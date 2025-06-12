<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Course;
use App\Models\Tool;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class CourseController extends Controller
{
    public function index()
    {
        $courses = Course::with(['category', 'user'])->latest()->get();
        return Inertia::render('admin/courses/index', ['courses' => $courses]);
    }

    public function create()
    {
        $categories = Category::all();
        $tools = Tool::all();
        return Inertia::render('admin/courses/create', ['categories' => $categories, 'tools' => $tools]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'short_description' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'thumbnail' => 'nullable|image|mimes:jpeg,jpg,png|max:2048',
            'price' => 'required|numeric|min:0',
            'level' => 'required|string|in:beginner,intermediate,advanced',
            'sneak_peek_images' => 'nullable|array|max:4',
            'sneak_peek_images.*' => 'image|mimes:jpeg,jpg,png|max:2048',
        ]);

        $data = $request->all();
        $slug = Str::slug($data['title']);
        $originalSlug = $slug;
        $counter = 1;
        while (Course::where('slug', $slug)->exists()) {
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
        $data['course_url'] = url('/course/' . $slug);
        $data['registration_url'] = url('/course/' . $slug . '/register');
        $data['status'] = 'draft';

        $course = Course::create($data);

        if ($request->has('tools') && is_array($request->tools)) {
            $course->tools()->sync($request->tools);
        }

        if ($request->hasFile('sneak_peek_images')) {
            foreach ($request->file('sneak_peek_images') as $idx => $image) {
                if ($idx >= 4) break;
                $path = $image->store('course_images', 'public');
                $course->images()->create([
                    'image_url' => $path,
                    'order' => $idx,
                ]);
            }
        }

        if ($request->has('modules')) {
            $modules = json_decode($request->input('modules'), true);
            if (is_array($modules)) {
                foreach ($modules as $modIdx => $mod) {
                    $module = $course->modules()->create([
                        'title' => $mod['title'],
                        'description' => $mod['description'] ?? null,
                        'order' => $modIdx,
                    ]);
                    if (isset($mod['lessons']) && is_array($mod['lessons'])) {
                        foreach ($mod['lessons'] as $lessonIdx => $lesson) {
                            $attachmentPath = null;
                            $fileKey = "modules.{$modIdx}.lessons.{$lessonIdx}.attachment";
                            if ($lesson['type'] === 'file' && $request->hasFile($fileKey)) {
                                $attachmentPath = $request->file($fileKey)->store('lesson_attachments', 'public');
                            }
                            $module->lessons()->create([
                                'title' => $lesson['title'],
                                'description' => $lesson['description'] ?? null,
                                'type' => $lesson['type'],
                                'content' => $lesson['content'] ?? null,
                                'video_url' => $lesson['type'] === 'video' ? ($lesson['video_url'] ?? null) : null,
                                'attachment' => $attachmentPath,
                                'is_free' => $lesson['isFree'] ?? false,
                                'order' => $lessonIdx,
                            ]);
                        }
                    }
                }
            }
        }

        return redirect()->route('courses.index')->with('success', 'Kursus berhasil dibuat.');
    }

    public function edit(string $id)
    {
        $course = Course::findOrFail($id);
        return Inertia::render('admin/courses/edit', ['course' => $course]);
    }

    public function update(Request $request, string $id)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'user_id' => 'required|exists:users,id',
            'category_id' => 'required|exists:categories,id',
            'short_description' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'thumbnail' => 'nullable|image|mimes:jpeg,jpg,png|max:2048',
            'price' => 'required|numeric|min:0',
            'level' => 'required|string|in:beginner,intermediate,advanced',
            'status' => 'required|string|in:draft,published,archived',
        ]);

        $course = Course::findOrFail($id);

        $data = $request->only(['title', 'user_id', 'category_id', 'short_description', 'description', 'price', 'level', 'status']);

        if ($request->hasFile('thumbnail')) {
            Storage::disk('public')->delete($course->thumbnail);
            $thumbnail = $request->file('thumbnail');
            $thumbnailPath = $thumbnail->store('thumbnails', 'public');
            $data['thumbnail'] = $thumbnailPath;
        }

        $course->update($data);

        return redirect()->route('courses.index')->with('success', 'Kursus berhasil diperbarui.');
    }

    public function destroy(string $id)
    {
        $course = Course::findOrFail($id);
        $course->delete();
        return redirect()->route('courses.index')->with('success', 'Kursus berhasil dihapus.');
    }
}
