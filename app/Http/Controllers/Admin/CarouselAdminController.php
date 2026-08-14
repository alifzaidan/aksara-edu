<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Carousel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class CarouselAdminController extends Controller
{
    public function index()
    {
        $carousels = Carousel::orderBy('order', 'asc')->orderBy('created_at', 'desc')->get();

        return Inertia::render('admin/carousels/index', [
            'carousels' => $carousels,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title'      => 'nullable|string|max:255',
            'image'      => 'required|image|mimes:jpeg,png,jpg,webp|max:5120', // Max 5 MB
            'target_url' => 'nullable|string|max:1000',
            'order'      => 'nullable|integer',
            'is_active'  => 'nullable|boolean',
        ], [
            'image.required' => 'Gambar banner carousel wajib diunggah.',
            'image.max'      => 'Ukuran file gambar tidak boleh melebihi 5 MB.',
            'image.mimes'    => 'Format gambar harus berupa JPG, JPEG, PNG, atau WEBP.',
        ]);

        if ($request->hasFile('image')) {
            $image = $request->file('image');
            $path = $image->store('carousels', 'public');
            $imagePath = '/storage/' . $path;
        } else {
            return back()->withErrors(['image' => 'Gambar wajib diunggah.']);
        }

        Carousel::create([
            'title'      => $request->title,
            'image_path' => $imagePath,
            'target_url' => $request->target_url,
            'order'      => $request->order ?? 0,
            'is_active'  => $request->boolean('is_active', true),
        ]);

        return back()->with('success', 'Banner carousel berhasil ditambahkan.');
    }

    public function update(Request $request, Carousel $carousel)
    {
        $request->validate([
            'title'      => 'nullable|string|max:255',
            'image'      => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120', // Max 5 MB
            'target_url' => 'nullable|string|max:1000',
            'order'      => 'nullable|integer',
            'is_active'  => 'nullable|boolean',
        ], [
            'image.max'   => 'Ukuran file gambar tidak boleh melebihi 5 MB.',
            'image.mimes' => 'Format gambar harus berupa JPG, JPEG, PNG, atau WEBP.',
        ]);

        $data = [
            'title'      => $request->title,
            'target_url' => $request->target_url,
            'order'      => $request->order ?? 0,
            'is_active'  => $request->boolean('is_active', true),
        ];

        if ($request->hasFile('image')) {
            $image = $request->file('image');

            // Hapus gambar lama jika ada dan tersimpan di storage
            if ($carousel->image_path && str_starts_with($carousel->image_path, '/storage/')) {
                $oldPath = str_replace('/storage/', '', $carousel->image_path);
                Storage::disk('public')->delete($oldPath);
            }

            $path = $image->store('carousels', 'public');
            $data['image_path'] = '/storage/' . $path;
        }

        $carousel->update($data);

        return back()->with('success', 'Banner carousel berhasil diperbarui.');
    }

    public function destroy(Carousel $carousel)
    {
        if ($carousel->image_path && str_starts_with($carousel->image_path, '/storage/')) {
            $oldPath = str_replace('/storage/', '', $carousel->image_path);
            Storage::disk('public')->delete($oldPath);
        }

        $carousel->delete();

        return back()->with('success', 'Banner carousel berhasil dihapus.');
    }

    public function toggleStatus(Carousel $carousel)
    {
        $carousel->update([
            'is_active' => !$carousel->is_active,
        ]);

        return back()->with('success', 'Status banner carousel berhasil diubah.');
    }
}
