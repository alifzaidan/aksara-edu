<?php

namespace App\Http\Controllers\Api\Agent;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * GET /api/v1/agent/revenue-summary?date=YYYY-MM-DD
 *
 * Pendapatan (rupiah, nett_amount, definisi sama dengan dashboard admin) untuk
 * hari sebelum `date` dan bulan berjalan sampai `date`. Hanya agregat.
 */
class RevenueSummaryController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $validated = $request->validate(['date' => 'nullable|date_format:Y-m-d']);

        $date = isset($validated['date']) ? Carbon::createFromFormat('Y-m-d', $validated['date'])->startOfDay() : now()->startOfDay();
        $yesterday = $date->copy()->subDay();
        $monthStart = $date->copy()->startOfMonth();

        $sum = fn (Carbon $from, Carbon $to) => (int) round((float) Invoice::paidPayments()
            ->whereBetween('paid_at', [$from, $to])
            ->sum('nett_amount'));

        return response()->json([
            'generated_at' => now()->toIso8601String(),
            'timezone' => config('app.timezone'),
            'currency' => 'IDR',
            'date' => $date->toDateString(),
            'yesterday' => [
                'date' => $yesterday->toDateString(),
                'amount' => $sum($yesterday, $yesterday->copy()->endOfDay()),
            ],
            'month_to_date' => [
                'from' => $monthStart->toDateString(),
                'to' => $date->toDateString(),
                'amount' => $sum($monthStart, $date->copy()->endOfDay()),
            ],
        ]);
    }
}
