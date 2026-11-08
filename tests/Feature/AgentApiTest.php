<?php

use App\Models\AgentAuditLog;
use App\Models\Bootcamp;
use App\Models\BootcampSchedule;
use App\Models\Bundle;
use App\Models\Category;
use App\Models\CertificationProgram;
use App\Models\CertificationProgramSchedule;
use App\Models\Course;
use App\Models\EnrollmentBootcamp;
use App\Models\EnrollmentBundle;
use App\Models\EnrollmentCertificationProgram;
use App\Models\EnrollmentCourse;
use App\Models\EnrollmentWebinar;
use App\Models\Invoice;
use App\Models\User;
use App\Models\Webinar;
use Carbon\Carbon;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Str;

beforeEach(function () {
    Carbon::setTestNow(Carbon::parse('2026-11-09 07:30:00', 'Asia/Jakarta'));

    $this->owner = User::factory()->create();
    $this->category = Category::create(['name' => 'Pajak', 'slug' => 'pajak']);

    $this->agent = User::factory()->create(['email' => 'agent-supervisor@agents.aksademy.local']);
    $this->token = $this->agent->createToken('agent-supervisor', ['agent:read'])->plainTextToken;
});

afterEach(fn () => Carbon::setTestNow());

function agentGet(string $uri, ?string $token)
{
    // Header & guard Sanctum tersimpan antar-request dalam satu test; reset dulu.
    test()->flushHeaders();
    app('auth')->forgetGuards();

    return test()->withHeaders(array_filter([
        'Accept' => 'application/json',
        'Authorization' => $token ? "Bearer {$token}" : null,
    ]))->get($uri);
}

function makeWebinar(array $attrs = []): Webinar
{
    return Webinar::create(array_merge([
        'user_id' => test()->owner->id,
        'category_id' => test()->category->id,
        'title' => 'Webinar Coretax',
        'slug' => 'webinar-'.Str::random(8),
        'start_time' => '2026-11-12 19:00:00',
        'end_time' => '2026-11-12 21:00:00',
        'registration_deadline' => '2026-11-11 23:59:00',
        'quota' => 10,
        'batch' => 3,
        'status' => 'published',
    ], $attrs));
}

function makeBootcamp(array $attrs = []): Bootcamp
{
    return Bootcamp::create(array_merge([
        'user_id' => test()->owner->id,
        'category_id' => test()->category->id,
        'title' => 'Bootcamp Fullstack',
        'slug' => 'bootcamp-'.Str::random(8),
        'start_date' => '2026-11-08',
        'end_date' => '2026-11-20',
        'quota' => 0,
        'batch' => 2,
        'status' => 'published',
    ], $attrs));
}

function makeCourse(array $attrs = []): Course
{
    return Course::create(array_merge([
        'user_id' => test()->owner->id,
        'category_id' => test()->category->id,
        'title' => 'Kelas Excel Akuntansi',
        'slug' => 'course-'.Str::random(8),
        'price' => 150000,
        'status' => 'published',
    ], $attrs));
}

function makeBundle(array $attrs = []): Bundle
{
    return Bundle::create(array_merge([
        'user_id' => test()->owner->id,
        'title' => 'Paket Pajak Lengkap',
        'slug' => 'bundle-'.Str::random(8),
        'batch' => '5',
        'price' => 500000,
        'registration_deadline' => '2026-11-30 23:59:00',
        'status' => 'published',
    ], $attrs));
}

function makeProgram(array $attrs = []): CertificationProgram
{
    return CertificationProgram::create(array_merge([
        'category_id' => test()->category->id,
        'title' => 'Sertifikasi Brevet AB',
        'slug' => 'program-'.Str::random(8),
        'batch' => '7',
        'registration_deadline' => '2026-11-20 23:59:00',
        'type' => 'scholarship',
        'status' => 'published',
    ], $attrs));
}

