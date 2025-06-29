<?php

namespace App\Http\Controllers;

use App\Models\AffiliateEarning;
use App\Models\Bootcamp;
use App\Models\Course;
use App\Models\EnrollmentBootcamp;
use App\Models\EnrollmentCourse;
use App\Models\EnrollmentWebinar;
use App\Models\Invoice;
use App\Models\User;
use App\Models\Webinar;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Haruncpi\LaravelIdGenerator\IdGenerator;

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

            $amount = $item->price;

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

            $invoice = Invoice::create([
                'user_id' => $userId,
                'invoice_code' => $invoice_code,
                'amount' => $amount,
            ]);

            // Request create invoice ke Xendit
            $xendit_create_invoice = new CreateInvoiceRequest([
                'external_id' => $invoice_code,
                'customer' => [
                    'given_names' => Auth::user()->name,
                    'email' => Auth::user()->email,
                ],
                'amount' => $amount,
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
                'amount' => 0,
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

            // LOGIKA PENCATATAN KOMISI AFILIASI
            $this->recordAffiliateCommission($invoice);
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
}
