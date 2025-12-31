<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\PartnershipProduct;
use App\Models\PartnershipProductClick;
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
}
