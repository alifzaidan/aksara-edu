<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Course;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CourseController extends Controller
{
    private const ADMIN_WHATSAPP_URL = 'https://wa.me/+6285142505794';

    public function index()
    {
        $categories = Category::all();
        $courses = Course::with(['category'])
            ->where('status', 'published')
            ->orderBy('created_at', 'desc')
            ->get();

        $myCourseIds = [];
        if (Auth::check()) {
            $userId = Auth::id();
            $myCourseIds = Invoice::with('courseItems.course.category')
                ->where('user_id', $userId)
                ->where('status', 'paid')
                ->get()
                ->flatMap(function ($invoice) {
                    return $invoice->courseItems->pluck('course_id');
                })
                ->unique()
                ->values()
                ->all();
        }
        return Inertia::render('user/course/dashboard/index', ['categories' => $categories, 'courses' => $courses, 'myCourseIds' => $myCourseIds]);
    }

    public function detail(Request $request, Course $course)
    {
        $this->handleReferralCode($request);

        if ($course->status !== 'published') {
            return Inertia::render('user/unavailable/index', [
                'title' => 'Kelas Tidak Tersedia',
                'item' => $course->only(['title', 'slug', 'status']),
                'adminWhatsappUrl' => self::ADMIN_WHATSAPP_URL,
                'message' => 'Kelas tidak tersedia. Silahkan hubungi admin.',
                'backUrl' => route('course.index'),
                'backLabel' => 'Kembali ke Daftar Kelas',
            ])->toResponse($request)->setStatusCode(404);
        }

        $course->load(['category', 'user', 'tools', 'images', 'modules.lessons.quizzes.questions']);

        $relatedCourses = Course::with(['category'])
            ->where('status', 'published')
            ->where('category_id', $course->category_id)
            ->where('id', '!=', $course->id)
            ->orderBy('created_at', 'desc')
            ->limit(3)
            ->get();

        $myCourseIds = [];
        if (Auth::check()) {
            $userId = Auth::id();
            $myCourseIds = Invoice::with('courseItems.course.category')
                ->where('user_id', $userId)
                ->where('status', 'paid')
                ->get()
                ->flatMap(function ($invoice) {
                    return $invoice->courseItems->pluck('course_id');
                })
                ->unique()
                ->values()
                ->all();
        }

        return Inertia::render('user/course/detail/index', [
            'course' => $course,
            'relatedCourses' => $relatedCourses,
            'myCourseIds' => $myCourseIds,
            'referralInfo' => $this->getReferralInfo(),
        ]);
    }

    public function showCheckout(Request $request, Course $course)
    {
        $this->handleReferralCode($request);

        if ($course->status !== 'published') {
            return Inertia::render('user/unavailable/index', [
                'title' => 'Kelas Tidak Tersedia',
                'item' => $course->only(['title', 'slug', 'status']),
                'adminWhatsappUrl' => self::ADMIN_WHATSAPP_URL,
                'message' => 'Kelas tidak tersedia. Silahkan hubungi admin.',
                'backUrl' => route('course.index'),
                'backLabel' => 'Kembali ke Daftar Kelas',
            ])->toResponse($request)->setStatusCode(404);
        }

        // if (!Auth::check()) {
        //     $currentUrl = $request->fullUrl();
        //     return redirect()->route('login', ['redirect' => $currentUrl]);
        // }

        $course->load(['modules.lessons']);
        $hasAccess = false;
        $pendingInvoice = null;
        $pendingInvoiceUrl = null;

        $userId = Auth::id();

        if ($userId) {
            $hasAccess = Invoice::where('user_id', $userId)
                ->where('status', 'paid')
                ->whereHas('courseItems', function ($query) use ($course) {
                    $query->where('course_id', $course->id);
                })
                ->exists();

            // Cek akses via cicilan aktif
            if (!$hasAccess) {
                $hasAccess = Invoice::where('user_id', $userId)
                    ->where('status', 'installment_pending')
                    ->whereNull('access_suspended_at')
                    ->whereHas('courseItems', function ($query) use ($course) {
                        $query->where('course_id', $course->id);
                    })
                    ->whereHas('installmentTerms', function ($q) {
                        $q->where('installment_number', 1)->where('status', 'paid');
                    })
                    ->exists();
            }

            if (!$hasAccess) {
                $invoice = Invoice::where('user_id', $userId)
                    ->where('status', 'pending')
                    ->whereHas('courseItems', function ($query) use ($course) {
                        $query->where('course_id', $course->id);
                    })
                    ->latest()
                    ->first();

                if ($invoice) {
                    $pendingInvoice = [
                        'id' => $invoice->id,
                        'invoice_code' => $invoice->invoice_code,
                        'status' => $invoice->status,
                        'amount' => $invoice->amount,
                        'payment_method' => $invoice->payment_method,
                        'invoice_url' => $invoice->invoice_url,
                        'created_at' => $invoice->created_at?->toISOString() ?? (string) $invoice->created_at,
                        'expires_at' => $invoice->expires_at ? $invoice->expires_at->toISOString() : null,
                    ];
                    $pendingInvoiceUrl = $invoice->invoice_url;
                }
            }
        }

        return Inertia::render('user/course/checkout/index', [
            'course' => $course,
            'hasAccess' => $hasAccess,
            'pendingInvoice' => $pendingInvoice,
            'pendingInvoiceUrl' => $pendingInvoiceUrl,
            'referralInfo' => $this->getReferralInfo(),
            'installmentTerms' => $course->installmentTerms()->get(['term_number', 'amount', 'due_date']),
        ]);
    }

    public function showCheckoutSuccess()
    {
        return Inertia::render('user/checkout/success');
    }

    /**
     * Handle referral code dari URL parameter
     */
    private function handleReferralCode(Request $request): void
    {
        $referralCode = $request->query('ref');

        if ($referralCode) {
            session([
                'affiliate_code' => $referralCode,
                'referral_code' => $referralCode,
            ]);
        }
    }

    /**
     * Get referral info untuk frontend
     */
    private function getReferralInfo(): array
    {
        $code = session('affiliate_code') ?? session('referral_code');
        return [
            'code' => $code,
            'hasActive' => $code && $code !== 'ATM2025',
        ];
    }
}
