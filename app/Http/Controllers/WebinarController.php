<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Webinar;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class WebinarController extends Controller
{
    public function index()
    {
        $webinars = Webinar::with(['category', 'user'])->latest()->get();
        return Inertia::render('admin/webinars/index', ['webinars' => $webinars]);
    }

    public function create()
    {
        $categories = Category::all();
        return Inertia::render('admin/webinars/create', ['categories' => $categories]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'description' => 'nullable|string',
            'benefits' => 'nullable|string',
            'thumbnail' => 'nullable|image|mimes:jpeg,jpg,png|max:2048',
            'start_time' => 'required|date',
            'end_time' => 'nullable|date|after_or_equal:start_time',
            'registration_deadline' => 'nullable|date',
            'host_name' => 'nullable|string|max:255',
            'host_description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'quota' => 'required|integer|min:0',
            'registration_link' => 'nullable|url|max:255',
            'instructions' => 'nullable|string',
            'batch' => 'nullable|string|max:255',
        ]);

        $data = $request->all();
        foreach (['start_time', 'end_time', 'registration_deadline', 'registration_start_time', 'registration_end_time'] as $field) {
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
        $data['user_id'] = $request->user()->id;
        $data['webinar_url'] = url('/webinar/' . $slug);
        $data['registration_url'] = url('/webinar/' . $slug . '/register');
        $data['status'] = 'draft';

        Webinar::create($data);

        return redirect()->route('webinars.index')->with('success', 'Webinar berhasil dibuat.');
    }

    public function show(string $id)
    {
        $webinar = Webinar::with(['category', 'user'])->findOrFail($id);
        return Inertia::render('admin/webinars/show', ['webinar' => $webinar]);
    }

    public function edit(string $id)
    {
        $webinar = Webinar::findOrFail($id);
        $categories = Category::all();
        return Inertia::render('admin/webinars/edit', ['webinar' => $webinar, 'categories' => $categories]);
    }

    public function update(Request $request, string $id)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'description' => 'nullable|string',
            'benefits' => 'nullable|string',
            'thumbnail' => 'nullable|image|mimes:jpeg,jpg,png|max:2048',
            'start_time' => 'required|date',
            'end_time' => 'nullable|date|after_or_equal:start_time',
            'registration_deadline' => 'nullable|date',
            'host_name' => 'nullable|string|max:255',
            'host_description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'quota' => 'required|integer|min:0',
            'registration_link' => 'nullable|url|max:255',
            'instructions' => 'nullable|string',
            'batch' => 'nullable|string|max:255',
        ]);

        $webinar = Webinar::findOrFail($id);
        $data = $request->all();

        foreach (['start_time', 'end_time', 'registration_deadline', 'registration_start_time', 'registration_end_time'] as $field) {
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

        return redirect()->route('webinars.index')->with('success', 'Webinar berhasil diperbarui.');
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
}
