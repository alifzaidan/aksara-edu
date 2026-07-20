<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\PointTransaction;
use App\Models\Setting;
use App\Services\PointService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReferralAdminController extends Controller
{
    protected $pointService;

    public function __construct(PointService $pointService)
    {
        $this->pointService = $pointService;
    }

    /**
     * Display referral settings form.
     */
    public function settings()
    {
        return Inertia::render('admin/referral/settings', [
            'settings' => [
                'referral_reward' => (int) Setting::get('referral_reward', 5000),
                'buyer_reward' => (int) Setting::get('buyer_reward', 2000),
                'referral_only_first_purchase' => (bool) Setting::get('referral_only_first_purchase', true),
            ]
        ]);
    }

    /**
     * Update referral settings.
     */
    public function updateSettings(Request $request)
    {
        $request->validate([
            'referral_reward' => 'required|integer|min:0',
            'buyer_reward' => 'required|integer|min:0',
            'referral_only_first_purchase' => 'required|boolean',
        ]);

        Setting::set('referral_reward', $request->referral_reward);
        Setting::set('buyer_reward', $request->buyer_reward);
        Setting::set('referral_only_first_purchase', $request->referral_only_first_purchase);

        return redirect()->back()->with('success', 'Pengaturan referral berhasil diperbarui.');
    }

    /**
     * Display referral performance report.
     */
    public function report()
    {
        $referrers = User::whereHas('referredInvoices', function ($query) {
            $query->where('status', 'paid');
        })
        ->withCount(['referredInvoices as referrals_count' => function ($query) {
            $query->where('status', 'paid');
        }])
        ->orderBy('referrals_count', 'desc')
        ->paginate(15);

        return Inertia::render('admin/referral/report', [
            'referrers' => $referrers
        ]);
    }

    /**
     * Display point transaction ledger and adjustment form.
     */
    public function transactions(Request $request)
    {
        $query = PointTransaction::with('user');

        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('user', function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $transactions = $query->orderBy('created_at', 'desc')->paginate(15);

        // Fetch users list for dropdown select (limit to 100 or search-enabled)
        $users = User::select('id', 'name', 'email', 'point_balance')
            ->orderBy('name')
            ->limit(200)
            ->get();

        return Inertia::render('admin/referral/transactions', [
            'transactions' => $transactions,
            'users' => $users,
            'filters' => $request->only(['search'])
        ]);
    }

    /**
     * Manually adjust a user's point balance.
     */
    public function adjustPoints(Request $request)
    {
        $request->validate([
            'user_id' => 'required|string',
            'amount' => 'required|integer',
            'description' => 'required|string|max:255',
        ]);

        try {
            $user = User::where('id', $request->user_id)
                ->orWhere('name', $request->user_id)
                ->orWhere('email', $request->user_id)
                ->first();

            if (!$user) {
                return redirect()->back()->withErrors([
                    'user_id' => 'Pengguna dengan ID, nama, atau email tersebut tidak ditemukan.'
                ]);
            }
            
            // Check for negative point balance
            if ($request->amount < 0 && $user->point_balance < abs($request->amount)) {
                return redirect()->back()->withErrors([
                    'amount' => 'Saldo poin tidak mencukupi untuk pengurangan ini.'
                ]);
            }

            $this->pointService->adjustPoints(
                $user->id,
                $request->amount,
                'manual_adjustment',
                $request->description
            );

            return redirect()->back()->with('success', 'Saldo poin berhasil disesuaikan secara manual.');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors([
                'error' => 'Gagal menyesuaikan poin: ' . $e->getMessage()
            ]);
        }
    }
}
