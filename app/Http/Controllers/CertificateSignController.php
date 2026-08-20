<?php

namespace App\Http\Controllers;

use App\Models\CertificateSign;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class CertificateSignController extends Controller
{
    public function index(Request $request)
    {
        $query = CertificateSign::latest();

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('name', 'like', "%{$search}%")
                ->orWhere('position', 'like', "%{$search}%");
        }

        $perPage = min(100, max(5, (int) $request->input('per_page', 10)));
        $signs = $query->paginate($perPage)->withQueryString();

        return Inertia::render('admin/certificates/signs/index', [
            'signs' => $signs,
            'filters' => [
                'search' => $request->input('search'),
                'per_page' => $perPage,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|unique:certificate_signs',
            'image' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'position' => 'nullable|string'
        ]);

        $data = $request->only(['name', 'position']);

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('certificate-signs', 'public');
        }

        CertificateSign::create($data);

        return redirect()->route('certificate-signs.index')
            ->with('success', 'Tanda tangan berhasil ditambahkan');
    }

    public function update(Request $request, CertificateSign $certificateSign)
    {
        $request->validate([
            'name' => 'required|string|unique:certificate_signs,name,' . $certificateSign->id,
            'image' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'position' => 'nullable|string'
        ]);

        $data = $request->only(['name', 'position']);

        if ($request->hasFile('image')) {
            if ($certificateSign->image) {
                Storage::disk('public')->delete($certificateSign->image);
            }
            $image = $request->file('image');
            $imagePath = $image->store('certificate-signs', 'public');
            $data['image'] = $imagePath;
        }

        $certificateSign->update($data);

        return redirect()->route('certificate-signs.index')
            ->with('success', 'Tanda tangan berhasil diperbarui');
    }

    public function destroy(CertificateSign $certificateSign)
    {
        if ($certificateSign->image) {
            Storage::disk('public')->delete($certificateSign->image);
        }

        $certificateSign->delete();

        return redirect()->route('certificate-signs.index')
            ->with('success', 'Tanda tangan berhasil dihapus');
    }
}
