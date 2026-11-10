<?php

namespace App\Http\Controllers\Api\Agent;

use App\Http\Controllers\Controller;
use App\Models\Bootcamp;
use App\Models\Bundle;
use App\Models\CertificationProgram;
use App\Models\Course;
use App\Models\Webinar;
use App\Services\Agent\EnrollmentCounter;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

/**
 * GET /api/v1/agent/catalog-summary?types=course,webinar,...
 *
 * Semua produk yang sedang dijual: kelas online, webinar, bootcamp, paket
 * bundling, dan program sertifikasi — beserta peserta, kuota, dan tenggat.
 * Hanya agregat, tanpa data pribadi.
 */
class CatalogSummaryController extends Controller
{
    public const TYPES = ['course', 'webinar', 'bootcamp', 'bundle', 'certification_program'];

    /** Ambang "tenggat dekat" dan "kuota hampir penuh". */
    private const DEADLINE_SOON_DAYS = 3;

    private const ALMOST_FULL_RATIO = 0.9;

    /** Jendela "pendaftar baru" (hari). */
    private const RECENT_DAYS = 7;

    private Carbon $now;

    private Carbon $today;

    public function __construct(private EnrollmentCounter $counter) {}

    public function __invoke(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'types' => ['nullable', 'string', 'regex:/^[a-z_]+(,[a-z_]+)*$/'],
        ]);

        $types = isset($validated['types'])
            ? array_values(array_unique(explode(',', $validated['types'])))
            : self::TYPES;

        if ($unknown = array_diff($types, self::TYPES)) {
            return response()->json([
                'message' => 'Tipe tidak dikenal: '.implode(', ', $unknown),
                'allowed' => self::TYPES,
            ], 422);
        }

        $this->now = now();
        $this->today = $this->now->copy()->startOfDay();

        $items = collect($types)->flatMap(fn (string $type) => match ($type) {
            'course' => $this->courses(),
            'webinar' => $this->webinars(),
            'bootcamp' => $this->bootcamps(),
            'bundle' => $this->bundles(),
            'certification_program' => $this->certificationPrograms(),
        })->values();

        return response()->json([
            'generated_at' => $this->now->toIso8601String(),
            'timezone' => config('app.timezone'),
            'recent_days' => self::RECENT_DAYS,
            'totals' => [
                'by_type' => collect($types)->mapWithKeys(fn ($t) => [$t => $items->where('type', $t)->count()]),
                'deadline_soon' => $items->where('deadline_soon', true)->count(),
                'almost_full' => $items->where('almost_full', true)->count(),
                'enrolled_recent' => $items->sum('enrolled_recent'),
            ],
            'items' => $items,
        ]);
    }

    /** Kelas online: selalu tersedia selama published (tanpa jadwal, tenggat, kuota). */
    private function courses(): Collection
    {
        $courses = Course::with('category:id,name')
            ->where('status', 'published')
            ->orderBy('title')
            ->get();

        return $this->build('course', $courses, fn (Course $c) => [
            'start' => null,
            'end' => null,
            'level' => $c->level,
        ], deadline: fn () => null);
    }

    private function webinars(): Collection
    {
        $webinars = Webinar::with('category:id,name')
            ->where('status', 'published')
            ->where('start_time', '>=', $this->today)
            ->orderBy('start_time')
            ->get();

        return $this->build('webinar', $webinars, fn (Webinar $w) => [
            'start' => Carbon::parse($w->start_time)->toIso8601String(),
            'end' => $w->end_time ? Carbon::parse($w->end_time)->toIso8601String() : null,
        ], quota: fn (Webinar $w) => (int) $w->quota);
    }

    private function bootcamps(): Collection
    {
        $bootcamps = Bootcamp::with('category:id,name')
            ->withCount('schedules')
            ->where('status', 'published')
            ->where(function ($q) {
                $q->whereDate('end_date', '>=', $this->today)
                    ->orWhere(fn ($sq) => $sq->whereNull('end_date')->whereDate('start_date', '>=', $this->today));
            })
            ->orderBy('start_date')
            ->get();

        return $this->build('bootcamp', $bootcamps, fn (Bootcamp $b) => [
            'start' => Carbon::parse($b->start_date)->toDateString(),
            'end' => $b->end_date ? Carbon::parse($b->end_date)->toDateString() : null,
            'sessions_total' => (int) $b->schedules_count,
        ], quota: fn (Bootcamp $b) => (int) $b->quota);
    }

    /** Sama dengan Bundle::isAvailable(): published & tenggat belum lewat. */
    private function bundles(): Collection
    {
        $bundles = Bundle::withCount('bundleItems')
            ->where('status', 'published')
            ->where(fn ($q) => $q->whereNull('registration_deadline')->orWhere('registration_deadline', '>=', $this->now))
            ->orderBy('title')
            ->get();

        return $this->build('bundle', $bundles, fn (Bundle $b) => [
            'start' => null,
            'end' => null,
            'items_count' => (int) $b->bundle_items_count,
        ], category: fn () => null);
    }

    /** Published & (pendaftaran masih buka atau masih ada sesi mendatang). */
    private function certificationPrograms(): Collection
    {
        $programs = CertificationProgram::with('category:id,name')
            ->withCount('schedules')
            ->withMin('schedules', 'schedule_date')
            ->withMax('schedules', 'schedule_date')
            ->where('status', 'published')
            ->where(function ($q) {
                $q->whereNull('registration_deadline')
                    ->orWhere('registration_deadline', '>=', $this->today)
                    ->orWhereHas('schedules', fn ($sq) => $sq->whereDate('schedule_date', '>=', $this->today));
            })
            ->orderBy('registration_deadline')
            ->get();

        $scholarship = $this->counter->count(
            'certification_program',
            $programs->pluck('id')->all(),
            extra: fn ($q, $table) => $q->where("{$table}.is_scholarship", true),
        );

        return $this->build('certification_program', $programs, fn (CertificationProgram $p) => [
            'start' => $p->schedules_min_schedule_date ? Carbon::parse($p->schedules_min_schedule_date)->toDateString() : null,
            'end' => $p->schedules_max_schedule_date ? Carbon::parse($p->schedules_max_schedule_date)->toDateString() : null,
            'program_type' => $p->type,
            'sessions_total' => (int) $p->schedules_count,
            'enrolled_scholarship' => $scholarship->get($p->id, 0),
            'socialization_registration_deadline' => $p->socialization_registration_deadline
                ? Carbon::parse($p->socialization_registration_deadline)->toIso8601String()
                : null,
        ]);
    }

    /**
     * Gabungkan field umum + field khusus tipe.
     *
     * @param  Collection<int, Model>  $models
     */
    private function build(
        string $type,
        Collection $models,
        callable $specific,
        ?callable $quota = null,
        ?callable $deadline = null,
        ?callable $category = null,
    ): Collection {
        $ids = $models->pluck('id')->all();
        $enrolled = $this->counter->count($type, $ids);
        $recent = $this->counter->count($type, $ids, $this->now->copy()->subDays(self::RECENT_DAYS));

        return $models->map(fn (Model $m) => array_merge(
            [
                'type' => $type,
                'id' => $m->id,
                'title' => $m->title,
                'batch' => filled($m->batch ?? null) ? (string) $m->batch : null,
                'category' => $category ? $category($m) : $m->category?->name,
                'price' => (int) $m->price,
                'registration_url' => $m->registration_url,
            ],
            $specific($m),
            $this->registration($deadline ? $deadline($m) : $m->registration_deadline),
            $this->quota($quota ? $quota($m) : 0, $enrolled->get($m->id, 0)),
            ['enrolled_recent' => $recent->get($m->id, 0)],
        ));
    }

    /** @return array{registration_deadline: ?string, days_to_deadline: ?int, registration_open: bool, deadline_soon: bool} */
    private function registration($deadline): array
    {
        if (! $deadline) {
            return [
                'registration_deadline' => null,
                'days_to_deadline' => null,
                'registration_open' => true,
                'deadline_soon' => false,
            ];
        }

        $deadline = Carbon::parse($deadline);
        $days = (int) $this->today->diffInDays($deadline->copy()->startOfDay(), false);
        $open = $deadline->greaterThanOrEqualTo($this->now);

        return [
            'registration_deadline' => $deadline->toIso8601String(),
            'days_to_deadline' => $days,
            'registration_open' => $open,
            'deadline_soon' => $open && $days <= self::DEADLINE_SOON_DAYS,
        ];
    }

    /** quota 0 (atau produk tanpa kolom kuota) = tidak terbatas. */
    private function quota(int $quota, int $enrolled): array
    {
        $unlimited = $quota <= 0;

        return [
            'quota' => $unlimited ? null : $quota,
            'quota_unlimited' => $unlimited,
            'enrolled' => $enrolled,
            'remaining' => $unlimited ? null : max(0, $quota - $enrolled),
            'almost_full' => ! $unlimited && $enrolled >= (int) ceil($quota * self::ALMOST_FULL_RATIO),
        ];
    }
}