function enroll(string $type, string $productId, string $status = 'paid', bool $firstTermPaid = false, array $extra = [], ?string $paidAt = null): void
{
    $buyer = User::factory()->create();
    $invoice = Invoice::create([
        'user_id' => $buyer->id,
        'amount' => 100000,
        'nett_amount' => 100000,
        'status' => $status,
        'invoice_code' => 'INV-'.Str::random(8),
        'paid_at' => $paidAt ?? ($status === 'paid' ? now() : null),
    ]);

    if ($status === 'installment_pending') {
        Invoice::create([
            'user_id' => $buyer->id,
            'amount' => 50000,
            'nett_amount' => 50000,
            'status' => $firstTermPaid ? 'paid' : 'pending',
            'invoice_code' => 'INV-'.Str::random(8),
            'is_installment' => true,
            'parent_invoice_id' => $invoice->id,
            'installment_number' => 1,
        ]);
    }

    [$model, $key] = match ($type) {
        'course' => [EnrollmentCourse::class, 'course_id'],
        'webinar' => [EnrollmentWebinar::class, 'webinar_id'],
        'bootcamp' => [EnrollmentBootcamp::class, 'bootcamp_id'],
        'bundle' => [EnrollmentBundle::class, 'bundle_id'],
        'certification_program' => [EnrollmentCertificationProgram::class, 'certification_program_id'],
    };

    $model::create(array_merge(['invoice_id' => $invoice->id, $key => $productId, 'price' => 100000], $extra));
}

// --- Keamanan -----------------------------------------------------------

it('menolak request tanpa token', function () {
    agentGet('/api/v1/agent/catalog-summary', null)->assertUnauthorized();
});

it('menolak token tanpa ability agent:read', function () {
    $other = $this->agent->createToken('external', ['external-api'])->plainTextToken;

    agentGet('/api/v1/agent/catalog-summary', $other)->assertForbidden();
    agentGet('/api/v1/agent/schedules-and-recordings', $other)->assertForbidden();
});

it('mencatat setiap request ke agent_audit_logs', function () {
    agentGet('/api/v1/agent/catalog-summary', $this->token)->assertOk();
    agentGet('/api/v1/agent/catalog-summary', null)->assertUnauthorized();

    expect(AgentAuditLog::count())->toBe(2);
    $ok = AgentAuditLog::where('status', 200)->first();
    expect($ok->token_name)->toBe('agent-supervisor')
        ->and($ok->path)->toBe('/api/v1/agent/catalog-summary');
});

it('tidak pernah mengembalikan data pribadi peserta', function () {
    $webinar = makeWebinar();
    enroll('webinar', $webinar->id);

    $body = agentGet('/api/v1/agent/catalog-summary', $this->token)->getContent()
        .agentGet('/api/v1/agent/schedules-and-recordings?date=2026-11-12', $this->token)->getContent();

    foreach (User::all() as $user) {
        expect($body)->not->toContain($user->email);
        if ($user->phone_number) {
            expect($body)->not->toContain($user->phone_number);
        }
    }
    expect($body)->not->toContain('"email"')->not->toContain('phone');
});

// --- catalog-summary ----------------------------------------------------

it('menghitung peserta, sisa kuota, dan tenggat sesuai aturan dashboard', function () {
    $webinar = makeWebinar(['quota' => 10]);
    foreach (range(1, 8) as $_) {
        enroll('webinar', $webinar->id, 'paid');
    }
    enroll('webinar', $webinar->id, 'installment_pending', firstTermPaid: true);  // dihitung
    enroll('webinar', $webinar->id, 'installment_pending', firstTermPaid: false); // tidak
    enroll('webinar', $webinar->id, 'pending');                                   // tidak

    makeWebinar(['title' => 'Draft', 'status' => 'draft']);
    makeWebinar(['title' => 'Lewat', 'start_time' => '2026-11-01 19:00:00']);

    $res = agentGet('/api/v1/agent/catalog-summary', $this->token)->assertOk();

    $items = collect($res->json('items'));
    expect($items->where('type', 'webinar'))->toHaveCount(1);

    $w = $items->firstWhere('id', $webinar->id);
    expect($w['enrolled'])->toBe(9)
        ->and($w['quota'])->toBe(10)
        ->and($w['remaining'])->toBe(1)
        ->and($w['almost_full'])->toBeTrue()
        ->and($w['days_to_deadline'])->toBe(2)
        ->and($w['deadline_soon'])->toBeTrue()
        ->and($w['start'])->toBe('2026-11-12T19:00:00+07:00');

    expect($res->json('totals.deadline_soon'))->toBe(1)
        ->and($res->json('timezone'))->toBe('Asia/Jakarta');
});

