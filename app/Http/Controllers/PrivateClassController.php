<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Invoice;
use App\Models\PrivateClass;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class PrivateClassController extends Controller
{
    public function index(Request $request)
    {
        $user = User::find(Auth::id());
        $isAffiliate = $user && $user->hasRole('affiliate');

        $query = PrivateClass::with(['category', 'user', 'schedules'])->latest();
        if ($isAffiliate) {
            $query->where('status', 'published');
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('category', function ($cq) use ($search) {
                        $cq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $baseStats = PrivateClass::query();
        if ($isAffiliate) {
            $baseStats->where('status', 'published');
        }

        $total = (clone $baseStats)->count();
        $published = (clone $baseStats)->where('status', 'published')->count();
        $draft = (clone $baseStats)->where('status', 'draft')->count();
        $archived = (clone $baseStats)->where('status', 'archived')->count();

        $totalParticipants = Invoice::where('status', 'paid')
            ->whereHas('privateItems')
            ->count();

        $user = Auth::user();
        $isStaff = $user && $user->hasRole('staff') && !$user->hasRole('admin');

        $totalRevenue = $isStaff
            ? 0
            : Invoice::where('status', 'paid')
                ->whereHas('privateItems')
                ->sum('nett_amount');

        $perPage = min(100, max(5, (int) $request->input('per_page', 10)));
        $privateClasses = $query->paginate($perPage)->withQueryString();

        return Inertia::render('admin/privates/index', [
            'privateClasses' => $privateClasses,
            'statistics' => [
                'total' => $total,
                'published' => $published,
                'draft' => $draft,
                'archived' => $archived,
                'participants' => $totalParticipants,
                'revenue' => $totalRevenue,
            ],
            'filters' => [
                'search' => $request->input('search'),
                'per_page' => $perPage,
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('admin/privates/create', [
            'categories' => Category::all(['id', 'name']),
            'mentors' => User::role('mentor')->get(['id', 'name', 'email']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'category_id' => 'required|exists:categories,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'requirements' => 'nullable|string',
            'benefits' => 'nullable|string',
            'curriculum' => 'nullable|string',
            'thumbnail' => 'nullable|image|mimes:jpeg,jpg,png|max:2048',
            'mode' => 'required|in:online,offline',
            'location' => 'nullable|string|max:255',
            'registration_deadline' => 'nullable|date',
            'strikethrough_price' => 'required|numeric|min:0',
            'price' => 'required|numeric|min:0',
            'group_url' => 'nullable|string',
            'requirement_1' => 'nullable|string',
            'requirement_2' => 'nullable|string',
            'requirement_3' => 'nullable|string',
            'schedules' => 'required|array|min:1',
            'schedules.*.start_time' => 'required|date',
            'schedules.*.end_time' => 'required|date',
            'schedules.*.registration_deadline' => 'nullable|date',
            'schedules.*.max_participants' => 'nullable|integer|min:1',
        ]);

        if ($validated['mode'] === 'offline' && empty($validated['location'])) {
            return back()->withErrors(['location' => 'Lokasi wajib diisi untuk mode offline.']);
        }

        $scheduleRows = $this->prepareScheduleRows($request->input('schedules', []));

        $slug = Str::slug($validated['title']);
        $originalSlug = $slug;
        $counter = 1;
        while (PrivateClass::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $counter++;
        }

        $data = $validated;
        $data['slug'] = $slug;
        $data['max_participants'] = 1;
        $data['status'] = 'draft';
        $data['private_url'] = url('/private/' . $slug);
        $data['registration_url'] = url('/private/' . $slug . '/register');

        if (!empty($data['registration_deadline'])) {
            $data['registration_deadline'] = Carbon::parse($data['registration_deadline'])
                ->setTimezone(config('app.timezone'))
                ->format('Y-m-d H:i:s');
        }

        $firstSchedule = $scheduleRows[0];
        $data['start_time'] = $firstSchedule['start_time'];
        $data['end_time'] = $firstSchedule['end_time'];

        if ($request->hasFile('thumbnail')) {
            $data['thumbnail'] = $request->file('thumbnail')->store('thumbnails', 'public');
        }

        $privateClass = PrivateClass::create($data);
        $privateClass->schedules()->createMany($scheduleRows);

        return redirect()->route('privates.index')->with('success', 'Private class berhasil dibuat.');
    }

    public function show(string $id)
    {
        $privateClass = PrivateClass::with(['category', 'user', 'schedules'])->findOrFail($id);

        $transactions = Invoice::with(['user', 'privateItems.privateClass', 'privateItems.privateClassSchedule'])
            ->whereHas('privateItems', function ($q) use ($id) {
                $q->where('private_class_id', $id);
            })
            ->latest()
            ->get();

        $user = Auth::user();
        if ($user && $user->hasRole('staff') && !$user->hasRole('admin')) {
            $transactions->each(function ($tx) {
                $tx->amount = 0;
                $tx->discount_amount = 0;
                $tx->transaction_fee = 0;
                $tx->nett_amount = 0;
            });
        }

        return Inertia::render('admin/privates/show', [
            'privateClass' => $privateClass,
            'transactions' => $transactions,
        ]);
    }

    public function edit(string $id)
    {
        return Inertia::render('admin/privates/edit', [
            'privateClass' => PrivateClass::with('schedules')->findOrFail($id),
            'categories' => Category::all(['id', 'name']),
            'mentors' => User::role('mentor')->get(['id', 'name', 'email']),
        ]);
    }

    public function update(Request $request, string $id)
    {
        $privateClass = PrivateClass::with('schedules')->findOrFail($id);

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'category_id' => 'required|exists:categories,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'requirements' => 'nullable|string',
            'benefits' => 'nullable|string',
            'curriculum' => 'nullable|string',
            'thumbnail' => 'nullable|image|mimes:jpeg,jpg,png|max:2048',
            'mode' => 'required|in:online,offline',
            'location' => 'nullable|string|max:255',
            'registration_deadline' => 'nullable|date',
            'strikethrough_price' => 'required|numeric|min:0',
            'price' => 'required|numeric|min:0',
            'group_url' => 'nullable|string',
            'requirement_1' => 'nullable|string',
            'requirement_2' => 'nullable|string',
            'requirement_3' => 'nullable|string',
            'schedules' => 'required|array|min:1',
            'schedules.*.start_time' => 'required|date',
            'schedules.*.end_time' => 'required|date',
            'schedules.*.registration_deadline' => 'nullable|date',
            'schedules.*.max_participants' => 'nullable|integer|min:1',
        ]);

        if ($validated['mode'] === 'offline' && empty($validated['location'])) {
            return back()->withErrors(['location' => 'Lokasi wajib diisi untuk mode offline.']);
        }

        $scheduleRows = $this->prepareScheduleRows($request->input('schedules', []));

        $data = $validated;
        $data['max_participants'] = 1;

        if ($privateClass->title !== $validated['title']) {
            $slug = Str::slug($validated['title']);
            $originalSlug = $slug;
            $counter = 1;
            while (PrivateClass::where('slug', $slug)->where('id', '!=', $privateClass->id)->exists()) {
                $slug = $originalSlug . '-' . $counter++;
            }

            $data['slug'] = $slug;
            $data['private_url'] = url('/private/' . $slug);
            $data['registration_url'] = url('/private/' . $slug . '/register');
        }

        if (!empty($data['registration_deadline'])) {
            $data['registration_deadline'] = Carbon::parse($data['registration_deadline'])
                ->setTimezone(config('app.timezone'))
                ->format('Y-m-d H:i:s');
        }

        $firstSchedule = $scheduleRows[0];
        $data['start_time'] = $firstSchedule['start_time'];
        $data['end_time'] = $firstSchedule['end_time'];

        if ($request->hasFile('thumbnail')) {
            if ($privateClass->thumbnail) {
                Storage::disk('public')->delete($privateClass->thumbnail);
            }
            $data['thumbnail'] = $request->file('thumbnail')->store('thumbnails', 'public');
        }

        $privateClass->update($data);
        $privateClass->schedules()->delete();
        $privateClass->schedules()->createMany($scheduleRows);

        return redirect()->route('privates.show', $privateClass->id)->with('success', 'Private class berhasil diperbarui.');
    }

    public function destroy(string $id)
    {
        $privateClass = PrivateClass::findOrFail($id);

        if ($privateClass->thumbnail) {
            Storage::disk('public')->delete($privateClass->thumbnail);
        }

        $privateClass->delete();

        return redirect()->route('privates.index')->with('success', 'Private class berhasil dihapus.');
    }

    public function publish(PrivateClass $private)
    {
        $private->update(['status' => 'published']);

        return back()->with('success', 'Private class berhasil dipublish.');
    }

    public function archive(PrivateClass $private)
    {
        $private->update(['status' => 'archived']);

        return back()->with('success', 'Private class berhasil diarsipkan.');
    }

    public function duplicate(PrivateClass $private)
    {
        $private->load('schedules');

        $copy = $private->replicate();
        $copy->title = $private->title . ' (Copy)';

        $slug = Str::slug($copy->title);
        $baseSlug = $slug;
        $counter = 1;
        while (PrivateClass::where('slug', $slug)->exists()) {
            $slug = $baseSlug . '-' . $counter++;
        }

        $copy->slug = $slug;
        $copy->status = 'draft';
        $copy->private_url = url('/private/' . $slug);
        $copy->registration_url = url('/private/' . $slug . '/register');
        $copy->save();

        foreach ($private->schedules as $schedule) {
            $copy->schedules()->create([
                'start_time' => $schedule->start_time,
                'end_time' => $schedule->end_time,
                'registration_deadline' => $schedule->registration_deadline,
                'max_participants' => $schedule->max_participants,
                'is_active' => $schedule->is_active,
            ]);
        }

        return redirect()->route('privates.edit', $copy->id)->with('success', 'Private class berhasil diduplikasi.');
    }

    private function prepareScheduleRows(array $schedules): array
    {
        $rows = [];

        foreach ($schedules as $index => $schedule) {
            if (empty($schedule['start_time']) || empty($schedule['end_time'])) {
                continue;
            }

            $start = Carbon::parse($schedule['start_time'])->setTimezone(config('app.timezone'));
            $end = Carbon::parse($schedule['end_time'])->setTimezone(config('app.timezone'));

            if ($end->lte($start)) {
                throw ValidationException::withMessages([
                    "schedules.$index.end_time" => 'Jam selesai slot harus setelah jam mulai.',
                ]);
            }

            $deadline = !empty($schedule['registration_deadline'])
                ? Carbon::parse($schedule['registration_deadline'])->setTimezone(config('app.timezone'))
                : null;

            if ($deadline && $deadline->gt($start)) {
                throw ValidationException::withMessages([
                    "schedules.$index.registration_deadline" => 'Deadline pendaftaran slot tidak boleh melebihi jam mulai slot.',
                ]);
            }

            $rows[] = [
                'start_time' => $start->format('Y-m-d H:i:s'),
                'end_time' => $end->format('Y-m-d H:i:s'),
                'registration_deadline' => $deadline?->format('Y-m-d H:i:s'),
                'max_participants' => max((int) ($schedule['max_participants'] ?? 1), 1),
                'is_active' => true,
            ];
        }

        if (empty($rows)) {
            throw ValidationException::withMessages([
                'schedules' => 'Minimal satu jadwal slot wajib diisi.',
            ]);
        }

        return $rows;
    }
}
