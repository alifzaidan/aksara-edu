<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\PartnershipProduct;
use App\Models\PartnershipProductClick;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class PartnershipProductController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $isAffiliate = $user->hasRole('affiliate');

        $query = PartnershipProduct::with(['category'])
            ->withCount('clicks')
            ->latest();

        if ($isAffiliate) {
            $query->where('status', 'published');
        }

        // Apply filters
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('category') && $request->category !== 'all') {
            $query->where('category_id', $request->category);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('short_description', 'like', "%{$search}%");
            });
        }

        $products = $query->get();

        // ✅ Calculate Statistics
        $totalProducts = $products->count();
        $publishedProducts = $products->where('status', 'published')->count();
        $draftProducts = $products->where('status', 'draft')->count();
        $archivedProducts = $products->where('status', 'archived')->count();

        // Price breakdown
        $freeProducts = $products->where('price', 0)->count();
        $paidProducts = $products->where('price', '>', 0)->count();

        // Click statistics
        $totalClicks = $products->sum('clicks_count');
        $averageClicksPerProduct = $totalProducts > 0 ? round($totalClicks / $totalProducts, 1) : 0;

        // Get unique users who clicked
        $productIds = $products->pluck('id');
        $uniqueUsers = PartnershipProductClick::whereIn('partnership_product_id', $productIds)
            ->whereNotNull('user_id')
            ->distinct('user_id')
            ->count('user_id');

        // Time-based click statistics
        $clicksToday = PartnershipProductClick::whereIn('partnership_product_id', $productIds)
            ->whereDate('created_at', today())
            ->count();

        $clicksThisWeek = PartnershipProductClick::whereIn('partnership_product_id', $productIds)
            ->where('created_at', '>=', now()->startOfWeek())
            ->count();

        $clicksThisMonth = PartnershipProductClick::whereIn('partnership_product_id', $productIds)
            ->where('created_at', '>=', now()->startOfMonth())
            ->count();

        // Calculate potential revenue (strikethrough - price) * clicks
        $totalPotentialSavings = 0;
        foreach ($products as $product) {
            $savings = $product->strikethrough_price - $product->price;
            $totalPotentialSavings += ($savings * ($product->clicks_count ?? 0));
        }

        // Top performing products
        $topProducts = $products->sortByDesc('clicks_count')->take(3);

        $statistics = [
            'overview' => [
                'total_products' => $totalProducts,
                'published_products' => $publishedProducts,
                'draft_products' => $draftProducts,
                'archived_products' => $archivedProducts,
            ],
            'pricing' => [
                'free_products' => $freeProducts,
                'paid_products' => $paidProducts,
            ],
            'engagement' => [
                'total_clicks' => $totalClicks,
                'unique_users' => $uniqueUsers,
                'average_clicks' => $averageClicksPerProduct,
                'clicks_today' => $clicksToday,
                'clicks_this_week' => $clicksThisWeek,
                'clicks_this_month' => $clicksThisMonth,
            ],
            'performance' => [
                'total_potential_savings' => $totalPotentialSavings,
                'top_products' => $topProducts->map(fn($p) => [
                    'id' => $p->id,
                    'title' => $p->title,
                    'clicks_count' => $p->clicks_count ?? 0,
                ]),
            ],
        ];

        return Inertia::render('admin/partnership-products/index', [
            'products' => $products,
            'statistics' => $statistics,
        ]);
    }

    public function create()
    {
        $categories = Category::all();

        return Inertia::render('admin/partnership-products/create', [
            'categories' => $categories,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'short_description' => 'nullable|string|max:500',
            'description' => 'nullable|string',
            'key_points' => 'nullable|string',
            'thumbnail' => 'nullable|image|mimes:jpeg,jpg,png,webp|max:2048',
            'registration_deadline' => 'required|date|after:today',
            'duration_days' => 'nullable|integer|min:0',
            'schedule_days' => 'required|array|min:1',
            'schedule_days.*' => 'string|in:Senin,Selasa,Rabu,Kamis,Jumat,Sabtu,Minggu',
            'strikethrough_price' => 'required|numeric|min:0',
            'price' => 'required|numeric|min:0',
            'registration_url' => 'required|url|max:500',
        ]);

        // Generate slug
        $slug = Str::slug($validated['title']);
        $originalSlug = $slug;
        $counter = 1;
        while (PartnershipProduct::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $counter++;
        }
        $validated['slug'] = $slug;
        $validated['product_url'] = url('/certification/' . $slug);

        // Handle thumbnail
        if ($request->hasFile('thumbnail')) {
            $thumbnailPath = $request->file('thumbnail')->store('partnership-products/thumbnails', 'public');
            $validated['thumbnail'] = $thumbnailPath;
        }

        $validated['status'] = 'draft';

        $product = PartnershipProduct::create($validated);

        return redirect()
            ->route('partnership-products.show', $product->id)
            ->with('success', 'Produk kerjasama berhasil dibuat.');
    }

    public function show(string $id)
    {
        $product = PartnershipProduct::with(['category'])
            ->withCount('clicks')
            ->findOrFail($id);

        // Get click statistics grouped by date (last 30 days)
        $clickStats = DB::table('partnership_product_clicks')
            ->where('partnership_product_id', $id)
            ->where('created_at', '>=', now()->subDays(30))
            ->selectRaw('DATE(created_at) as date, COUNT(*) as clicks')
            ->groupBy('date')
            ->orderBy('date', 'desc')
            ->get();

        // Get unique user clicks
        $uniqueClicks = DB::table('partnership_product_clicks')
            ->where('partnership_product_id', $id)
            ->whereNotNull('user_id')
            ->distinct('user_id')
            ->count('user_id');

        // Get recent clicks (last 10)
        $recentClicks = PartnershipProductClick::where('partnership_product_id', $id)
            ->with('user:id,name')
            ->latest('created_at')
            ->limit(10)
            ->get();

        return Inertia::render('admin/partnership-products/show', [
            'product' => $product,
            'clickStats' => $clickStats,
            'uniqueClicks' => $uniqueClicks,
            'recentClicks' => $recentClicks,
        ]);
    }

    public function edit(string $id)
    {
        $product = PartnershipProduct::findOrFail($id);
        $categories = Category::all();

        return Inertia::render('admin/partnership-products/edit', [
            'product' => $product,
            'categories' => $categories,
        ]);
    }

    public function update(Request $request, string $id)
    {
        $product = PartnershipProduct::findOrFail($id);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'short_description' => 'nullable|string|max:500',
            'description' => 'nullable|string',
            'key_points' => 'nullable|string',
            'thumbnail' => 'nullable|image|mimes:jpeg,jpg,png,webp|max:2048',
            'registration_deadline' => 'required|date|after:today',
            'duration_days' => 'nullable|integer|min:0',
            'schedule_days' => 'required|array|min:1',
            'schedule_days.*' => 'string|in:Senin,Selasa,Rabu,Kamis,Jumat,Sabtu,Minggu',
            'strikethrough_price' => 'required|numeric|min:0',
            'price' => 'required|numeric|min:0',
            'registration_url' => 'required|url|max:500',
        ], [
            'title.required' => 'Judul produk harus diisi.',
            'category_id.required' => 'Kategori harus dipilih.',
            'registration_deadline.required' => 'Batas waktu pendaftaran harus diisi.',
            'registration_deadline.after' => 'Batas waktu pendaftaran harus setelah hari ini.',
            'schedule_days.required' => 'Hari pelaksanaan harus dipilih.',
            'schedule_days.min' => 'Pilih minimal 1 hari pelaksanaan.',
            'registration_url.required' => 'URL pendaftaran harus diisi.',
            'registration_url.url' => 'URL pendaftaran harus berformat URL yang valid.',
            'price.required' => 'Harga harus diisi.',
            'price.numeric' => 'Harga harus berupa angka.',
        ]);

        if ($validated['title'] !== $product->title) {
            $slug = Str::slug($validated['title']);
            $originalSlug = $slug;
            $counter = 1;
            while (PartnershipProduct::where('slug', $slug)->where('id', '!=', $product->id)->exists()) {
                $slug = $originalSlug . '-' . $counter++;
            }
            $validated['slug'] = $slug;
            $validated['product_url'] = url('/certification/' . $slug);
        }

        if ($request->hasFile('thumbnail')) {
            if ($product->thumbnail && Storage::disk('public')->exists($product->thumbnail)) {
                Storage::disk('public')->delete($product->thumbnail);
            }
            $thumbnailPath = $request->file('thumbnail')->store('partnership-products/thumbnails', 'public');
            $validated['thumbnail'] = $thumbnailPath;
        } else {
            unset($validated['thumbnail']);
        }

        $product->update($validated);

        return redirect()
            ->route('partnership-products.show', $product->id)
            ->with('success', 'Produk kerjasama berhasil diperbarui.');
    }

    public function destroy(string $id)
    {
        $product = PartnershipProduct::findOrFail($id);

        if ($product->thumbnail && Storage::disk('public')->exists($product->thumbnail)) {
            Storage::disk('public')->delete($product->thumbnail);
        }

        $product->delete();

        return redirect()
            ->route('partnership-products.index')
            ->with('success', 'Produk kerjasama berhasil dihapus.');
    }

    public function duplicate(string $id)
    {
        $product = PartnershipProduct::findOrFail($id);

        $newProduct = $product->replicate();

        if ($product->thumbnail && Storage::disk('public')->exists($product->thumbnail)) {
            $originalPath = $product->thumbnail;
            $extension = pathinfo($originalPath, PATHINFO_EXTENSION);
            $newFileName = 'partnership-products/thumbnails/' . uniqid('copy_') . '.' . $extension;
            Storage::disk('public')->copy($originalPath, $newFileName);
            $newProduct->thumbnail = $newFileName;
        }

        // Generate unique slug for duplicated product
        $slug = Str::slug($newProduct->title);
        $originalSlug = $slug;
        $counter = 1;
        while (PartnershipProduct::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $counter++;
        }
        $newProduct->slug = $slug;

        // Auto-generate product_url for duplicated product
        $newProduct->product_url = url('/partnership-products/' . $slug);

        $newProduct->status = 'draft';

        $newProduct->save();

        return redirect()
            ->route('partnership-products.show', $newProduct->id)
            ->with('success', 'Produk kerjasama berhasil diduplikasi. Silakan edit sebelum dipublikasikan.');
    }

    public function publish(string $id)
    {
        $product = PartnershipProduct::findOrFail($id);

        if (empty($product->thumbnail)) {
            return back()->with('error', 'Thumbnail harus diupload sebelum mempublikasikan produk.');
        }

        if (empty($product->description)) {
            return back()->with('error', 'Deskripsi harus diisi sebelum mempublikasikan produk.');
        }

        if (empty($product->registration_url)) {
            return back()->with('error', 'URL pendaftaran harus diisi sebelum mempublikasikan produk.');
        }

        $product->status = 'published';
        $product->save();

        return back()->with('success', 'Produk kerjasama berhasil dipublikasikan.');
    }

    public function archive(string $id)
    {
        $product = PartnershipProduct::findOrFail($id);
        $product->status = 'archived';
        $product->save();

        return back()->with('success', 'Produk kerjasama berhasil diarsipkan.');
    }

    public function trackClick(Request $request, string $id)
    {
        $product = PartnershipProduct::findOrFail($id);

        // Create click record
        PartnershipProductClick::create([
            'partnership_product_id' => $product->id,
            'user_id' => Auth::id(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'referrer' => $request->header('referer'),
        ]);

        // Redirect to registration URL
        return redirect()->away($product->registration_url);
    }

    public function statistics()
    {
        $stats = [
            'total_products' => PartnershipProduct::count(),
            'published_products' => PartnershipProduct::where('status', 'published')->count(),
            'draft_products' => PartnershipProduct::where('status', 'draft')->count(),
            'archived_products' => PartnershipProduct::where('status', 'archived')->count(),
            'total_clicks' => PartnershipProductClick::count(),
            'unique_users' => PartnershipProductClick::whereNotNull('user_id')->distinct('user_id')->count('user_id'),
            'clicks_today' => PartnershipProductClick::whereDate('created_at', today())->count(),
            'clicks_this_week' => PartnershipProductClick::where('created_at', '>=', now()->startOfWeek())->count(),
            'clicks_this_month' => PartnershipProductClick::where('created_at', '>=', now()->startOfMonth())->count(),
            'top_products' => PartnershipProduct::where('status', 'published')
                ->withCount('clicks')
                ->orderBy('clicks_count', 'desc')
                ->limit(5)
                ->get(['id', 'title', 'thumbnail']),
            'recent_products' => PartnershipProduct::where('status', 'published')
                ->latest()
                ->limit(5)
                ->get(['id', 'title', 'created_at', 'thumbnail']),
        ];

        return Inertia::render('admin/partnership-products/statistics', [
            'statistics' => $stats,
        ]);
    }

    public function bulkAction(Request $request)
    {
        $validated = $request->validate([
            'action' => 'required|in:publish,archive,delete',
            'ids' => 'required|array|min:1',
            'ids.*' => 'exists:partnership_products,id',
        ]);

        $products = PartnershipProduct::whereIn('id', $validated['ids'])->get();

        switch ($validated['action']) {
            case 'publish':
                foreach ($products as $product) {
                    if (!empty($product->thumbnail) && !empty($product->description) && !empty($product->registration_url)) {
                        $product->update(['status' => 'published']);
                    }
                }
                return back()->with('success', 'Produk yang valid berhasil dipublikasikan.');

            case 'archive':
                PartnershipProduct::whereIn('id', $validated['ids'])->update(['status' => 'archived']);
                return back()->with('success', 'Produk berhasil diarsipkan.');

            case 'delete':
                foreach ($products as $product) {
                    if ($product->thumbnail && Storage::disk('public')->exists($product->thumbnail)) {
                        Storage::disk('public')->delete($product->thumbnail);
                    }
                    $product->delete();
                }
                return back()->with('success', 'Produk berhasil dihapus.');

            default:
                return back()->with('error', 'Aksi tidak valid.');
        }
    }
}
