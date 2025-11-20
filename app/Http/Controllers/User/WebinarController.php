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

        if (!Auth::check()) {
            $currentUrl = $request->fullUrl();
            return redirect()->route('login', ['redirect' => $currentUrl]);
        }

        $webinar->load(['tools', 'user', 'category']);
        $hasAccess = false;
        $pendingInvoiceUrl = null;

        $userId = Auth::id();

        $hasAccess = Invoice::where('user_id', $userId)
            ->where('status', 'paid')
            ->whereHas('webinarItems', function ($query) use ($webinar) {
                $query->where('webinar_id', $webinar->id);
            })
            ->exists();

        if (!$hasAccess) {
            $pendingInvoice = Invoice::where('user_id', $userId)
                ->where('status', 'pending')
                ->whereHas('webinarItems', function ($query) use ($webinar) {
                    $query->where('webinar_id', $webinar->id);
                })
                ->latest()
                ->first();

            if ($pendingInvoice && $pendingInvoice->invoice_url) {
                $pendingInvoiceUrl = $pendingInvoice->invoice_url;
            }
        }

        return Inertia::render('user/webinar/register/index', [
            'webinar' => $webinar,
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
