<?php

namespace App\Http\Controllers\Api\Agent;

use App\Http\Controllers\Controller;
use App\Models\BootcampSchedule;
use App\Models\CertificationProgramSchedule;
use App\Models\Webinar;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

/**
 * GET /api/v1/agent/schedules-and-recordings?date=YYYY-MM-DD
 *
 * Jadwal webinar, sesi bootcamp, dan sesi program sertifikasi pada tanggal
 * tersebut (default hari ini) dan hari sebelumnya, beserta status link
 * rekaman. Link Zoom belum punya kolom sendiri (url_* = halaman program/LMS),
 * jadi belum dilaporkan. Kelas online & bundle tidak punya jadwal.
 */
class ScheduleController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'date' => 'nullable|date_format:Y-m-d',
        ]);

        $date = isset($validated['date'])
            ? Carbon::createFromFormat('Y-m-d', $validated['date'])->startOfDay()
            : now()->startOfDay();
        $previous = $date->copy()->subDay();

        $today = $this->schedulesOn($date);
        $yesterday = $this->schedulesOn($previous);

        return response()->json([
            'generated_at' => now()->toIso8601String(),
            'timezone' => config('app.timezone'),
            'date' => $date->toDateString(),
            'summary' => [
                'sessions_today' => $today->count(),
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

    private function schedulesOn(Carbon $date): Collection
    {
        return $this->webinars($date)
            ->concat($this->bootcampSessions($date))
            ->concat($this->certificationSessions($date))
            ->sortBy('start')
            ->values();
    }

    private function webinars(Carbon $date): Collection
    {
        return Webinar::query()
            ->whereIn('status', ['published', 'archived'])
            ->whereDate('start_time', $date->toDateString())
            ->get()
            ->map(fn (Webinar $w) => [
                'type' => 'webinar',
                'id' => $w->id,
                'parent_id' => null,
                'title' => $w->title,
                'session_title' => null,
                'batch' => filled($w->batch) ? (string) $w->batch : null,
                'session_number' => null,
                'sessions_total' => null,
                'start' => Carbon::parse($w->start_time)->toIso8601String(),
                'end' => $w->end_time ? Carbon::parse($w->end_time)->toIso8601String() : null,
                'has_recording' => filled($w->recording_url),
            ]);
    }

    private function bootcampSessions(Carbon $date): Collection
    {
        $sessions = BootcampSchedule::with('bootcamp:id,title,batch,status')
            ->whereDate('schedule_date', $date->toDateString())
            ->whereHas('bootcamp', fn ($q) => $q->whereIn('status', ['published', 'archived', 'hidden']))
            ->get();

        $order = $this->sessionOrder(BootcampSchedule::query(), 'bootcamp_id', $sessions);

        return $sessions->map(fn (BootcampSchedule $s) => $this->session(
            type: 'bootcamp_session',
            schedule: $s,
            parentId: $s->bootcamp_id,
            parent: $s->bootcamp,
            order: $order->get($s->bootcamp_id, collect()),
            sessionTitle: null,
        ));
    }

    private function certificationSessions(Carbon $date): Collection
    {
        $sessions = CertificationProgramSchedule::with('certificationProgram:id,title,batch,status')
            ->whereDate('schedule_date', $date->toDateString())
            ->whereHas('certificationProgram', fn ($q) => $q->whereIn('status', ['published', 'archived', 'hidden']))
            ->get();

        $order = $this->sessionOrder(CertificationProgramSchedule::query(), 'certification_program_id', $sessions);

        return $sessions->map(fn (CertificationProgramSchedule $s) => $this->session(
            type: 'certification_session',
            schedule: $s,
            parentId: $s->certification_program_id,
            parent: $s->certificationProgram,
            order: $order->get($s->certification_program_id, collect()),
            sessionTitle: $s->title,
        ));
    }

    /** Urutan id sesi per induk (untuk nomor sesi). */
    private function sessionOrder($query, string $parentKey, Collection $sessions): Collection
    {
        return $query
            ->whereIn($parentKey, $sessions->pluck($parentKey)->unique()->all())
            ->orderBy('schedule_date')
            ->orderBy('start_time')
            ->get(['id', $parentKey])
            ->groupBy($parentKey)
            ->map(fn ($rows) => $rows->pluck('id')->values());
    }

    private function session(
        string $type,
        $schedule,
        string $parentId,
        $parent,
        Collection $order,
        ?string $sessionTitle,
    ): array {
        $day = Carbon::parse($schedule->schedule_date)->toDateString();
        $tz = config('app.timezone');

        return [
            'type' => $type,
            'id' => $schedule->id,
            'parent_id' => $parentId,
            'title' => $parent?->title,
            'session_title' => $sessionTitle,
            'batch' => filled($parent?->batch) ? (string) $parent->batch : null,
            'session_number' => $order->search($schedule->id) + 1,
            'sessions_total' => $order->count(),
            'start' => Carbon::parse("{$day} {$schedule->start_time}", $tz)->toIso8601String(),
            'end' => Carbon::parse("{$day} {$schedule->end_time}", $tz)->toIso8601String(),
            'has_recording' => filled($schedule->recording_url),
        ];
    }
}
