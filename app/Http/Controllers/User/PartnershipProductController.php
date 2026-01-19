<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\PartnershipProduct;
use App\Models\PartnershipProductClick;
use App\Models\PartnershipProductScholarship;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PartnershipProductController extends Controller
{
    public function index()
    {
        $categories = Category::all();
        $partnershipProducts = PartnershipProduct::with(['category'])
            ->where('status', 'published')
            ->where('registration_deadline', '>=', now())
            ->orderBy('registration_deadline', 'asc')
            ->get();

        return Inertia::render('user/partnership-product/dashboard/index', [
            'categories' => $categories,
            'partnershipProducts' => $partnershipProducts,
        ]);
    }

    public function detail(Request $request, PartnershipProduct $partnershipProduct)
    {
        $partnershipProduct->load(['category']);

        $relatedPartnershipProducts = PartnershipProduct::with(['category'])
            ->where('status', 'published')
            ->where('category_id', $partnershipProduct->category_id)
            ->where('id', '!=', $partnershipProduct->id)
            ->where('registration_deadline', '>=', now())
            ->orderBy('registration_deadline', 'asc')
            ->limit(3)
            ->get();

        return Inertia::render('user/partnership-product/detail/index', [
            'partnershipProduct' => $partnershipProduct,
            'relatedPartnershipProducts' => $relatedPartnershipProducts,
        ]);
    }

    public function trackClick(Request $request, string $id)
    {
        $product = PartnershipProduct::findOrFail($id);

        $deadline = new \DateTime($product->registration_deadline);
        $now = new \DateTime();

        if ($now > $deadline) {
            return back()->with('error', 'Pendaftaran untuk program ini sudah ditutup.');
        }

        PartnershipProductClick::create([
            'partnership_product_id' => $product->id,
            'user_id' => Auth::id(), // Akan null jika guest
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'referrer' => $request->header('referer'),
        ]);

        return redirect()->away($product->registration_url);
    }

    public function scholarshipApply(PartnershipProduct $partnershipProduct)
    {
        // Hanya boleh akses jika type adalah scholarship dan published
        if ($partnershipProduct->type !== 'scholarship' || $partnershipProduct->status !== 'published') {
            abort(404, 'Produk beasiswa tidak ditemukan atau tidak tersedia');
        }

        return Inertia::render('user/partnership-product/scholarship-apply/index', [
            'partnershipProduct' => $partnershipProduct,
        ]);
    }

    public function scholarshipStore(Request $request, PartnershipProduct $partnershipProduct)
    {
        // Validasi bahwa produk adalah scholarship
        if ($partnershipProduct->type !== 'scholarship' || $partnershipProduct->status !== 'published') {
            abort(404, 'Produk beasiswa tidak ditemukan atau tidak tersedia');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'required|string|max:20',
            'nim' => 'required|string|max:50',
            'university' => 'required|string|max:255',
            'major' => 'required|string|max:255',
            'semester' => 'required|integer|min:1|max:8',
            'ktm_photo' => 'required|image|mimes:jpeg,jpg,png,webp|max:5120',
            'transcript_photo' => 'required|image|mimes:jpeg,jpg,png,webp|max:5120',
            'instagram_proof_photo' => 'required|image|mimes:jpeg,jpg,png,webp|max:5120',
            'instagram_tag_proof_photo' => 'required|image|mimes:jpeg,jpg,png,webp|max:5120',
        ], [
            'name.required' => 'Nama lengkap harus diisi.',
            'email.required' => 'Email harus diisi.',
            'email.email' => 'Format email tidak valid.',
            'phone.required' => 'Nomor telepon harus diisi.',
            'nim.required' => 'NIM harus diisi.',
            'university.required' => 'Nama universitas harus diisi.',
            'major.required' => 'Program studi harus diisi.',
            'semester.required' => 'Semester harus dipilih.',
            'semester.max' => 'Semester tidak boleh lebih dari 8.',
            'ktm_photo.required' => 'Foto KTM harus diunggah.',
            'ktm_photo.image' => 'File KTM harus berupa gambar.',
            'transcript_photo.required' => 'Foto transkrip nilai harus diunggah.',
            'transcript_photo.image' => 'File transkrip harus berupa gambar.',
            'instagram_proof_photo.required' => 'Foto bukti follow Instagram harus diunggah.',
            'instagram_proof_photo.image' => 'File bukti follow harus berupa gambar.',
            'instagram_tag_proof_photo.required' => 'Foto bukti tag Instagram harus diunggah.',
            'instagram_tag_proof_photo.image' => 'File bukti tag harus berupa gambar.',
        ]);

        // Store files
        $ktmPath = $request->file('ktm_photo')->store('partnership-scholarships/ktm', 'public');
        $transcriptPath = $request->file('transcript_photo')->store('partnership-scholarships/transcript', 'public');
        $instagramProofPath = $request->file('instagram_proof_photo')->store('partnership-scholarships/instagram-proof', 'public');
        $instagramTagProofPath = $request->file('instagram_tag_proof_photo')->store('partnership-scholarships/instagram-tag-proof', 'public');

        PartnershipProductScholarship::create([
            'partnership_product_id' => $partnershipProduct->id,
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'nim' => $validated['nim'],
            'university' => $validated['university'],
            'major' => $validated['major'],
            'semester' => $validated['semester'],
            'ktm_photo' => $ktmPath,
            'transcript_photo' => $transcriptPath,
            'instagram_proof_photo' => $instagramProofPath,
            'instagram_tag_proof_photo' => $instagramTagProofPath,
        ]);

        return redirect()->route('partnership-products.scholarship-success', $partnershipProduct->slug);
    }

    public function scholarshipSuccess(PartnershipProduct $partnershipProduct)
    {
        // Hanya boleh akses jika type adalah scholarship dan published
        if ($partnershipProduct->type !== 'scholarship' || $partnershipProduct->status !== 'published') {
            abort(404, 'Produk beasiswa tidak ditemukan atau tidak tersedia');
        }

        return Inertia::render('user/partnership-product/scholarship-apply/success', [
            'partnershipProduct' => [
                'id' => $partnershipProduct->id,
                'title' => $partnershipProduct->title,
                'slug' => $partnershipProduct->slug,
                'scholarship_group_link' => $partnershipProduct->scholarship_group_link,
            ],
        ]);
    }
}
