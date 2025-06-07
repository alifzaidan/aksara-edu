<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
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
        return Inertia::render('admin/courses/create', ['categories' => $categories]);
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
        ]);


        $thumbnail = $request->file('thumbnail');
        $thumbnailPath = $thumbnail->store('thumbnails', 'public');

        $data = $request->all();
        $data['thumbnail'] = $thumbnailPath;
        $data['user_id'] = $request->user()->id;
        $data['status'] = 'draft';

        Course::create($data);

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
