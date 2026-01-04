<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Certificate;
use App\Models\Invoice;
use App\Models\Tool;
use App\Models\User;
use App\Models\Webinar;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class WebinarController extends Controller
{
    public function index()
    {
        $user = User::find(Auth::user()->id);
        $isAffiliate = $user->hasRole('affiliate');

        if ($isAffiliate) {
            $webinars = Webinar::with(['category', 'user', 'certificate'])
                ->where('status', 'published')
                ->latest()
                ->get();
        } else {
            $webinars = Webinar::with(['category', 'user', 'certificate'])
                ->latest()
                ->get();
        }

        $totalWebinars = $webinars->count();
        $publishedWebinars = $webinars->where('status', 'published')->count();
        $draftWebinars = $webinars->where('status', 'draft')->count();
        $archivedWebinars = $webinars->where('status', 'archived')->count();

        $freeWebinars = $webinars->where('price', 0)->count();
        $paidWebinars = $webinars->where('price', '>', 0)->count();

        $now = Carbon::now();
        $completedWebinars = $webinars->filter(function ($webinar) use ($now) {
            return $webinar->end_time && Carbon::parse($webinar->end_time)->isBefore($now);
        })->count();
        $upcomingWebinars = $webinars->filter(function ($webinar) use ($now) {
            return $webinar->start_time && Carbon::parse($webinar->start_time)->isAfter($now);
        })->count();
        $ongoingWebinars = $totalWebinars - $completedWebinars - $upcomingWebinars;

        $webinarsWithRecording = $webinars->whereNotNull('recording_url')->count();
        $webinarsWithoutRecording = $totalWebinars - $webinarsWithRecording;

        $webinarIds = $webinars->pluck('id');
        $totalParticipants = Invoice::where('status', 'paid')
            ->whereHas('webinarItems', function ($query) use ($webinarIds) {
                $query->whereIn('webinar_id', $webinarIds);
            })
            ->count();

        $totalRevenue = Invoice::where('status', 'paid')
            ->whereHas('webinarItems', function ($query) use ($webinarIds) {
                $query->whereIn('webinar_id', $webinarIds);
            })
            ->sum('nett_amount');

        $statistics = [
            'overview' => [
                'total_webinars' => $totalWebinars,
                'published_webinars' => $publishedWebinars,
                'draft_webinars' => $draftWebinars,
                'archived_webinars' => $archivedWebinars,
            ],
            'pricing' => [
                'free_webinars' => $freeWebinars,
                'paid_webinars' => $paidWebinars,
            ],
            'completion' => [
                'completed' => $completedWebinars,
                'ongoing' => $ongoingWebinars,
                'upcoming' => $upcomingWebinars,
            ],
            'recording' => [
                'with_recording' => $webinarsWithRecording,
                'without_recording' => $webinarsWithoutRecording,
            ],
            'performance' => [
                'total_participants' => $totalParticipants,
                'total_revenue' => $totalRevenue,
            ],
        ];

        return Inertia::render('admin/webinars/index', [
            'webinars' => $webinars,
            'statistics' => $statistics,
        ]);
    }

    public function create()
    {
        $categories = Category::all();
        $tools = Tool::all();

        $mentors = User::role('mentor')->get(['id', 'name', 'bio', 'avatar']);

        return Inertia::render('admin/webinars/create', ['categories' => $categories, 'tools' => $tools, 'mentors' => $mentors]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'title' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'description' => 'nullable|string',
            'benefits' => 'nullable|string',
            'thumbnail' => 'nullable|image|mimes:jpeg,jpg,png|max:2048',
            'start_time' => 'required|date',
            'end_time' => 'nullable|date|after_or_equal:start_time',
            'registration_deadline' => 'nullable|date',
            'strikethrough_price' => 'required|numeric|min:0',
            'price' => 'required|numeric|min:0',
            'quota' => 'required|integer|min:0',
            'group_url' => 'nullable|string',
            'batch' => 'nullable|string|max:255',
            'tools' => 'nullable|array',
        ]);

        $data = $request->all();
        foreach (['start_time', 'end_time', 'registration_deadline'] as $field) {
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
        while (Webinar::where('slug', $slug)->exists()) {
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
        $data['webinar_url'] = url('/webinar/' . $slug);
        $data['registration_url'] = url('/webinar/' . $slug . '/register');
        $data['status'] = 'draft';

        $webinar = Webinar::create($data);

        if ($request->has('tools') && is_array($request->tools)) {
            $webinar->tools()->sync($request->tools);
        }

        return redirect()->route('webinars.index')->with('success', 'Webinar berhasil dibuat.');
    }

    public function show(string $id)
    {
        $webinar = Webinar::with(['category', 'user', 'tools'])->findOrFail($id);

        $transactions = Invoice::with([
            'user',
            'referrer',
            'webinarItems' => function ($query) use ($id) {
                $query->where('webinar_id', $id)
                    ->with('freeRequirement');
            }
        ])
            ->whereHas('webinarItems', function ($query) use ($id) {
                $query->where('webinar_id', $id);
            })
            ->latest()
            ->get();

        $participants = Invoice::with([
            'user',
            'webinarItems' => function ($query) use ($id) {
                $query->where('webinar_id', $id);
            }
        ])
            ->where('status', 'paid')
            ->whereHas('webinarItems', function ($query) use ($id) {
                $query->where('webinar_id', $id);
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
                    'webinar_item' => [
                        'id' => $invoice->webinarItems[0]->id,
                        'webinar_id' => $invoice->webinarItems[0]->webinar_id,
                        'attendance_proof' => $invoice->webinarItems[0]->attendance_proof,
                        'attendance_verified' => $invoice->webinarItems[0]->attendance_verified,
                        'progress' => $invoice->webinarItems[0]->progress,
                        'completed_at' => $invoice->webinarItems[0]->completed_at,
                    ],
                ];
            });

        $ratings = $transactions->flatMap(function ($invoice) {
            return $invoice->webinarItems->map(function ($item) use ($invoice) {
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

        $certificate = Certificate::where('webinar_id', $id)->first();

        return Inertia::render('admin/webinars/show', [
            'webinar' => $webinar,
            'transactions' => $transactions,
            'participants' => $participants,
            'ratings' => $ratings,
            'averageRating' => round($averageRating, 1),
            'certificate' => $certificate
        ]);
    }

    public function edit(string $id)
    {
        $webinar = Webinar::with(['tools'])->findOrFail($id);
        $categories = Category::all();
        $tools = Tool::all();

        $mentors = User::role('mentor')->get(['id', 'name', 'bio', 'avatar']);

        return Inertia::render('admin/webinars/edit', ['webinar' => $webinar, 'categories' => $categories, 'tools' => $tools, 'mentors' => $mentors]);
    }

    public function update(Request $request, string $id)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'title' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'description' => 'nullable|string',
            'benefits' => 'nullable|string',
            'thumbnail' => 'nullable|image|mimes:jpeg,jpg,png|max:2048',
            'start_time' => 'required|date',
            'end_time' => 'nullable|date|after_or_equal:start_time',
            'registration_deadline' => 'nullable|date',
            'strikethrough_price' => 'required|numeric|min:0',
            'price' => 'required|numeric|min:0',
            'quota' => 'required|integer|min:0',
            'group_url' => 'nullable|string',
            'batch' => 'nullable|string|max:255',
            'tools' => 'nullable|array',
        ]);

        $webinar = Webinar::findOrFail($id);
        $data = $request->all();

        foreach (['start_time', 'end_time', 'registration_deadline'] as $field) {
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
        while (Webinar::where('slug', $slug)->where('id', '!=', $webinar->id)->exists()) {
            $slug = $originalSlug . '-' . $counter++;
        }
        $data['slug'] = $slug;

        if ($request->hasFile('thumbnail')) {
            if ($webinar->thumbnail) {
                Storage::disk('public')->delete($webinar->thumbnail);
            }
            $thumbnail = $request->file('thumbnail');
            $thumbnailPath = $thumbnail->store('thumbnails', 'public');
            $data['thumbnail'] = $thumbnailPath;
        } else {
            unset($data['thumbnail']);
        }

        $data['webinar_url'] = url('/webinar/' . $slug);
        $data['registration_url'] = url('/webinar/' . $slug . '/register');

        $webinar->update($data);

        if ($request->has('tools') && is_array($request->tools)) {
            $webinar->tools()->sync($request->tools);
        }

        return redirect()->route('webinars.show', $webinar->id)->with('success', 'Webinar berhasil diperbarui.');
    }

    public function destroy(string $id)
    {
        $webinar = Webinar::findOrFail($id);
        $webinar->delete();
        return redirect()->route('webinars.index')->with('success', 'Webinar berhasil dihapus.');
    }

    public function duplicate(string $id)
    {
        $webinar = Webinar::findOrFail($id);

        $newWebinar = $webinar->replicate();

        if ($webinar->thumbnail && Storage::disk('public')->exists($webinar->thumbnail)) {
            $originalPath = $webinar->thumbnail;
            $extension = pathinfo($originalPath, PATHINFO_EXTENSION);
            $newFileName = 'thumbnails/' . uniqid('copy_') . '.' . $extension;
            Storage::disk('public')->copy($originalPath, $newFileName);
            $newWebinar->thumbnail = $newFileName;
        } else {
            $newWebinar->thumbnail = null;
        }

        $slug = Str::slug($newWebinar->title);
        if (!empty($newWebinar->batch)) {
            $slug .= '-batch-' . $newWebinar->batch;
        }
        $originalSlug = $slug;
        $counter = 1;
        while (Webinar::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $counter++;
        }
        $newWebinar->slug = $slug;
        $newWebinar->status = 'draft';
        $newWebinar->webinar_url = url('/webinar/' . $slug);
        $newWebinar->registration_url = url('/webinar/' . $slug . '/register');
        $newWebinar->save();

        if ($webinar->tools && $webinar->tools->count() > 0) {
            $newWebinar->tools()->sync($webinar->tools->pluck('id')->toArray());
        }

        return redirect()->route('webinars.show', $newWebinar->id)
            ->with('success', 'Webinar berhasil diduplikasi. Silakan edit sebelum dipublikasikan.');
    }

    public function publish(string $id)
    {
        $webinar = Webinar::findOrFail($id);
        $webinar->status = 'published';
        $webinar->save();

        return back()->with('success', 'Webinar berhasil dipublikasikan.');
    }

    public function archive(string $id)
    {
        $webinar = Webinar::findOrFail($id);
        $webinar->status = 'archived';
        $webinar->save();

        return back()->with('success', 'Webinar berhasil ditutup.');
    }

    public function addRecording(Request $request, string $id)
    {
        $request->validate([
            'recording_url' => 'required|url|max:255',
        ]);

        $webinar = Webinar::findOrFail($id);
        $webinar->recording_url = $request->recording_url;
        $webinar->save();

        return back()->with('success', 'Link rekaman berhasil diperbarui.');
    }

    public function removeRecording(string $id)
    {
        $webinar = Webinar::findOrFail($id);

        if (!$webinar->recording_url) {
            return back()->with('error', 'Tidak ada link rekaman untuk dihapus.');
        }

        $webinar->recording_url = null;
        $webinar->save();

        return back()->with('success', 'Link rekaman berhasil dihapus.');
    }
}
