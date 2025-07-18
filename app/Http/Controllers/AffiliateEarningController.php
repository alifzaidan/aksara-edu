<?php

namespace App\Http\Controllers;

use App\Models\AffiliateEarning;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AffiliateEarningController extends Controller
{
    public function index()
    {
        $userId = Auth::user()->id;
        $earnings = AffiliateEarning::with([
            'invoice.user',
            'invoice.courseItems.course',
            'invoice.bootcampItems.bootcamp',
            'invoice.webinarItems.webinar',
        ])
            ->where('affiliate_user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('admin/earnings/index', ['earnings' => $earnings]);
    }

    public function approveEarning(AffiliateEarning $earning)
    {
        $earning->update(['status' => 'approved']);
        return back()->with('success', 'Komisi berhasil disetujui.');
    }

    public function rejectEarning(AffiliateEarning $earning)
    {
        $earning->update(['status' => 'rejected']);
        return back()->with('success', 'Komisi berhasil ditolak.');
    }
}
