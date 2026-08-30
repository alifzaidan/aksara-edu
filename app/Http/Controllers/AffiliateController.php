<?php

namespace App\Http\Controllers;

use App\Models\AffiliateEarning;
use App\Models\AffiliateWithdrawal;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class AffiliateController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        $isStaff = $user && $user->hasRole('staff') && !$user->hasRole('admin');

        $query = User::role('affiliate');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('affiliate_code', 'like', "%{$search}%")
                    ->orWhere('phone_number', 'like', "%{$search}%");
            });
        }

        // Calculate Statistics using SQL aggregates
        $baseQuery = User::role('affiliate');
        $totalAffiliates = (clone $baseQuery)->count();
        $activeAffiliates = (clone $baseQuery)->where('affiliate_status', 'Active')->count();
        $inactiveAffiliates = (clone $baseQuery)->where(function ($q) {
            $q->where('affiliate_status', '!=', 'Active')->orWhereNull('affiliate_status');
        })->count();

        $totalEarnings = $isStaff ? 0 : (int) AffiliateEarning::sum('amount');
        $paidCommission = $isStaff ? 0 : (int) AffiliateWithdrawal::sum('amount');
        $pendingCommission = $isStaff ? 0 : max(0, $totalEarnings - $paidCommission);
        $totalTransactions = AffiliateEarning::whereHas('invoice', function ($q) {
            $q->where('status', 'paid');
        })->count();

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

        $perPage = min(100, max(5, (int) $request->input('per_page', 10)));
        $affiliates = $query->withSum('affiliateEarnings', 'amount')
            ->withCount([
                'affiliateEarnings as total_transactions' => function ($query) {
                    $query->whereHas('invoice', function ($q) {
                        $q->where('status', 'paid');
                    });
                }
            ])
            ->latest()
            ->paginate($perPage)
            ->withQueryString();

        $affiliates->through(function ($affiliate) use ($isStaff) {
            $affiliate->total_earnings = $isStaff ? 0 : ($affiliate->affiliate_earnings_sum_amount ?? 0);
            unset($affiliate->affiliate_earnings_sum_amount);
            return $affiliate;
        });

        return Inertia::render('admin/affiliates/index', [
            'affiliates' => $affiliates,
            'statistics' => $statistics,
            'filters' => [
                'search' => $request->input('search'),
                'per_page' => $perPage,
            ],
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
        $user = Auth::user();
        $isStaff = $user && $user->hasRole('staff') && !$user->hasRole('admin');

        $affiliate = User::findOrFail($id);
        $earnings = AffiliateEarning::with([
            'invoice.user',
            'invoice.courseItems.course',
            'invoice.bootcampItems.bootcamp',
            'invoice.webinarItems.webinar',
            'invoice.bundleEnrollments.bundle',
            'invoice.certificationProgramItems.certificationProgram',
        ])
            ->where('affiliate_user_id', $affiliate->id)
            ->orderBy('created_at', 'desc')
            ->get();
        $withdrawals = AffiliateWithdrawal::where('affiliate_user_id', $affiliate->id)->orderBy('withdrawn_at', 'desc')->get();

        $totalCommission = $isStaff ? 0 : $earnings->sum('amount');
        $paidCommission = $isStaff ? 0 : $withdrawals->sum('amount');
        $availableCommission = $isStaff ? 0 : ($totalCommission - $paidCommission);

        if ($isStaff) {
            $earnings->transform(function ($e) {
                $e->amount = 0;
                if ($e->invoice) {
                    $e->invoice->nett_amount = 0;
                }
                return $e;
            });
            $withdrawals->transform(function ($w) {
                $w->amount = 0;
                return $w;
            });
        }

        $stats = [
            'total_products' => $earnings->count(),
            'total_commission' => $totalCommission,
            'paid_commission' => $paidCommission,
            'available_commission' => $availableCommission,
        ];

        return Inertia::render('admin/affiliates/show', [
            'affiliate' => $affiliate,
            'earnings' => $earnings,
            'withdrawals' => $withdrawals,
            'stats' => $stats,
        ]);
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

        $totalWithdrawn = AffiliateWithdrawal::where('affiliate_user_id', $affiliate->id)->sum('amount');

        $totalCommission = AffiliateEarning::where('affiliate_user_id', $affiliate->id)->sum('amount');
        $availableCommission = $totalCommission - $totalWithdrawn;

        if ($withdrawAmount > $availableCommission) {
            return back()->with('error', 'Nominal penarikan melebihi komisi yang tersedia.');
        }

        AffiliateWithdrawal::create([
            'affiliate_user_id' => $affiliate->id,
            'amount' => $withdrawAmount,
            'withdrawn_at' => now(),
        ]);

        return back()->with('success', "Berhasil menarik komisi sebesar Rp " . number_format($withdrawAmount, 0, ',', '.') . " untuk {$affiliate->name}.");
    }
}
