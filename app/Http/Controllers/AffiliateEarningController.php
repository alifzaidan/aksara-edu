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
    public function index(Request $request)
    {
        $user = Auth::user();
        $query = AffiliateEarning::with([
            'affiliateUser',
            'invoice.user',
            'invoice.courseItems.course',
            'invoice.bootcampItems.bootcamp',
            'invoice.webinarItems.webinar',
            'invoice.bundleEnrollments.bundle',
            'invoice.certificationProgramItems.certificationProgram',
        ]);

        if (!$user->hasRole('admin')) {
            $query->where('affiliate_user_id', $user->id);
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->whereHas('invoice', function ($iq) use ($search) {
                    $iq->where('invoice_code', 'like', "%{$search}%")
                        ->orWhereHas('user', fn ($uq) => $uq->where('name', 'like', "%{$search}%"));
                })->orWhereHas('affiliateUser', function ($aq) use ($search) {
                    $aq->where('name', 'like', "%{$search}%")
                        ->orWhere('affiliate_code', 'like', "%{$search}%");
                });
            });
        }

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $startDate = \Carbon\Carbon::parse($request->input('start_date'))->startOfDay();
            $endDate = \Carbon\Carbon::parse($request->input('end_date'))->endOfDay();
            $query->whereBetween('created_at', [$startDate, $endDate]);
        }

        $perPage = min(100, max(5, (int) $request->input('per_page', 10)));
        $earnings = $query->orderBy('created_at', 'desc')->paginate($perPage)->withQueryString();

        return Inertia::render('admin/earnings/index', [
            'earnings' => $earnings,
            'filters' => [
                'search' => $request->input('search'),
                'start_date' => $request->input('start_date'),
                'end_date' => $request->input('end_date'),
                'per_page' => $perPage,
            ],
        ]);
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
