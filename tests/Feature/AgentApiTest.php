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
        ->and($webinar['has_meeting_link'])->toBeFalse()
        ->and($webinar)->not->toHaveKey('zoom_meeting_id')
        ->and($webinar)->not->toHaveKey('auto_meeting_link')
        ->and($webinar)->not->toHaveKey('group_url');
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

// --- Fase F: link Zoom & rekaman ---------------------------------------

function agentPost(string $uri, array $data, ?string $token, ?string $key = 'key-1')
{
    test()->flushHeaders();
    app('auth')->forgetGuards();

    return test()->withHeaders(array_filter([
        'Accept' => 'application/json',
        'Authorization' => $token ? "Bearer {$token}" : null,
        'Idempotency-Key' => $key,
    ]))->postJson($uri, $data);
}

function writerToken(): string
{
    return test()->agent->createToken('agent-academic', ['agent:read', 'agent:write-meeting', 'agent:write-recording'])->plainTextToken;
}

function makeSession(Bootcamp $bootcamp, string $day, string $start = '09:00:00', string $end = '12:00:00', array $attrs = []): BootcampSchedule
{
    return BootcampSchedule::create(array_merge([
        'bootcamp_id' => $bootcamp->id,
        'schedule_date' => $day,
        'day' => 'senin',
        'start_time' => $start,
        'end_time' => $end,
    ], $attrs));
}

it('melaporkan jadwal yang butuh link Zoom, terpisah otomatis dan manual', function () {
    $auto = makeBootcamp(['auto_meeting_link' => true]);
    $manual = makeBootcamp(['title' => 'Bootcamp Akun Pinjaman']);

    $sesiLewat = makeSession($auto, '2026-11-09', '06:00:00', '07:00:00');   // sudah mulai
    $sesiBaru = makeSession($auto, '2026-11-10');                              // butuh link
    makeSession($auto, '2026-11-11', attrs: ['meeting_url' => 'https://us06web.zoom.us/j/1', 'zoom_meeting_id' => '123456789']);
    makeSession($auto, '2026-11-30');                                          // di luar 7 hari
    makeSession($manual, '2026-11-12');                                        // manual
    makeWebinar(['auto_meeting_link' => true, 'start_time' => '2026-11-12 19:00:00', 'end_time' => '2026-11-12 21:00:00']);

    $res = agentGet('/api/v1/agent/schedules-needing-meeting-link', $this->token)->assertOk();

    $items = collect($res->json('items'));
    expect($items->pluck('id'))->not->toContain($sesiLewat->id)
        ->and($items)->toHaveCount(2)
        ->and($items->firstWhere('id', $sesiBaru->id)['duration_minutes'])->toBe(180)
        ->and($items->firstWhere('type', 'webinar')['duration_minutes'])->toBe(120)
        ->and($items->first())->not->toHaveKey('auto_meeting_link')
        ->and($res->json('manual_missing'))->toHaveCount(1)
        ->and($res->json('manual_missing.0.title'))->toBe('Bootcamp Akun Pinjaman');

    agentGet('/api/v1/agent/schedules-needing-meeting-link?days=30', $this->token)
        ->assertOk()->assertJsonCount(3, 'items');
    agentGet('/api/v1/agent/schedules-needing-meeting-link?days=99', $this->token)->assertUnprocessable();
});

