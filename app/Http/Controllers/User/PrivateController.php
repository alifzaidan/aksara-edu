<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\EnrollmentPrivate;
use App\Models\Invoice;
use App\Models\PrivateClass;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PrivateController extends Controller
{
    private const ADMIN_WHATSAPP_URL = 'https://wa.me/+6285142505794';

    public function index()
    {
        $categories = Category::all();
        $privateClasses = PrivateClass::with(['category', 'user', 'schedules'])
            ->where('status', 'published')
            ->whereHas('schedules', function ($query) {
                $query->where('is_active', true)
                    ->where(function ($q) {
                        $q->whereNull('registration_deadline')
                            ->orWhere('registration_deadline', '>=', now());
                    });
            })
            ->withMin(['schedules as next_schedule_start' => function ($query) {
                $query->where('is_active', true);
            }], 'start_time')
            ->orderBy('next_schedule_start', 'asc')
            ->get();

        $myPrivateClassIds = [];
        if (Auth::check()) {
            $userId = Auth::id();
            $myPrivateClassIds = Invoice::with('privateItems.privateClass.category')
                ->purchasedByUser($userId)
                ->get()
                ->flatMap(function ($invoice) {
                    return $invoice->privateItems->pluck('private_class_id');
                })
                ->unique()
                ->values()
                ->all();
        }

        return Inertia::render('user/private/dashboard/index', [
            'categories' => $categories,
            'privateClasses' => $privateClasses,
            'myPrivateClassIds' => $myPrivateClassIds,
        ]);
    }

    public function detail(Request $request, PrivateClass $privateClass)
    {
        $this->handleReferralCode($request);

        if ($privateClass->status !== 'published') {
            return Inertia::render('user/unavailable/index', [
                'title' => 'Private Class Tidak Tersedia',
                'item' => $privateClass->only(['title', 'slug', 'status']),
                'adminWhatsappUrl' => self::ADMIN_WHATSAPP_URL,
                'message' => 'Private Class tidak tersedia. Silahkan hubungi admin.',
                'backUrl' => route('private.index'),
                'backLabel' => 'Kembali ke Daftar Private Class',
            ])->toResponse($request)->setStatusCode(404);
        }

        $privateClass->load(['category', 'user', 'schedules']);

        $relatedPrivateClasses = PrivateClass::with(['category', 'user', 'schedules'])
            ->where('status', 'published')
            ->where('category_id', $privateClass->category_id)
            ->where('id', '!=', $privateClass->id)
            ->whereHas('schedules', function ($query) {
                $query->where('is_active', true)
                    ->where(function ($q) {
                        $q->whereNull('registration_deadline')
                            ->orWhere('registration_deadline', '>=', now());
                    });
            })
            ->withMin(['schedules as next_schedule_start' => function ($query) {
                $query->where('is_active', true);
            }], 'start_time')
            ->orderBy('next_schedule_start', 'asc')
            ->limit(3)
            ->get();

        $myPrivateClassIds = [];
        if (Auth::check()) {
            $userId = Auth::id();
            $myPrivateClassIds = Invoice::with('privateItems.privateClass.category')
                ->purchasedByUser($userId)
                ->get()
                ->flatMap(function ($invoice) {
                    return $invoice->privateItems->pluck('private_class_id');
                })
                ->unique()
                ->values()
                ->all();
        }

        return Inertia::render('user/private/detail/index', [
            'privateClass' => $privateClass,
            'relatedPrivateClasses' => $relatedPrivateClasses,
            'myPrivateClassIds' => $myPrivateClassIds,
            'referralInfo' => $this->getReferralInfo(),
        ]);
    }

    public function showRegister(Request $request, PrivateClass $privateClass)
    {
        $this->handleReferralCode($request);

        if ($privateClass->status !== 'published') {
            return Inertia::render('user/unavailable/index', [
                'title' => 'Private Class Tidak Tersedia',
                'item' => $privateClass->only(['title', 'slug', 'status']),
                'adminWhatsappUrl' => self::ADMIN_WHATSAPP_URL,
                'message' => 'Private Class tidak tersedia. Silahkan hubungi admin.',
                'backUrl' => route('private.index'),
                'backLabel' => 'Kembali ke Daftar Private Class',
            ])->toResponse($request)->setStatusCode(404);
        }

        // if (!Auth::check()) {
        //     return redirect()->route('login', ['redirect' => $request->fullUrl()]);
        // }

        $privateClass->load(['category', 'user', 'schedules']);
        $userId = Auth::id();
        $activeInstallment = $userId ? Invoice::getActiveInstallmentForUser($userId, 'private', $privateClass->id) : null;

        $schedules = $privateClass->schedules
            ->where('is_active', true)
            ->sortBy('start_time')
            ->values();

        $scheduleIds = $schedules->pluck('id');

        $paidCounts = EnrollmentPrivate::select('private_class_schedule_id', DB::raw('count(*) as total'))
            ->whereIn('private_class_schedule_id', $scheduleIds)
            ->whereHas('invoice', function ($query) {
                $query->where('status', 'paid');
            })
            ->groupBy('private_class_schedule_id')
            ->pluck('total', 'private_class_schedule_id');

        $ownedScheduleIds = collect();
        $pendingEnrollments = collect();

        if ($userId) {
            $ownedPaidIds = EnrollmentPrivate::whereIn('private_class_schedule_id', $scheduleIds)
                ->whereHas('invoice', function ($query) use ($userId) {
                    $query->where('user_id', $userId)
                        ->where('is_installment', false)
                        ->whereIn('status', ['paid', 'completed']);
                })
                ->pluck('private_class_schedule_id');

            $isInstallmentCompleted = $activeInstallment && $activeInstallment['is_fully_paid'];
            if ($isInstallmentCompleted) {
                $completedInstallmentScheduleIds = EnrollmentPrivate::whereIn('private_class_schedule_id', $scheduleIds)
                    ->where('invoice_id', $activeInstallment['parent_invoice_id'])
                    ->pluck('private_class_schedule_id');
                $ownedPaidIds = $ownedPaidIds->concat($completedInstallmentScheduleIds);
            }

            $ownedScheduleIds = $ownedPaidIds->unique()->values();

            if (!$activeInstallment) {
                $pendingEnrollments = EnrollmentPrivate::with(['invoice:id,invoice_url,expires_at,created_at'])
                    ->whereIn('private_class_schedule_id', $scheduleIds)
                    ->whereHas('invoice', function ($query) use ($userId) {
                        $query->where('status', 'pending')
                            ->where('is_installment', false)
                            ->where('user_id', $userId)
                            ->where(function ($q) {
                                $q->whereNull('expires_at')
                                    ->orWhere('expires_at', '>', now());
                            });
                    })
                    ->get()
                    ->sortByDesc(function ($enrollment) {
                        return $enrollment->invoice?->created_at;
                    })
                    ->unique('private_class_schedule_id')
                    ->values();
            }
        }

        $pendingBySchedule = $pendingEnrollments->mapWithKeys(function ($enrollment) {
            $invoice = $enrollment->invoice;
            return [
                $enrollment->private_class_schedule_id => [
                    'pending_invoice' => $invoice ? [
                        'id' => $invoice->id,
                        'invoice_code' => $invoice->invoice_code,
                        'status' => $invoice->status,
                        'amount' => $invoice->amount,
                        'payment_method' => $invoice->payment_method,
                        'invoice_url' => $invoice->invoice_url,
                        'created_at' => $invoice->created_at?->toISOString() ?? (string) $invoice->created_at,
                        'expires_at' => $invoice->expires_at ? $invoice->expires_at->toISOString() : null,
                    ] : null,
                    'invoice_url' => $invoice?->invoice_url,
                ],
            ];
        });

        $scheduleOptions = $schedules->map(function ($schedule) use ($paidCounts, $pendingBySchedule, $ownedScheduleIds) {
            $occupiedParticipants = (int) ($paidCounts[$schedule->id] ?? 0);
            $maxParticipants = max((int) ($schedule->max_participants ?? 1), 1);
            $isFull = $occupiedParticipants >= $maxParticipants;
            $hasAccess = $ownedScheduleIds->contains($schedule->id);
            $pendingInvoice = data_get($pendingBySchedule, $schedule->id . '.pending_invoice');
            $pendingInvoiceUrl = data_get($pendingBySchedule, $schedule->id . '.invoice_url');

            $isRegistrationClosed = $schedule->registration_deadline && now()->gt($schedule->registration_deadline);

            return [
                'id' => $schedule->id,
                'start_time' => $schedule->start_time,
                'end_time' => $schedule->end_time,
                'registration_deadline' => $schedule->registration_deadline,
                'max_participants' => $maxParticipants,
                'occupied_participants' => $occupiedParticipants,
                'is_full' => $isFull,
                'has_access' => $hasAccess,
                'pending_invoice' => $pendingInvoice,
                'pending_invoice_url' => $pendingInvoiceUrl,
                'is_registration_closed' => $isRegistrationClosed,
            ];
        })->values();

        return Inertia::render('user/private/register/index', [
            'privateClass' => $privateClass,
            'scheduleOptions' => $scheduleOptions,
            'activeInstallment' => $activeInstallment,
            'referralInfo' => $this->getReferralInfo(),
            'installmentTerms' => $privateClass->installmentTerms()->get(['term_number', 'amount', 'due_date']),
        ]);
    }

    public function showRegisterSuccess()
    {
        return Inertia::render('user/checkout/success');
    }

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

    private function getReferralInfo(): array
    {
        $code = session('affiliate_code') ?? session('referral_code');
        return [
            'code' => $code,
            'hasActive' => $code && $code !== 'ATM2025',
        ];
    }
}
