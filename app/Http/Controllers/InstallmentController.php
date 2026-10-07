<?php

namespace App\Http\Controllers;

use App\Models\Bootcamp;
use App\Models\Bundle;
use App\Models\CertificationProgram;
use App\Models\Course;
use App\Models\EnrollmentBootcamp;
use App\Models\EnrollmentBundle;
use App\Models\EnrollmentCertificationProgram;
use App\Models\EnrollmentCourse;
use App\Models\EnrollmentPrivate;
use App\Models\EnrollmentWebinar;
use App\Models\Invoice;
use App\Models\PrivateClass;
use App\Models\PrivateClassSchedule;
use App\Models\ProductInstallmentTerm;
use App\Models\Webinar;
use App\Traits\MessaraTrait;
use Carbon\Carbon;
use Haruncpi\LaravelIdGenerator\IdGenerator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
// use Xendit\Configuration;
// use Xendit\Invoice\CreateInvoiceRequest;
// use Xendit\Invoice\InvoiceApi;

class InstallmentController extends Controller
{
    use MessaraTrait;

    public function __construct()
    {
        // Configuration::setXenditKey(config('xendit.API_KEY'));
    }

    /**
     * Daftar cicilan milik user yang sedang login
     */
    public function index()
    {
        $userId = Auth::id();

        $invoices = Invoice::with([
            'courseItems.course',
            'bootcampItems.bootcamp',
            'webinarItems.webinar',
            'privateItems.privateClass',
            'certificationProgramItems.certificationProgram',
            'bundleEnrollments.bundle',
            'installmentTerms',
        ])
            ->where('user_id', $userId)
            ->where('is_installment', true)
            ->whereNull('parent_invoice_id') // Hanya invoice induk
            ->orderByDesc('created_at')
            ->get()
            ->map(function (Invoice $invoice) {
                $terms = $invoice->installmentTerms->sortBy('installment_number')->values();
                $paidCount = $terms->where('status', 'paid')->count();
                $totalCount = $terms->count();
                $nextUnpaid = $terms->where('status', 'pending')->first();
                $isNextOverdue = false;
                if ($nextUnpaid && $nextUnpaid->installment_due_date) {
                    $isNextOverdue = Carbon::now('Asia/Jakarta')->gt(Carbon::parse($nextUnpaid->installment_due_date)->endOfDay());
                }

                $parentGrossAmount = ($invoice->amount == $invoice->nett_amount && $totalCount > 0)
                    ? (float) $invoice->amount + ($totalCount * 5000)
                    : (float) $invoice->amount;

                return [
                    'id' => $invoice->id,
                    'invoice_code' => $invoice->invoice_code,
                    'status' => $invoice->status,
                    'amount' => $parentGrossAmount,
                    'is_access_suspended' => $invoice->isAccessSuspended() || $isNextOverdue,
                    'access_suspended_at' => $invoice->access_suspended_at,
                    'created_at' => $invoice->created_at,
                    'product_type' => $invoice->getInvoiceType(),
                    'product_name' => $this->getProductName($invoice),
                    'paid_terms' => $paidCount,
                    'total_terms' => $totalCount,
                    'next_unpaid_term' => $nextUnpaid ? [
                        'id' => $nextUnpaid->id,
                        'installment_number' => $nextUnpaid->installment_number,
                        'amount' => ($nextUnpaid->status !== 'paid' && $nextUnpaid->amount == $nextUnpaid->nett_amount)
                            ? $nextUnpaid->amount + 5000
                            : $nextUnpaid->amount,
                        'installment_due_date' => $nextUnpaid->installment_due_date,
                        'status' => $nextUnpaid->status,
                        'is_overdue' => $isNextOverdue,
                    ] : null,
                    'terms' => $terms->map(function ($t) {
                        $isOverdue = $t->installment_due_date
                            ? Carbon::now('Asia/Jakarta')->gt(Carbon::parse($t->installment_due_date)->endOfDay()) && $t->status !== 'paid'
                            : false;
                        return [
                            'id' => $t->id,
                            'installment_number' => $t->installment_number,
                            'invoice_code' => $t->invoice_code,
                            'amount' => ($t->status !== 'paid' && $t->amount == $t->nett_amount)
                                ? $t->amount + 5000
                                : $t->amount,
                            'status' => $t->status,
                            'installment_due_date' => $t->installment_due_date,
                            'paid_at' => $t->paid_at,
                            'payment_method' => $t->payment_method,
                            'payment_channel' => $t->payment_channel,
                            'is_overdue' => $isOverdue,
                        ];
                    }),
                ];
            });

        return Inertia::render('user/profile/installments', [
            'installments' => $invoices,
        ]);
    }

