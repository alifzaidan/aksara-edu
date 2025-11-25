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

        $totalPromotions = $promotions->count();
        $today = Carbon::today();

        $activePromotions = $promotions->where('is_active', true)->count();
        $inactivePromotions = $promotions->where('is_active', false)->count();

        $runningNow = $promotions->filter(function ($promo) use ($today) {
            $startDate = Carbon::parse($promo->start_date);
            $endDate = Carbon::parse($promo->end_date);
            return $promo->is_active &&
                $startDate->lte($today) &&
                $endDate->gte($today);
        })->count();

        $upcoming = $promotions->filter(function ($promo) use ($today) {
            $startDate = Carbon::parse($promo->start_date);
            return $promo->is_active && $startDate->gt($today);
        })->count();

        $expired = $promotions->filter(function ($promo) use ($today) {
            $endDate = Carbon::parse($promo->end_date);
            return $endDate->lt($today);
        })->count();

        $totalDuration = 0;
        $shortTerm = 0;
        $mediumTerm = 0;
        $longTerm = 0;

        foreach ($promotions as $promo) {
            $start = Carbon::parse($promo->start_date);
            $end = Carbon::parse($promo->end_date);
            $duration = $start->diffInDays($end) + 1;
            $totalDuration += $duration;

            if ($duration <= 7) {
                $shortTerm++;
            } elseif ($duration <= 30) {
                $mediumTerm++;
            } else {
                $longTerm++;
            }
        }

        $averageDuration = $totalPromotions > 0 ? round($totalDuration / $totalPromotions, 1) : 0;

        $withRedirect = $promotions->whereNotNull('url_redirect')
            ->filter(fn($p) => !empty(trim($p->url_redirect)))
            ->count();
        $withoutRedirect = $totalPromotions - $withRedirect;

        $recentPromotions = $promotions->filter(function ($promo) {
            return Carbon::parse($promo->created_at)->isAfter(now()->subDays(30));
        })->count();

        $upcomingSoon = $promotions->filter(function ($promo) use ($today) {
            $startDate = Carbon::parse($promo->start_date);
            $nextWeek = $today->copy()->addDays(7);
            return $promo->is_active &&
                $startDate->gt($today) &&
                $startDate->lte($nextWeek);
        })->count();

        $expiringSoon = $promotions->filter(function ($promo) use ($today) {
            $endDate = Carbon::parse($promo->end_date);
            $nextWeek = $today->copy()->addDays(7);
            return $promo->is_active &&
                $endDate->gte($today) &&
                $endDate->lte($nextWeek);
        })->count();

        $statistics = [
            'overview' => [
                'total_promotions' => $totalPromotions,
                'active_promotions' => $activePromotions,
                'inactive_promotions' => $inactivePromotions,
                'recent_promotions' => $recentPromotions,
            ],
            'status' => [
                'running_now' => $runningNow,
                'upcoming' => $upcoming,
                'expired' => $expired,
                'upcoming_soon' => $upcomingSoon,
                'expiring_soon' => $expiringSoon,
            ],
            'duration' => [
                'average_duration' => $averageDuration,
                'short_term' => $shortTerm,
                'medium_term' => $mediumTerm,
                'long_term' => $longTerm,
            ],
            'redirect' => [
                'with_redirect' => $withRedirect,
                'without_redirect' => $withoutRedirect,
            ],
        ];

        return Inertia::render('admin/promotions/index', [
            'promotions' => $promotions,
            'statistics' => $statistics,
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
