<?php

namespace App\Http\Controllers;

use App\Models\Bootcamp;
use App\Models\Category;
use App\Models\Tool;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class BootcampController extends Controller
{
    public function index()
    {
        $bootcamps = Bootcamp::with(['category', 'user', 'schedules'])->latest()->get();
        return Inertia::render('admin/bootcamps/index', ['bootcamps' => $bootcamps]);
    }

    public function create()
    {
        $categories = Category::all();
        $tools = Tool::all();
        return Inertia::render('admin/bootcamps/create', ['categories' => $categories, 'tools' => $tools]);
    }

    public function store(Request $request)
    {
        $request->validate([
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
            'host_name' => 'nullable|string|max:255',
            'host_description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'quota' => 'required|integer|min:0',
            'batch' => 'nullable|string|max:255',
            'group_url' => 'nullable|string',
            'tools' => 'nullable|array',
        ]);

        $data = $request->all();
        foreach (['start_date', 'end_date', 'registration_deadline'] as $field) {
            if (!empty($data[$field])) {
                $data[$field] = Carbon::parse($data[$field])->format('Y-m-d H:i:s');
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
        $data['user_id'] = $request->user()->id;
        $data['bootcamp_url'] = url('/bootcamp/' . $slug);
        $data['registration_url'] = url('/bootcamp/' . $slug . '/register');
        $data['status'] = 'draft';

        $bootcamp = Bootcamp::create($data);

        if ($request->has('schedules') && is_array($request->schedules)) {
            foreach ($request->schedules as $schedule) {
                if (
                    isset($schedule['day'], $schedule['start_time'], $schedule['end_time']) &&
                    $schedule['day'] && $schedule['start_time'] && $schedule['end_time']
                ) {
                    $bootcamp->schedules()->create([
                        'day' => $schedule['day'],
                        'start_time' => $schedule['start_time'],
                        'end_time' => $schedule['end_time'],
                    ]);
                }
            }
        }

        if ($request->has('tools') && is_array($request->tools)) {
            $bootcamp->tools()->sync($request->tools);
        }

        return redirect()->route('bootcamps.index')->with('success', 'Bootcamp berhasil dibuat.');
    }

    public function show(string $id)
    {
        $bootcamp = Bootcamp::with(['category', 'user', 'schedules', 'tools'])->findOrFail($id);
        return Inertia::render('admin/bootcamps/show', ['bootcamp' => $bootcamp]);
    }

    public function edit(string $id)
    {
        $bootcamp = Bootcamp::with(['schedules', 'tools'])->findOrFail($id);
        $categories = Category::all();
        $tools = Tool::all();
        return Inertia::render('admin/bootcamps/edit', ['bootcamp' => $bootcamp, 'categories' => $categories, 'tools' => $tools]);
    }

    public function update(Request $request, string $id)
    {
        $request->validate([
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
            'host_name' => 'nullable|string|max:255',
            'host_description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'quota' => 'required|integer|min:0',
            'batch' => 'nullable|string|max:255',
            'group_url' => 'nullable|string',
            'tools' => 'nullable|array',
        ]);

        $bootcamp = Bootcamp::findOrFail($id);
        $data = $request->all();

        foreach (['start_date', 'end_date', 'registration_deadline'] as $field) {
            if (!empty($data[$field])) {
                $data[$field] = Carbon::parse($data[$field])->format('Y-m-d H:i:s');
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
            $bootcamp->schedules()->delete();
            foreach ($request->schedules as $schedule) {
                if (
                    isset($schedule['day'], $schedule['start_time'], $schedule['end_time']) &&
                    $schedule['day'] && $schedule['start_time'] && $schedule['end_time']
                ) {
                    $bootcamp->schedules()->create([
                        'day' => $schedule['day'],
                        'start_time' => $schedule['start_time'],
                        'end_time' => $schedule['end_time'],
                    ]);
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
}
