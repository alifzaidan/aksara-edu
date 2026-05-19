<?php

namespace App\Http\Controllers\User\Profile;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
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
            'certificationProgramItems.certificationProgram',
        ])
            ->where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('user/profile/transaction/index', ['myTransactions' => $myTransactions]);
    }

    public function show($id)
    {
        $invoice = Invoice::with([
            'courseItems.course',
            'bootcampItems.bootcamp',
            'webinarItems.webinar',
            'certificationProgramItems.certificationProgram',
        ])->findOrFail($id);

        return Inertia::render('user/profile/transaction/show', ['invoice' => $invoice]);
    }
}
