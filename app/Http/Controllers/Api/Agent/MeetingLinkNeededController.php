<?php

namespace App\Http\Controllers\Api\Agent;

use App\Http\Controllers\Controller;
use App\Services\Agent\ScheduleItems;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;

/**
 * GET /api/v1/agent/schedules-needing-meeting-link?days=7
 *
 * Sesi mendatang (mulai setelah sekarang, sampai `days` hari ke depan) yang
 * belum punya `meeting_url`.
 * - `items`         : produk dengan `auto_meeting_link` = true → agent boleh
 *                     membuat meeting Zoom di akun perusahaan.
 * - `manual_missing`: produk tanpa centang (akun Zoom pinjaman) → hanya untuk
 *                     pengingat ke admin; agent tidak membuat meeting.
 */
class MeetingLinkNeededController extends Controller
{
    public function __invoke(Request $request, ScheduleItems $schedules): JsonResponse
    {
        $validated = $request->validate([
            'days' => 'nullable|integer|min:1|max:30',
        ]);

        $days = (int) ($validated['days'] ?? 7);
        $now = now();
        $to = $now->copy()->addDays($days);

        $upcoming = $schedules->between($now, $to)
            ->filter(fn (array $i) => ! $i['has_meeting_link'] && Carbon::parse($i['start'])->greaterThan($now))
            ->map(fn (array $i) => array_merge(
                Arr::only($i, ['type', 'id', 'parent_id', 'title', 'session_title', 'batch', 'session_number', 'sessions_total', 'start', 'end', 'auto_meeting_link']),
                ['duration_minutes' => $i['end'] ? Carbon::parse($i['start'])->diffInMinutes(Carbon::parse($i['end'])) : null],
            ));

        $strip = fn (array $i) => Arr::except($i, ['auto_meeting_link']);

        return response()->json([
            'generated_at' => $now->toIso8601String(),
            'timezone' => config('app.timezone'),
            'from' => $now->toDateString(),
            'to' => $to->toDateString(),
            'items' => $upcoming->where('auto_meeting_link', true)->map($strip)->values(),
            'manual_missing' => $upcoming->where('auto_meeting_link', false)->map($strip)->values(),
        ]);
    }
}
