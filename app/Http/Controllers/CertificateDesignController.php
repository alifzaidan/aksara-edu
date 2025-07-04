<?php

namespace App\Http\Controllers;

use App\Models\CertificateDesign;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class CertificateDesignController extends Controller
{
    public function index()
    {
        $designs = CertificateDesign::latest()->get();

        return Inertia::render('admin/certificates/designs/index', [
            'designs' => $designs
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|unique:certificate_designs',
            'image_1' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'image_2' => 'nullable|image|mimes:jpeg,png,jpg|max:2048'
        ]);

        $data = $request->only(['name']);

        if ($request->hasFile('image_1')) {
            $image1 = $request->file('image_1');
            $image1Path = $image1->store('certificate-designs', 'public');
            $data['image_1'] = $image1Path;
        }

        if ($request->hasFile('image_2')) {
            $image2 = $request->file('image_2');
            $image2Path = $image2->store('certificate-designs', 'public');
            $data['image_2'] = $image2Path;
        }

        CertificateDesign::create($data);

        return redirect()->route('certificate-designs.index')
            ->with('success', 'Desain sertifikat berhasil ditambahkan');
    }

    public function update(Request $request, CertificateDesign $certificateDesign)
    {
        $request->validate([
            'name' => 'required|string|unique:certificate_designs,name,' . $certificateDesign->id,
            'image_1' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'image_2' => 'nullable|image|mimes:jpeg,png,jpg|max:2048'
        ]);

        $data = $request->only(['name']);

        if ($request->hasFile('image_1')) {
            if ($certificateDesign->image_1) {
                Storage::disk('public')->delete($certificateDesign->image_1);
            }
            $image1 = $request->file('image_1');
            $image1Path = $image1->store('certificate-designs', 'public');
            $data['image_1'] = $image1Path;
        }

        if ($request->hasFile('image_2')) {
            if ($certificateDesign->image_2) {
                Storage::disk('public')->delete($certificateDesign->image_2);
            }
            $image2 = $request->file('image_2');
            $image2Path = $image2->store('certificate-designs', 'public');
            $data['image_2'] = $image2Path;
        }

        $certificateDesign->update($data);

        return redirect()->route('certificate-designs.index')
            ->with('success', 'Desain sertifikat berhasil diperbarui');
    }

    public function destroy(CertificateDesign $certificateDesign)
    {
        if ($certificateDesign->image_1) {
            Storage::disk('public')->delete($certificateDesign->image_1);
        }

        if ($certificateDesign->image_2) {
            Storage::disk('public')->delete($certificateDesign->image_2);
        }

        $certificateDesign->delete();

        return redirect()->route('certificate-designs.index')
            ->with('success', 'Desain sertifikat berhasil dihapus');
    }
}