    /**
     * Buat invoice cicilan: invoice induk + N invoice anak
     */
    public function store(Request $request)
    {
        $userId = Auth::id();
        $type = $request->input('type');
        $itemId = $request->input('id');
        $privateClassScheduleId = $request->input('private_class_schedule_id');

        // Cek apakah user sudah memiliki cicilan aktif yang belum lunas
        if ($userId) {
            $activeInstallment = Invoice::getActiveInstallmentForUser($userId, $type, $itemId);
            if ($activeInstallment && !$activeInstallment['is_fully_paid']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda memiliki transaksi cicilan yang sedang aktif untuk program ini. Silakan lanjutkan pembayaran termin cicilan Anda.',
                ], 422);
            }
        }

        // Validasi: cicilan tidak bisa dikombinasikan dengan poin/voucher
        if ($request->input('discount_code_id') || $request->input('points_redeemed', 0) > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cicilan tidak dapat dikombinasikan dengan poin atau voucher.',
            ], 422);
        }

        try {
            // Ambil produk
            [$item, $enrollmentTable, $enrollmentField] = $this->resolveProduct($type, $itemId, $privateClassScheduleId);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat cicilan: ' . $e->getMessage(),
            ], 422);
        }

        $selectedPrivateSchedule = null;
        if ($type === 'private') {
            $selectedPrivateSchedule = PrivateClassSchedule::find($privateClassScheduleId);
            if (!$selectedPrivateSchedule) {
                return response()->json([
                    'success' => false,
                    'message' => 'Jadwal private class tidak ditemukan.',
                ], 404);
            }
        }

        // Validasi cicilan tersedia
        if (!$item->installment_enabled) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat cicilan: Produk ini tidak tersedia untuk pembayaran cicilan.',
            ], 422);
        }

        $terms = ProductInstallmentTerm::where('termable_type', get_class($item))
            ->where('termable_id', $item->id)
            ->orderBy('term_number')
            ->get();

        if ($terms->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat cicilan: Konfigurasi termin cicilan belum diatur oleh admin.',
            ], 422);
        }

        $adminFeePerTerm = 5000;
        $termsCount = $terms->count();
        $totalNettAmount = $terms->sum('amount');
        $totalGrossAmount = $totalNettAmount + ($termsCount * $adminFeePerTerm);
        $dpTerm = $terms->first();
        $dpGrossAmount = $dpTerm->amount + $adminFeePerTerm;

        // Generate kode invoice induk
        if (DB::getDriverName() === 'sqlite') {
            $count = Invoice::whereNull('parent_invoice_id')->count() + 1;
            $parentCode = 'AKS-' . date('y') . str_pad($count, 5, '0', STR_PAD_LEFT);
        } else {
            $parentCode = IdGenerator::generate([
                'table' => 'invoices',
                'field' => 'invoice_code',
                'length' => 11,
                'reset_on_prefix_change' => true,
                'prefix' => 'AKS-' . date('y'),
            ]);
        }

        DB::beginTransaction();
        try {
            // Buat invoice induk
            $parentInvoice = Invoice::create([
                'user_id' => $userId,
                'invoice_code' => $parentCode,
                'amount' => $totalGrossAmount,
                'nett_amount' => $totalNettAmount,
                'discount_amount' => 0,
                'points_redeemed' => 0,
                'status' => 'installment_pending',
                'is_installment' => true,
            ]);

            // Buat invoice anak untuk setiap termin (tiap termin memiliki biaya admin)
            $firstChildInvoice = null;
            foreach ($terms as $term) {
                $childCode = $parentCode . '-T' . $term->term_number;
                $childAmount = $term->amount + $adminFeePerTerm;

                $child = Invoice::create([
                    'user_id' => $userId,
                    'invoice_code' => $childCode,
                    'amount' => $childAmount,
                    'nett_amount' => $term->amount,
                    'discount_amount' => 0,
                    'points_redeemed' => 0,
                    'status' => 'pending',
                    'is_installment' => false,
                    'parent_invoice_id' => $parentInvoice->id,
                    'installment_term_id' => $term->id,
                    'installment_number' => $term->term_number,
                    'installment_due_date' => Carbon::parse($term->due_date),
                    'expires_at' => Carbon::now()->addHours(24),
                ]);

                if ($term->term_number === 1) {
                    $firstChildInvoice = $child;
                }
            }

            // Buat enrollment (akses belum aktif - akan diaktifkan via callback DP)
            $enrollmentData = [
                'invoice_id' => $parentInvoice->id,
                $enrollmentField => $item->id,
                'price' => $totalNettAmount,
                'completed_at' => null,
                'progress' => 0,
            ];
            if ($type === 'private') {
                $enrollmentData['private_class_schedule_id'] = $selectedPrivateSchedule->id;
            }
            $enrollmentTable::create($enrollmentData);

            // ===== XENDIT (dicomment) =====
            // // Buat Xendit Invoice hanya untuk termin ke-1 (DP)
            // $xenditInvoice = $this->createXenditInvoice($firstChildInvoice, $item, Auth::user());
            // $firstChildInvoice->update(['invoice_url' => $xenditInvoice['invoice_url']]);
            // ===== END XENDIT =====

            $cancelUrl = match ($type) {
                'course' => route('course.checkout', ['course' => $item->slug]),
                'bootcamp' => route('bootcamp.register', ['bootcamp' => $item->slug]),
                'webinar' => route('webinar.register', ['webinar' => $item->slug]),
                'private' => route('private.register', ['privateClass' => $item->slug]),
                'certification_program' => route('certification-programs.register', ['program' => $item->slug]),
                default => route('profile.installments'),
            };

            // ===== DOKU =====
            $dokuService = app(\App\Services\DokuService::class);
            $dokuResponse = $dokuService->createCheckout(
                $firstChildInvoice->invoice_code,
                $firstChildInvoice->amount,
                [
                    'customer_id'         => 'USER-' . $userId,
                    'customer_name'       => Auth::user()->name,
                    'customer_email'      => Auth::user()->email,
                    'customer_phone'      => Auth::user()->phone_number,
                    'item_name'           => $item->title . ' (DP Cicilan 1)',
                    'item_description'    => 'Pembayaran DP Cicilan: ' . $item->title,
                    'callback_url_cancel' => $cancelUrl,
                ]
            );
            $paymentUrl = $dokuResponse['response']['payment']['url'] ?? '';
            $firstChildInvoice->update(['invoice_url' => $paymentUrl]);
            // ===== END DOKU =====

            DB::commit();

            return response()->json([
                'success' => true,
                'payment_url' => $paymentUrl,
                'invoice_id' => $parentInvoice->id,
                'invoice_code' => $parentCode,
                'dp_amount' => $dpGrossAmount,
                'total_terms' => $terms->count(),
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Installment creation failed', [
                'error' => $e->getMessage(),
                'user_id' => Auth::id(),
                'request_data' => $request->all(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Generate payment URL untuk termin berikutnya
     */
    public function payTerm(Request $request, string $parentInvoiceId)
    {
        $userId = Auth::id();

        $parentInvoice = Invoice::with(['installmentTerms'])
            ->where('id', $parentInvoiceId)
            ->where('user_id', $userId)
            ->where('is_installment', true)
            ->whereNull('parent_invoice_id')
            ->firstOrFail();

        if ($parentInvoice->status === 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'Semua cicilan sudah lunas.',
            ], 422);
        }

        $nextTerm = $parentInvoice->nextUnpaidTerm();
        if (!$nextTerm) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak ada termin yang perlu dibayar.',
            ], 422);
        }

        // Validasi overdue: tidak bisa bayar mandiri jika jatuh tempo sudah terlewat
        if ($nextTerm->installment_due_date) {
            $dueDate = Carbon::parse($nextTerm->installment_due_date)->endOfDay();
            if (Carbon::now('Asia/Jakarta')->gt($dueDate)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Batas waktu pembayaran untuk termin ini telah melewati jatuh tempo. Pembayaran online ditutup, silakan hubungi admin untuk penyelesaian cicilan.',
                ], 422);
            }
        }

        // Pastikan termin ke-1 (DP) sudah dibayar jika sedang membayar termin berikutnya (jangan loncat)
        if ($nextTerm->installment_number > 1) {
            $dp = $parentInvoice->installmentTerms()->where('installment_number', 1)->first();
            if ($dp && $dp->status !== 'paid') {
                return response()->json([
                    'success' => false,
                    'message' => 'Termin ke-1 (DP) belum dibayar.',
                ], 422);
            }
        }

        // Buat DOKU Transaction baru yang selalu valid & fresh (mencegah link expired & duplicate external_id)
        $productInvoice = $parentInvoice->load([
            'courseItems.course',
            'bootcampItems.bootcamp',
            'webinarItems.webinar',
            'privateItems.privateClass',
            'certificationProgramItems.certificationProgram',
            'bundleEnrollments.bundle',
        ]);
        $item = $this->getProductFromInvoice($productInvoice);

        $uniqueExternalId = $nextTerm->invoice_code . '_' . time();

        DB::beginTransaction();
        try {
            // Pastikan nominal termin memiliki biaya admin Rp 5.000 jika sebelumnya belum ditambahkan
            if ($nextTerm->amount == $nextTerm->nett_amount) {
                $nextTerm->amount = (float) $nextTerm->nett_amount + 5000;
                $nextTerm->save();
            }

            // ===== DOKU =====
            $dokuService = app(\App\Services\DokuService::class);
            $dokuResponse = $dokuService->createCheckout(
                $uniqueExternalId,
                $nextTerm->amount,
                [
                    'customer_id'         => 'USER-' . $userId,
                    'customer_name'       => Auth::user()->name,
                    'customer_email'      => Auth::user()->email,
                    'customer_phone'      => Auth::user()->phone_number,
                    'item_name'           => ($item?->title ?? 'Produk') . ' (Cicilan ke-' . $nextTerm->installment_number . ')',
                    'item_description'    => 'Pembayaran Cicilan ke-' . $nextTerm->installment_number . ' ' . ($item?->title ?? 'Produk'),
                    'callback_url_cancel' => route('profile.installments'),
                ]
            );
            $paymentUrl = $dokuResponse['response']['payment']['url'] ?? '';
            $nextTerm->update([
                'status' => 'pending',
                'invoice_url' => $paymentUrl,
                'expires_at' => Carbon::now()->addHours(24),
            ]);
            // ===== END DOKU =====

            DB::commit();

            return response()->json([
                'success' => true,
                'payment_url' => $paymentUrl,
                'term_number' => $nextTerm->installment_number,
                'amount' => $nextTerm->amount,
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    // ========================= PRIVATE HELPERS =========================

    private function resolveProduct(string $type, string $itemId, ?string $privateScheduleId = null): array
    {
        return match ($type) {
            'course' => [Course::findOrFail($itemId), EnrollmentCourse::class, 'course_id'],
            'bootcamp' => [Bootcamp::findOrFail($itemId), EnrollmentBootcamp::class, 'bootcamp_id'],
            'webinar' => [Webinar::findOrFail($itemId), EnrollmentWebinar::class, 'webinar_id'],
            'private' => [PrivateClass::findOrFail($itemId), EnrollmentPrivate::class, 'private_class_id'],
            'certification_program' => [CertificationProgram::findOrFail($itemId), EnrollmentCertificationProgram::class, 'certification_program_id'],
            'bundle' => [Bundle::findOrFail($itemId), EnrollmentBundle::class, 'bundle_id'],
            default => throw new \Exception('Tipe produk tidak valid'),
        };
    }

    private function getProductFromInvoice(Invoice $invoice): mixed
    {
        if ($invoice->courseItems->count() > 0) return $invoice->courseItems->first()->course;
        if ($invoice->bootcampItems->count() > 0) return $invoice->bootcampItems->first()->bootcamp;
        if ($invoice->webinarItems->count() > 0) return $invoice->webinarItems->first()->webinar;
        if ($invoice->privateItems->count() > 0) return $invoice->privateItems->first()->privateClass;
        if ($invoice->certificationProgramItems->count() > 0) return $invoice->certificationProgramItems->first()->certificationProgram;
        if ($invoice->bundleEnrollments->count() > 0) return $invoice->bundleEnrollments->first()->bundle;
        throw new \Exception('Produk tidak ditemukan pada invoice ini.');
    }

    private function getProductName(Invoice $invoice): string
    {
        try {
            $item = $this->getProductFromInvoice($invoice);
            return $item?->title ?? $item?->name ?? 'Produk';
        } catch (\Throwable $e) {
            return 'Produk';
        }
    }

    /**
     * Kirim pesan pengingat WhatsApp ke peserta cicilan secara manual oleh admin
     */
    public function sendReminder(Request $request, string $id)
    {
        try {
            $invoice = Invoice::with([
                'user',
                'parentInvoice.user',
                'installmentTerms',
                'courseItems.course',
                'bootcampItems.bootcamp',
                'webinarItems.webinar',
                'privateItems.privateClass',
                'certificationProgramItems.certificationProgram',
                'bundleEnrollments.bundle',
            ])->findOrFail($id);

            $parentInvoice = $invoice->parent_invoice_id ? $invoice->parentInvoice : $invoice;
            $termInvoice = $invoice->parent_invoice_id ? $invoice : $parentInvoice->nextUnpaidTerm();

            if (!$termInvoice) {
                return response()->json(['success' => false, 'message' => 'Semua termin cicilan untuk invoice ini sudah lunas.'], 422);
            }

            $user = $parentInvoice->user;
            if (!$user || !$user->phone_number) {
                return response()->json(['success' => false, 'message' => 'Nomor WhatsApp peserta tidak ditemukan atau belum diisi.'], 422);
            }

            $phoneNumber = $this->formatPhoneNumber($user->phone_number);
            $termNumber = $termInvoice->installment_number;
            $totalTerms = $parentInvoice->installmentTerms()->count();
            $termAmount = ($termInvoice->status !== 'paid' && $termInvoice->amount == $termInvoice->nett_amount)
                ? $termInvoice->amount + 5000
                : $termInvoice->amount;
            $amount = 'Rp ' . number_format($termAmount, 0, ',', '.');
            $dueDate = $termInvoice->installment_due_date ? Carbon::parse($termInvoice->installment_due_date)->translatedFormat('d F Y') : '-';
            $productName = $this->getProductName($parentInvoice);
            $payUrl = $termInvoice->invoice_url ?: url('/profile/installments');

            $customMessage = $request->input('custom_message');
            if (!empty($customMessage)) {
                $message = $customMessage;
            } else {
                $message = "*[Aksademy - Pengingat Pembayaran Cicilan]*\n\n";
                $message .= "Halo *{$user->name}*,\n\n";
                $message .= "Kami mengingatkan tagihan cicilan untuk program *{$productName}*:\n";
                $message .= "• *Termin:* Ke-{$termNumber} dari {$totalTerms}\n";
                $message .= "• *Nominal:* {$amount}\n";
                $message .= "• *Jatuh Tempo:* {$dueDate}\n\n";
                $message .= "Silakan lakukan pembayaran melalui tautan berikut:\n";
                $message .= "🔗 {$payUrl}\n\n";
                $message .= "Pastikan pembayaran dilakukan sebelum jatuh tempo agar akses belajar Anda tetap aktif.\n\n";
                $message .= "Terima kasih!\n*Aksademy Support*";
            }

            self::sendText([['phone' => $phoneNumber, 'message' => $message, 'isGroup' => 'false']]);

            return response()->json([
                'success' => true,
                'message' => "Pengingat cicilan berhasil dikirim ke WhatsApp {$user->name} ({$phoneNumber}).",
                'phone' => $phoneNumber,
                'message_content' => $message,
            ]);
        } catch (\Throwable $e) {
            Log::error('Manual installment reminder failed', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Gagal mengirim pengingat: ' . $e->getMessage()], 500);
        }
    }

    private function createXenditInvoice(Invoice $childInvoice, mixed $item, mixed $user, ?string $externalId = null)
    {
        $xenditRequest = new CreateInvoiceRequest([
            'external_id' => $externalId ?: ($childInvoice->invoice_code . '_' . time()),
            'customer' => [
                'given_names' => $user->name,
                'email' => $user->email,
                'mobile_number' => $user->phone_number,
            ],
            'customer_notification_preference' => [
                'invoice_created' => ['email', 'whatsapp'],
                'invoice_reminder' => ['email', 'whatsapp'],
                'invoice_paid' => ['email'],
            ],
            'description' => 'Cicilan ke-' . $childInvoice->installment_number . ' untuk ' . ($item?->title ?? 'Produk') . ' - ' . $user->name,
            'amount' => $childInvoice->amount,
            'items' => [[
                'name' => ($item?->title ?? 'Produk') . ' (Cicilan ke-' . $childInvoice->installment_number . ')',
                'price' => $childInvoice->amount,
                'quantity' => 1,
            ]],
            'success_redirect_url' => route('profile.installments'),
            'failure_redirect_url' => route('profile.installments'),
        ]);

        $xenditApi = new InvoiceApi();
        return $xenditApi->createInvoice($xenditRequest);
    }
}
