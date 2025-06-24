<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\Course;
use App\Models\EnrollmentCourse;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
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
        $userId = Auth::id();
        $invoices = Invoice::with('items', 'items.course')->where('user_id', $userId)->orderBy('created_at', 'desc')->get();
        return Inertia::render('invoice', compact('invoices'));
    }

    public function store(Request $request)
    {
        DB::beginTransaction();
        try {
            $userId = Auth::id();
            $courseId = $request->input('course_id');
            $course = Course::findOrFail($courseId);

            $amount = $course->price;

            $items = [
                [
                    'name' => $course->title,
                    'price' => $course->price,
                    'quantity' => 1,
                ]
            ];

            $invoice_code = IdGenerator::generate([
                'table' => 'invoices',
                'field' => 'invoice_code',
                'length' => 11,
                'reset_on_prefix_change'  => true,
                'prefix' => 'INV-' . date('y')
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

            // Simpan detail invoice
            EnrollmentCourse::create([
                'invoice_id' => $invoice->id,
                'course_id' => $course->id,
                'price' => $course->price,
                'completed_at' => null,
                'progress' => 0,
            ]);

            DB::commit();

            return response()->json([
                'url' => $xendit_invoice['invoice_url'],
            ], 200);
        } catch (\Throwable $th) {
            DB::rollBack();
            throw $th;
        }
    }

    public function show($id)
    {
        $invoice = Invoice::with('items', 'items.course')->findOrFail($id);
        return Inertia::render('user/course/checkout/success', ['invoice' => $invoice]);
    }

    public function callbackXendit(Request $request)
    {
        $getToken = $request->header('x-callback-token');
        $callbackToken = config('xendit.CALLBACK_TOKEN');

        if ($getToken != $callbackToken) {
            return response()->json(['message' => 'unauthorized'], 401);
        }

        //cek eksternal id darri xendit dengan external id di database
        $invoice = Invoice::where('invoice_code', $request->external_id)->first();
        if (!$invoice) {
            return response()->json(['message' => 'Invoice Not Found'], 404);
        }
        $date = date_create($request->paid_at);
        $paid_at = date_format($date, "Y-m-d H:i:s");
        $invoice->update([
            'paid_at' => $paid_at,
            'status' => ($request->status == 'PAID' || $request->status == 'SETTLED') ? 'paid' : 'failed',
            'payment_method' => $request->payment_method,
            'payment_channel' => $request->payment_channel
        ]);

        return response()->json(['message' => 'Success'], 200);
    }
}
