<?php

namespace App\Http\Controllers\Api\Agent;

use App\Http\Controllers\Controller;
use App\Services\Agent\ScheduleItems;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

/**
 * GET /api/v1/agent/schedules-and-recordings?date=YYYY-MM-DD
 *
 * Jadwal webinar, sesi bootcamp, dan sesi program sertifikasi pada tanggal
 * tersebut (default hari ini) dan hari sebelumnya, beserta status link Zoom
 * (`meeting_url`) dan rekaman. Kelas online & bundle tidak punya jadwal.
 */
class ScheduleController extends Controller
{
    public function __invoke(Request $request, ScheduleItems $schedules): JsonResponse
    {
        $validated = $request->validate([
            'date' => 'nullable|date_format:Y-m-d',
        ]);

        $date = isset($validated['date'])
            ? Carbon::createFromFormat('Y-m-d', $validated['date'])->startOfDay()
            : now()->startOfDay();
        $previous = $date->copy()->subDay();

        $today = $this->publicItems($schedules->between($date, $date));
        $yesterday = $this->publicItems($schedules->between($previous, $previous));

        return response()->json([
            'generated_at' => now()->toIso8601String(),
            'timezone' => config('app.timezone'),
            'date' => $date->toDateString(),
            'summary' => [
                'sessions_today' => $today->count(),
                'sessions_today_without_meeting_link' => $today->where('has_meeting_link', false)->count(),
                'sessions_previous_day' => $yesterday->count(),
                'previous_day_with_recording' => $yesterday->where('has_recording', true)->count(),
                'previous_day_without_recording' => $yesterday->where('has_recording', false)->count(),
            ],
            'today' => $today,
            'previous_day' => [
                'date' => $previous->toDateString(),
                'items' => $yesterday,
            ],
        ]);
    }

    private function publicItems(Collection $items): Collection
    {
        return $items->map(fn (array $item) => Arr::except($item, ScheduleItems::INTERNAL_KEYS))->values();
    }
}