it('memperlakukan quota 0 sebagai tidak terbatas', function () {
    $bootcamp = makeBootcamp(['quota' => 0]);
    enroll('bootcamp', $bootcamp->id);

    $b = collect(agentGet('/api/v1/agent/catalog-summary', $this->token)->json('items'))
        ->firstWhere('id', $bootcamp->id);

    expect($b['quota_unlimited'])->toBeTrue()
        ->and($b['quota'])->toBeNull()
        ->and($b['remaining'])->toBeNull()
        ->and($b['almost_full'])->toBeFalse()
        ->and($b['enrolled'])->toBe(1);
});

it('mencakup kelas online, bundling, dan sertifikasi yang sedang dijual', function () {
    $course = makeCourse();
    makeCourse(['title' => 'Draft', 'status' => 'draft']);
    enroll('course', $course->id);
    enroll('course', $course->id, paidAt: '2026-10-01 10:00:00'); // lama: tidak masuk enrolled_recent

    $bundle = makeBundle();
    makeBundle(['title' => 'Tutup', 'registration_deadline' => '2026-11-01 23:59:00']);
    enroll('bundle', $bundle->id);

    $program = makeProgram();
    makeProgram(['title' => 'Lewat', 'registration_deadline' => '2026-10-01 23:59:00']);
    CertificationProgramSchedule::create([
        'certification_program_id' => $program->id,
        'schedule_date' => '2026-11-22', 'day' => 'minggu', 'start_time' => '09:00:00', 'end_time' => '12:00:00',
    ]);
    enroll('certification_program', $program->id);
    enroll('certification_program', $program->id, extra: ['is_scholarship' => true]);

    $res = agentGet('/api/v1/agent/catalog-summary', $this->token)->assertOk();
    $items = collect($res->json('items'));

    expect($res->json('totals.by_type'))->toMatchArray([
        'course' => 1, 'webinar' => 0, 'bootcamp' => 0, 'bundle' => 1, 'certification_program' => 1,
    ]);

    $c = $items->firstWhere('id', $course->id);
    expect($c['type'])->toBe('course')
        ->and($c['enrolled'])->toBe(2)
        ->and($c['enrolled_recent'])->toBe(1)
        ->and($c['quota_unlimited'])->toBeTrue()
        ->and($c['registration_deadline'])->toBeNull();

    $b = $items->firstWhere('id', $bundle->id);
    expect($b['batch'])->toBe('5')
        ->and($b['enrolled'])->toBe(1)
        ->and($b['category'])->toBeNull();

    $p = $items->firstWhere('id', $program->id);
    expect($p['program_type'])->toBe('scholarship')
        ->and($p['enrolled'])->toBe(2)
        ->and($p['enrolled_scholarship'])->toBe(1)
        ->and($p['sessions_total'])->toBe(1)
        ->and($p['start'])->toBe('2026-11-22')
        ->and($p['days_to_deadline'])->toBe(11);
});

it('bisa memfilter tipe dan menolak tipe tak dikenal', function () {
    makeCourse();
    makeWebinar();

    $res = agentGet('/api/v1/agent/catalog-summary?types=webinar', $this->token)->assertOk();
    expect(collect($res->json('items'))->pluck('type')->unique()->all())->toBe(['webinar'])
        ->and(array_keys($res->json('totals.by_type')))->toBe(['webinar']);

    agentGet('/api/v1/agent/catalog-summary?types=webinar,ebook', $this->token)
        ->assertStatus(422)
        ->assertJsonPath('allowed.0', 'course');
});

