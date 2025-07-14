<?php

namespace App\Http\Controllers;

use App\Models\AffiliateEarning;
use App\Models\Bootcamp;
use App\Models\Certificate;
use App\Models\CertificateParticipant;
use App\Models\Course;
use App\Models\EnrollmentBootcamp;
use App\Models\EnrollmentCourse;
use App\Models\EnrollmentWebinar;
use App\Models\Invoice;
use App\Models\User;
use App\Models\Webinar;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Haruncpi\LaravelIdGenerator\IdGenerator;
use Illuminate\Support\Facades\Log;

use Xendit\Configuration;
use Xendit\Invoice\CreateInvoiceRequest;
use Xendit\Invoice\InvoiceApi;

class InvoiceController extends Controller
{
    public function __construct()
    {
        Configuration::setXenditKey(config('xendit.API_KEY'));
    }

    public function index()
    {
        $invoices = Invoice::with([
            'user.referrer',
            'courseItems.course',
            'bootcampItems.bootcamp',
            'webinarItems.webinar'
        ])
            ->orderBy('created_at', 'desc')
            ->get();
        return Inertia::render('admin/transactions/index', ['invoices' => $invoices]);
    }

    public function store(Request $request)
    {
        DB::beginTransaction();
        try {
            $userId = Auth::id();
            $type = $request->input('type', 'course');
            $itemId = $request->input('id');

            $discountAmount = $request->input('discount_amount', 0);
            $nettAmount = $request->input('nett_amount', 0);
            $transactionFee = $request->input('transaction_fee', 5000);
            $totalAmount = $request->input('total_amount');

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
            } else {
                throw new \Exception('Tipe pembelian tidak valid');
            }

            // Validasi harga untuk keamanan
            if ($nettAmount != $item->price) {
                throw new \Exception('Harga tidak sesuai');
            }

            if ($discountAmount > 0 && $discountAmount != $item->strikethrough_price) {
                throw new \Exception('Discount amount tidak sesuai');
            }

            $calculatedTotal = $item->price > 0 ? $item->price + $transactionFee : 0;
            if ($totalAmount != $calculatedTotal) {
                throw new \Exception('Total amount tidak sesuai');
            }

            $items = [
                [
                    'name' => $item->title,
                    'price' => $item->price,
                    'quantity' => 1,
                ]
            ];

            $invoice_code = IdGenerator::generate([
                'table' => 'invoices',
                'field' => 'invoice_code',
                'length' => 11,
                'reset_on_prefix_change'  => true,
                'prefix' => 'AKS-' . date('y')
            ]);

            $expiresAt = Carbon::now()->addHours(24);

            $invoice = Invoice::create([
                'user_id' => $userId,
                'invoice_code' => $invoice_code,
                'discount_amount' => $discountAmount,
                'amount' => $totalAmount,
                'nett_amount' => $nettAmount,
                'expires_at' => $expiresAt,
            ]);

            // Request create invoice ke Xendit
            $xendit_create_invoice = new CreateInvoiceRequest([
                'external_id' => $invoice_code,
                'customer' => [
                    'given_names' => Auth::user()->name,
                    'email' => Auth::user()->email,
                ],
                'amount' => $totalAmount,
                'items' => $items,
                'failure_redirect_url' => route('invoice.show', ['id' => $invoice->id]),
                'success_redirect_url' => route('invoice.show', ['id' => $invoice->id]),
            ]);

            $xendit_api_instance = new InvoiceApi();
            $xendit_invoice = $xendit_api_instance->createInvoice($xendit_create_invoice);

            $invoice->update([
                'invoice_url' => $xendit_invoice['invoice_url'],
            ]);

            // Simpan detail invoice ke tabel enrollment yang sesuai
            $enrollmentTable::create([
                'invoice_id' => $invoice->id,
                $enrollmentField => $item->id,
                'price' => $item->price,
                'completed_at' => null,
                'progress' => 0,
            ]);

            $this->addToCertificateParticipants($type, $item->id, $userId);

            DB::commit();

            return response()->json([
                'url' => $xendit_invoice['invoice_url'],
            ], 200);
        } catch (\Throwable $th) {
            DB::rollBack();
            return response()->json([
                'message' => $th->getMessage(),
            ], 500);
        }
    }

    public function enrollFree(Request $request)
    {
        DB::beginTransaction();
        try {
            $userId = Auth::id();
            $type = $request->input('type', 'course');
            $itemId = $request->input('id');

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
            } else {
                throw new \Exception('Tipe pendaftaran tidak valid');
            }

            if ($item->price > 0) {
                throw new \Exception('Item ini tidak gratis');
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
                'invoice_code' => $invoice_code,
                'discount_amount' => 0,
                'amount' => 0,
                'nett_amount' => 0,
                'status' => 'paid',
                'paid_at' => now(),
                'payment_method' => 'FREE',
            ]);

            $enrollmentTable::create([
                'invoice_id' => $invoice->id,
                $enrollmentField => $item->id,
                'price' => 0,
                'completed_at' => null,
                'progress' => 0,
            ]);

            $this->addToCertificateParticipants($type, $item->id, $userId);

            DB::commit();

            return response()->json([
                'message' => 'Pendaftaran berhasil!',
                'redirect_url' => route('invoice.show', ['id' => $invoice->id]),
            ], 200);
        } catch (\Throwable $th) {
            DB::rollBack();
            return response()->json([
                'message' => $th->getMessage(),
            ], 500);
        }
    }

    public function show($id)
    {
        $invoice = Invoice::with(['courseItems.course', 'bootcampItems.bootcamp', 'webinarItems.webinar'])->findOrFail($id);
        return Inertia::render('user/checkout/success', ['invoice' => $invoice]);
    }

    /**
     * Cancel invoice manually (both in database and Xendit)
     */
    public function cancel($id)
    {
        DB::beginTransaction();
        try {
            $invoice = Invoice::where('id', $id)
                ->where('user_id', Auth::id())
                ->where('status', 'pending')
                ->firstOrFail();

            $this->expireInvoiceInXendit($invoice->invoice_code);

            // Update status di database
            $invoice->update(['status' => 'failed']);

            DB::commit();

            return response()->json([
                'message' => 'Invoice berhasil dibatalkan.',
                'success' => true
            ], 200);
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
        }

        return response()->json([
            'message' => count($expiredInvoices) . ' invoices expired and updated.',
            'expired_count' => count($expiredInvoices)
        ]);
    }

    public function callbackXendit(Request $request)
    {
        $getToken = $request->header('x-callback-token');
        $callbackToken = config('xendit.CALLBACK_TOKEN');

        if ($getToken != $callbackToken) {
            return response()->json(['message' => 'unauthorized'], 401);
        }

        $invoice = Invoice::with('user')->where('invoice_code', $request->external_id)->first();
        if (!$invoice) {
            return response()->json(['message' => 'Invoice Not Found'], 404);
        }

        // Hanya proses jika status invoice masih pending untuk menghindari duplikasi
        if ($invoice->status !== 'pending') {
            return response()->json(['message' => 'Invoice already processed'], 200);
        }

        $isSuccess = ($request->status == 'PAID' || $request->status == 'SETTLED');

        if ($isSuccess) {
            $date = date_create($request->paid_at);
            $paid_at = date_format($date, "Y-m-d H:i:s");

            $invoice->update([
                'paid_at' => $paid_at,
                'status' => 'paid',
                'payment_method' => $request->payment_method,
                'payment_channel' => $request->payment_channel
            ]);

            $this->recordAffiliateCommission($invoice);

            $this->addEnrollmentToCertificateParticipants($invoice);
        } else {
            $invoice->update(['status' => 'failed']);
        }

        return response()->json(['message' => 'Success'], 200);
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
                $commissionAmount = $invoice->amount * ($affiliate->commission / 100);

                AffiliateEarning::create([
                    'affiliate_user_id' => $affiliate->id,
                    'invoice_id' => $invoice->id,
                    'amount' => $commissionAmount,
                    'rate' => $affiliate->commission,
                    'status' => 'pending',
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
        $invoice->load(['courseItems', 'bootcampItems', 'webinarItems']);

        foreach ($invoice->courseItems as $courseItem) {
            $this->addToCertificateParticipants('course', $courseItem->course_id, $invoice->user_id);
        }

        foreach ($invoice->bootcampItems as $bootcampItem) {
            $this->addToCertificateParticipants('bootcamp', $bootcampItem->bootcamp_id, $invoice->user_id);
        }

        foreach ($invoice->webinarItems as $webinarItem) {
            $this->addToCertificateParticipants('webinar', $webinarItem->webinar_id, $invoice->user_id);
        }
    }
}
