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
            'parentInvoice.installmentTerms',
        ])
            ->where('user_id', $userId)
            ->findOrFail($id);

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

