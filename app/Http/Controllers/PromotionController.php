<?php

namespace App\Http\Controllers;

use App\Models\Promotion;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Inertia\Inertia;

class PromotionController extends Controller
{

    public function index() {
        $promotions = Promotion::all();
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
    
}

