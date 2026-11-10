<?php

namespace App\Http\Controllers\Api\Agent;

use App\Http\Controllers\Controller;
use App\Services\Agent\ScheduleItems;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;

/**
 * GET /api/v1/agent/recordings-pending?hours=48
 *
 * Sesi produk `auto_meeting_link` yang selesai dalam `hours` jam terakhir,
 * punya `zoom_meeting_id` (meeting di akun Zoom perusahaan), tetapi
 * `recording_url` masih kosong. Rekaman yang
 * belum siap di Zoom akan muncul lagi esok malam selama masih dalam jendela.
 * Webinar tanpa `end_time` dianggap selesai saat waktu mulai.
 */
class RecordingsPendingController extends Controller
{
    public function __invoke(Request $request, ScheduleItems $schedules): JsonResponse
    {
        $validated = $request->validate([
            'hours' => 'nullable|integer|min:1|max:168',
        ]);

        $hours = (int) ($validated['hours'] ?? 48);
        $now = now();
        $since = $now->copy()->subHours($hours);

        $items = $schedules->between($since, $now)
            ->filter(function (array $i) use ($since, $now) {
                $ended = Carbon::parse($i['end'] ?? $i['start']);

                return $i['auto_meeting_link']
                    && filled($i['zoom_meeting_id'])
                    && ! $i['has_recording']
                    && $ended->between($since, $now);
            })
            ->map(fn (array $i) => Arr::only($i, [
                'type', 'id', 'parent_id', 'title', 'session_title', 'batch',
                'session_number', 'sessions_total', 'start', 'end', 'zoom_meeting_id', 'group_url',
            ]))
            ->values();

        return response()->json([
            'generated_at' => $now->toIso8601String(),
            'timezone' => config('app.timezone'),
            'since' => $since->toIso8601String(),
            'items' => $items,
        ]);
    }
}