it('melaporkan rekaman yang belum diisi hanya untuk meeting buatan agent dalam jendela 48 jam', function () {
    $bootcamp = makeBootcamp(['auto_meeting_link' => true, 'group_url' => 'https://chat.whatsapp.com/abc']);
    $zoom = ['meeting_url' => 'https://us06web.zoom.us/j/1', 'zoom_meeting_id' => '98765432101'];

    $pending = makeSession($bootcamp, '2026-11-08', attrs: $zoom);
    makeSession($bootcamp, '2026-11-07', '19:00:00', '21:00:00', attrs: $zoom + ['recording_url' => 'https://youtu.be/x']);
    makeSession($bootcamp, '2026-11-08', '13:00:00', '15:00:00');           // tanpa zoom_meeting_id
    makeSession($bootcamp, '2026-11-06', attrs: $zoom);                     // > 48 jam
    makeSession($bootcamp, '2026-11-09', '09:00:00', '12:00:00', attrs: $zoom); // belum selesai
    makeSession(makeBootcamp(), '2026-11-08', attrs: $zoom);              // produk manual (akun pinjaman)

    $res = agentGet('/api/v1/agent/recordings-pending', $this->token)->assertOk();

    expect($res->json('items'))->toHaveCount(1)
        ->and($res->json('items.0.id'))->toBe($pending->id)
        ->and($res->json('items.0.zoom_meeting_id'))->toBe('98765432101')
        ->and($res->json('items.0.group_url'))->toBe('https://chat.whatsapp.com/abc');
});

it('menolak tulis tanpa ability, tanpa Idempotency-Key, dan payload tidak valid', function () {
    $session = makeSession(makeBootcamp(['auto_meeting_link' => true]), '2026-11-10');
    $body = ['type' => 'bootcamp_session', 'id' => $session->id, 'meeting_url' => 'https://us06web.zoom.us/j/123456789?pwd=x', 'zoom_meeting_id' => '123456789'];

    agentPost('/api/v1/agent/update-meeting-link', $body, $this->token)->assertForbidden();

    $writer = writerToken();
    agentPost('/api/v1/agent/update-meeting-link', $body, $writer, key: null)->assertStatus(400);
    agentPost('/api/v1/agent/update-meeting-link', array_merge($body, ['meeting_url' => 'https://evil.example/zoom.us/j/1']), $writer)->assertUnprocessable();
    agentPost('/api/v1/agent/update-meeting-link', array_merge($body, ['type' => 'course']), $writer, 'k2')->assertUnprocessable();

    expect($session->fresh()->meeting_url)->toBeNull();
});

it('mengisi link Zoom sekali, idempoten, dan tidak menimpa nilai lain', function () {
    $webinar = makeWebinar(['auto_meeting_link' => true, 'webinar_url' => 'https://lms.aksademy.id/webinar/x']);
    $writer = writerToken();
    $body = ['type' => 'webinar', 'id' => $webinar->id, 'meeting_url' => 'https://us06web.zoom.us/j/123456789?pwd=x', 'zoom_meeting_id' => '123456789'];

    agentPost('/api/v1/agent/update-meeting-link', $body, $writer, 'k1')->assertOk()->assertJsonPath('status', 'updated');

    $webinar->refresh();
    expect($webinar->meeting_url)->toBe($body['meeting_url'])
        ->and($webinar->zoom_meeting_id)->toBe('123456789')
        ->and($webinar->webinar_url)->toBe('https://lms.aksademy.id/webinar/x');

    // Request ulang dengan kunci sama → respons sama, ditandai replay.
    agentPost('/api/v1/agent/update-meeting-link', $body, $writer, 'k1')
        ->assertOk()->assertHeader('Idempotent-Replayed', 'true')->assertJsonPath('status', 'updated');
    // Kunci sama, payload lain → ditolak.
    agentPost('/api/v1/agent/update-meeting-link', array_merge($body, ['zoom_meeting_id' => '999999999']), $writer, 'k1')
        ->assertUnprocessable();
    // Kunci baru, nilai sama → unchanged; nilai lain → 409.
    agentPost('/api/v1/agent/update-meeting-link', $body, $writer, 'k2')->assertOk()->assertJsonPath('status', 'unchanged');
    agentPost('/api/v1/agent/update-meeting-link', array_merge($body, ['zoom_meeting_id' => '999999999']), $writer, 'k3')
        ->assertStatus(409)->assertJsonPath('status', 'conflict');

    expect($webinar->fresh()->zoom_meeting_id)->toBe('123456789');

    $log = AgentAuditLog::where('method', 'POST')->latest('id')->first();
    expect($log->payload['type'])->toBe('webinar')
        ->and($log->payload['idempotency_key'])->toBe('k3')
        ->and($log->status)->toBe(409);
});

