<?php

namespace App\Http\Controllers\User;

use Inertia\Inertia;
use App\Models\Bundle;
use App\Models\Invoice;
use Illuminate\Http\Request;
use App\Models\EnrollmentBundle;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;

class BundleController extends Controller
{
    private const ADMIN_WHATSAPP_URL = 'https://wa.me/+6285142505794';

    public function index()
    {
        $bundles = Bundle::with(['bundleItems.bundleable'])
            ->where('status', 'published')
            ->where(function ($query) {
                $query->whereNull('registration_deadline')
                    ->orWhere('registration_deadline', '>=', now());
            })
            ->withCount('bundleItems')
            ->orderBy('registration_deadline', 'asc')
            ->get()
            ->map(function ($bundle) {
                $totalOriginalPrice = $bundle->bundleItems->sum('price');
                $bundle->strikethrough_price = $totalOriginalPrice;

                if (!isset($bundle->bundle_items_count)) {
                    $bundle->bundle_items_count = $bundle->bundleItems->count();
                }

                return $bundle;
            });

        return Inertia::render('user/bundling/dashboard/index', [
            'bundles' => $bundles,
        ]);
    }

    public function detail(Request $request, Bundle $bundle)
    {
        $this->handleReferralCode($request);

        if ($bundle->status !== 'published') {
            return Inertia::render('user/unavailable/index', [
                'title' => 'Bundle Tidak Tersedia',
                'item' => $bundle->only(['title', 'slug', 'status']),
                'adminWhatsappUrl' => self::ADMIN_WHATSAPP_URL,
                'message' => 'Bundle tidak tersedia. Silahkan hubungi admin.',
                'backUrl' => route('bundle.index'),
                'backLabel' => 'Kembali ke Daftar Bundle',
            ])->toResponse($request)->setStatusCode(404);
        }

        if ($bundle->registration_deadline && now()->gt($bundle->registration_deadline)) {
            return redirect()->route('bundle.index')->with('error', 'Pendaftaran untuk bundle ini sudah ditutup.');
        }

        $bundle->load([
            'bundleItems.bundleable',
            'user'
        ]);

        $bundle->load([
            'bundleItems' => function ($query) {
                $query->orderBy('order');
            },
            'bundleItems.bundleable' => function ($query) {
                $query->select(['id', 'title', 'slug', 'price', 'thumbnail']);
            },
            'user'
        ]);

        $bundle->bundle_items_count = $bundle->bundleItems->count();

        $totalOriginalPrice = $bundle->bundleItems->sum('price');
        $bundle->strikethrough_price = $totalOriginalPrice;

        $groupedItems = [
            'courses' => $bundle->bundleItems->filter(function ($item) {
                return $item->bundleable && str_contains($item->bundleable_type, 'Course');
            })->values(),
            'bootcamps' => $bundle->bundleItems->filter(function ($item) {
                return $item->bundleable && str_contains($item->bundleable_type, 'Bootcamp');
            })->values(),
            'webinars' => $bundle->bundleItems->filter(function ($item) {
                return $item->bundleable && str_contains($item->bundleable_type, 'Webinar');
            })->values(),
        ];

        // Calculate discount
        $discountAmount = $totalOriginalPrice - $bundle->price;
        $discountPercentage = $totalOriginalPrice > 0
            ? round(($discountAmount / $totalOriginalPrice) * 100)
            : 0;

        // Check if user already owns any items in the bundle
        $ownedItems = [];
        $hasOwnedItems = false;

        if (Auth::check()) {
            $userId = Auth::id();

            $ownedCourseIds = Invoice::with('courseItems')
                ->where('user_id', $userId)
                ->where('status', 'paid')
                ->get()
                ->flatMap(fn($invoice) => $invoice->courseItems->pluck('course_id'))
                ->unique()
                ->toArray();

            $ownedBootcampIds = Invoice::with('bootcampItems')
                ->where('user_id', $userId)
                ->where('status', 'paid')
                ->get()
                ->flatMap(fn($invoice) => $invoice->bootcampItems->pluck('bootcamp_id'))
                ->unique()
                ->toArray();

            $ownedWebinarIds = Invoice::with('webinarItems')
                ->where('user_id', $userId)
                ->where('status', 'paid')
                ->get()
                ->flatMap(fn($invoice) => $invoice->webinarItems->pluck('webinar_id'))
                ->unique()
                ->toArray();

            foreach ($bundle->bundleItems as $item) {
                if (!$item->bundleable) continue;

                $isOwned = false;
                $itemType = '';

                if (str_contains($item->bundleable_type, 'Course') && in_array($item->bundleable_id, $ownedCourseIds)) {
                    $isOwned = true;
                    $itemType = 'Kelas';
                } elseif (str_contains($item->bundleable_type, 'Bootcamp') && in_array($item->bundleable_id, $ownedBootcampIds)) {
                    $isOwned = true;
                    $itemType = 'Bootcamp';
                } elseif (str_contains($item->bundleable_type, 'Webinar') && in_array($item->bundleable_id, $ownedWebinarIds)) {
                    $isOwned = true;
                    $itemType = 'Webinar';
                }

                if ($isOwned) {
                    $hasOwnedItems = true;
                    $ownedItems[] = [
                        'id' => $item->bundleable_id,
                        'title' => $item->bundleable->title,
                        'type' => $itemType,
                    ];
                }
            }
        }

        $relatedBundles = Bundle::with(['bundleItems.bundleable'])
            ->where('status', 'published')
            ->where('id', '!=', $bundle->id)
            ->where(function ($query) {
                $query->whereNull('registration_deadline')
                    ->orWhere('registration_deadline', '>=', now());
            })
            ->withCount('bundleItems')
            ->orderBy('registration_deadline', 'asc')
            ->limit(3)
            ->get()
            ->map(function ($bundle) {
                $totalOriginalPrice = $bundle->bundleItems->sum('price');
                $bundle->strikethrough_price = $totalOriginalPrice;

                if (!isset($bundle->bundle_items_count)) {
                    $bundle->bundle_items_count = $bundle->bundleItems->count();
                }

                return $bundle;
            });

        return Inertia::render('user/bundling/detail/index', [
            'bundle' => $bundle,
            'groupedItems' => $groupedItems,
            'totalOriginalPrice' => $totalOriginalPrice,
            'discountAmount' => $discountAmount,
            'discountPercentage' => $discountPercentage,
            'relatedBundles' => $relatedBundles,
            'hasOwnedItems' => $hasOwnedItems,
            'ownedItems' => $ownedItems,
        ]);
    }

