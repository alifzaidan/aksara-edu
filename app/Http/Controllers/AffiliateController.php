<?php

namespace App\Http\Controllers;

use App\Models\AffiliateEarning;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class AffiliateController extends Controller
{
    public function index()
    {
        $affiliates = User::role('affiliate')
            ->withSum('affiliateEarnings', 'amount')
            ->withCount([
                'affiliateEarnings as total_transactions' => function ($query) {
                    $query->whereHas('invoice', function ($q) {
                        $q->where('status', 'paid');
                    });
                }
            ])
            ->latest()
            ->get()
            ->map(function ($affiliate) {
                $affiliate->total_earnings = $affiliate->affiliate_earnings_sum_amount ?? 0;
                unset($affiliate->affiliate_earnings_sum_amount);
                return $affiliate;
            });

        // Calculate Statistics
        $totalAffiliates = $affiliates->count();
        $activeAffiliates = $affiliates->where('affiliate_status', 'Active')->count();
        $inactiveAffiliates = $affiliates->where('affiliate_status', 'Not Active')->count();

        // Total earnings and transactions
        $totalEarnings = $affiliates->sum('total_earnings');
        $totalTransactions = $affiliates->sum('total_transactions');

        $allEarnings = AffiliateEarning::all();
        $paidCommission = $allEarnings->where('status', 'paid')->sum('amount');
        $pendingCommission = $allEarnings->where('status', 'approved')->sum('amount');

        $statistics = [
            'overview' => [
                'total_affiliates' => $totalAffiliates,
                'active_affiliates' => $activeAffiliates,
                'inactive_affiliates' => $inactiveAffiliates,
            ],
            'earnings' => [
                'total_earnings' => $totalEarnings,
                'paid_commission' => $paidCommission,
                'pending_commission' => $pendingCommission,
                'total_transactions' => $totalTransactions,
            ],
        ];

        return Inertia::render('admin/affiliates/index', [
            'affiliates' => $affiliates,
            'statistics' => $statistics,
        ]);
    }

    public function create()
    {
        return Inertia::render('admin/affiliates/create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:' . User::class,
            'phone_number' => 'required|string|max:255',
            'password' => 'required|string|min:8',
            'affiliate_code' => 'required|string|max:255|unique:' . User::class,
            'affiliate_status' => 'required|string',
            'commission' => 'required|numeric|min:0',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone_number' => $request->phone_number,
            'password' => Hash::make($request->password),
            'affiliate_code' => $request->affiliate_code,
            'affiliate_status' => $request->affiliate_status,
            'commission' => $request->commission,
            'email_verified_at' => now(),
        ]);

        $user->assignRole('affiliate');

        return redirect()->route('affiliates.index')->with('success', 'Affiliate berhasil ditambahkan.');
    }

    public function show(string $id)
    {
        $affiliate = User::findOrFail($id);
        $earnings = AffiliateEarning::with([
            'invoice.user',
            'invoice.courseItems.course',
            'invoice.bootcampItems.bootcamp',
            'invoice.webinarItems.webinar',
            'invoice.bundleEnrollments.bundle',
        ])
            ->where('affiliate_user_id', $affiliate->id)
            ->orderBy('created_at', 'desc')
            ->get();

        $stats = [
            'total_products' => $earnings->count(),
            'total_commission' => $earnings->sum('amount'),
            'paid_commission' => $earnings->where('status', 'paid')->sum('amount'),
            'available_commission' => $earnings->where('status', 'approved')->sum('amount'),
        ];

        return Inertia::render('admin/affiliates/show', ['affiliate' => $affiliate, 'earnings' => $earnings, 'stats' => $stats]);
    }

    public function edit(string $id)
    {
        $affiliate = User::findOrFail($id);
        return Inertia::render('admin/affiliates/edit', ['affiliate' => $affiliate]);
    }

    public function update(Request $request, string $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:' . User::class . ',email,' . $id,
            'phone_number' => 'required|string|max:255',
            'commission' => 'required|numeric|min:0',
        ]);

        $affiliate = User::findOrFail($id);
        $affiliate->update($request->all());

        return redirect()->route('affiliates.show', $affiliate->id)->with('success', 'Affiliate berhasil diperbarui.');
    }

    public function destroy(string $id)
    {
        $affiliate = User::findOrFail($id);
        $affiliate->delete();
        return redirect()->route('affiliates.index')->with('success', 'Affiliate berhasil dihapus.');
    }

    public function toggleStatus($id)
    {
        $affiliate = User::findOrFail($id);

        if ($affiliate->affiliate_status === 'Active') {
            $affiliate->affiliate_status = 'Not Active';
        } else {
            $affiliate->affiliate_status = 'Active';
        }
        $affiliate->save();

        return redirect()->route('affiliates.index')
            ->with('success', 'Status afiliasi berhasil diubah menjadi ' . $affiliate->affiliate_status . '.');
    }

    public function withdrawCommission(Request $request, string $id)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
        ]);

        $affiliate = User::findOrFail($id);
        $withdrawAmount = (int) $request->amount;

        $availableCommission = AffiliateEarning::where('affiliate_user_id', $affiliate->id)
            ->where('status', 'approved')
            ->sum('amount');

        if ($withdrawAmount > $availableCommission) {
            return back()->with('error', 'Nominal penarikan melebihi komisi yang tersedia.');
        }

        $remainingAmount = $withdrawAmount;
        $approvedEarnings = AffiliateEarning::where('affiliate_user_id', $affiliate->id)
            ->where('status', 'approved')
            ->orderBy('created_at', 'asc')
            ->get();

        foreach ($approvedEarnings as $earning) {
            if ($remainingAmount <= 0) break;

            if ($earning->amount <= $remainingAmount) {
                $earning->update(['status' => 'paid']);
                $remainingAmount -= $earning->amount;
            } else {
                break;
            }
        }

        return back()->with('success', "Berhasil menarik komisi sebesar Rp " . number_format($withdrawAmount, 0, ',', '.') . " untuk {$affiliate->name}.");
    }
}