it('tidak membuat link untuk produk yang tidak dicentang otomatis', function () {
    $session = makeSession(makeBootcamp(), '2026-11-10');

    agentPost('/api/v1/agent/update-meeting-link', [
        'type' => 'bootcamp_session', 'id' => $session->id,
        'meeting_url' => 'https://us06web.zoom.us/j/123456789', 'zoom_meeting_id' => '123456789',
    ], writerToken())->assertStatus(409)->assertJsonPath('status', 'manual');

    expect($session->fresh()->meeting_url)->toBeNull();
});

it('mengisi recording_url hanya untuk sesi buatan agent', function () {
    $bootcamp = makeBootcamp(['auto_meeting_link' => true]);
    $agentSession = makeSession($bootcamp, '2026-11-08', attrs: ['meeting_url' => 'https://us06web.zoom.us/j/1', 'zoom_meeting_id' => '123456789']);
    $manualSession = makeSession($bootcamp, '2026-11-08', '13:00:00', '15:00:00');
    $writer = writerToken();

    agentPost('/api/v1/agent/update-recording-url', ['type' => 'bootcamp_session', 'id' => $agentSession->id, 'recording_url' => 'https://youtu.be/abc'], $writer, 'r1')
        ->assertOk()->assertJsonPath('status', 'updated');
    agentPost('/api/v1/agent/update-recording-url', ['type' => 'bootcamp_session', 'id' => $agentSession->id, 'recording_url' => 'https://youtu.be/lain'], $writer, 'r2')
        ->assertStatus(409);
    agentPost('/api/v1/agent/update-recording-url', ['type' => 'bootcamp_session', 'id' => $manualSession->id, 'recording_url' => 'https://youtu.be/abc'], $writer, 'r3')
        ->assertStatus(409)->assertJsonPath('status', 'manual');
    agentPost('/api/v1/agent/update-recording-url', ['type' => 'bootcamp_session', 'id' => $manualSession->id, 'recording_url' => 'https://drive.google.com/x'], $writer, 'r4')
        ->assertUnprocessable();
    agentPost('/api/v1/agent/update-recording-url', ['type' => 'webinar', 'id' => (string) Str::uuid(), 'recording_url' => 'https://youtu.be/abc'], $writer, 'r5')
        ->assertNotFound();

    expect($agentSession->fresh()->recording_url)->toBe('https://youtu.be/abc')
        ->and($manualSession->fresh()->recording_url)->toBeNull();
});

it('agent:token --write menambah ability tulis dan menolak nilai tak dikenal', function () {
    Artisan::call('agent:token', ['agent' => 'academic', '--write' => 'meeting,recording']);

    $user = User::where('email', 'agent-academic@agents.aksademy.local')->firstOrFail();
    expect($user->tokens()->first()->abilities)->toBe(['agent:read', 'agent:write-meeting', 'agent:write-recording']);

    expect(Artisan::call('agent:token', ['agent' => 'academic', '--write' => 'delete']))->toBe(1)
        ->and($user->tokens()->count())->toBe(1);
});

it('menyembunyikan link Zoom dari serialisasi model secara default', function () {
    $webinar = makeWebinar(['meeting_url' => 'https://us06web.zoom.us/j/1?pwd=rahasia', 'zoom_meeting_id' => '123456789']);
    $session = makeSession(makeBootcamp(), '2026-11-10', attrs: ['meeting_url' => 'https://us06web.zoom.us/j/2?pwd=rahasia']);

    expect($webinar->toArray())->not->toHaveKey('meeting_url')->not->toHaveKey('zoom_meeting_id')
        ->and($session->toArray())->not->toHaveKey('meeting_url')
        ->and($session->makeVisible('meeting_url')->toArray()['meeting_url'])->toContain('pwd=rahasia');
});

// --- Admin & peserta: link Zoom ----------------------------------------

function adminUser(): User
{
    \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'admin']);
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    return $admin;
}

