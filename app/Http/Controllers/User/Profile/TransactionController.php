<?php

namespace App\Http\Controllers\User\Profile;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class TransactionController extends Controller
{
    public function index()
    {
        $userId = Auth::id();
        $myTransactions = Invoice::with([
            'courseItems.course',
            'bootcampItems.bootcamp',
            'webinarItems.webinar',
            'privateItems.privateClass',
            'privateItems.privateClassSchedule',
            'certificationProgramItems.certificationProgram',
            'bundleEnrollments.bundle.bundleItems.bundleable',
            'discountUsage.discountCode',
            'installmentTerms',
            'parentInvoice.courseItems.course',
            'parentInvoice.bootcampItems.bootcamp',
            'parentInvoice.webinarItems.webinar',
            'parentInvoice.certificationProgramItems.certificationProgram',
        ])
            ->where('user_id', $userId)
            ->whereNull('parent_invoice_id')
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('user/profile/transaction/index', ['myTransactions' => $myTransactions]);
    }

    public function show($id)
    {
        $userId = Auth::id();
        $invoice = Invoice::with([
            'courseItems.course',
            'bootcampItems.bootcamp',
            'webinarItems.webinar',
            'privateItems.privateClass',
            'privateItems.privateClassSchedule',
            'certificationProgramItems.certificationProgram',
            'bundleEnrollments.bundle.bundleItems.bundleable',
            'discountUsage.discountCode',
            'installmentTerms',
            'parentInvoice.courseItems.course',
            'parentInvoice.bootcampItems.bootcamp',
            'parentInvoice.webinarItems.webinar',
            'parentInvoice.certificationProgramItems.certificationProgram',
            'parentInvoice.installmentTerms',
        ])->findOrFail($id);

        if ($invoice->user_id !== Auth::id() && (!Auth::user() || !Auth::user()->hasRole('admin'))) {
            abort(403);
        }

        // Tambahkan is_overdue ke setiap termin cicilan
        $invoice->installmentTerms->transform(function ($term) {
            $term->is_overdue = $term->installment_due_date
                && $term->status !== 'paid'
                && Carbon::now('Asia/Jakarta')->gt(Carbon::parse($term->installment_due_date)->endOfDay());
            return $term;
        });

        return Inertia::render('user/profile/transaction/show', ['invoice' => $invoice]);
    }
}

