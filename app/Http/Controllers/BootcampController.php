<?php

namespace App\Http\Controllers;

use App\Models\Bootcamp;
use App\Models\BootcampSchedule;
use App\Models\Category;
use App\Models\Certificate;
use App\Models\Invoice;
use App\Models\Tool;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class BootcampController extends Controller
{
    public function index()
    {
        $user = User::find(Auth::user()->id);
        $isAffiliate = $user->hasRole('affiliate');

        if ($isAffiliate) {
            $bootcamps = Bootcamp::with(['category', 'user', 'schedules', 'certificate'])
                ->where('status', 'published')
                ->latest()
                ->get();
        } else {
            $bootcamps = Bootcamp::with(['category', 'user', 'schedules', 'certificate'])
                ->latest()
                ->get();
        }

        $totalBootcamps = $bootcamps->count();
        $publishedBootcamps = $bootcamps->where('status', 'published')->count();
        $draftBootcamps = $bootcamps->where('status', 'draft')->count();
        $archivedBootcamps = $bootcamps->where('status', 'archived')->count();

        $freeBootcamps = $bootcamps->where('price', 0)->count();
        $paidBootcamps = $bootcamps->where('price', '>', 0)->count();

        $now = Carbon::now();
        $completedBootcamps = $bootcamps->filter(function ($bootcamp) use ($now) {
            return $bootcamp->end_date && Carbon::parse($bootcamp->end_date)->isBefore($now);
        })->count();
        $ongoingBootcamps = $totalBootcamps - $completedBootcamps;

        $bootcampIds = $bootcamps->pluck('id');
        $totalEnrollments = Invoice::where('status', 'paid')
            ->whereHas('bootcampItems', function ($query) use ($bootcampIds) {
                $query->whereIn('bootcamp_id', $bootcampIds);
            })
            ->count();

        $totalRevenue = Invoice::where('status', 'paid')
            ->whereHas('bootcampItems', function ($query) use ($bootcampIds) {
                $query->whereIn('bootcamp_id', $bootcampIds);
            })
            ->sum('nett_amount');

        $statistics = [
            'overview' => [
                'total_bootcamps' => $totalBootcamps,
                'published_bootcamps' => $publishedBootcamps,
                'draft_bootcamps' => $draftBootcamps,
                'archived_bootcamps' => $archivedBootcamps,
            ],
            'pricing' => [
                'free_bootcamps' => $freeBootcamps,
                'paid_bootcamps' => $paidBootcamps,
            ],
            'completion' => [
                'completed' => $completedBootcamps,
                'ongoing' => $ongoingBootcamps,
            ],
            'performance' => [
                'total_enrollments' => $totalEnrollments,
                'total_revenue' => $totalRevenue,
            ],
        ];

        return Inertia::render('admin/bootcamps/index', [
            'bootcamps' => $bootcamps,
            'statistics' => $statistics,
        ]);
    }

    public function create()
    {
        $categories = Category::all();
        $tools = Tool::all();

        $mentors = User::role('mentor')->get(['id', 'name', 'bio', 'avatar']);

        return Inertia::render('admin/bootcamps/create', ['categories' => $categories, 'tools' => $tools, 'mentors' => $mentors]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'title' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'description' => 'nullable|string',
            'requirements' => 'nullable|string',
            'benefits' => 'nullable|string',
            'curriculum' => 'nullable|string',
            'thumbnail' => 'nullable|image|mimes:jpeg,jpg,png|max:2048',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'registration_deadline' => 'nullable|date',
            'strikethrough_price' => 'required|numeric|min:0',
            'price' => 'required|numeric|min:0',
            'quota' => 'required|integer|min:0',
            'batch' => 'nullable|string|max:255',
            'group_url' => 'nullable|string',
            'has_submission_link' => 'nullable|boolean',
            'tools' => 'nullable|array',
        ]);

        $data = $request->all();
        foreach (['start_date', 'end_date', 'registration_deadline'] as $field) {
            if (!empty($data[$field])) {
                $data[$field] = Carbon::parse($data[$field])
                    ->setTimezone(config('app.timezone'))
                    ->format('Y-m-d H:i:s');
            }
        }

        $slug = Str::slug($data['title']);
        if (!empty($data['batch'])) {
            $slug .= '-batch-' . $data['batch'];
        }
        $originalSlug = $slug;
        $counter = 1;
        while (Bootcamp::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $counter++;
        }
        $data['slug'] = $slug;

        if ($request->hasFile('thumbnail')) {
            $thumbnail = $request->file('thumbnail');
            $thumbnailPath = $thumbnail->store('thumbnails', 'public');
            $data['thumbnail'] = $thumbnailPath;
        } else {
            $data['thumbnail'] = null;
        }
        $data['bootcamp_url'] = url('/bootcamp/' . $slug);
        $data['registration_url'] = url('/bootcamp/' . $slug . '/register');
        $data['status'] = 'draft';

        $bootcamp = Bootcamp::create($data);

        $dayMap = [
            0 => 'minggu',
            1 => 'senin',
            2 => 'selasa',
            3 => 'rabu',
            4 => 'kamis',
            5 => 'jumat',
            6 => 'sabtu',
        ];

        foreach ((array) $request->input('schedules', []) as $row) {
            if (empty($row['schedule_date']) || empty($row['start_time']) || empty($row['end_time'])) {
                continue;
            }

            $date = Carbon::parse($row['schedule_date'])->toDateString();
            $dayEnum = $dayMap[Carbon::parse($date)->dayOfWeek];

            BootcampSchedule::create([
                'bootcamp_id'  => $bootcamp->id,
                'schedule_date' => $date,
                'day'          => $dayEnum,
                'start_time'   => $row['start_time'],
                'end_time'     => $row['end_time'],
            ]);
        }

        if ($request->has('tools') && is_array($request->tools)) {
            $bootcamp->tools()->sync($request->tools);
        }

        return redirect()->route('bootcamps.index')->with('success', 'Bootcamp berhasil dibuat.');
    }

    public function show(string $id)
    {
        $bootcamp = Bootcamp::with(['category', 'user', 'schedules', 'tools'])->findOrFail($id);

        $transactions = Invoice::with([
            'user',
            'referrer',
            'bootcampItems' => function ($query) use ($id) {
                $query->where('bootcamp_id', $id)
                    ->with('freeRequirement');
            }
        ])
            ->whereHas('bootcampItems', function ($query) use ($id) {
                $query->where('bootcamp_id', $id);
            })
            ->latest()
            ->get();

        $participants = Invoice::with([
            'user',
            'bootcampItems' => function ($query) use ($id) {
                $query->where('bootcamp_id', $id)
                    ->with([
                        'attendances.bootcampSchedule' => function ($scheduleQuery) {
                            $scheduleQuery->orderBy('schedule_date');
                        }
                    ]);
            }
        ])
            ->where('status', 'paid')
            ->whereHas('bootcampItems', function ($query) use ($id) {
                $query->where('bootcamp_id', $id);
            })
            ->latest()
            ->get()
            ->map(function ($invoice) {
                return [
                    'id' => $invoice->id,
                    'user' => [
                        'id' => $invoice->user->id,
                        'name' => $invoice->user->name,
                        'email' => $invoice->user->email,
                        'phone_number' => $invoice->user->phone_number,
                    ],
                    'bootcamp_item' => [
                        'id' => $invoice->bootcampItems[0]->id,
                        'bootcamp_id' => $invoice->bootcampItems[0]->bootcamp_id,
                        'submission_link' => $invoice->bootcampItems[0]->submission_link,
                        'progress' => $invoice->bootcampItems[0]->progress,
                        'completed_at' => $invoice->bootcampItems[0]->completed_at,
                        'attendances' => $invoice->bootcampItems[0]->attendances->map(function ($attendance) {
                            return [
                                'id' => $attendance->id,
                                'enrollment_bootcamp_id' => $attendance->enrollment_bootcamp_id,
                                'bootcamp_schedule_id' => $attendance->bootcamp_schedule_id,
                                'attendance_proof' => $attendance->attendance_proof,
                                'verified' => $attendance->verified,
                                'notes' => $attendance->notes,
                                'created_at' => $attendance->created_at,
                                'bootcamp_schedule' => [
                                    'id' => $attendance->bootcampSchedule->id,
                                    'schedule_date' => $attendance->bootcampSchedule->schedule_date,
                                    'day' => $attendance->bootcampSchedule->day,
                                    'start_time' => $attendance->bootcampSchedule->start_time,
                                    'end_time' => $attendance->bootcampSchedule->end_time,
                                ],
                            ];
                        }),
                    ],
                ];
            });

        $ratings = $transactions->flatMap(function ($invoice) {
            return $invoice->bootcampItems->map(function ($item) use ($invoice) {
                if ($item->rating && $item->review) {
                    return [
                        'id' => $item->id,
                        'user' => [
                            'id' => $invoice->user->id,
                            'name' => $invoice->user->name,
                        ],
                        'rating' => $item->rating,
                        'review' => $item->review,
                        'created_at' => $item->reviewed_at ?? $item->updated_at,
                    ];
                }
                return null;
            })->filter();
        })->values();

        $averageRating = $ratings->avg('rating') ?? 0;

        $certificate = Certificate::where('bootcamp_id', $id)->first();

        return Inertia::render('admin/bootcamps/show', [
            'bootcamp' => $bootcamp,
            'transactions' => $transactions,
            'participants' => $participants,
            'ratings' => $ratings,
            'averageRating' => round($averageRating, 1),
            'certificate' => $certificate
        ]);
    }

    public function edit(string $id)
    {
        $bootcamp = Bootcamp::with(['schedules', 'tools'])->findOrFail($id);
        $categories = Category::all();
        $tools = Tool::all();

        $mentors = User::role('mentor')->get(['id', 'name', 'bio', 'avatar']);

        return Inertia::render('admin/bootcamps/edit', ['bootcamp' => $bootcamp, 'categories' => $categories, 'tools' => $tools, 'mentors' => $mentors]);
    }

    public function update(Request $request, string $id)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'title' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'description' => 'nullable|string',
            'requirements' => 'nullable|string',
            'benefits' => 'nullable|string',
            'curriculum' => 'nullable|string',
            'thumbnail' => 'nullable|image|mimes:jpeg,jpg,png|max:2048',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'registration_deadline' => 'nullable|date',
            'strikethrough_price' => 'required|numeric|min:0',
            'price' => 'required|numeric|min:0',
            'quota' => 'required|integer|min:0',
            'batch' => 'nullable|string|max:255',
            'group_url' => 'nullable|string',
            'has_submission_link' => 'nullable|boolean',
            'tools' => 'nullable|array',
        ]);

        $bootcamp = Bootcamp::findOrFail($id);
        $data = $request->all();

        foreach (['start_date', 'end_date', 'registration_deadline'] as $field) {
            if (!empty($data[$field])) {
                $data[$field] = Carbon::parse($data[$field])
                    ->setTimezone(config('app.timezone'))
                    ->format('Y-m-d H:i:s');
            }
        }

        $slug = Str::slug($data['title']);
        if (!empty($data['batch'])) {
            $slug .= '-batch-' . $data['batch'];
        }
        $originalSlug = $slug;
        $counter = 1;
        while (Bootcamp::where('slug', $slug)->where('id', '!=', $bootcamp->id)->exists()) {
            $slug = $originalSlug . '-' . $counter++;
        }
        $data['slug'] = $slug;

        if ($request->hasFile('thumbnail')) {
            if ($bootcamp->thumbnail) {
                Storage::disk('public')->delete($bootcamp->thumbnail);
            }
            $thumbnail = $request->file('thumbnail');
            $thumbnailPath = $thumbnail->store('thumbnails', 'public');
            $data['thumbnail'] = $thumbnailPath;
        } else {
            unset($data['thumbnail']);
        }

        $data['bootcamp_url'] = url('/bootcamp/' . $slug);
        $data['registration_url'] = url('/bootcamp/' . $slug . '/register');

        $bootcamp->update($data);

        if ($request->has('schedules') && is_array($request->schedules)) {
            $dayMap = [
                0 => 'minggu',
                1 => 'senin',
                2 => 'selasa',
                3 => 'rabu',
                4 => 'kamis',
                5 => 'jumat',
                6 => 'sabtu',
            ];

            $incomingSchedules = collect($request->schedules)
                ->filter(function ($scheduleData) {
                    return !empty($scheduleData['schedule_date']) && !empty($scheduleData['start_time']) && !empty($scheduleData['end_time']);
                })
                ->values();

            $hasIds = $incomingSchedules->contains(function ($scheduleData) {
                return !empty($scheduleData['id']);
            });

            // New path: update by schedule id (prevents duplicates when date/time changes)
            if ($hasIds) {
                $existingById = $bootcamp->schedules()->get()->keyBy('id');
                $processedIds = [];
                $skippedDeletes = 0;

                foreach ($incomingSchedules as $scheduleData) {
                    $date = Carbon::parse($scheduleData['schedule_date'])->toDateString();
                    $dayEnum = $dayMap[Carbon::parse($date)->dayOfWeek];
                    $payload = [
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
                        $created = $bootcamp->schedules()->create($payload);
                        $processedIds[] = $created->id;
                    }
                }

                $toDelete = $bootcamp->schedules()->whereNotIn('id', $processedIds)->get();
                foreach ($toDelete as $schedule) {
                    if ($schedule->attendances()->exists()) {
                        $skippedDeletes++;
                        continue;
                    }
                    $schedule->delete();
                }

                if ($skippedDeletes > 0) {
                    session()->flash('warning', 'Sebagian jadwal tidak dihapus karena sudah memiliki data absensi.');
                }
            } else {
                // Backward-compatible path: match by composite key
                $existingSchedules = $bootcamp->schedules()->get()->keyBy(function ($schedule) {
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
                        if ($existingSchedule->day !== $dayEnum) {
                            $existingSchedule->update(['day' => $dayEnum]);
                        }
                    } else {
                        $bootcamp->schedules()->create([
                            'schedule_date' => $date,
                            'day' => $dayEnum,
                            'start_time' => $startTime,
                            'end_time' => $endTime,
                        ]);
                    }
                }

                $schedulesToDelete = $existingSchedules->reject(function ($schedule) use ($processedKeys) {
                    $scheduleKey = $schedule->schedule_date . '|' . $schedule->start_time . '|' . $schedule->end_time;
                    return in_array($scheduleKey, $processedKeys);
                });

                foreach ($schedulesToDelete as $schedule) {
                    if (!$schedule->attendances()->exists()) {
                        $schedule->delete();
                    }
                }
            }
        }

        if ($request->has('tools') && is_array($request->tools)) {
            $bootcamp->tools()->sync($request->tools);
        }

        return redirect()->route('bootcamps.show', $bootcamp->id)->with('success', 'Bootcamp berhasil diperbarui.');
    }

    public function destroy(string $id)
    {
        $bootcamp = Bootcamp::findOrFail($id);
        $bootcamp->delete();
        return redirect()->route('bootcamps.index')->with('success', 'Bootcamp berhasil dihapus.');
    }

    public function duplicate(string $id)
    {
        $bootcamp = Bootcamp::findOrFail($id);

        $newBootcamp = $bootcamp->replicate();

        if ($bootcamp->thumbnail && Storage::disk('public')->exists($bootcamp->thumbnail)) {
            $originalPath = $bootcamp->thumbnail;
            $extension = pathinfo($originalPath, PATHINFO_EXTENSION);
            $newFileName = 'thumbnails/' . uniqid('copy_') . '.' . $extension;
            Storage::disk('public')->copy($originalPath, $newFileName);
            $newBootcamp->thumbnail = $newFileName;
        } else {
            $newBootcamp->thumbnail = null;
        }

        $slug = Str::slug($newBootcamp->title);
        if (!empty($newBootcamp->batch)) {
            $slug .= '-batch-' . $newBootcamp->batch;
        }
        $originalSlug = $slug;
        $counter = 1;
        while (Bootcamp::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $counter++;
        }
        $newBootcamp->slug = $slug;
        $newBootcamp->status = 'draft';
        $newBootcamp->bootcamp_url = url('/bootcamp/' . $slug);
        $newBootcamp->registration_url = url('/bootcamp/' . $slug . '/register');
        $newBootcamp->save();

        foreach ($bootcamp->schedules as $schedule) {
            $newBootcamp->schedules()->create([
                'schedule_date' => $schedule->schedule_date,
                'day' => $schedule->day,
                'start_time' => $schedule->start_time,
                'end_time' => $schedule->end_time,
            ]);
        }

        if ($bootcamp->tools && $bootcamp->tools->count() > 0) {
            $newBootcamp->tools()->sync($bootcamp->tools->pluck('id')->toArray());
        }

        return redirect()->route('bootcamps.show', $newBootcamp->id)
            ->with('success', 'Bootcamp berhasil diduplikasi. Silakan edit sebelum dipublikasikan.');
    }

    public function publish(string $id)
    {
        $bootcamp = Bootcamp::findOrFail($id);
        $bootcamp->status = 'published';
        $bootcamp->save();

        return back()->with('success', 'Bootcamp berhasil dipublikasikan.');
    }

    public function archive(string $id)
    {
        $bootcamp = Bootcamp::findOrFail($id);
        $bootcamp->status = 'archived';
        $bootcamp->save();

        return back()->with('success', 'Bootcamp berhasil ditutup.');
    }

    public function addScheduleRecording(Request $request, string $bootcampId, string $scheduleId)
    {
        $request->validate([
            'recording_url' => 'required|url|max:255',
        ]);

        $bootcamp = Bootcamp::findOrFail($bootcampId);
        $schedule = BootcampSchedule::where('bootcamp_id', $bootcamp->id)
            ->where('id', $scheduleId)
            ->firstOrFail();

        $schedule->recording_url = $request->recording_url;
        $schedule->save();

        return back()->with('success', 'Link rekaman berhasil diperbarui untuk jadwal ini.');
    }

    public function removeScheduleRecording(string $bootcampId, string $scheduleId)
    {
        $bootcamp = Bootcamp::findOrFail($bootcampId);
        $schedule = BootcampSchedule::where('bootcamp_id', $bootcamp->id)
            ->where('id', $scheduleId)
            ->firstOrFail();

        if (!$schedule->recording_url) {
            return back()->with('error', 'Tidak ada link rekaman untuk dihapus pada jadwal ini.');
        }

        $schedule->recording_url = null;
        $schedule->save();

        return back()->with('success', 'Link rekaman berhasil dihapus dari jadwal ini.');
    }
}