it('admin menyalakan link otomatis dan mengisi/menghapus link Zoom per sesi', function () {
    $bootcamp = makeBootcamp();
    $session = makeSession($bootcamp, '2026-11-10');
    $this->actingAs(adminUser());

    $this->post(route('bootcamps.auto-meeting-link', $bootcamp->id), ['enabled' => true])->assertRedirect();
    expect($bootcamp->fresh()->auto_meeting_link)->toBeTrue();

    $this->post(route('bootcamps.meeting-link', [$bootcamp->id, $session->id]), [
        'meeting_url' => 'https://us06web.zoom.us/j/81234567890?pwd=abc',
    ])->assertRedirect()->assertSessionHasNoErrors();
    expect($session->fresh()->zoom_meeting_id)->toBe('81234567890');

    $this->post(route('bootcamps.meeting-link', [$bootcamp->id, $session->id]), ['meeting_url' => 'http://tidak-aman'])
        ->assertSessionHasErrors('meeting_url');

    $this->delete(route('bootcamps.meeting-link.remove', [$bootcamp->id, $session->id]))->assertRedirect();
    expect($session->fresh()->meeting_url)->toBeNull()->and($session->fresh()->zoom_meeting_id)->toBeNull();

    $webinar = makeWebinar();
    $this->post(route('webinars.meeting-link', $webinar->id), ['meeting_url' => 'https://us06web.zoom.us/j/123456789', 'zoom_meeting_id' => '123456789'])
        ->assertSessionHasNoErrors();
    expect($webinar->fresh()->meeting_url)->toBe('https://us06web.zoom.us/j/123456789');
});

it('bukan admin tidak bisa mengubah link Zoom', function () {
    $bootcamp = makeBootcamp();
    $session = makeSession($bootcamp, '2026-11-10');
    $this->actingAs(User::factory()->create());

    $this->post(route('bootcamps.meeting-link', [$bootcamp->id, $session->id]), ['meeting_url' => 'https://us06web.zoom.us/j/123456789'])
        ->assertForbidden();
    expect($session->fresh()->meeting_url)->toBeNull();
});

it('peserta aktif melihat link Zoom sesi, pengunjung halaman publik tidak', function () {
    $bootcamp = makeBootcamp();
    makeSession($bootcamp, '2026-11-10', attrs: ['meeting_url' => 'https://us06web.zoom.us/j/1?pwd=rahasia', 'zoom_meeting_id' => '123456789']);

    enroll('bootcamp', $bootcamp->id);
    $buyer = Invoice::latest('id')->first()->user;

    $this->actingAs($buyer)
        ->get(route('profile.bootcamp.detail', $bootcamp->slug))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('bootcamp.bootcamp_items.0.bootcamp.schedules.0.meeting_url', 'https://us06web.zoom.us/j/1?pwd=rahasia')
            ->missing('bootcamp.bootcamp_items.0.bootcamp.schedules.0.zoom_meeting_id'));

    // Halaman publik memuat jadwal (tanggal sesi ada), tapi tanpa link Zoom.
    $public = $this->get(route('bootcamp.detail', $bootcamp->slug))->assertOk();
    expect($public->getContent())->toContain('2026-11-10')->not->toContain('pwd=rahasia');
});

it('duplikat webinar tidak membawa link Zoom batch lama', function () {
    $webinar = makeWebinar(['meeting_url' => 'https://us06web.zoom.us/j/123456789', 'zoom_meeting_id' => '123456789']);
    $this->actingAs(adminUser());

    $this->post(route('webinars.duplicate', $webinar->id))->assertRedirect();

    $copy = Webinar::where('id', '!=', $webinar->id)->latest('created_at')->firstOrFail();
    expect($copy->meeting_url)->toBeNull()->and($copy->zoom_meeting_id)->toBeNull()
        ->and($webinar->fresh()->meeting_url)->not->toBeNull();
});

