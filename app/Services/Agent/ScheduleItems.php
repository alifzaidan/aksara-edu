<?php

namespace App\Services\Agent;

use App\Models\BootcampSchedule;
use App\Models\CertificationProgramSchedule;
use App\Models\Webinar;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;

/**
 * Sesi terjadwal (webinar, sesi bootcamp, sesi program sertifikasi) dalam
 * bentuk seragam untuk API agent.
 *
 * Kolom `*_url` produk = halaman program/LMS. Link Zoom ada di `meeting_url`
 * (per webinar / per sesi). Item memuat kunci internal `zoom_meeting_id` dan
 * `auto_meeting_link`; controller memilih kunci mana yang dikirim.
 */
class ScheduleItems
{
    /** Tipe item → model yang menyimpan meeting_url / recording_url. */
    public const MODELS = [
        'webinar' => Webinar::class,
        'bootcamp_session' => BootcampSchedule::class,
        'certification_session' => CertificationProgramSchedule::class,
    ];

    /** Kunci yang tidak ikut di respons jadwal umum. */
    public const INTERNAL_KEYS = ['zoom_meeting_id', 'auto_meeting_link'];

    /** Semua sesi dengan tanggal mulai di antara $from dan $to (inklusif), urut waktu mulai. */
    public function between(Carbon $from, Carbon $to): Collection
    {
        $from = $from->copy()->startOfDay();
        $to = $to->copy()->startOfDay();

        return $this->webinars($from, $to)
            ->concat($this->bootcampSessions($from, $to))
            ->concat($this->certificationSessions($from, $to))
            ->sortBy('start')
            ->values();
    }

    /** Produk induk yang menentukan `auto_meeting_link` untuk sebuah sesi. */
    public static function productOf(Model $session): ?Model
    {
        return match (true) {
            $session instanceof Webinar => $session,
            $session instanceof BootcampSchedule => $session->bootcamp,
            $session instanceof CertificationProgramSchedule => $session->certificationProgram,
            default => null,
        };
    }

    /**
     * Dipanggil saat model sesi disimpan: bila jadwal produk otomatis bergeser,
     * link Zoom lama dikosongkan agar agent membuat meeting baru (job 16:30).
     * Produk manual (akun Zoom pinjaman) tidak disentuh.
     */
    public static function dropStaleMeetingLink(Model $session): void
    {
        if (! $session->exists || blank($session->getOriginal('meeting_url')) || $session->isDirty('meeting_url')) {
            return;
        }

        $fields = $session instanceof Webinar ? ['start_time', 'end_time'] : ['schedule_date', 'start_time', 'end_time'];
        // Bandingkan sebagai waktu, bukan string: form mengirim "09:00", DB menyimpan "09:00:00".
        $moment = fn ($v) => blank($v) ? null : Carbon::parse($v)->format('Y-m-d H:i');
        $moved = collect($fields)->contains(fn ($f) => $moment($session->getOriginal($f)) !== $moment($session->getAttribute($f)));

        if ($moved && self::productOf($session)?->auto_meeting_link) {
            $session->meeting_url = null;
            $session->zoom_meeting_id = null;
        }
    }

    private function webinars(Carbon $from, Carbon $to): Collection
    {
        return Webinar::query()
            ->whereIn('status', ['published', 'archived'])
            ->whereDate('start_time', '>=', $from->toDateString())
            ->whereDate('start_time', '<=', $to->toDateString())
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
                'has_meeting_link' => filled($w->meeting_url),
                'zoom_meeting_id' => $w->zoom_meeting_id,
                'auto_meeting_link' => (bool) $w->auto_meeting_link,
            ]);
    }

    private function bootcampSessions(Carbon $from, Carbon $to): Collection
    {
        $sessions = BootcampSchedule::with('bootcamp:id,title,batch,status,auto_meeting_link')
            ->whereBetween('schedule_date', [$from->toDateString(), $to->toDateString()])
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

    private function certificationSessions(Carbon $from, Carbon $to): Collection
    {
        $sessions = CertificationProgramSchedule::with('certificationProgram:id,title,batch,status,auto_meeting_link')
            ->whereBetween('schedule_date', [$from->toDateString(), $to->toDateString()])
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
            'has_meeting_link' => filled($schedule->meeting_url),
            'zoom_meeting_id' => $schedule->zoom_meeting_id,
            'auto_meeting_link' => (bool) $parent?->auto_meeting_link,
        ];
    }
}
