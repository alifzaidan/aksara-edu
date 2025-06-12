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
        $data['registration_url'] = url('/course/' . $slug . '/checkout');
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

    public function show(string $id)
    {
        $course = Course::with(['category', 'user', 'tools', 'images', 'modules.lessons'])->findOrFail($id);
        return Inertia::render('admin/courses/show', ['course' => $course]);
    }

    public function edit(string $id)
    {
        $course = Course::with(['tools', 'images', 'modules.lessons'])->findOrFail($id);
        $categories = Category::all();
        $tools = Tool::all();
        return Inertia::render('admin/courses/edit', ['course' => $course, 'categories' => $categories, 'tools' => $tools]);
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

    public function duplicate(string $id)
    {
        $course = Course::with(['tools', 'modules.lessons'])->findOrFail($id);

        $newCourse = $course->replicate();
        // Duplicate thumbnail if exists
        if ($course->thumbnail && Storage::disk('public')->exists($course->thumbnail)) {
            $originalPath = $course->thumbnail;
            $extension = pathinfo($originalPath, PATHINFO_EXTENSION);
            $newFileName = 'thumbnails/' . uniqid('copy_') . '.' . $extension;
            Storage::disk('public')->copy($originalPath, $newFileName);
            $newCourse->thumbnail = $newFileName;
        } else {
            $newCourse->thumbnail = null;
        }

        // Generate unique slug
        $slug = Str::slug($newCourse->title);
        $originalSlug = $slug;
        $counter = 1;
        while (Course::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $counter++;
        }
        $newCourse->slug = $slug;
        $newCourse->status = 'draft';
        $newCourse->course_url = url('/course/' . $slug);
        $newCourse->registration_url = url('/course/' . $slug . '/checkout');
        $newCourse->save();

        // Duplicate course images
        if ($course->images && $course->images->count() > 0) {
            foreach ($course->images as $image) {
                $newImagePath = null;
                if ($image->image_url && Storage::disk('public')->exists($image->image_url)) {
                    $ext = pathinfo($image->image_url, PATHINFO_EXTENSION);
                    $newImagePath = 'course_images/' . uniqid('copy_') . '.' . $ext;
                    Storage::disk('public')->copy($image->image_url, $newImagePath);
                }
                $newCourse->images()->create([
                    'image_url' => $newImagePath,
                    'order' => $image->order,
                ]);
            }
        }

        // Duplicate tools
        if ($course->tools && $course->tools->count() > 0) {
            $newCourse->tools()->sync($course->tools->pluck('id')->toArray());
        }

        // Duplicate modules and lessons
        foreach ($course->modules as $module) {
            $newModule = $module->replicate();
            $newModule->course_id = $newCourse->id;
            $newModule->save();

            foreach ($module->lessons as $lesson) {
                $newLesson = $lesson->replicate();
                $newLesson->module_id = $newModule->id;
                // Duplicate attachment if exists
                if ($lesson->attachment && Storage::disk('public')->exists($lesson->attachment)) {
                    $originalAttachment = $lesson->attachment;
                    $ext = pathinfo($originalAttachment, PATHINFO_EXTENSION);
                    $newAttachment = 'lesson_attachments/' . uniqid('copy_') . '.' . $ext;
                    Storage::disk('public')->copy($originalAttachment, $newAttachment);
                    $newLesson->attachment = $newAttachment;
                }
                $newLesson->save();
            }
        }

        return redirect()->route('courses.show', $newCourse->id)
            ->with('success', 'Kelas berhasil diduplikasi. Silakan edit sebelum dipublikasikan.');
    }

    public function publish(string $id)
    {
        $course = Course::findOrFail($id);
        $course->status = 'published';
        $course->save();

        return back()->with('success', 'Kelas berhasil dipublikasikan.');
    }

    public function archive(string $id)
    {
        $course = Course::findOrFail($id);
        $course->status = 'archived';
        $course->save();

        return back()->with('success', 'Kelas berhasil diarsipkan.');
    }
}