    public function showCheckout(Request $request, Bundle $bundle)
    {
        $this->handleReferralCode($request);

        if ($bundle->status !== 'published') {
            return Inertia::render('user/unavailable/index', [
                'title' => 'Bundle Tidak Tersedia',
                'item' => $bundle->only(['title', 'slug', 'status']),
                'adminWhatsappUrl' => self::ADMIN_WHATSAPP_URL,
                'message' => 'Bundle tidak tersedia. Silahkan hubungi admin.',
                'backUrl' => route('bundle.index'),
                'backLabel' => 'Kembali ke Daftar Bundle',
            ])->toResponse($request)->setStatusCode(404);
        }

        // if (!Auth::check()) {
        //     $currentUrl = $request->fullUrl();
        //     return redirect()->route('login', ['redirect' => $currentUrl]);
        // }

        if ($bundle->registration_deadline && now()->gt($bundle->registration_deadline)) {
            return redirect()->route('bundle.detail', $bundle->slug)
                ->with('error', 'Pendaftaran untuk bundle ini sudah ditutup.');
        }

        if ($bundle->price === 0) {
            return redirect()->route('bundle.detail', $bundle->slug)
                ->with('error', 'Bundle ini gratis, tidak perlu checkout.');
        }

        $bundle->load([
            'bundleItems' => function ($query) {
                $query->orderBy('order');
            },
            'bundleItems.bundleable' => function ($query) {
                $query->select(['id', 'title', 'slug', 'price', 'thumbnail']);
            }
        ]);

        $bundle->bundle_items_count = $bundle->bundleItems->count();
        $totalOriginalPrice = $bundle->bundleItems->sum('price');
        $bundle->strikethrough_price = $totalOriginalPrice;

        $hasAccess = false;
        $pendingInvoice = null;
        $pendingInvoiceUrl = null;
        $userId = Auth::id();

        if ($userId) {
            $hasAccess = EnrollmentBundle::whereHas('invoice', function ($query) use ($userId) {
                $query->where('user_id', $userId)
                    ->where('status', 'paid');
            })
                ->where('bundle_id', $bundle->id)
                ->exists();

            // Cek akses via cicilan aktif
            if (!$hasAccess) {
                $hasAccess = Invoice::where('user_id', $userId)
                    ->where('status', 'installment_pending')
                    ->whereNull('access_suspended_at')
                    ->whereHas('bundleEnrollments', function ($query) use ($bundle) {
                        $query->where('bundle_id', $bundle->id);
                    })
                    ->whereHas('installmentTerms', function ($q) {
                        $q->where('installment_number', 1)->where('status', 'paid');
                    })
                    ->exists();
            }

            if (!$hasAccess) {
                $invoice = Invoice::where('user_id', $userId)
                    ->where('status', 'pending')
                    ->whereHas('bundleEnrollments', function ($query) use ($bundle) {
                        $query->where('bundle_id', $bundle->id);
                    })
                    ->where(function ($query) {
                        $query->whereNull('expires_at')
                            ->orWhere('expires_at', '>', now());
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

        return Inertia::render('user/bundling/checkout/index', [
            'bundle' => $bundle,
            'hasAccess' => $hasAccess,
            'pendingInvoice' => $pendingInvoice,
            'pendingInvoiceUrl' => $pendingInvoiceUrl,
            'referralInfo' => $this->getReferralInfo(),
            'installmentTerms' => $bundle->installmentTerms()->get(['term_number', 'amount', 'due_date']),
        ]);
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