it('mengosongkan link Zoom bila jadwal produk otomatis digeser, bukan produk manual', function () {
    $zoom = ['meeting_url' => 'https://us06web.zoom.us/j/123456789', 'zoom_meeting_id' => '123456789'];
    $auto = makeSession(makeBootcamp(['auto_meeting_link' => true]), '2026-11-10', attrs: $zoom);
    $manual = makeSession(makeBootcamp(), '2026-11-10', attrs: $zoom);

    // Format beda ("09:00" vs "09:00:00") tapi waktu sama → link tetap.
    $auto->update(['start_time' => '09:00', 'schedule_date' => '2026-11-10']);
    expect($auto->fresh()->meeting_url)->not->toBeNull();

    $auto->update(['schedule_date' => '2026-11-12']);
    $manual->update(['schedule_date' => '2026-11-12']);
    expect($auto->fresh()->meeting_url)->toBeNull()->and($auto->fresh()->zoom_meeting_id)->toBeNull()
        ->and($manual->fresh()->meeting_url)->not->toBeNull();

    $webinar = makeWebinar(['auto_meeting_link' => true] + $zoom);
    $webinar->update(['start_time' => '2026-11-12T20:00']);
    expect($webinar->fresh()->meeting_url)->toBeNull();
});

it('menghitung pendapatan kemarin dan bulan ini sama dengan dashboard admin', function () {
    $pay = function (string $paidAt, int $nett, string $status = 'paid', array $extra = []) {
        return Invoice::create(array_merge([
            'user_id' => User::factory()->create()->id, 'amount' => $nett, 'nett_amount' => $nett,
            'status' => $status, 'invoice_code' => 'INV-'.Str::random(8), 'paid_at' => $paidAt,
        ], $extra));
    };

    $pay('2026-11-08 10:00:00', 100000);                       // kemarin
    $pay('2026-11-08 23:59:00', 50000);                        // kemarin
    $pay('2026-11-02 09:00:00', 200000);                       // awal bulan
    $pay('2026-10-31 20:00:00', 999000);                       // bulan lalu
    $pay('2026-11-08 12:00:00', 777000, 'pending');            // belum bayar
    $parent = $pay('2026-11-08 08:00:00', 300000, 'paid', ['is_installment' => true]); // induk cicilan: tidak dihitung
    $pay('2026-11-08 08:00:00', 150000, 'paid', ['is_installment' => true, 'parent_invoice_id' => $parent->id, 'installment_number' => 1]);

    $res = agentGet('/api/v1/agent/revenue-summary?date=2026-11-09', $this->token)->assertOk();

    expect($res->json('yesterday.amount'))->toBe(300000)
        ->and($res->json('month_to_date.amount'))->toBe(500000)
        ->and($res->json('month_to_date.from'))->toBe('2026-11-01');
});

it('menghitung pendaftar kemarin berbayar dan gratis per orang', function () {
    $user = fn () => User::factory()->create()->id;
    $inv = fn (array $a) => Invoice::create(array_merge(['amount' => 100000, 'nett_amount' => 100000, 'status' => 'paid',
        'invoice_code' => 'INV-'.Str::random(8), 'paid_at' => '2026-11-08 10:00:00'], $a));

    $budi = $user();
    $inv(['user_id' => $budi]);                                           // berbayar
    $inv(['user_id' => $budi]);                                           // orang sama, dihitung 1
    $inv(['user_id' => $user(), 'amount' => 0, 'nett_amount' => 0]);      // gratis
    $inv(['user_id' => $user(), 'amount' => 0, 'nett_amount' => 0]);      // gratis
    $inv(['user_id' => $user(), 'status' => 'pending']);                  // belum bayar
    $inv(['user_id' => $user(), 'paid_at' => '2026-11-07 10:00:00']);     // lusa
    $cicil = $user();
    $parent = $inv(['user_id' => $cicil, 'status' => 'installment_pending', 'is_installment' => true, 'paid_at' => null]);
    $inv(['user_id' => $cicil, 'is_installment' => true, 'parent_invoice_id' => $parent->id, 'installment_number' => 1]);

    $res = agentGet('/api/v1/agent/revenue-summary?date=2026-11-09', $this->token)->assertOk();

    expect($res->json('yesterday.registrations'))->toBe(['paid' => 2, 'free' => 2]);
});
