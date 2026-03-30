<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Bootcamp;
use App\Models\Category;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class BootcampController extends Controller
{
    private const ADMIN_WHATSAPP_URL = 'https://wa.me/+6285142505794';

    public function index()
    {
        $categories = Category::all();
        $bootcamps = Bootcamp::with(['category'])
            ->where('status', 'published')
            ->where('registration_deadline', '>=', now())
            ->orderBy('start_date', 'asc')
            ->get();

        $myBootcampIds = [];
        if (Auth::check()) {
            $userId = Auth::id();
            $myBootcampIds = Invoice::with('bootcampItems.bootcamp.category')
                ->where('user_id', $userId)
                ->where('status', 'paid')
                ->get()
                ->flatMap(function ($invoice) {
                    return $invoice->bootcampItems->pluck('bootcamp_id');
                })
                ->unique()
                ->values()
                ->all();
        }
        return Inertia::render('user/bootcamp/dashboard/index', ['categories' => $categories, 'bootcamps' => $bootcamps, 'myBootcampIds' => $myBootcampIds]);
    }

    public function detail(Request $request, Bootcamp $bootcamp)
    {
        $this->handleReferralCode($request);

        if ($bootcamp->status !== 'published' && $bootcamp->status !== 'hidden') {
            return Inertia::render('user/unavailable/index', [
                'title' => 'Bootcamp Tidak Tersedia',
                'item' => $bootcamp->only(['title', 'slug', 'status']),
                'adminWhatsappUrl' => self::ADMIN_WHATSAPP_URL,
                'message' => 'Bootcamp tidak tersedia. Silahkan hubungi admin.',
                'backUrl' => route('bootcamp.index'),
                'backLabel' => 'Kembali ke Daftar Bootcamp',
            ])->toResponse($request)->setStatusCode(404);
        }

        $bootcamp->load(['category', 'schedules', 'tools', 'mentors']);

        $relatedBootcamps = Bootcamp::with(['category', 'mentors'])
            ->where('status', 'published')
            ->where('category_id', $bootcamp->category_id)
            ->where('id', '!=', $bootcamp->id)
            ->where('registration_deadline', '>=', now())
            ->orderBy('registration_deadline', 'asc')
            ->limit(3)
            ->get();

        $myBootcampIds = [];
        if (Auth::check()) {
            $userId = Auth::id();
            $myBootcampIds = Invoice::with('bootcampItems.bootcamp.category')
                ->where('user_id', $userId)
                ->where('status', 'paid')
                ->get()
                ->flatMap(function ($invoice) {
                    return $invoice->bootcampItems->pluck('bootcamp_id');
                })
                ->unique()
                ->values()
                ->all();
        }

        return Inertia::render('user/bootcamp/detail/index', [
            'bootcamp' => $bootcamp,
            'relatedBootcamps' => $relatedBootcamps,
            'myBootcampIds' => $myBootcampIds,
            'referralInfo' => $this->getReferralInfo(),
        ]);
    }

    public function showRegister(Request $request, Bootcamp $bootcamp)
    {
        $this->handleReferralCode($request);

        if ($bootcamp->status !== 'published' && $bootcamp->status !== 'hidden') {
            return Inertia::render('user/unavailable/index', [
                'title' => 'Bootcamp Tidak Tersedia',
                'item' => $bootcamp->only(['title', 'slug', 'status']),
                'adminWhatsappUrl' => self::ADMIN_WHATSAPP_URL,
                'message' => 'Bootcamp tidak tersedia. Silahkan hubungi admin.',
                'backUrl' => route('bootcamp.index'),
                'backLabel' => 'Kembali ke Daftar Bootcamp',
            ])->toResponse($request)->setStatusCode(404);
        }

        if (!Auth::check()) {
            $currentUrl = $request->fullUrl();
            return redirect()->route('login', ['redirect' => $currentUrl]);
        }

        $bootcamp->load(['schedules', 'tools', 'category', 'mentors']);
        $hasAccess = false;
        $pendingInvoiceUrl = null;

        $userId = Auth::id();

        $hasAccess = Invoice::where('user_id', $userId)
            ->where('status', 'paid')
            ->whereHas('bootcampItems', function ($query) use ($bootcamp) {
                $query->where('bootcamp_id', $bootcamp->id);
            })
            ->exists();

        if (!$hasAccess) {
            $pendingInvoice = Invoice::where('user_id', $userId)
                ->where('status', 'pending')
                ->whereHas('bootcampItems', function ($query) use ($bootcamp) {
                    $query->where('bootcamp_id', $bootcamp->id);
                })
                ->latest()
                ->first();

            if ($pendingInvoice && $pendingInvoice->invoice_url) {
                $pendingInvoiceUrl = $pendingInvoice->invoice_url;
            }
        }

        return Inertia::render('user/bootcamp/register/index', [
            'bootcamp' => $bootcamp,
            'hasAccess' => $hasAccess,
            'pendingInvoiceUrl' => $pendingInvoiceUrl,
            'referralInfo' => $this->getReferralInfo(),
        ]);
    }

    public function showRegisterSuccess()
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
                'referral_code' => $referralCode,
            ]);
        }
    }

    /**
     * Get referral info untuk frontend
     */
    private function getReferralInfo(): array
    {
        return [
            'code' => session('referral_code'),
            'hasActive' => session('referral_code') && session('referral_code') !== 'ATM2025',
        ];
    }
}
