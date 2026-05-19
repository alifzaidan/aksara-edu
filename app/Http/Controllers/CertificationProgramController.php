<?php

namespace App\Http\Controllers;

use App\Models\CertificationProgram;
use App\Models\CertificationProgramApplication;
use App\Models\CertificationProgramScholarshipApplication;
use App\Models\Category;
use App\Models\User;
use App\Traits\WablasTrait;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class CertificationProgramController extends Controller
{
    use WablasTrait;

    public function index(Request $request)
    {
        $programs = CertificationProgram::with(['category', 'mentors', 'schedules'])
            ->latest()
            ->get();

        $statistics = [
            'total_programs' => $programs->count(),
            'published_programs' => $programs->where('status', 'published')->count(),
            'draft_programs' => $programs->where('status', 'draft')->count(),
            'archived_programs' => $programs->where('status', 'archived')->count(),
            'regular_programs' => $programs->where('type', 'regular')->count(),
            'scholarship_programs' => $programs->where('type', 'scholarship')->count(),
        ];

        return Inertia::render('admin/certification-programs/index', [
            'programs' => $programs,
            'statistics' => $statistics,
        ]);
    }

    public function create(Request $request)
    {
        $type = $request->query('type', 'regular');

        $categories = Category::all();
        $mentors = User::role('mentor')->get(['id', 'name', 'bio', 'avatar']);

        $view = $type === 'scholarship'
            ? 'admin/certification-programs/create-scholarship'
            : 'admin/certification-programs/create-regular';

        return Inertia::render($view, [
            'categories' => $categories,
            'mentors' => $mentors,
        ]);
    }

    public function store(Request $request)
    {
        $type = $request->input('type', 'regular');

        $rules = [
            'mentor_ids' => 'required|array|min:1',
            'mentor_ids.*' => 'required|exists:users,id',
            'title' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'short_description' => 'nullable|string|max:500',
            'description' => 'nullable|string',
            'batch' => 'nullable|string|max:255',
            'benefits' => 'nullable|string',
            'terms_conditions' => 'nullable|string',
            'thumbnail' => 'nullable|image|mimes:jpeg,jpg,png,webp|max:2048',
            'document_required' => 'nullable|boolean',
            'document_description' => 'nullable|string',
            'strikethrough_price' => 'required|numeric|min:0',
            'price' => 'nullable|numeric|min:0',
            'scholarship_price' => 'nullable|numeric|min:0',
            'registration_deadline' => 'nullable|date',
            'socialization_registration_deadline' => 'nullable|date',
            'group_url' => 'nullable|string',
            'socialization_group_url' => 'nullable|string',
            'type' => 'required|in:regular,scholarship',
        ];

        if ($type === 'scholarship') {
            $rules['scholarship_flow'] = 'nullable|string';
        }

        $request->validate($rules);

        $data = $request->except(['schedules', 'socialization_schedules', 'mentor_ids']);

        foreach (['registration_deadline', 'socialization_registration_deadline'] as $field) {
            if (!empty($data[$field])) {
                $data[$field] = Carbon::parse($data[$field])
                    ->setTimezone(config('app.timezone'))
                    ->format('Y-m-d H:i:s');
            }
        }

        $slug = $this->buildSlug($data['title'], $data['batch'] ?? null);
        $data['slug'] = $slug;

        if ($request->hasFile('thumbnail')) {
            $thumbnailPath = $request->file('thumbnail')->store('certification-programs/thumbnails', 'public');
            $data['thumbnail'] = $thumbnailPath;
        } else {
            $data['thumbnail'] = null;
        }

        if ($type === 'scholarship') {
            $data['price'] = 0;
        }

        $data['program_url'] = url('/certification-programs/' . $slug);
        $data['registration_url'] = url('/certification-programs/' . $slug . '/register');
        $data['status'] = 'draft';

        $program = CertificationProgram::create($data);

        $this->syncSchedules($program, (array) $request->input('schedules', []), 'schedules');
        $this->syncSchedules($program, (array) $request->input('socialization_schedules', []), 'socializationSchedules');

        $mentorIds = collect($request->input('mentor_ids', []))
            ->filter()
            ->unique()
            ->values()
            ->all();
        $program->mentors()->sync($mentorIds);

        return redirect()->route('certification-programs.show', $program->id)
            ->with('success', 'Sertifikasi program berhasil dibuat.');
    }

    public function show(string $id)
    {
        $program = CertificationProgram::with(['category', 'mentors', 'schedules', 'socializationSchedules'])->findOrFail($id);

        $applications = [];
        if ($program->type === 'scholarship') {
            $applications = CertificationProgramScholarshipApplication::where('certification_program_id', $program->id)
                ->latest()
                ->get();
        } else {
            $applications = CertificationProgramApplication::with('user')
                ->where('certification_program_id', $program->id)
                ->latest()
                ->get();
        }

        return Inertia::render('admin/certification-programs/show', [
            'program' => $program,
            'applications' => $applications,
        ]);
    }

    public function edit(string $id)
    {
        $program = CertificationProgram::with(['category', 'mentors', 'schedules', 'socializationSchedules'])->findOrFail($id);
        $categories = Category::all();
        $mentors = User::role('mentor')->get(['id', 'name', 'bio', 'avatar']);

        $view = $program->type === 'scholarship'
            ? 'admin/certification-programs/edit-scholarship'
            : 'admin/certification-programs/edit-regular';

        return Inertia::render($view, [
            'program' => $program,
            'categories' => $categories,
            'mentors' => $mentors,
        ]);
    }

    public function update(Request $request, string $id)
    {
        $program = CertificationProgram::findOrFail($id);
        $type = $program->type;

        $rules = [
            'mentor_ids' => 'required|array|min:1',
            'mentor_ids.*' => 'required|exists:users,id',
            'title' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'short_description' => 'nullable|string|max:500',
            'description' => 'nullable|string',
            'batch' => 'nullable|string|max:255',
            'benefits' => 'nullable|string',
            'terms_conditions' => 'nullable|string',
            'thumbnail' => 'nullable|image|mimes:jpeg,jpg,png,webp|max:2048',
            'document_required' => 'nullable|boolean',
            'document_description' => 'nullable|string',
            'strikethrough_price' => 'required|numeric|min:0',
            'price' => 'nullable|numeric|min:0',
            'scholarship_price' => 'nullable|numeric|min:0',
            'registration_deadline' => 'nullable|date',
            'socialization_registration_deadline' => 'nullable|date',
            'group_url' => 'nullable|string',
            'socialization_group_url' => 'nullable|string',
        ];

        if ($type === 'scholarship') {
            $rules['scholarship_flow'] = 'nullable|string';
        }

        $request->validate($rules);

        $data = $request->except(['schedules', 'socialization_schedules', 'mentor_ids']);

        foreach (['registration_deadline', 'socialization_registration_deadline'] as $field) {
            if (!empty($data[$field])) {
                $data[$field] = Carbon::parse($data[$field])
                    ->setTimezone(config('app.timezone'))
                    ->format('Y-m-d H:i:s');
            }
        }

        $slug = $this->buildSlug($data['title'], $data['batch'] ?? null, $program->id);
        $data['slug'] = $slug;

        if ($request->hasFile('thumbnail')) {
            if ($program->thumbnail) {
                Storage::disk('public')->delete($program->thumbnail);
            }
            $data['thumbnail'] = $request->file('thumbnail')->store('certification-programs/thumbnails', 'public');
        } else {
            unset($data['thumbnail']);
        }

        if ($type === 'scholarship') {
            $data['price'] = 0;
        }

        $data['program_url'] = url('/certification-programs/' . $slug);
        $data['registration_url'] = url('/certification-programs/' . $slug . '/register');

        $program->update($data);

        $this->syncSchedules($program, (array) $request->input('schedules', []), 'schedules');
        $this->syncSchedules($program, (array) $request->input('socialization_schedules', []), 'socializationSchedules');

        $mentorIds = collect($request->input('mentor_ids', []))
            ->filter()
            ->unique()
            ->values()
            ->all();
        $program->mentors()->sync($mentorIds);

        return redirect()->route('certification-programs.show', $program->id)
            ->with('success', 'Sertifikasi program berhasil diperbarui.');
    }

    public function destroy(string $id)
    {
        $program = CertificationProgram::findOrFail($id);
        if ($program->thumbnail) {
            Storage::disk('public')->delete($program->thumbnail);
        }

        $program->delete();

        return redirect()->route('certification-programs.index')->with('success', 'Sertifikasi program berhasil dihapus.');
    }

    public function publish(string $id)
    {
        $program = CertificationProgram::findOrFail($id);
        $program->status = 'published';
        $program->save();

        return back()->with('success', 'Sertifikasi program berhasil dipublikasikan.');
    }

    public function archive(string $id)
    {
        $program = CertificationProgram::findOrFail($id);
        $program->status = 'archived';
        $program->save();

        return back()->with('success', 'Sertifikasi program berhasil diarsipkan.');
    }

    public function hidden(string $id)
    {
        $program = CertificationProgram::findOrFail($id);
        $program->status = 'hidden';
        $program->save();

        return back()->with('success', 'Sertifikasi program berhasil disembunyikan.');
    }

    public function addScheduleRecording(Request $request, string $programId, string $scheduleId)
    {
        $request->validate([
            'recording_url' => 'required|url|max:255',
        ]);

        $program = CertificationProgram::findOrFail($programId);
        $schedule = $program->schedules()->where('id', $scheduleId)->firstOrFail();

        $schedule->recording_url = $request->recording_url;
        $schedule->save();

        return back()->with('success', 'Link rekaman berhasil diperbarui untuk jadwal ini.');
    }

    public function removeScheduleRecording(string $programId, string $scheduleId)
    {
        $program = CertificationProgram::findOrFail($programId);
        $schedule = $program->schedules()->where('id', $scheduleId)->firstOrFail();

        $schedule->recording_url = null;
        $schedule->save();

        return back()->with('success', 'Link rekaman berhasil dihapus dari jadwal ini.');
    }

    public function addSocializationRecording(Request $request, string $programId, string $scheduleId)
    {
        $request->validate([
            'recording_url' => 'required|url|max:255',
        ]);

        $program = CertificationProgram::findOrFail($programId);
        $schedule = $program->socializationSchedules()->where('id', $scheduleId)->firstOrFail();

        $schedule->recording_url = $request->recording_url;
        $schedule->save();

        return back()->with('success', 'Link rekaman berhasil diperbarui untuk jadwal sosialisasi ini.');
    }

    public function removeSocializationRecording(string $programId, string $scheduleId)
    {
        $program = CertificationProgram::findOrFail($programId);
        $schedule = $program->socializationSchedules()->where('id', $scheduleId)->firstOrFail();

        $schedule->recording_url = null;
        $schedule->save();

        return back()->with('success', 'Link rekaman berhasil dihapus dari jadwal sosialisasi ini.');
    }

    public function approveApplication(string $programId, string $applicationId)
    {
        $program = CertificationProgram::findOrFail($programId);
        $application = CertificationProgramApplication::with('user')
            ->where('certification_program_id', $programId)
            ->where('id', $applicationId)
            ->firstOrFail();

        if ($application->status === 'approved') {
            return back()->with('success', 'Pendaftaran ini sudah disetujui sebelumnya.');
        }

        $application->update([
            'status' => 'approved',
            'approved_at' => now(),
            'rejected_at' => null,
        ]);

        if ($application->user?->phone_number) {
            $phoneNumber = $this->formatPhoneNumber($application->user->phone_number);
            $message = "*[Aksademy - Pendaftaran Sertifikasi Disetujui]* 🎉\n\n";
            $message .= "Halo *{$application->user->name}*,\n\n";
            $message .= "Selamat! Pendaftaran Anda untuk program *{$program->title}* telah kami setujui.\n\n";
            $message .= "Langkah selanjutnya:\n";
            $message .= "1. Selesaikan pembayaran melalui link berikut:\n";
            $message .= "{$program->registration_url}\n";
            if (!empty($program->socialization_group_url)) {
                $message .= "2. Bergabung ke grup sosialisasi agar tidak ketinggalan info penting:\n";
                $message .= "{$program->socialization_group_url}\n";
            }
            $message .= "\nJika sudah selesai, silakan lanjutkan ke tahap berikutnya sesuai instruksi.\n\n";
            $message .= "Terima kasih dan selamat bergabung! 🚀\n\n";
            $message .= "*Araska - Customer Support*";

            self::sendText([
                [
                    'phone' => $phoneNumber,
                    'message' => $message,
                    'isGroup' => 'false',
                ]
            ]);
        }

        return back()->with('success', 'Pendaftaran berhasil disetujui.');
    }

    public function rejectApplication(Request $request, string $programId, string $applicationId)
    {
        $program = CertificationProgram::findOrFail($programId);
        $application = CertificationProgramApplication::with('user')
            ->where('certification_program_id', $programId)
            ->where('id', $applicationId)
            ->firstOrFail();

        if ($application->status === 'rejected') {
            return back()->with('success', 'Pendaftaran ini sudah ditolak sebelumnya.');
        }

        $application->update([
            'status' => 'rejected',
            'rejected_at' => now(),
            'approved_at' => null,
            'notes' => $request->input('notes'),
        ]);

        if ($application->user?->phone_number) {
            $phoneNumber = $this->formatPhoneNumber($application->user->phone_number);
            $message = "*[Aksademy - Pendaftaran Sertifikasi Ditolak]*\n\n";
            $message .= "Hai *{$application->user->name}*,\n\n";
            $message .= "Mohon maaf, pendaftaran Sertifikasi *{$program->title}* Anda belum dapat kami terima.\n\n";
            $message .= "Terima kasih atas ketertarikannya.\n\n";
            $message .= "*Araska - Customer Support*";

            self::sendText([
                [
                    'phone' => $phoneNumber,
                    'message' => $message,
                    'isGroup' => 'false',
                ]
            ]);
        }

        return back()->with('success', 'Pendaftaran berhasil ditolak.');
    }

    public function approveScholarshipApplication(string $programId, string $applicationId)
    {
        $program = CertificationProgram::findOrFail($programId);
        $application = CertificationProgramScholarshipApplication::where('certification_program_id', $programId)
            ->where('id', $applicationId)
            ->firstOrFail();

        if ($application->status === 'approved') {
            return back()->with('success', 'Pendaftaran beasiswa ini sudah disetujui sebelumnya.');
        }

        $application->update([
            'status' => 'approved',
            'approved_at' => now(),
            'rejected_at' => null,
        ]);

        if (!empty($application->phone)) {
            $phoneNumber = $this->formatPhoneNumber($application->phone);
            $paymentUrl = url('/certification-programs/' . $program->slug . '/register?scholarship=1');

            $message = "*[Aksademy - Pengumuman Beasiswa]* 🎉\n\n";
            $message .= "Hai Kak *{$application->name}*,\n\n";
            $message .= "Selamat! Anda dinyatakan *LOLOS* sebagai penerima Beasiswa *{$program->title}*.\n\n";
            $message .= "Silakan lanjutkan dengan langkah berikut:\n";
            $message .= "1. Selesaikan pembayaran melalui link berikut:\n";
            $message .= "{$paymentUrl}\n";
            if (!empty($program->socialization_group_url)) {
                $message .= "2. Bergabung ke grup sosialisasi agar update informasi lebih cepat diterima:\n";
                $message .= "{$program->socialization_group_url}\n";
            }
            $message .= "\nTerima kasih dan selamat bergabung! 🚀\n\n";
            $message .= "*Araska - Customer Support*";

            self::sendText([
                [
                    'phone' => $phoneNumber,
                    'message' => $message,
                    'isGroup' => 'false',
                ]
            ]);
        }

        return back()->with('success', 'Pendaftaran beasiswa berhasil disetujui.');
    }

    public function rejectScholarshipApplication(Request $request, string $programId, string $applicationId)
    {
        $program = CertificationProgram::findOrFail($programId);
        $application = CertificationProgramScholarshipApplication::where('certification_program_id', $programId)
            ->where('id', $applicationId)
            ->firstOrFail();

        if ($application->status === 'rejected') {
            return back()->with('success', 'Pendaftaran beasiswa ini sudah ditolak sebelumnya.');
        }

        $application->update([
            'status' => 'rejected',
            'rejected_at' => now(),
            'approved_at' => null,
        ]);

        if (!empty($application->phone)) {
            $phoneNumber = $this->formatPhoneNumber($application->phone);

            $message = "*[Aksademy - Pengumuman Beasiswa]*\n\n";
            $message .= "Hai Kak *{$application->name}*,\n\n";
            $message .= "Mohon maaf, Anda belum lolos sebagai penerima Beasiswa *{$program->title}*.\n\n";
            $message .= "Terima kasih atas partisipasi dan ketertarikannya pada program ini.\n\n";
            $message .= "*Araska - Customer Support*";

            self::sendText([
                [
                    'phone' => $phoneNumber,
                    'message' => $message,
                    'isGroup' => 'false',
                ]
            ]);
        }

        return back()->with('success', 'Pendaftaran beasiswa berhasil ditolak.');
    }

    private function buildSlug(string $title, ?string $batch = null, ?string $ignoreId = null): string
    {
        $slug = Str::slug($title);
        if (!empty($batch)) {
            $slug .= '-batch-' . $batch;
        }

        $originalSlug = $slug;
        $counter = 1;

        while (CertificationProgram::when($ignoreId, function ($q) use ($ignoreId) {
            $q->where('id', '!=', $ignoreId);
        })->where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $counter++;
        }

        return $slug;
    }

    private function syncSchedules(CertificationProgram $program, array $schedules, string $relationName): void
    {
        $dayMap = [
            0 => 'minggu',
            1 => 'senin',
            2 => 'selasa',
            3 => 'rabu',
            4 => 'kamis',
            5 => 'jumat',
            6 => 'sabtu',
        ];

        $incomingSchedules = collect($schedules)
            ->filter(function ($scheduleData) {
                return !empty($scheduleData['schedule_date']) && !empty($scheduleData['start_time']) && !empty($scheduleData['end_time']);
            })
            ->values();

        $relation = $program->{$relationName}();
        $hasIds = $incomingSchedules->contains(function ($scheduleData) {
            return !empty($scheduleData['id']);
        });

        if ($hasIds) {
            $existingById = $relation->get()->keyBy('id');
            $processedIds = [];

            foreach ($incomingSchedules as $scheduleData) {
                $date = Carbon::parse($scheduleData['schedule_date'])->toDateString();
                $dayEnum = $dayMap[Carbon::parse($date)->dayOfWeek];
                $payload = [
                    'title' => $scheduleData['title'] ?? null,
                    'schedule_date' => $date,
                    'day' => $dayEnum,
                    'start_time' => $scheduleData['start_time'],
                    'end_time' => $scheduleData['end_time'],
                ];

                if (!empty($scheduleData['id']) && $existingById->has($scheduleData['id'])) {
                    $existingSchedule = $existingById->get($scheduleData['id']);
                    $existingSchedule->update($payload);
                    $processedIds[] = $existingSchedule->id;
                } else {
                    $created = $relation->create($payload);
                    $processedIds[] = $created->id;
                }
            }

            $relation->whereNotIn('id', $processedIds)->delete();
            return;
        }

        $existingSchedules = $relation->get()->keyBy(function ($schedule) {
            return $schedule->schedule_date . '|' . $schedule->start_time . '|' . $schedule->end_time;
        });

        $processedKeys = [];

        foreach ($incomingSchedules as $scheduleData) {
            $date = Carbon::parse($scheduleData['schedule_date'])->toDateString();
            $dayEnum = $dayMap[Carbon::parse($date)->dayOfWeek];
            $startTime = $scheduleData['start_time'];
            $endTime = $scheduleData['end_time'];

            $scheduleKey = $date . '|' . $startTime . '|' . $endTime;
            $processedKeys[] = $scheduleKey;

            if ($existingSchedules->has($scheduleKey)) {
                $existingSchedule = $existingSchedules->get($scheduleKey);
                $existingSchedule->update([
                    'title' => $scheduleData['title'] ?? null,
                    'day' => $dayEnum,
                ]);
            } else {
                $relation->create([
                    'title' => $scheduleData['title'] ?? null,
                    'schedule_date' => $date,
                    'day' => $dayEnum,
                    'start_time' => $startTime,
                    'end_time' => $endTime,
                ]);
            }
        }

        $schedulesToDelete = $existingSchedules->reject(function ($schedule) use ($processedKeys) {
            $scheduleKey = $schedule->schedule_date . '|' . $schedule->start_time . '|' . $schedule->end_time;
            return in_array($scheduleKey, $processedKeys, true);
        });

        foreach ($schedulesToDelete as $schedule) {
            $schedule->delete();
        }
    }

    private function formatPhoneNumber(string $phoneNumber): string
    {
        $phoneNumber = preg_replace('/[^0-9]/', '', $phoneNumber);

        if (str_starts_with($phoneNumber, '0')) {
            return '62' . substr($phoneNumber, 1);
        }

        if (str_starts_with($phoneNumber, '62')) {
            return $phoneNumber;
        }

        if (str_starts_with($phoneNumber, '8')) {
            return '62' . $phoneNumber;
        }

        return $phoneNumber;
    }
}
