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
        $affiliates = User::role('affiliate')->latest()->get();

        return Inertia::render('admin/affiliates/index', ['affiliates' => $affiliates]);
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
}
