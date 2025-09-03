<?php

namespace App\Http\Controllers;

use App\Models\Promotion;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PromotionController extends Controller
{
    public function index()
    {
        $promotions = Promotion::orderBy('created_at', 'desc')->get();
        return Inertia::render('admin/promotions/index', [
            'promotions' => $promotions,
        ]);
    }

    public function getActivePromotion()
    {
        $today = Carbon::today();
        $promotion = Promotion::where('is_active', true)
            ->whereDate('start_date', '<=', $today)
            ->whereDate('end_date', '>=', $today)
            ->first();

        return response()->json($promotion);
    }

    public function create()
    {
        return Inertia::render('admin/promotions/create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'promotion_flyer' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'is_active' => 'boolean',
            'url_redirect' => 'nullable|url',
        ]);

        $flyerPath = null;
        if ($request->hasFile('promotion_flyer')) {
            $flyerPath = $request->file('promotion_flyer')->store('promotions', 'public');
        }

        Promotion::create([
            'promotion_flyer' => $flyerPath ? Storage::url($flyerPath) : null,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'is_active' => $request->boolean('is_active', true),
            'url_redirect' => $request->url_redirect,
        ]);

        return redirect()->route('promotions.index')
            ->with('success', 'Flyer promosi berhasil ditambahkan.');
    }

    public function show(Promotion $promotion)
    {
        return Inertia::render('admin/promotions/show', [
            'promotion' => $promotion,
        ]);
    }

    public function edit(Promotion $promotion)
    {
        return Inertia::render('admin/promotions/edit', [
            'promotion' => $promotion,
        ]);
    }

    public function update(Request $request, Promotion $promotion)
    {
        $request->validate([
            'promotion_flyer' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'is_active' => 'boolean',
            'url_redirect' => 'nullable|url',
        ]);

        $data = [
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'is_active' => $request->boolean('is_active'),
            'url_redirect' => $request->url_redirect,
        ];

        if ($request->hasFile('promotion_flyer')) {
            // Delete old flyer if exists
            if ($promotion->promotion_flyer) {
                $oldPath = str_replace('/storage/', '', $promotion->promotion_flyer);
                Storage::disk('public')->delete($oldPath);
            }

            $flyerPath = $request->file('promotion_flyer')->store('promotions', 'public');
            $data['promotion_flyer'] = Storage::url($flyerPath);
        }

        $promotion->update($data);

        return redirect()->route('promotions.index')
            ->with('success', 'Flyer promosi berhasil diperbarui.');
    }

    public function destroy(Promotion $promotion)
    {
        // Delete flyer file if exists
        if ($promotion->promotion_flyer) {
            $filePath = str_replace('/storage/', '', $promotion->promotion_flyer);
            Storage::disk('public')->delete($filePath);
        }

        $promotion->delete();

        return redirect()->route('promotions.index')
            ->with('success', 'Flyer promosi berhasil dihapus.');
    }

    public function toggleStatus(Promotion $promotion)
    {
        if (!$promotion->is_active) {
            $activePromotion = Promotion::where('is_active', true)
                ->where('id', '!=', $promotion->id)
                ->first();

            if ($activePromotion) {
                return back()->with('error', 'Hanya boleh ada satu flyer promosi yang aktif. Nonaktifkan flyer yang aktif terlebih dahulu.');
            }
        }

        $promotion->update([
            'is_active' => !$promotion->is_active
        ]);

        $status = $promotion->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return back()->with('success', "Flyer promosi berhasil {$status}.");
    }
}
