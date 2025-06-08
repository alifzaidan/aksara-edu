<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Webinar;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
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
            'registration_start_time' => 'nullable|date',
            'registration_end_time' => 'nullable|date|after_or_equal:registration_start_time',
            'host_name' => 'nullable|string|max:255',
            'host_description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'quota' => 'required|integer|min:0',
            'registration_link' => 'nullable|url|max:255',
            'batch' => 'nullable|string|max:255',
        ]);


        $thumbnail = $request->file('thumbnail');
        $thumbnailPath = $thumbnail->store('thumbnails', 'public');

        $data = $request->all();
        $data['thumbnail'] = $thumbnailPath;
        $data['user_id'] = $request->user()->id;
        $data['status'] = 'draft';

        Webinar::create($data);

        return redirect()->route('webinars.index')->with('success', 'Webinar berhasil dibuat.');
    }

    public function edit(string $id)
    {
        $webinar = Webinar::findOrFail($id);
        return Inertia::render('admin/webinars/edit', ['webinar' => $webinar]);
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
            'start_time' => 'required|date',
            'end_time' => 'nullable|date|after_or_equal:start_time',
            'registration_start_time' => 'nullable|date',
            'registration_end_time' => 'nullable|date|after_or_equal:registration_start_time',
            'host_name' => 'nullable|string|max:255',
            'host_description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'quota' => 'required|integer|min:0',
            'registration_link' => 'nullable|url|max:255',
            'batch' => 'nullable|string|max:255',
        ]);

        $webinar = Webinar::findOrFail($id);

        $data = $request->only(['title', 'category_id', 'description', 'requirements', 'benefits', 'curriculum', 'start_time', 'end_time', 'registration_start_time', 'registration_end_time', 'host_name', 'host_description', 'price', 'quota', 'registration_link', 'batch']);

        if ($request->hasFile('thumbnail')) {
            Storage::disk('public')->delete($webinar->thumbnail);
            $thumbnail = $request->file('thumbnail');
            $thumbnailPath = $thumbnail->store('thumbnails', 'public');
            $data['thumbnail'] = $thumbnailPath;
        }

        $webinar->update($data);

        return redirect()->route('webinars.index')->with('success', 'Webinar berhasil diperbarui.');
    }

    public function destroy(string $id)
    {
        $webinar = Webinar::findOrFail($id);
        $webinar->delete();
        return redirect()->route('webinars.index')->with('success', 'Webinar berhasil dihapus.');
    }
}