// --- schedules-and-recordings ------------------------------------------

it('menyertakan sesi program sertifikasi di jadwal', function () {
    $program = makeProgram();
    foreach (['2026-11-02', '2026-11-09'] as $day) {
        CertificationProgramSchedule::create([
            'certification_program_id' => $program->id,
            'title' => "Modul {$day}",
            'schedule_date' => $day, 'day' => 'senin', 'start_time' => '13:00:00', 'end_time' => '15:00:00',
        ]);
    }

    $session = collect(agentGet('/api/v1/agent/schedules-and-recordings?date=2026-11-09', $this->token)->json('today'))
        ->firstWhere('type', 'certification_session');

    expect($session['parent_id'])->toBe($program->id)
        ->and($session['session_title'])->toBe('Modul 2026-11-09')
        ->and($session['session_number'])->toBe(2)
        ->and($session['sessions_total'])->toBe(2)
        ->and($session['batch'])->toBe('7')
        ->and($session['has_recording'])->toBeFalse();
});

it('mengembalikan jadwal hari ini dan status rekaman hari sebelumnya', function () {
    makeWebinar(['start_time' => '2026-11-09 19:00:00', 'end_time' => null]);
    makeWebinar(['title' => 'Kemarin', 'start_time' => '2026-11-08 19:00:00', 'recording_url' => 'https://youtu.be/x']);

    $bootcamp = makeBootcamp();
    foreach (['2026-11-08', '2026-11-09', '2026-11-10'] as $day) {
        BootcampSchedule::create([
            'bootcamp_id' => $bootcamp->id,
            'schedule_date' => $day,
            'day' => 'senin',
            'start_time' => '09:00:00',
            'end_time' => '12:00:00',
        ]);
    }

    $res = agentGet('/api/v1/agent/schedules-and-recordings?date=2026-11-09', $this->token)->assertOk();

    expect($res->json('date'))->toBe('2026-11-09')
        ->and($res->json('summary.sessions_today'))->toBe(2)
        ->and($res->json('summary.sessions_previous_day'))->toBe(2)
        ->and($res->json('summary.previous_day_with_recording'))->toBe(1)
        ->and($res->json('summary.previous_day_without_recording'))->toBe(1);

    $session = collect($res->json('today'))->firstWhere('type', 'bootcamp_session');
    expect($session['session_number'])->toBe(2)
        ->and($session['sessions_total'])->toBe(3)
        ->and($session['start'])->toBe('2026-11-09T09:00:00+07:00')
        ->and($session['end'])->toBe('2026-11-09T12:00:00+07:00');

    $webinar = collect($res->json('today'))->firstWhere('type', 'webinar');
    expect($webinar['end'])->toBeNull()
        ->and($webinar)->not->toHaveKey('has_meeting_link');
});

it('memakai hari ini bila date kosong dan menolak format tanggal salah', function () {
    agentGet('/api/v1/agent/schedules-and-recordings', $this->token)
        ->assertOk()
        ->assertJsonPath('date', '2026-11-09');

    agentGet('/api/v1/agent/schedules-and-recordings?date=09-11-2026', $this->token)
        ->assertUnprocessable();
});

// --- Perintah token -----------------------------------------------------

it('agent:token membuat token read-only dan mencabut token lama', function () {
    Artisan::call('agent:token', ['agent' => 'academic']);
    Artisan::call('agent:token', ['agent' => 'academic']);

    $user = User::where('email', 'agent-academic@agents.aksademy.local')->firstOrFail();
    expect($user->tokens()->count())->toBe(1)
        ->and($user->tokens()->first()->abilities)->toBe(['agent:read'])
        ->and($user->roles()->count())->toBe(0);
});
