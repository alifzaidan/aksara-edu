<?php

namespace App\Http\Controllers;

use App\Exports\TransactionsExport;
use App\Models\AffiliateEarning;
use App\Models\Bootcamp;
use App\Models\Bundle;
use App\Models\Certificate;
use App\Models\CertificateParticipant;
use App\Models\CertificationProgram;
use App\Models\CertificationProgramApplication;
use App\Models\CertificationProgramScholarshipApplication;
use App\Models\Course;
use App\Models\DiscountUsage;
use App\Models\EnrollmentBootcamp;
use App\Models\EnrollmentBundle;
use App\Models\EnrollmentCertificationProgram;
use App\Models\EnrollmentCourse;
use App\Models\EnrollmentPrivate;
use App\Models\EnrollmentWebinar;
use App\Models\FreeEnrollmentRequirement;
use App\Models\Invoice;
use App\Models\PrivateClass;
use App\Models\PrivateClassSchedule;
use App\Models\User;
use App\Models\Webinar;
use App\Traits\MessaraTrait;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Haruncpi\LaravelIdGenerator\IdGenerator;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Facades\Excel;
use Xendit\Configuration;
use Xendit\Invoice\CreateInvoiceRequest;
use Xendit\Invoice\InvoiceApi;

class InvoiceController extends Controller
{
    use MessaraTrait;

    public function __construct()
    {
        Configuration::setXenditKey(config('xendit.API_KEY'));
    }

    public function index(Request $request)
    {
        // Ambil filter tanggal dari request
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        $status = $request->input('status');
        $paymentType = $request->input('payment_type');
        $productType = $request->input('product_type');

        // Buat query dasar (hanya transaksi utama / parent invoice)
        $invoicesQuery = Invoice::with([
            'user.referrer',
            'installmentTerms',
            'courseItems.course',
            'bootcampItems.bootcamp',
            'webinarItems.webinar',
            'privateItems.privateClass',
            'privateItems.privateClassSchedule',
            'certificationProgramItems.certificationProgram',
            'bundleEnrollments.bundle'
        ])->whereNull('parent_invoice_id');

        // Apply date filter jika ada
        if ($startDate && $endDate) {
            $start = Carbon::parse($startDate)->startOfDay();
            $end = Carbon::parse($endDate)->endOfDay();

            $invoicesQuery->where(function ($q) use ($start, $end) {
                $q->where(function ($q2) use ($start, $end) {
                    $q2->where('status', 'paid')
                        ->whereBetween('paid_at', [$start, $end]);
                })->orWhere(function ($q2) use ($start, $end) {
                    $q2->whereIn('status', ['paid', 'pending', 'failed'])
                        ->whereBetween('created_at', [$start, $end]);
                });
            });
        }

        // Apply status filter
        if ($status && !empty($status)) {
            $statuses = is_array($status) ? $status : explode(',', $status);
            $invoicesQuery->whereIn('status', $statuses);
        }

        // Apply payment type filter (free vs paid)
        if ($paymentType && !empty($paymentType)) {
            $types = is_array($paymentType) ? $paymentType : explode(',', $paymentType);
            if (in_array('free', $types) && in_array('paid', $types)) {
                // both selected, no filter needed
            } elseif (in_array('free', $types)) {
                $invoicesQuery->where('nett_amount', 0);
            } elseif (in_array('paid', $types)) {
                $invoicesQuery->where('nett_amount', '>', 0);
            }
        }

        // Apply product type filter
        if ($productType && !empty($productType)) {
            $productTypes = is_array($productType) ? $productType : explode(',', $productType);
            $relationMap = [
                'course' => 'courseItems',
                'bootcamp' => 'bootcampItems',
                'webinar' => 'webinarItems',
                'private' => 'privateItems',
                'bundle' => 'bundleEnrollments',
                'certification_program' => 'certificationProgramItems',
                'certification' => 'certificationProgramItems',
            ];
            $invoicesQuery->where(function ($q) use ($productTypes, $relationMap) {
                foreach ($productTypes as $idx => $pType) {
                    $relation = $relationMap[$pType] ?? (\Illuminate\Support\Str::camel($pType) . 'Items');
                    if ($idx === 0) {
                        $q->whereHas($relation);
                    } else {
                        $q->orWhereHas($relation);
                    }
                }
            });
        }

        // Search filter
        if ($request->filled('search')) {
            $search = $request->input('search');
            $invoicesQuery->where(function ($q) use ($search) {
                $q->where('invoice_code', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhere('phone_number', 'like', "%{$search}%");
                    });
            });
        }

        // ✅ Calculate Statistics efficiently using database aggregates
        $statsBase = (clone $invoicesQuery);
        $totalTransactions = (clone $statsBase)->count();
        $paidTransactions = (clone $statsBase)->where('status', 'paid')->count();
        $pendingTransactions = (clone $statsBase)->where('status', 'pending')->count();
        $failedTransactions = (clone $statsBase)->where('status', 'failed')->count();

        $user = Auth::user();
        $isStaff = $user && $user->hasRole('staff') && !$user->hasRole('admin');

        // Revenue statistics
        $totalRevenue = $isStaff ? 0 : (clone $statsBase)->where('status', 'paid')->sum('nett_amount');
        $totalGross = $isStaff ? 0 : (clone $statsBase)->where('status', 'paid')->sum('amount');
        $totalDiscount = $isStaff ? 0 : (clone $statsBase)->where('status', 'paid')->sum('discount_amount');

        // Free vs Paid
        $freeEnrollments = (clone $statsBase)->where('status', 'paid')->where('nett_amount', 0)->count();
        $paidEnrollments = (clone $statsBase)->where('status', 'paid')->where('nett_amount', '>', 0)->count();

        // Product Type Breakdown
        $courseTransactions = (clone $statsBase)->whereHas('courseItems')->count();
        $bootcampTransactions = (clone $statsBase)->whereHas('bootcampItems')->count();
        $webinarTransactions = (clone $statsBase)->whereHas('webinarItems')->count();
        $privateTransactions = (clone $statsBase)->whereHas('privateItems')->count();
        $bundleTransactions = (clone $statsBase)->whereHas('bundleEnrollments')->count();

        $todayTransactions = (clone $statsBase)->whereDate('paid_at', Carbon::today())->count();
        $todayRevenue = $isStaff ? 0 : (clone $statsBase)->where('status', 'paid')->whereDate('paid_at', Carbon::today())->sum('nett_amount');

        $thisMonthTransactions = (clone $statsBase)->whereYear('paid_at', Carbon::now()->year)->whereMonth('paid_at', Carbon::now()->month)->count();
        $thisMonthRevenue = $isStaff ? 0 : (clone $statsBase)->where('status', 'paid')->whereYear('paid_at', Carbon::now()->year)->whereMonth('paid_at', Carbon::now()->month)->sum('nett_amount');

        $averageTransactionValue = (!$isStaff && $paidEnrollments > 0)
            ? $totalRevenue / $paidEnrollments
            : 0;

        $successRate = $totalTransactions > 0
            ? ($paidTransactions / $totalTransactions) * 100
            : 0;

        $statistics = [
            'overview' => [
                'total_transactions' => $totalTransactions,
                'paid_transactions' => $paidTransactions,
                'pending_transactions' => $pendingTransactions,
                'failed_transactions' => $failedTransactions,
                'success_rate' => round($successRate, 1),
            ],
            'revenue' => [
                'total_revenue' => $totalRevenue,
                'total_gross' => $totalGross,
                'total_discount' => $totalDiscount,
                'average_transaction' => round($averageTransactionValue, 0),
            ],
            'enrollment_type' => [
                'free_enrollments' => $freeEnrollments,
                'paid_enrollments' => $paidEnrollments,
            ],
            'product_breakdown' => [
                'course' => $courseTransactions,
                'bootcamp' => $bootcampTransactions,
                'webinar' => $webinarTransactions,
                'private' => $privateTransactions,
                'bundle' => $bundleTransactions,
            ],
            'period' => [
                'today_transactions' => $todayTransactions,
                'today_revenue' => $todayRevenue,
                'month_transactions' => $thisMonthTransactions,
                'month_revenue' => $thisMonthRevenue,
            ],
        ];

        // Paginate invoices per page
        $perPage = min(100, max(5, (int) $request->input('per_page', 10)));
        $invoices = $invoicesQuery->orderBy('created_at', 'desc')->paginate($perPage)->withQueryString();

