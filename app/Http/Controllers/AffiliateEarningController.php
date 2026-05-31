<?php

namespace App\Http\Controllers;

use App\Exports\EarningsExport;
use App\Models\AffiliateEarning;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

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
            'invoice.bundleEnrollments.bundle',
            'invoice.certificationProgramItems.certificationProgram',
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

    public function export(Request $request)
    {
        $user    = Auth::user();
        $isAdmin = $user->hasRole('admin');

        $filters = [
            'start_date' => $request->input('start_date'),
            'end_date'   => $request->input('end_date'),
        ];

        $startLabel = $filters['start_date'] ? \Carbon\Carbon::parse($filters['start_date'])->format('dmY') : 'all';
        $endLabel   = $filters['end_date']   ? \Carbon\Carbon::parse($filters['end_date'])->format('dmY')   : $startLabel;
        $filename   = "pendapatan_{$startLabel}-{$endLabel}.xlsx";

        return Excel::download(
            new EarningsExport($filters, $user->id, $isAdmin),
            $filename
        );
    }
}
