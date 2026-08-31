<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Invoice;
use App\Models\Webinar;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class WebinarController extends Controller
{
    private const ADMIN_WHATSAPP_URL = 'https://wa.me/+6285142505794';

    public function index()
    {
        $categories = Category::all();
        $webinars = Webinar::with(['category'])
            ->where('status', 'published')
            ->where('registration_deadline', '>=', now())
            ->orderBy('start_time', 'asc')
            ->get();

        $myWebinarIds = [];
        if (Auth::check()) {
            $userId = Auth::id();
            $myWebinarIds = Invoice::with('webinarItems.webinar.category')
                ->where('user_id', $userId)
                ->where('status', 'paid')
                ->get()
                ->flatMap(function ($invoice) {
                    return $invoice->webinarItems->pluck('webinar_id');
                })
                ->unique()
                ->values()
                ->all();
        }
        return Inertia::render('user/webinar/dashboard/index', ['categories' => $categories, 'webinars' => $webinars, 'myWebinarIds' => $myWebinarIds]);
    }

    public function detail(Request $request, Webinar $webinar)
    {
        $this->handleReferralCode($request);

        if ($webinar->status !== 'published') {
            return Inertia::render('user/unavailable/index', [
                'title' => 'Webinar Tidak Tersedia',
                'item' => $webinar->only(['title', 'slug', 'status']),
                'adminWhatsappUrl' => self::ADMIN_WHATSAPP_URL,
                'message' => 'Webinar tidak tersedia. Silahkan hubungi admin.',
                'backUrl' => route('webinar.index'),
                'backLabel' => 'Kembali ke Daftar Webinar',
            ])->toResponse($request)->setStatusCode(404);
        }

        $webinar->load(['category', 'tools', 'user']);

        $relatedWebinars = Webinar::with(['category', 'user'])
            ->where('status', 'published')
            ->where('category_id', $webinar->category_id)
            ->where('id', '!=', $webinar->id)
            ->where('registration_deadline', '>=', now())
            ->orderBy('registration_deadline', 'asc')
            ->limit(3)
            ->get();

        $myWebinarIds = [];
        if (Auth::check()) {
            $userId = Auth::id();
            $myWebinarIds = Invoice::with('webinarItems.webinar.category')
                ->where('user_id', $userId)
                ->where('status', 'paid')
                ->get()
                ->flatMap(function ($invoice) {
                    return $invoice->webinarItems->pluck('webinar_id');
                })
                ->unique()
                ->values()
                ->all();
        }

        return Inertia::render('user/webinar/detail/index', [
            'webinar' => $webinar,
            'relatedWebinars' => $relatedWebinars,
            'myWebinarIds' => $myWebinarIds,
            'referralInfo' => $this->getReferralInfo(),
        ]);
    }


    public function showRegister(Request $request, Webinar $webinar)
    {
        $this->handleReferralCode($request);

        if ($webinar->status !== 'published') {
            return Inertia::render('user/unavailable/index', [
                'title' => 'Webinar Tidak Tersedia',
                'item' => $webinar->only(['title', 'slug', 'status']),
                'adminWhatsappUrl' => self::ADMIN_WHATSAPP_URL,
                'message' => 'Webinar tidak tersedia. Silahkan hubungi admin.',
                'backUrl' => route('webinar.index'),
                'backLabel' => 'Kembali ke Daftar Webinar',
            ])->toResponse($request)->setStatusCode(404);
        }

        // if (!Auth::check()) {
        //     $currentUrl = $request->fullUrl();
        //     return redirect()->route('login', ['redirect' => $currentUrl]);
        // }

        $webinar->load(['tools', 'user', 'category']);
        $hasAccess = false;
        $pendingInvoice = null;
        $pendingInvoiceUrl = null;

        $userId = Auth::id();

        if ($userId) {
            $hasAccess = Invoice::where('user_id', $userId)
                ->where('status', 'paid')
                ->whereHas('webinarItems', function ($query) use ($webinar) {
                    $query->where('webinar_id', $webinar->id);
                })
                ->exists();

            // Cek akses via cicilan aktif
            if (!$hasAccess) {
                $hasAccess = Invoice::where('user_id', $userId)
                    ->where('status', 'installment_pending')
                    ->whereNull('access_suspended_at')
                    ->whereHas('webinarItems', function ($query) use ($webinar) {
                        $query->where('webinar_id', $webinar->id);
                    })
                    ->whereHas('installmentTerms', function ($q) {
                        $q->where('installment_number', 1)->where('status', 'paid');
                    })
                    ->exists();
            }

            if (!$hasAccess) {
                $invoice = Invoice::where('user_id', $userId)
                    ->where('status', 'pending')
                    ->whereHas('webinarItems', function ($query) use ($webinar) {
                        $query->where('webinar_id', $webinar->id);
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

        return Inertia::render('user/webinar/register/index', [
            'webinar' => $webinar,
            'hasAccess' => $hasAccess,
            'pendingInvoice' => $pendingInvoice,
            'pendingInvoiceUrl' => $pendingInvoiceUrl,
            'referralInfo' => $this->getReferralInfo(),
            'installmentTerms' => $webinar->installmentTerms()->get(['term_number', 'amount', 'due_date']),
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