        return Inertia::render('admin/transactions/index', [
            'invoices' => $invoices,
            'statistics' => $statistics,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'status' => $status,
                'payment_type' => $paymentType,
                'product_type' => $productType,
                'search' => $request->input('search'),
                'per_page' => $perPage,
            ],
        ]);
    }

    public function store(Request $request)
    {
        DB::beginTransaction();
        try {
            $userId = Auth::id();
            $type = $request->input('type', 'course');
            $itemId = $request->input('id');
            $privateClassScheduleId = $request->input('private_class_schedule_id');
            $selectedPrivateSchedule = null;
            $isScholarship = false;
            $itemPrice = null;

            $discountAmount = $request->input('discount_amount', 0);
            $nettAmount = $request->input('nett_amount', 0);
            $transactionFee = $request->input('transaction_fee', 5000);
            $totalAmount = $request->input('total_amount');

            $discountCodeId = $request->input('discount_code_id');
            $discountCodeAmount = $request->input('discount_code_amount', 0);

            if ($type === 'course') {
                $item = Course::findOrFail($itemId);
                $enrollmentTable = EnrollmentCourse::class;
                $enrollmentField = 'course_id';
            } elseif ($type === 'bootcamp') {
                $item = Bootcamp::findOrFail($itemId);
                $enrollmentTable = EnrollmentBootcamp::class;
                $enrollmentField = 'bootcamp_id';
            } elseif ($type === 'webinar') {
                $item = Webinar::findOrFail($itemId);
                $enrollmentTable = EnrollmentWebinar::class;
                $enrollmentField = 'webinar_id';
            } elseif ($type === 'private') {
                $item = PrivateClass::findOrFail($itemId);
                $enrollmentTable = EnrollmentPrivate::class;
                $enrollmentField = 'private_class_id';

                if (!$privateClassScheduleId) {
                    throw new \Exception('Jadwal private class wajib dipilih');
                }

                $selectedPrivateSchedule = PrivateClassSchedule::where('id', $privateClassScheduleId)
                    ->where('private_class_id', $item->id)
                    ->where('is_active', true)
                    ->first();

                if (!$selectedPrivateSchedule) {
                    throw new \Exception('Jadwal private class tidak valid atau sudah tidak aktif');
                }
            } elseif ($type === 'certification_program') {
                $item = CertificationProgram::findOrFail($itemId);
                $enrollmentTable = EnrollmentCertificationProgram::class;
                $enrollmentField = 'certification_program_id';

                $isScholarship = $request->boolean('is_scholarship', false);
                if ($item->type === 'scholarship') {
                    $isScholarship = true;
                }

                if ($item->type === 'regular' && $isScholarship) {
                    throw new \Exception('Program ini bukan tipe beasiswa');
                }

                if (!in_array($item->status, ['published', 'hidden'], true)) {
                    throw new \Exception('Sertifikasi tidak tersedia untuk checkout');
                }

                if ($item->registration_deadline && now()->gt($item->registration_deadline)) {
                    throw new \Exception('Pendaftaran sertifikasi sudah ditutup');
                }

                if ($isScholarship) {
                    $application = CertificationProgramScholarshipApplication::where('certification_program_id', $item->id)
                        ->where('email', Auth::user()->email)
                        ->latest()
                        ->first();

                    if (!$application) {
                        throw new \Exception('Anda belum terdaftar sebagai peserta beasiswa');
                    }

                    if ($application->status !== 'approved') {
                        throw new \Exception('Pengajuan beasiswa Anda belum disetujui');
                    }
                } elseif ($item->document_required) {
                    $application = CertificationProgramApplication::where('certification_program_id', $item->id)
                        ->where('user_id', $userId)
                        ->latest()
                        ->first();

                    if (!$application) {
                        throw new \Exception('Dokumen pendaftaran belum diajukan');
                    }

                    if ($application->status !== 'approved') {
                        throw new \Exception('Dokumen pendaftaran Anda belum disetujui');
                    }
                }
            } else {
                throw new \Exception('Tipe pembelian tidak valid');
            }

            if ($type === 'private') {
                if ($item->status !== 'published') {
                    throw new \Exception('Private class tidak tersedia untuk checkout');
                }

                $effectiveDeadline = $selectedPrivateSchedule?->registration_deadline ?? $item->registration_deadline;
                if ($effectiveDeadline && now()->gt($effectiveDeadline)) {
                    throw new \Exception('Pendaftaran jadwal private class sudah ditutup');
                }

                $maxParticipants = max((int) ($selectedPrivateSchedule?->max_participants ?? 1), 1);

                $alreadyPaidByUser = EnrollmentPrivate::where('private_class_schedule_id', $selectedPrivateSchedule->id)
                    ->whereHas('invoice', function ($query) use ($userId) {
                        $query->where('user_id', $userId)->where('status', 'paid');
                    })
                    ->exists();

                if ($alreadyPaidByUser) {
                    throw new \Exception('Anda sudah terdaftar pada jadwal private class ini.');
                }

                $paidCount = EnrollmentPrivate::where('private_class_schedule_id', $selectedPrivateSchedule->id)
                    ->whereHas('invoice', function ($query) {
                        $query->where('status', 'paid');
                    })
                    ->count();

                if ($paidCount >= $maxParticipants) {
                    throw new \Exception('Slot private class pada jadwal terpilih sudah penuh.');
                }

                $activePendingCount = EnrollmentPrivate::where('private_class_schedule_id', $selectedPrivateSchedule->id)
                    ->whereHas('invoice', function ($query) {
                        $query->where('status', 'pending')
                            ->where(function ($q) {
                                $q->whereNull('expires_at')
                                    ->orWhere('expires_at', '>', now());
                            });
                    })
                    ->count();

                if (($paidCount + $activePendingCount) >= $maxParticipants) {
                    throw new \Exception('Slot private class pada jadwal terpilih sedang dipesan. Silakan coba jadwal lain.');
                }
            }

            $itemPrice = $item->price;
            if ($type === 'certification_program' && $isScholarship) {
                $itemPrice = $item->scholarship_price;
            }

            $discountCode = null;
            if ($discountCodeId) {
                $discountCode = \App\Models\DiscountCode::find($discountCodeId);

                if (!$discountCode) {
                    throw new \Exception('Kode diskon tidak ditemukan');
                }

                if (!$discountCode->isValid()) {
                    throw new \Exception('Kode diskon tidak valid atau sudah kedaluwarsa');
                }

                if (!$discountCode->canBeUsed()) {
                    throw new \Exception('Kode diskon sudah mencapai batas penggunaan');
                }

                if (!$discountCode->canBeUsedByUser($userId)) {
                    throw new \Exception('Anda sudah mencapai batas penggunaan kode diskon ini');
                }

                if (!$discountCode->isApplicableToProduct($type, $itemId)) {
                    throw new \Exception('Kode diskon tidak berlaku untuk produk ini');
                }

                $calculatedDiscount = $discountCode->calculateDiscount($itemPrice);
                if ($discountCodeAmount !== $calculatedDiscount) {
                    throw new \Exception('Jumlah diskon tidak sesuai');
                }
            }

            $expectedNettAmount = $itemPrice - $discountCodeAmount;

            $pointsRedeemed = (int) $request->input('points_redeemed', 0);
            if ($pointsRedeemed > 0) {
                if ($discountCodeId) {
                    throw new \Exception('Voucher dan Poin tidak dapat digunakan bersamaan.');
                }
                
                $user = Auth::user();
                if ($pointsRedeemed > $user->point_balance) {
                    throw new \Exception('Saldo poin Anda tidak mencukupi.');
                }
                
                if ($pointsRedeemed > $expectedNettAmount) {
                    throw new \Exception('Poin yang digunakan melebihi harga produk.');
                }
                
                $expectedNettAmount = $expectedNettAmount - $pointsRedeemed;
            }

            $referralUserId = null;
            $referralCode = $request->input('referral_code');
            if ($referralCode) {
                if ($discountCodeId) {
                    throw new \Exception('Voucher dan Referral tidak dapat digunakan bersamaan.');
                }
                
                $referralService = app(\App\Services\ReferralService::class);
                $validationResult = $referralService->validateReferralCode($referralCode, null, Auth::user());
                
                if (!$validationResult['valid']) {
                    throw new \Exception($validationResult['message']);
                }
                
                $referralUserId = $validationResult['referrer']->id;
            }

            $expectedTotal = $expectedNettAmount > 0 ? $expectedNettAmount + $transactionFee : 0;

            if ($nettAmount != $expectedNettAmount) {
                throw new \Exception('Harga nett tidak sesuai');
            }

            if ($totalAmount != $expectedTotal) {
                throw new \Exception('Total amount tidak sesuai');
            }

            $fees = [];
            if ($discountAmount > 0) {
                $fees[] = ['type' => 'Diskon', 'value' => -$discountAmount];
            }
            if ($discountCodeAmount > 0) {
                $fees[] = ['type' => 'Diskon Promo (' . $discountCode->code . ')', 'value' => -$discountCodeAmount];
            }
            if ($pointsRedeemed > 0) {
                $fees[] = ['type' => 'Potongan Poin', 'value' => -$pointsRedeemed];
            }
            $fees[] = ['type' => 'Biaya Transaksi', 'value' => $transactionFee];

            $items = [
                [
                    'name' => $type === 'private' && $selectedPrivateSchedule
                        ? $item->title . ' (' . Carbon::parse($selectedPrivateSchedule->start_time)->format('d M Y H:i') . ')'
                        : $item->title,
                    'price' => $item->strikethrough_price > 0 ? $item->strikethrough_price : $itemPrice,
                    'quantity' => 1,
                ]
            ];

            $invoice_code = IdGenerator::generate([
                'table' => 'invoices',
                'field' => 'invoice_code',
                'length' => 11,
                'reset_on_prefix_change' => true,
                'prefix' => 'AKS-' . date('y')
            ]);

            $expiresAt = Carbon::now()->addHours(24);

            $invoice = Invoice::create([
                'user_id' => $userId,
                'invoice_code' => $invoice_code,
                'discount_amount' => $discountAmount,
                'amount' => $totalAmount,
                'nett_amount' => $nettAmount,
                'points_redeemed' => $pointsRedeemed,
                'referral_user_id' => $referralUserId,
                'expires_at' => $expiresAt,
            ]);

            if ($pointsRedeemed > 0) {
                app(\App\Services\PointService::class)->redeemPoints(Auth::user(), $pointsRedeemed, $invoice);
            }

            if ($discountCode) {
                DiscountUsage::create([
                    'discount_code_id' => $discountCode->id,
                    'user_id' => $userId,
                    'invoice_id' => $invoice->id,
                    'discount_amount' => $discountCodeAmount,
                ]);

                $discountCode->incrementUsage();
            }

            $xendit_create_invoice = new CreateInvoiceRequest([
                'external_id' => $invoice_code,
                'customer' => [
                    'given_names' => Auth::user()->name,
                    'email' => Auth::user()->email,
                    'mobile_number' => Auth::user()->phone_number,
                ],
                'customer_notification_preference' => [
                    'invoice_created' => ['email', 'whatsapp'],
                    'invoice_reminder' => ['email', 'whatsapp'],
                    'invoice_paid' => ['email'],
                ],
                'description' => 'Invoice pembayaran transaksi produk ' . $item->title . ' untuk user ' . Auth::user()->name,
                'amount' => $totalAmount,
                'items' => $items,
                'fees' => $fees,
                'failure_redirect_url' => route('invoice.show', ['id' => $invoice->id]),
                'success_redirect_url' => route('invoice.show', ['id' => $invoice->id]),
            ]);

            $xendit_api_instance = new InvoiceApi();
            $xendit_invoice = $xendit_api_instance->createInvoice($xendit_create_invoice);

            $invoice->update([
                'invoice_url' => $xendit_invoice['invoice_url'],
            ]);

            $enrollmentData = [
                'invoice_id' => $invoice->id,
                $enrollmentField => $item->id,
                'price' => $nettAmount,
                'completed_at' => null,
                'progress' => 0,
            ];

            if ($type === 'private') {
                $enrollmentData['private_class_schedule_id'] = $selectedPrivateSchedule->id;
            }

            if ($type === 'certification_program') {
                $enrollmentData['is_scholarship'] = $isScholarship;
            }

            $enrollmentTable::create($enrollmentData);

            if (in_array($type, ['course', 'bootcamp', 'webinar'], true)) {
                $this->addToCertificateParticipants($type, $item->id, $userId);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'payment_url' => $xendit_invoice['invoice_url'],
                'invoice_id' => $invoice->id,
                'invoice_code' => $invoice->invoice_code
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Invoice creation failed', [
                'error' => $e->getMessage(),
                'user_id' => Auth::id(),
                'request_data' => $request->all()
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function storeBundle(Request $request)
    {
        DB::beginTransaction();
        try {
            $userId = Auth::id();
            $bundleId = $request->input('bundle_id');
            $discountAmount = $request->input('discount_amount', 0);
            $transactionFee = $request->input('transaction_fee', 5000);
            $nettAmount = $request->input('nett_amount');
            $totalAmount = $request->input('total_amount');
            $discountCodeAmount = $request->input('discount_code_amount', 0);

            $bundle = Bundle::with('bundleItems.bundleable')->findOrFail($bundleId);

            // Validate bundle availability
            if (!$bundle->isAvailable()) {
                throw new \Exception('Bundle tidak tersedia untuk pembelian');
            }

            // Bundle harus berbayar
            if ($bundle->price === 0) {
                throw new \Exception('Bundle ini gratis, tidak perlu checkout');
            }

            // Check if already purchased
            if ($bundle->isPurchasedByUser($userId)) {
                throw new \Exception('Anda sudah membeli bundle ini');
            }

            // Validate pricing
            $expectedNettAmount = $bundle->price - $discountCodeAmount;

            $pointsRedeemed = (int) $request->input('points_redeemed', 0);
            if ($pointsRedeemed > 0) {
                if ($discountCodeAmount > 0) {
                    throw new \Exception('Voucher dan Poin tidak dapat digunakan bersamaan.');
                }
                
                $user = Auth::user();
                if ($pointsRedeemed > $user->point_balance) {
                    throw new \Exception('Saldo poin Anda tidak mencukupi.');
                }
                
                if ($pointsRedeemed > $expectedNettAmount) {
                    throw new \Exception('Poin yang digunakan melebihi harga produk.');
                }
                
                $expectedNettAmount = $expectedNettAmount - $pointsRedeemed;
            }

            $referralUserId = null;
            $referralCode = $request->input('referral_code');
            if ($referralCode) {
                if ($discountCodeAmount > 0) {
                    throw new \Exception('Voucher dan Referral tidak dapat digunakan bersamaan.');
                }
                
                $referralService = app(\App\Services\ReferralService::class);
                $validationResult = $referralService->validateReferralCode($referralCode, null, Auth::user());
                
                if (!$validationResult['valid']) {
                    throw new \Exception($validationResult['message']);
                }
                
                $referralUserId = $validationResult['referrer']->id;
            }

            $expectedTotal = $expectedNettAmount > 0 ? $expectedNettAmount + $transactionFee : 0;

            Log::info('Creating bundle invoice', [
                'user_id' => $userId,
                'bundle_id' => $bundleId,
                'bundle_price' => $bundle->price,
                'discount_amount' => $discountAmount,
                'discount_code_amount' => $discountCodeAmount,
                'transaction_fee' => $transactionFee,
                'nett_amount' => $nettAmount,
                'total_amount' => $totalAmount,
                'expected_nett_amount' => $expectedNettAmount,
                'expected_total_amount' => $expectedTotal,
            ]);
            if ($nettAmount != $expectedNettAmount) {
                throw new \Exception('Harga nett tidak sesuai');
            }

            if ($totalAmount != $expectedTotal) {
                throw new \Exception('Total amount tidak sesuai');
            }


            $invoice_code = IdGenerator::generate([
                'table' => 'invoices',
                'field' => 'invoice_code',
                'length' => 11,
                'reset_on_prefix_change' => true,
                'prefix' => 'AKS-' . date('y')
            ]);

            $expiresAt = Carbon::now()->addHours(24);

            // Create invoice
            $invoice = Invoice::create([
                'user_id' => $userId,
                'invoice_code' => $invoice_code,
                'discount_amount' => $discountAmount,
                'amount' => $totalAmount,
                'nett_amount' => $nettAmount,
                'points_redeemed' => $pointsRedeemed,
                'referral_user_id' => $referralUserId,
                'expires_at' => $expiresAt,
            ]);

            if ($pointsRedeemed > 0) {
                app(\App\Services\PointService::class)->redeemPoints(Auth::user(), $pointsRedeemed, $invoice);
            }

            // Create bundle enrollment
            EnrollmentBundle::create([
                'invoice_id' => $invoice->id,
                'bundle_id' => $bundle->id,
                'price' => $nettAmount,
            ]);

            // Prepare items for Xendit
            $items = [];
            $fees = [];

            $totalOriginalPrice = $bundle->bundleItems->sum('price');
            if ($totalOriginalPrice > $bundle->price) {
                $bundleDiscount = $totalOriginalPrice - $bundle->price;
                $fees[] = ['type' => 'Diskon Bundle', 'value' => -$bundleDiscount];
            }

            foreach ($bundle->bundleItems as $bundleItem) {
                $items[] = [
                    'name' => $bundleItem->bundleable->title,
                    'price' => $bundleItem->price,
                    'quantity' => 1,
                ];
            }

            if ($pointsRedeemed > 0) {
                $fees[] = ['type' => 'Potongan Poin', 'value' => -$pointsRedeemed];
            }
            $fees[] = ['type' => 'Biaya Transaksi', 'value' => $transactionFee];

            // Create Xendit invoice
            $xendit_create_invoice = new CreateInvoiceRequest([
                'external_id' => $invoice_code,
                'customer' => [
                    'given_names' => Auth::user()->name,
                    'email' => Auth::user()->email,
                    'mobile_number' => Auth::user()->phone_number,
                ],
                'customer_notification_preference' => [
                    'invoice_created' => ['email', 'whatsapp'],
                    'invoice_reminder' => ['email', 'whatsapp'],
                    'invoice_paid' => ['email'],
                ],
                'description' => 'Invoice pembayaran Paket Bundling: ' . $bundle->title,
                'amount' => $totalAmount,
                'items' => $items,
                'fees' => $fees,
                'failure_redirect_url' => route('invoice.show', ['id' => $invoice->id]),
                'success_redirect_url' => route('invoice.show', ['id' => $invoice->id]),
            ]);

            $xendit_api_instance = new InvoiceApi();
            $xendit_invoice = $xendit_api_instance->createInvoice($xendit_create_invoice);

            $invoice->update([
                'invoice_url' => $xendit_invoice['invoice_url'],
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'payment_url' => $xendit_invoice['invoice_url'],
                'invoice_id' => $invoice->id,
                'invoice_code' => $invoice->invoice_code
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Bundle invoice creation failed', [
                'error' => $e->getMessage(),
                'user_id' => Auth::id(),
                'bundle_id' => $request->input('bundle_id')
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function enrollFree(Request $request)
    {
        DB::beginTransaction();
        try {
            $request->validate([
                'type' => 'required|string|in:course,bootcamp,webinar,private',
                'id' => 'required',
                'private_class_schedule_id' => 'nullable|required_if:type,private|uuid',

                // New generic proof keys (preferred)
                'requirement_1_proof' => 'nullable|image|max:2048',
                'requirement_2_proof' => 'nullable|image|max:2048',
                'requirement_3_proof' => 'nullable|image|max:2048',

                // Backward compatible keys
                'ig_follow_proof' => 'nullable|image|max:2048',
                'tiktok_follow_proof' => 'nullable|image|max:2048',
                'tag_friend_proof' => 'nullable|image|max:2048',
            ]);

            $userId = Auth::id();
            $type = $request->input('type', 'course');
            $itemId = $request->input('id');
            $privateClassScheduleId = $request->input('private_class_schedule_id');
            $selectedPrivateSchedule = null;

            $affiliateCode = session('affiliate_code') ?? session('referral_code');
            $referredByUserId = null;

            if ($affiliateCode && $affiliateCode !== 'AKS2025') {
                $referrer = User::where('affiliate_code', $affiliateCode)->first();
                if ($referrer && $referrer->id !== $userId) {
                    $referredByUserId = $referrer->id;
                }
            }

            $item = null;
            $enrollmentTable = null;
            $enrollmentField = null;

            if ($type === 'course') {
                $item = Course::findOrFail($itemId);
                $enrollmentTable = EnrollmentCourse::class;
                $enrollmentField = 'course_id';
            } elseif ($type === 'bootcamp') {
                $item = Bootcamp::findOrFail($itemId);
                $enrollmentTable = EnrollmentBootcamp::class;
                $enrollmentField = 'bootcamp_id';
            } elseif ($type === 'webinar') {
                $item = Webinar::findOrFail($itemId);
                $enrollmentTable = EnrollmentWebinar::class;
                $enrollmentField = 'webinar_id';
            } elseif ($type === 'private') {
                $item = PrivateClass::findOrFail($itemId);
                $enrollmentTable = EnrollmentPrivate::class;
                $enrollmentField = 'private_class_id';

                $selectedPrivateSchedule = PrivateClassSchedule::where('id', $privateClassScheduleId)
                    ->where('private_class_id', $item->id)
                    ->where('is_active', true)
                    ->first();

                if (!$selectedPrivateSchedule) {
                    throw new \Exception('Jadwal private class tidak valid atau sudah tidak aktif');
                }
            } else {
                throw new \Exception('Tipe pendaftaran tidak valid');
            }

            if ($type === 'private') {
                if ($item->status !== 'published') {
                    throw new \Exception('Private class tidak tersedia untuk pendaftaran');
                }

                $effectiveDeadline = $selectedPrivateSchedule?->registration_deadline ?? $item->registration_deadline;
                if ($effectiveDeadline && now()->gt($effectiveDeadline)) {
                    throw new \Exception('Pendaftaran jadwal private class sudah ditutup');
                }

                $maxParticipants = max((int) ($selectedPrivateSchedule?->max_participants ?? 1), 1);

                $hasPaidEnrollment = EnrollmentPrivate::where('private_class_schedule_id', $selectedPrivateSchedule->id)
                    ->whereHas('invoice', function ($query) {
                        $query->where('status', 'paid');
                    })
                    ->count();

                if ($hasPaidEnrollment >= $maxParticipants || $maxParticipants <= 0) {
                    throw new \Exception('Slot private class pada jadwal terpilih sudah terisi.');
                }
            }

            if ($item->price > 0) {
                throw new \Exception('Item ini tidak gratis');
            }

            if ($type === 'private') {
                $existingEnrollment = $enrollmentTable::where('private_class_schedule_id', $selectedPrivateSchedule->id)
                    ->whereHas('invoice', function ($query) use ($userId) {
                        $query->where('user_id', $userId)
                            ->where('status', 'paid');
                    })
                    ->first();
            } else {
                $existingEnrollment = $enrollmentTable::where($enrollmentField, $item->id)
                    ->whereHas('invoice', function ($query) use ($userId) {
                        $query->where('user_id', $userId)
                            ->where('status', 'paid');
                    })
                    ->first();
            }

            if ($existingEnrollment) {
                throw new \Exception('Anda sudah terdaftar untuk item ini');
            }

            $invoice_code = IdGenerator::generate([
                'table' => 'invoices',
                'field' => 'invoice_code',
                'length' => 11,
                'reset_on_prefix_change'  => true,
                'prefix' => 'AKS-' . date('y')
            ]);

            $invoice = Invoice::create([
                'user_id' => $userId,
                'referred_by_user_id' => $referredByUserId,
                'invoice_code' => $invoice_code,
                'discount_amount' => 0,
                'amount' => 0,
                'nett_amount' => 0,
                'status' => 'paid',
                'paid_at' => Carbon::now('Asia/Jakarta'),
                'payment_method' => 'FREE',
                'payment_channel' => 'FREE_ENROLLMENT',
                'expires_at' => null,
            ]);

            $enrollment = $enrollmentTable::create([
                'invoice_id' => $invoice->id,
                $enrollmentField => $item->id,
                'private_class_schedule_id' => $type === 'private' ? $selectedPrivateSchedule->id : null,
                'price' => 0,
                'completed_at' => null,
                'progress' => 0,
            ]);

            if ($type === 'webinar' || $type === 'bootcamp') {
                $proof1 = $request->file('requirement_1_proof') ?? $request->file('ig_follow_proof');
                $proof2 = $request->file('requirement_2_proof') ?? $request->file('tiktok_follow_proof');
                $proof3 = $request->file('requirement_3_proof') ?? $request->file('tag_friend_proof');

                if (!$proof1 || !$proof2 || !$proof3) {
                    throw new \Exception('Harap upload semua bukti yang diperlukan!');
                }

                $requirementData = [
                    'enrollment_type' => $type,
                    'enrollment_id' => $enrollment->id
                ];

                $requirementData['ig_follow_proof'] = $proof1->store('free-requirements/requirement-1', 'public');
                $requirementData['tiktok_follow_proof'] = $proof2->store('free-requirements/requirement-2', 'public');
                $requirementData['tag_friend_proof'] = $proof3->store('free-requirements/requirement-3', 'public');

                FreeEnrollmentRequirement::create($requirementData);
            }

            $this->addToCertificateParticipants($type, $item->id, $userId);

            $this->sendWhatsAppFreeEnrollment($invoice, $type, $item);

            DB::commit();

            return redirect()->route('invoice.show', ['id' => $invoice->id])
                ->with('success', 'Pendaftaran gratis berhasil! Anda akan segera menerima konfirmasi.');
        } catch (\Throwable $th) {
            DB::rollBack();
            Log::error('Free enrollment failed', [
                'error' => $th->getMessage(),
                'user_id' => Auth::id(),
                'type' => $request->input('type'),
                'id' => $request->input('id')
            ]);

            return back()->withErrors(['message' => $th->getMessage()]);
        }
    }

    public function show($id)
    {
        $invoice = Invoice::with([
            'courseItems.course',
            'bootcampItems.bootcamp',
            'webinarItems.webinar',
            'privateItems.privateClass',
            'privateItems.privateClassSchedule',
            'certificationProgramItems.certificationProgram'
        ])->findOrFail($id);
        return Inertia::render('user/checkout/success', ['invoice' => $invoice]);
    }

    /**
     * Cancel invoice manually (both in database and Xendit)
     */
    public function cancel($id)
    {
        DB::beginTransaction();
        try {
            $isAdmin = Auth::user() && Auth::user()->hasRole('admin');

            $query = Invoice::with('discountUsage.discountCode')
                ->where('id', $id)
                ->where('status', 'pending');

            if (!$isAdmin) {
                $query->where('user_id', Auth::id());
            }

            $invoice = $query->firstOrFail();

            $this->expireInvoiceInXendit($invoice->invoice_code);

            if ($invoice->discountUsage) {
                $discountCode = $invoice->discountUsage->discountCode;
                if ($discountCode) {
                    $discountCode->decrement('used_count');
                }
                $invoice->discountUsage->delete();
            }

            if ($invoice->courseItems->count() > 0) {
                EnrollmentCourse::where('invoice_id', $invoice->id)->delete();
            }

            if ($invoice->bootcampItems->count() > 0) {
                EnrollmentBootcamp::where('invoice_id', $invoice->id)->delete();
            }

            if ($invoice->webinarItems->count() > 0) {
                EnrollmentWebinar::where('invoice_id', $invoice->id)->delete();
            }

            if ($invoice->privateItems->count() > 0) {
                EnrollmentPrivate::where('invoice_id', $invoice->id)->delete();
            }

            if ($invoice->certificationProgramItems->count() > 0) {
                EnrollmentCertificationProgram::where('invoice_id', $invoice->id)->delete();
            }

            if ($invoice->bundleEnrollments->count() > 0) {
                EnrollmentBundle::where('invoice_id', $invoice->id)->delete();
            }

            $userId = $invoice->user_id;

            foreach ($invoice->courseItems as $courseItem) {
                $certificate = Certificate::where('course_id', $courseItem->course_id)->first();
                if ($certificate) {
                    $hasOtherPaidEnrollment = EnrollmentCourse::where('course_id', $courseItem->course_id)
                        ->whereHas('invoice', function ($query) use ($userId) {
                            $query->where('user_id', $userId)
                                ->where('status', 'paid');
                        })
                        ->exists();

                    if (!$hasOtherPaidEnrollment) {
                        CertificateParticipant::where('certificate_id', $certificate->id)
                            ->where('user_id', $userId)
                            ->delete();
                    }
                }
            }

            foreach ($invoice->bootcampItems as $bootcampItem) {
                $certificate = Certificate::where('bootcamp_id', $bootcampItem->bootcamp_id)->first();
                if ($certificate) {
                    $hasOtherPaidEnrollment = EnrollmentBootcamp::where('bootcamp_id', $bootcampItem->bootcamp_id)
                        ->whereHas('invoice', function ($query) use ($userId) {
                            $query->where('user_id', $userId)
                                ->where('status', 'paid');
                        })
                        ->exists();

                    if (!$hasOtherPaidEnrollment) {
                        CertificateParticipant::where('certificate_id', $certificate->id)
                            ->where('user_id', $userId)
                            ->delete();
                    }
                }
            }

            foreach ($invoice->webinarItems as $webinarItem) {
                $certificate = Certificate::where('webinar_id', $webinarItem->webinar_id)->first();
                if ($certificate) {
                    $hasOtherPaidEnrollment = EnrollmentWebinar::where('webinar_id', $webinarItem->webinar_id)
                        ->whereHas('invoice', function ($query) use ($userId) {
                            $query->where('user_id', $userId)
                                ->where('status', 'paid');
                        })
                        ->exists();

                    if (!$hasOtherPaidEnrollment) {
                        CertificateParticipant::where('certificate_id', $certificate->id)
                            ->where('user_id', $userId)
                            ->delete();
                    }
                }
            }

            $invoice->update(['status' => 'failed']);

            if ($invoice->points_redeemed > 0) {
                app(\App\Services\PointService::class)->refundPoints($invoice);
            }

            DB::commit();

            if (request()->wantsJson() || request()->ajax()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Invoice berhasil dibatalkan.'
                ]);
            }

            return redirect()->back()->with('success', 'Invoice berhasil dibatalkan.');
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Gagal membatalkan invoice. ' . $e->getMessage(),
                'success' => false
            ], 400);
        }
    }

    /**
     * Expire invoice di Xendit menggunakan external_id
     */
    private function expireInvoiceInXendit($externalId)
    {
        try {
            $xendit_api_instance = new InvoiceApi();

            $invoices = $xendit_api_instance->getInvoices(null, null, $externalId);

            if (!empty($invoices) && isset($invoices[0]['id'])) {
                $xenditInvoiceId = $invoices[0]['id'];

                $xendit_api_instance->expireInvoice($xenditInvoiceId);
            }
        } catch (\Exception $e) {
            Log::error('Failed to expire invoice in Xendit: ' . $e->getMessage(), [
                'external_id' => $externalId
            ]);
        }
    }

    /**
     * Check and expire old invoices (to be called by scheduler)
     */
    public function expireOldInvoices()
    {
        $expiredInvoices = Invoice::where('status', 'pending')
            ->where('expires_at', '<', Carbon::now())
            ->get();

        foreach ($expiredInvoices as $invoice) {
            $this->expireInvoiceInXendit($invoice->invoice_code);
            $invoice->update(['status' => 'failed']);

            if ($invoice->points_redeemed > 0) {
                app(\App\Services\PointService::class)->refundPoints($invoice);
            }
        }

        return response()->json([
            'message' => count($expiredInvoices) . ' invoices expired and updated.',
            'expired_count' => count($expiredInvoices)
        ]);
    }

    public function callbackXendit(Request $request)
    {
        Log::info('=== XENDIT CALLBACK RECEIVED ===', [
            'headers' => $request->headers->all(),
            'payload' => $request->all()
        ]);

        try {
            $getToken = $request->header('x-callback-token');
        $callbackToken = config('xendit.CALLBACK_TOKEN');

        if ($getToken != $callbackToken) {
            return response()->json(['message' => 'unauthorized'], 401);
        }

        $invoice = Invoice::with([
            'user',
            'courseItems.course',
            'bootcampItems.bootcamp',
            'webinarItems.webinar',
            'privateItems.privateClass',
            'privateItems.privateClassSchedule',
            'certificationProgramItems.certificationProgram',
            'bundleEnrollments.bundle.bundleItems.bundleable'
        ])->where('invoice_code', $request->external_id)->first();

        if (!$invoice) {
            return response()->json(['message' => 'Invoice Not Found'], 404);
        }

        // Hanya proses jika status invoice masih pending untuk menghindari duplikasi
        if ($invoice->status !== 'pending') {
            return response()->json(['message' => 'Invoice already processed'], 200);
        }

        $isSuccess = ($request->status == 'PAID' || $request->status == 'SETTLED');

        // ====== INSTALLMENT CHILD HANDLER ======
        if ($invoice->isInstallmentChild() && $isSuccess) {
            $invoice->update([
                'paid_at' => Carbon::now('Asia/Jakarta'),
                'status' => 'paid',
                'payment_method' => $request->payment_method,
                'payment_channel' => $request->payment_channel,
            ]);

            $parentInvoice = Invoice::with([
                'user',
                'courseItems.course',
                'bootcampItems.bootcamp',
                'webinarItems.webinar',
                'privateItems.privateClass',
                'certificationProgramItems.certificationProgram',
                'bundleEnrollments.bundle',
            ])->find($invoice->parent_invoice_id);

            if ($parentInvoice) {
                // Jika termin ke-1 (DP): aktifkan akses
                if ($invoice->installment_number === 1) {
                    $this->activateInstallmentEnrollments($parentInvoice);
                }

                // Pulihkan akses jika sebelumnya dibekukan
                $parentInvoice->update(['access_suspended_at' => null]);

                // Catat komisi affiliate + mentor untuk termin ini
                $this->recordAffiliateCommissionForTerm($invoice, $parentInvoice);

                // Cek apakah semua termin lunas
                if ($parentInvoice->isFullyPaid()) {
                    $parentInvoice->update(['status' => 'paid', 'paid_at' => Carbon::now('Asia/Jakarta')]);
                    event(new \App\Events\TransactionPaid($parentInvoice));
                    $this->sendWhatsAppInstallmentComplete($parentInvoice);
                } else {
                    $this->sendWhatsAppTermPaid($invoice, $parentInvoice);
                }
            }

            return response()->json(['message' => 'Success'], 200);
        }
        // ====== END INSTALLMENT CHILD HANDLER ======

        if ($isSuccess) {
            $invoice->update([
                'paid_at' => Carbon::now('Asia/Jakarta'),
                'status' => 'paid',
                'payment_method' => $request->payment_method,
                'payment_channel' => $request->payment_channel
            ]);

            if ($invoice->bundleEnrollments->count() > 0) {
                Log::info('Processing bundle enrollments', [
                    'invoice_code' => $invoice->invoice_code,
                    'bundle_count' => $invoice->bundleEnrollments->count()
                ]);

                foreach ($invoice->bundleEnrollments as $bundleEnrollment) {
                    $bundleEnrollment->createIndividualEnrollments();

                    $bundle = $bundleEnrollment->bundle;

                    Log::info('Processing bundle items', [
                        'bundle_id' => $bundle->id,
                        'items_count' => $bundle->bundleItems->count()
                    ]);

                    foreach ($bundle->bundleItems as $item) {
                        $type = $item->getTypeSlug();
                        $this->addToCertificateParticipants($type, $item->bundleable_id, $invoice->user_id);

                        Log::info('Added to certificate', [
                            'type' => $type,
                            'item_id' => $item->bundleable_id,
                            'user_id' => $invoice->user_id
                        ]);
                    }
                }
            }

            $this->recordAffiliateCommission($invoice);
            $this->addEnrollmentToCertificateParticipants($invoice);

            // Fire event for referral/rewards points
            event(new \App\Events\TransactionPaid($invoice));

            // Kirim WhatsApp setelah pembayaran berhasil
            $this->sendWhatsAppNotification($invoice);
        } else {
            $invoice->update(['status' => 'failed']);

            // Kirim WhatsApp untuk pembayaran gagal (opsional)
            $this->sendWhatsAppPaymentFailed($invoice);
        }

        return response()->json(['message' => 'Success'], 200);

        } catch (\Throwable $e) {
            Log::error('XENDIT CALLBACK ERROR: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Callback processing error',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Kirim notifikasi WhatsApp setelah pembayaran berhasil
     *
     * @param Invoice $invoice
     * @return void
     */
    private function sendWhatsAppNotification(Invoice $invoice)
    {
        try {
            $user = $invoice->user;

            if (!$user->phone_number) {
                Log::warning('User does not have phone number', ['user_id' => $user->id, 'invoice_code' => $invoice->invoice_code]);
                return;
            }

            $phoneNumber = $this->formatPhoneNumber($user->phone_number);
            $message = $this->createWhatsAppMessage($invoice);

            $waData = [
                [
                    'phone' => $phoneNumber,
                    'message' => $message,
                    'isGroup' => 'false'
                ]
            ];

            $sent = self::sendText($waData);

            if ($sent) {
                Log::info('WhatsApp notification sent successfully', [
                    'invoice_code' => $invoice->invoice_code,
                    'user_id' => $user->id,
                    'phone' => $phoneNumber
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Failed to send WhatsApp notification', [
                'invoice_code' => $invoice->invoice_code,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Kirim notifikasi WhatsApp untuk pembayaran gagal
     *
     * @param Invoice $invoice
     * @return void
     */
    private function sendWhatsAppPaymentFailed(Invoice $invoice)
    {
        try {
            $user = $invoice->user;

            if (!$user->phone_number) {
                return;
            }

            $phoneNumber = $this->formatPhoneNumber($user->phone_number);

            $itemType = 'Program';
            if ($invoice->courseItems->count() > 0) {
                $itemType = 'Kelas Online';
            } elseif ($invoice->bootcampItems->count() > 0) {
                $itemType = 'Bootcamp';
            } elseif ($invoice->webinarItems->count() > 0) {
                $itemType = 'Webinar';
            } elseif ($invoice->privateItems->count() > 0) {
                $itemType = 'Private Class';
            } elseif ($invoice->certificationProgramItems->count() > 0) {
                $itemType = 'Sertifikasi Program';
            }

            $message = "*[Aksademy - Pembayaran {$itemType} Gagal]*\n\n";
            $message .= "Hai *{$user->name}*,\n\n";
            $message .= "Maaf, pembayaran {$itemType} untuk invoice *{$invoice->invoice_code}* tidak berhasil atau telah kadaluarsa.\n\n";
            $message .= "Silakan melakukan pembelian ulang jika Anda masih berminat.\n\n";
            $message .= "Jika Anda memiliki pertanyaan atau membutuhkan bantuan, silakan hubungi Admin kami via WhatsApp di nomor *6285142505794* (atau klik wa.me/6285142505794).\n\n";
            $message .= "Terima kasih atas perhatiannya.\n\n";
            $message .= "*Araska - Customer Support*";

            $waData = [
                [
                    'phone' => $phoneNumber,
                    'message' => $message,
                    'isGroup' => 'false'
                ]
            ];

            self::sendText($waData);
        } catch (\Exception $e) {
            Log::error('Failed to send WhatsApp payment failed notification', [
                'invoice_code' => $invoice->invoice_code,
                'error' => $e->getMessage()
            ]);
        }
    }

    // ==================== INSTALLMENT HELPERS ====================

    /**
     * Aktifkan akses enrollment pada invoice induk cicilan setelah DP dibayar
     */
    private function activateInstallmentEnrollments(Invoice $parentInvoice): void
    {
        // Jika invoice adalah bundling, buat individual enrollments untuk setiap item di dalam bundle
        if ($parentInvoice->bundleEnrollments && $parentInvoice->bundleEnrollments->count() > 0) {
            foreach ($parentInvoice->bundleEnrollments as $bundleEnrollment) {
                $bundleEnrollment->createIndividualEnrollments();
            }
        }

        Log::info('Installment DP paid - access activated', [
            'parent_invoice_code' => $parentInvoice->invoice_code,
            'user_id' => $parentInvoice->user_id,
        ]);
    }

    /**
     * Catat komisi affiliate untuk sebuah termin cicilan yang berhasil dibayar
     */
    private function recordAffiliateCommissionForTerm(Invoice $childInvoice, Invoice $parentInvoice): void
    {
        try {
            $this->recordAffiliateCommission($childInvoice);
        } catch (\Throwable $e) {
            Log::error('Failed to record affiliate commission for installment term', [
                'child_invoice_code' => $childInvoice->invoice_code,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Kirim WhatsApp saat satu termin cicilan berhasil dibayar (belum lunas)
     */
    private function sendWhatsAppTermPaid(Invoice $childInvoice, Invoice $parentInvoice): void
    {
        try {
            $user = $parentInvoice->user;
            if (!$user?->phone_number) return;

            $phoneNumber = $this->formatPhoneNumber($user->phone_number);
            $termNumber = $childInvoice->installment_number;
            $totalTerms = $parentInvoice->installmentTerms()->count();
            $nextTerm = $parentInvoice->nextUnpaidTerm();
            $nextDue = $nextTerm ? Carbon::parse($nextTerm->installment_due_date)->translatedFormat('d F Y') : '-';

            $message = "*[Aksademy - Cicilan Berhasil]*\n\n";
            $message .= "Hai *{$user->name}*,\n\n";
            $message .= "Cicilan ke-*{$termNumber}/{$totalTerms}* sebesar *Rp " . number_format($childInvoice->amount, 0, ',', '.') . "* berhasil dibayar.\n\n";
            if ($nextTerm) {
                $message .= "Cicilan ke-*" . ($termNumber + 1) . "/{$totalTerms}* jatuh tempo pada *{$nextDue}*.\n\n";
            }
            $message .= "Terima kasih!\n\n*Aksademy - Customer Support*";

            self::sendText([['phone' => $phoneNumber, 'message' => $message, 'isGroup' => 'false']]);
        } catch (\Throwable $e) {
            Log::error('Failed to send WhatsApp term paid', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Kirim WhatsApp saat semua termin cicilan lunas
     */
    private function sendWhatsAppInstallmentComplete(Invoice $parentInvoice): void
    {
        try {
            $user = $parentInvoice->user;
            if (!$user?->phone_number) return;

            $phoneNumber = $this->formatPhoneNumber($user->phone_number);

            $message = "*[Aksademy - Cicilan Lunas]*\n\n";
            $message .= "Hai *{$user->name}*,\n\n";
            $message .= "Selamat! Semua cicilan untuk invoice *{$parentInvoice->invoice_code}* telah lunas.\n\n";
            $message .= "Sertifikat tersedia untuk diunduh melalui profil Anda.\n\n";
            $message .= "Terima kasih!\n\n*Aksademy - Customer Support*";

            self::sendText([['phone' => $phoneNumber, 'message' => $message, 'isGroup' => 'false']]);
        } catch (\Throwable $e) {
            Log::error('Failed to send WhatsApp installment complete', ['error' => $e->getMessage()]);
        }
    }

    // ==================== END INSTALLMENT HELPERS ====================

    /**
     * Buat pesan WhatsApp berdasarkan item yang dibeli
     *
     * @param Invoice $invoice
     * @return string
     */
    private function createWhatsAppMessage(Invoice $invoice): string
    {
        $user = $invoice->user;
        $loginUrl = route('login');
        $profileUrl = route('profile.index');

        $invoice->load('discountUsage.discountCode');

        $itemType = null;
        $itemData = null;
        $typeInfo = null;

        if ($invoice->bundleEnrollments->count() > 0) {
            $itemType = 'bundle';
            $bundleEnrollment = $invoice->bundleEnrollments->first();
            $bundle = $bundleEnrollment->bundle;

            $typeInfo = [
                'icon' => '📦',
                'name' => 'Paket Bundling',
                'menu' => 'Dashboard',
                'title' => $bundle->title,
                'item' => $bundle
            ];
        } elseif ($invoice->courseItems->count() > 0) {
            $itemType = 'course';
            $itemData = $invoice->courseItems->first();
            $typeInfo = [
                'icon' => '📚',
                'name' => 'Kelas Online',
                'menu' => 'Kelas Saya',
                'title' => $itemData->course->title,
                'item' => $itemData->course
            ];
        } elseif ($invoice->bootcampItems->count() > 0) {
            $itemType = 'bootcamp';
            $itemData = $invoice->bootcampItems->first();
            $typeInfo = [
                'icon' => '🎯',
                'name' => 'Bootcamp',
                'menu' => 'Bootcamp Saya',
                'title' => $itemData->bootcamp->title,
                'item' => $itemData->bootcamp
            ];
        } elseif ($invoice->webinarItems->count() > 0) {
            $itemType = 'webinar';
            $itemData = $invoice->webinarItems->first();
            $typeInfo = [
                'icon' => '📺',
                'name' => 'Webinar',
                'menu' => 'Webinar Saya',
                'title' => $itemData->webinar->title,
                'item' => $itemData->webinar
            ];
        } elseif ($invoice->privateItems->count() > 0) {
            $itemType = 'private';
            $itemData = $invoice->privateItems()->with('privateClass', 'privateClassSchedule')->first();
            $typeInfo = [
                'icon' => '🎓',
                'name' => 'Private Class',
                'menu' => 'Dashboard',
                'title' => $itemData->privateClass->title,
                'item' => $itemData->privateClass
            ];
        } elseif ($invoice->certificationProgramItems->count() > 0) {
            $itemType = 'certification_program';
            $itemData = $invoice->certificationProgramItems->first();
            $typeInfo = [
                'icon' => '🧾',
                'name' => 'Sertifikasi Program',
                'menu' => 'Sertifikasi Saya',
                'title' => $itemData->certificationProgram->title,
                'item' => $itemData->certificationProgram
            ];
        }

        $isFreePurchase = $invoice->amount == 0;

        if ($isFreePurchase) {
            $message = "*[Aksademy - Pendaftaran {$typeInfo['name']} Berhasil]* ✅\n\n";
            $message .= "Hai *{$user->name}*,\n\n";
            $message .= "Selamat! Anda telah berhasil mendaftar untuk {$typeInfo['name']} GRATIS.\n\n";
        } else {
            $message = "*[Aksademy - Pembayaran {$typeInfo['name']} Berhasil]* ✅\n\n";
            $message .= "Hai *{$user->name}*,\n\n";
            $message .= "Terima kasih! Pembayaran {$typeInfo['name']} Anda telah berhasil diproses.\n\n";
        }

        $message .= "*Detail " . ($isFreePurchase ? 'Pendaftaran' : 'Pembelian') . ":*\n";
        $message .= "🧾 " . ($isFreePurchase ? 'Kode' : 'Invoice') . ": *{$invoice->invoice_code}*\n";
        $message .= "{$typeInfo['icon']} {$typeInfo['name']}: *{$typeInfo['title']}*\n";

        if ($itemType === 'bundle') {
            $bundle = $typeInfo['item'];
            $message .= "📦 Berisi: *{$bundle->bundle_items_count} Program*\n";
        }

        if ($isFreePurchase) {
            $message .= "💰 Biaya: *GRATIS* 🎉\n";
        } else {
            if ($invoice->discountUsage && $invoice->discountUsage->discountCode) {
                $discountCode = $invoice->discountUsage->discountCode;
                $message .= "🏷️ Kode Promo: *{$discountCode->code}* (-Rp " . number_format($invoice->discountUsage->discount_amount, 0, ',', '.') . ")\n";
            }
            $message .= "💰 Total: *Rp " . number_format($invoice->amount, 0, ',', '.') . "*\n";
        }

        $message .= "📅 " . ($isFreePurchase ? 'Terdaftar' : 'Dibayar') . ": " . Carbon::parse($invoice->paid_at)->format('d M Y H:i') . "\n\n";

        $message .= "*Cara Mengakses:*\n";
        $message .= "1. Login ke akun Anda: {$loginUrl}\n";
        $message .= "2. Kunjungi dashboard: {$profileUrl}\n";
        if ($itemType === 'bundle') {
            $message .= "3. Semua program sudah bisa diakses dari menu masing-masing\n";
            $message .= "4. Mulai belajar dan raih sertifikat untuk setiap program! 🎓\n\n";

            $bundle = $typeInfo['item'];
            $hasGroupUrl = false;
            $groupLinks = "";
            
            foreach ($bundle->bundleItems as $item) {
                $program = $item->bundleable;
                if ($program && !empty($program->group_url)) {
                    $hasGroupUrl = true;
                    $groupLinks .= "👥 {$program->title}:\n{$program->group_url}\n\n";
                }
            }

            if ($hasGroupUrl) {
                $message .= "*Join Group Pelatihan:*\n";
                $message .= $groupLinks;
                $message .= "⚠️ *Penting:*\n";
                $message .= "• Bergabung dengan group untuk mendapatkan info penting dan diskusi\n";
                $message .= "• Aktif mengikuti seluruh kegiatan program\n\n";
            }
        } else {
            $message .= "3. Pilih menu '{$typeInfo['menu']}'\n";
            $message .= "4. Mulai belajar dan raih sertifikat! 🎓\n\n";
        }

        if ($itemType === 'webinar') {
            $webinar = $typeInfo['item'];
            $startTime = Carbon::parse($webinar->start_time);
            $message .= "*Jadwal Webinar:*\n";
            $message .= "📅 {$startTime->format('d M Y')}\n";
            $message .= "🕐 {$startTime->format('H:i')} WIB\n\n";

            if (!empty($webinar->group_url)) {
                $message .= "*Join Group Webinar:*\n";
                $message .= "👥 {$webinar->group_url}\n\n";
                $message .= "⚠️ *Penting:* \n";
                $message .= "• Bergabung dengan group untuk update terbaru\n";
                $message .= "• Jangan lupa attend sesuai jadwal!\n\n";
            } else {
                $message .= "⚠️ *Penting:* Jangan lupa bergabung sesuai jadwal!\n\n";
            }
        } elseif ($itemType === 'bootcamp') {
            $bootcamp = $typeInfo['item'];
            $startDate = Carbon::parse($bootcamp->start_date);
            $endDate = Carbon::parse($bootcamp->end_date);
            $message .= "*Periode Bootcamp:*\n";
            $message .= "📅 {$startDate->format('d M Y')} - {$endDate->format('d M Y')}\n\n";

            if (!empty($bootcamp->group_url)) {
                $message .= "*Join Group Bootcamp:*\n";
                $message .= "👥 {$bootcamp->group_url}\n\n";
                $message .= "⚠️ *Penting:* \n";
                $message .= "• Bergabung dengan group untuk mendapatkan info penting dan diskusi\n";
                $message .= "• Aktif mengikuti seluruh kegiatan bootcamp\n\n";
            }
        } elseif ($itemType === 'private') {
            $privateClass = $typeInfo['item'];
            $privateSchedule = $itemData?->privateClassSchedule;

            if ($privateSchedule) {
                $startTime = Carbon::parse($privateSchedule->start_time);
                $endTime = Carbon::parse($privateSchedule->end_time);
                $message .= "*Jadwal Private Class:*\n";
                $message .= "📅 {$startTime->format('d M Y')}\n";
                $message .= "🕐 {$startTime->format('H:i')} - {$endTime->format('H:i')} WIB\n\n";
            } elseif (!empty($privateClass->start_time)) {
                $startTime = Carbon::parse($privateClass->start_time);
                $message .= "*Jadwal Private Class:*\n";
                $message .= "📅 {$startTime->format('d M Y')}\n";
                $message .= "🕐 {$startTime->format('H:i')} WIB\n\n";
            }

            if (!empty($privateClass->mode)) {
                $modeText = $privateClass->mode === 'offline' ? 'Offline' : 'Online';
                $message .= "📍 Mode: *{$modeText}*\n";
                if ($privateClass->mode === 'offline' && !empty($privateClass->location)) {
                    $message .= "📌 Lokasi: {$privateClass->location}\n";
                }
                $message .= "\n";
            }

            if (!empty($privateClass->group_url)) {
                $message .= "*Join Group Private Class:*\n";
                $message .= "👥 {$privateClass->group_url}\n\n";
            }
        } elseif ($itemType === 'certification_program') {
            $program = $typeInfo['item'];

            if (!empty($program->group_url)) {
                $message .= "*Join Group Sertifikasi:*\n";
                $message .= "👥 {$program->group_url}\n\n";
                $message .= "⚠️ *Penting:*\n";
                $message .= "• Bergabung dengan group untuk mendapatkan info penting\n";
                $message .= "• Ikuti jadwal program yang tersedia\n\n";
            }
        }

        $message .= "Jika Anda memiliki pertanyaan atau membutuhkan bantuan, silakan hubungi Admin kami via WhatsApp di nomor *6285142505794* (atau klik wa.me/6285142505794).\n\n";
        if ($isFreePurchase) {
            $message .= "Terima kasih telah bergabung dengan Aksademy! 🚀\n\n";
        } else {
            $message .= "Selamat belajar! 🚀\n\n";
        }

        $message .= "*Araska - Customer Support*";

        return $message;
    }

    /**
     * Kirim notifikasi WhatsApp untuk pendaftaran gratis
     *
     * @param Invoice $invoice
     * @param string $type
     * @param mixed $item
     * @return void
     */
    private function sendWhatsAppFreeEnrollment(Invoice $invoice, string $type, $item)
    {
        try {
            $user = $invoice->user;

            if (!$user->phone_number) {
                Log::warning('User does not have phone number for free enrollment', [
                    'user_id' => $user->id,
                    'invoice_code' => $invoice->invoice_code
                ]);
                return;
            }

            $phoneNumber = $this->formatPhoneNumber($user->phone_number);
            $message = $this->createWhatsAppMessage($invoice);

            $waData = [
                [
                    'phone' => $phoneNumber,
                    'message' => $message,
                    'isGroup' => 'false'
                ]
            ];

            $sent = self::sendText($waData);

            if ($sent) {
                Log::info('WhatsApp free enrollment notification sent successfully', [
                    'invoice_code' => $invoice->invoice_code,
                    'user_id' => $user->id,
                    'phone' => $phoneNumber,
                    'type' => $type
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Failed to send WhatsApp free enrollment notification', [
                'invoice_code' => $invoice->invoice_code,
                'type' => $type,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Format nomor HP ke format WhatsApp (62...)
     *
     * @param string $phoneNumber
     * @return string
     */
    private function formatPhoneNumber(string $phoneNumber): string
    {
        // Hapus semua karakter non-digit
        $phoneNumber = preg_replace('/[^0-9]/', '', $phoneNumber);

        // Jika dimulai dengan 0, ganti dengan 62
        if (substr($phoneNumber, 0, 1) == '0') {
            $phoneNumber = '62' . substr($phoneNumber, 1);
        }

        // Jika belum dimulai dengan 62, tambahkan 62
        if (substr($phoneNumber, 0, 2) != '62') {
            $phoneNumber = '62' . $phoneNumber;
        }

        return $phoneNumber;
    }

    /**
     * Mencatat komisi untuk afiliasi jika ada.
     *
     * @param Invoice $invoice
     * @return void
     */
    private function recordAffiliateCommission(Invoice $invoice)
    {
        $buyer = $invoice->user;

        // Cek apakah pembeli ini direferensikan oleh seseorang
        if ($buyer && $buyer->referred_by_user_id) {
            $affiliate = User::find($buyer->referred_by_user_id);

            // Memastikan afiliasi ada, aktif, dan memiliki rate komisi
            if ($affiliate && $affiliate->affiliate_status === 'Active' && $affiliate->commission > 0) {
                $commissionAmount = $invoice->nett_amount * ($affiliate->commission / 100);

                AffiliateEarning::create([
                    'affiliate_user_id' => $affiliate->id,
                    'invoice_id' => $invoice->id,
                    'amount' => $commissionAmount,
                    'rate' => $affiliate->commission,
                    'status' => 'approved',
                ]);
            }
        }

        $this->recordMentorCommission($invoice);
    }

    /**
     * Mencatat komisi untuk mentor dari penjualan kelas mereka
     *
     * @param Invoice $invoice
     * @return void
     */
    private function recordMentorCommission(Invoice $invoice)
    {
        $invoice->load(['courseItems.course.user']);

        foreach ($invoice->courseItems as $courseItem) {
            $course = $courseItem->course;
            $mentor = $course->user;

            if ($mentor && $mentor->hasRole('mentor') && $mentor->affiliate_status === 'Active' && $mentor->commission > 0) {
                $commissionAmount = $courseItem->price * ($mentor->commission / 100);

                AffiliateEarning::create([
                    'affiliate_user_id' => $mentor->id,
                    'invoice_id' => $invoice->id,
                    'amount' => $commissionAmount,
                    'rate' => $mentor->commission,
                    'status' => 'approved',
                    'type' => 'mentor_course',
                    'course_id' => $course->id,
                ]);
            }
        }
    }

    /**
     * Menambahkan peserta ke certificate participants berdasarkan tipe program
     *
     * @param string $type
     * @param string $itemId
     * @param string $userId
     * @return void
     */
    private function addToCertificateParticipants($type, $itemId, $userId)
    {
        $certificate = null;

        // Cari sertifikat berdasarkan tipe program
        switch ($type) {
            case 'course':
                $certificate = Certificate::where('course_id', $itemId)->first();
                break;
            case 'bootcamp':
                $certificate = Certificate::where('bootcamp_id', $itemId)->first();
                break;
            case 'webinar':
                $certificate = Certificate::where('webinar_id', $itemId)->first();
                break;
        }

        if ($certificate) {
            $existingParticipant = CertificateParticipant::where('certificate_id', $certificate->id)
                ->where('user_id', $userId)
                ->first();

            if (!$existingParticipant) {
                CertificateParticipant::create([
                    'certificate_id' => $certificate->id,
                    'user_id' => $userId,
                ]);
            }
        }
    }

    /**
     * Menambahkan enrollment ke certificate participants dari invoice yang dibayar
     *
     * @param Invoice $invoice
     * @return void
     */
    private function addEnrollmentToCertificateParticipants(Invoice $invoice)
    {
        $invoice->load(['courseItems', 'bootcampItems', 'webinarItems', 'privateItems', 'bundleEnrollments.bundle.bundleItems.bundleable']);

        foreach ($invoice->courseItems as $courseItem) {
            $this->addToCertificateParticipants('course', $courseItem->course_id, $invoice->user_id);
        }

        foreach ($invoice->bootcampItems as $bootcampItem) {
            $this->addToCertificateParticipants('bootcamp', $bootcampItem->bootcamp_id, $invoice->user_id);
        }

        foreach ($invoice->webinarItems as $webinarItem) {
            $this->addToCertificateParticipants('webinar', $webinarItem->webinar_id, $invoice->user_id);
        }

        foreach ($invoice->bundleEnrollments as $bundleEnrollment) {
            $bundle = $bundleEnrollment->bundle;

            if (!$bundle) {
                continue;
            }

            foreach ($bundle->bundleItems as $bundleItem) {
                $type = null;
                $itemId = null;

                if ($bundleItem->bundleable_type === 'App\\Models\\Course') {
                    $type = 'course';
                    $itemId = $bundleItem->bundleable_id;
                } elseif ($bundleItem->bundleable_type === 'App\\Models\\Bootcamp') {
                    $type = 'bootcamp';
                    $itemId = $bundleItem->bundleable_id;
                } elseif ($bundleItem->bundleable_type === 'App\\Models\\Webinar') {
                    $type = 'webinar';
                    $itemId = $bundleItem->bundleable_id;
                }

                if ($type && $itemId) {
                    $this->addToCertificateParticipants($type, $itemId, $invoice->user_id);
                }
            }
        }
    }

    public function generatePDF($id)
    {
        $user = Auth::user();
        if ($user && $user->hasRole('staff') && !$user->hasRole('admin')) {
            abort(403, 'Akses invoice tidak diizinkan untuk staff');
        }

        $invoice = Invoice::with([
            'user',
            'courseItems.course',
            'bootcampItems.bootcamp',
            'webinarItems.webinar',
            'privateItems.privateClass',
            'privateItems.privateClassSchedule',
            'certificationProgramItems.certificationProgram'
        ])->findOrFail($id);

        if ($invoice->status !== 'paid') {
            abort(403, 'Invoice belum dibayar');
        }

        $data = [
            'invoice' => $invoice,
            'company' => [
                'name' => 'Aksademy',
                'address' => 'Perumahan Permata Permadani, Blok B1. Kel. Pendem Kec. Junrejo Kota Batu Prov. Jawa Timur, 65324',
                'phone' => '+6285142505794',
                'email' => 'aksarateknologi@gmail.com',
                'website' => 'www.aksademy.id'
            ]
        ];

        $pdf = Pdf::loadView('invoices.pdf', $data);
        $pdf->setPaper('A4', 'portrait');

        return $pdf->stream("invoice-{$invoice->invoice_code}.pdf");
    }

    public function export(Request $request)
    {
        $filters = $request->only([
            'start_date',
            'end_date',
            'status',
            'payment_type',
            'product_type',
            'bootcamp_id',
            'webinar_id',
            'course_id',
            'bundle_id',
            'certification_program_id',
            'title',
            'user_name'
        ]);
        $filename = 'Laporan_Transaksi';

        if ($request->start_date && $request->end_date) {
            $filename .= '_' . Carbon::parse($request->start_date)->format('dmY')
                . '-' . Carbon::parse($request->end_date)->format('dmY');
        }

        $filename .= '_' . now()->format('YmdHis') . '.xlsx';

        return Excel::download(new TransactionsExport($filters), $filename);
    }
}
