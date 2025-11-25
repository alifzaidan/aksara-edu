<?php

namespace App\Http\Controllers;

use App\Models\Bundle;
use App\Models\BundleItem;
use App\Models\Course;
use App\Models\Bootcamp;
use App\Models\Invoice;
use App\Models\Webinar;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class BundleController extends Controller
{
    public function index()
    {
        $bundles = Bundle::with(['user', 'bundleItems.bundleable'])
            ->withCount('enrollments')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($bundle) {
                $totalOriginalPrice = $bundle->bundleItems->sum('price');
                $bundle->strikethrough_price = $totalOriginalPrice;
                return $bundle;
            });

        $totalBundles = $bundles->count();
        $publishedBundles = $bundles->where('status', 'published')->count();
        $draftBundles = $bundles->where('status', 'draft')->count();
        $archivedBundles = $bundles->where('status', 'archived')->count();

        $bundlesWithCourses = 0;
        $bundlesWithBootcamps = 0;
        $bundlesWithWebinars = 0;

        foreach ($bundles as $bundle) {
            $items = $bundle->bundleItems;
            $hasCourse = $items->contains(fn($item) => str_contains($item->bundleable_type, 'Course'));
            $hasBootcamp = $items->contains(fn($item) => str_contains($item->bundleable_type, 'Bootcamp'));
            $hasWebinar = $items->contains(fn($item) => str_contains($item->bundleable_type, 'Webinar'));

            if ($hasCourse) $bundlesWithCourses++;
            if ($hasBootcamp) $bundlesWithBootcamps++;
            if ($hasWebinar) $bundlesWithWebinars++;
        }

        $totalItems = 0;
        foreach ($bundles as $bundle) {
            $totalItems += $bundle->bundleItems->count();
        }
        $averageItemsPerBundle = $totalBundles > 0 ? round($totalItems / $totalBundles, 1) : 0;

        $totalSales = $bundles->sum('enrollments_count');

        $bundleIds = $bundles->pluck('id');
        $totalRevenue = Invoice::where('status', 'paid')
            ->whereHas('bundleEnrollments', function ($query) use ($bundleIds) {
                $query->whereIn('bundle_id', $bundleIds);
            })
            ->sum('nett_amount');

        $totalSavings = 0;
        foreach ($bundles as $bundle) {
            $originalPrice = $bundle->strikethrough_price;
            $bundlePrice = $bundle->price;
            $savings = $originalPrice - $bundlePrice;
            $totalSavings += ($savings * ($bundle->enrollments_count ?? 0));
        }

        $statistics = [
            'overview' => [
                'total_bundles' => $totalBundles,
                'published_bundles' => $publishedBundles,
                'draft_bundles' => $draftBundles,
                'archived_bundles' => $archivedBundles,
            ],
            'content' => [
                'with_courses' => $bundlesWithCourses,
                'with_bootcamps' => $bundlesWithBootcamps,
                'with_webinars' => $bundlesWithWebinars,
                'average_items' => $averageItemsPerBundle,
            ],
            'performance' => [
                'total_sales' => $totalSales,
                'total_revenue' => $totalRevenue,
                'total_savings' => $totalSavings,
            ],
        ];

        return Inertia::render('admin/bundles/index', [
            'bundles' => $bundles,
            'statistics' => $statistics,
        ]);
    }

    public function create()
    {
        $now = now();

        $courses = Course::where('status', 'published')
            ->select('id', 'title', 'price', 'slug')
            ->orderBy('price', 'desc')
            ->get();

        $bootcamps = Bootcamp::where('status', 'published')
            ->where(function ($query) use ($now) {
                $query->whereNull('registration_deadline')
                    ->orWhere('registration_deadline', '>=', $now);
            })
            ->select('id', 'title', 'price', 'slug', 'registration_deadline')
            ->orderBy('price', 'desc')
            ->get();

        $webinars = Webinar::where('status', 'published')
            ->where(function ($query) use ($now) {
                $query->whereNull('registration_deadline')
                    ->orWhere('registration_deadline', '>=', $now);
            })
            ->select('id', 'title', 'price', 'slug', 'registration_deadline')
            ->orderBy('price', 'desc')
            ->get();

        return Inertia::render('admin/bundles/create', [
            'courses' => $courses,
            'bootcamps' => $bootcamps,
            'webinars' => $webinars,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'short_description' => 'nullable|string|max:500',
            'description' => 'nullable|string',
            'benefits' => 'nullable|string',
            'thumbnail' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'price' => 'required|integer|min:0',
            'registration_deadline' => 'nullable|date',
            'items' => 'required|array|min:2',
            'items.*.type' => 'required|in:course,bootcamp,webinar',
            'items.*.id' => 'required|uuid',
            'items.*.price' => 'required|integer|min:0',
        ]);

        $hasPaidItem = collect($validated['items'])->contains(function ($item) {
            return $item['price'] > 0;
        });

        if (!$hasPaidItem) {
            return back()->withErrors([
                'items' => 'Minimal harus ada 1 produk berbayar dalam bundle'
            ])->withInput();
        }

        $totalOriginalPrice = collect($validated['items'])->sum('price');

        if ($validated['price'] > $totalOriginalPrice) {
            return back()->withErrors([
                'price' => 'Harga bundle tidak boleh melebihi total harga normal (' . number_format($totalOriginalPrice, 0, ',', '.') . ')'
            ])->withInput();
        }

        DB::beginTransaction();
        try {
            $slug = Str::slug($validated['title']);
            $originalSlug = $slug;
            $counter = 1;
            while (Bundle::where('slug', $slug)->exists()) {
                $slug = $originalSlug . '-' . $counter++;
            }

            $thumbnailPath = null;
            if ($request->hasFile('thumbnail')) {
                $thumbnailPath = $request->file('thumbnail')->store('bundles', 'public');
            }

            $bundle = Bundle::create([
                'user_id' => Auth::user()->id,
                'title' => $validated['title'],
                'slug' => $slug,
                'short_description' => $validated['short_description'] ?? null,
                'description' => $validated['description'] ?? null,
                'benefits' => $validated['benefits'] ?? null,
                'thumbnail' => $thumbnailPath,
                'price' => $validated['price'],
                'registration_deadline' => $validated['registration_deadline'] ?? null,
                'bundle_url' => url('/bundle/' . $slug),
                'registration_url' => url('/bundle/' . $slug . '/checkout'),
                'status' => 'draft',
            ]);

            foreach ($validated['items'] as $index => $item) {
                $bundleable = $this->getBundleableModel($item['type'], $item['id']);

                if (!$bundleable) {
                    throw new \Exception("Item {$item['type']} tidak ditemukan");
                }

                BundleItem::create([
                    'bundle_id' => $bundle->id,
                    'bundleable_type' => get_class($bundleable),
                    'bundleable_id' => $bundleable->id,
                    'order' => $index,
                    'price' => $bundleable->price,
                ]);
            }

            DB::commit();

            return redirect()->route('bundles.show', $bundle->id)
                ->with('success', 'Bundle berhasil dibuat!');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Bundle creation failed: ' . $e->getMessage());

            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function show(Bundle $bundle)
    {
        $bundle->load([
            'user',
            'bundleItems.bundleable',
            'enrollments.invoice.user'
        ]);

        $validItems = $bundle->bundleItems->filter(function ($item) {
            return $item->bundleable !== null;
        });

        $groupedItems = [
            'courses' => $validItems->filter(function ($item) {
                return str_contains($item->bundleable_type, 'Course');
            })->values(),
            'bootcamps' => $validItems->filter(function ($item) {
                return str_contains($item->bundleable_type, 'Bootcamp');
            })->values(),
            'webinars' => $validItems->filter(function ($item) {
                return str_contains($item->bundleable_type, 'Webinar');
            })->values(),
        ];

        $totalOriginalPrice = $validItems->sum('price');
        $discountAmount = $totalOriginalPrice - $bundle->price;
        $discountPercentage = $totalOriginalPrice > 0
            ? round(($discountAmount / $totalOriginalPrice) * 100)
            : 0;

        return Inertia::render('admin/bundles/show', [
            'bundle' => $bundle,
            'groupedItems' => $groupedItems,
            'totalOriginalPrice' => $totalOriginalPrice,
            'discountAmount' => $discountAmount,
            'discountPercentage' => $discountPercentage,
        ]);
    }

    public function edit(Bundle $bundle)
    {
        $bundle->load('bundleItems.bundleable');

        $now = now();

        $courses = Course::where('status', 'published')
            ->select('id', 'title', 'price', 'slug')
            ->orderBy('price', 'desc')
            ->get();

        $bootcamps = Bootcamp::where('status', 'published')
            ->where(function ($query) use ($now) {
                $query->whereNull('registration_deadline')
                    ->orWhere('registration_deadline', '>=', $now);
            })
            ->select('id', 'title', 'price', 'slug', 'registration_deadline')
            ->orderBy('price', 'desc')
            ->get();

        $webinars = Webinar::where('status', 'published')
            ->where(function ($query) use ($now) {
                $query->whereNull('registration_deadline')
                    ->orWhere('registration_deadline', '>=', $now);
            })
            ->select('id', 'title', 'price', 'slug', 'registration_deadline')
            ->orderBy('price', 'desc')
            ->get();

        return Inertia::render('admin/bundles/edit', [
            'bundle' => $bundle,
            'courses' => $courses,
            'bootcamps' => $bootcamps,
            'webinars' => $webinars,
        ]);
    }

    public function update(Request $request, Bundle $bundle)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'short_description' => 'nullable|string|max:500',
            'description' => 'nullable|string',
            'benefits' => 'nullable|string',
            'thumbnail' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'price' => 'required|integer|min:0',
            'registration_deadline' => 'nullable|date',
            'items' => 'required|array|min:2',
            'items.*.type' => 'required|in:course,bootcamp,webinar',
            'items.*.id' => 'required|uuid',
            'items.*.price' => 'required|integer|min:0',
        ]);

        $hasPaidItem = collect($validated['items'])->contains(function ($item) {
            return $item['price'] > 0;
        });

        if (!$hasPaidItem) {
            return back()->withErrors([
                'items' => 'Minimal harus ada 1 produk berbayar dalam bundle'
            ])->withInput();
        }

        $totalOriginalPrice = collect($validated['items'])->sum('price');

        if ($validated['price'] > $totalOriginalPrice) {
            return back()->withErrors([
                'price' => 'Harga bundle tidak boleh melebihi total harga normal (' . number_format($totalOriginalPrice, 0, ',', '.') . ')'
            ])->withInput();
        }

        DB::beginTransaction();
        try {
            $slug = $bundle->slug;
            if ($validated['title'] !== $bundle->title) {
                $slug = Str::slug($validated['title']);
                $originalSlug = $slug;
                $counter = 1;
                while (Bundle::where('slug', $slug)->where('id', '!=', $bundle->id)->exists()) {
                    $slug = $originalSlug . '-' . $counter++;
                }
            }

            if ($request->hasFile('thumbnail')) {
                if ($bundle->thumbnail) {
                    Storage::disk('public')->delete($bundle->thumbnail);
                }
                $thumbnailPath = $request->file('thumbnail')->store('bundles', 'public');
            } else {
                $thumbnailPath = $bundle->thumbnail;
            }

            $bundle->update([
                'title' => $validated['title'],
                'slug' => $slug,
                'short_description' => $validated['short_description'] ?? null,
                'description' => $validated['description'] ?? null,
                'benefits' => $validated['benefits'] ?? null,
                'thumbnail' => $thumbnailPath,
                'price' => $validated['price'],
                'registration_deadline' => $validated['registration_deadline'] ?? null,
                'bundle_url' => url('/bundle/' . $slug),
                'registration_url' => url('/bundle/' . $slug . '/checkout'),
            ]);

            $bundle->bundleItems()->delete();

            foreach ($validated['items'] as $index => $item) {
                $bundleable = $this->getBundleableModel($item['type'], $item['id']);

                if (!$bundleable) {
                    throw new \Exception("Item {$item['type']} tidak ditemukan");
                }

                BundleItem::create([
                    'bundle_id' => $bundle->id,
                    'bundleable_type' => get_class($bundleable),
                    'bundleable_id' => $bundleable->id,
                    'order' => $index,
                    'price' => $bundleable->price,
                ]);
            }

            DB::commit();

            return redirect()->route('bundles.show', $bundle->id)
                ->with('success', 'Bundle berhasil diupdate!');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Bundle update failed: ' . $e->getMessage());

            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function destroy(Bundle $bundle)
    {
        if ($bundle->enrollments()->exists()) {
            return back()->withErrors(['error' => 'Bundle tidak dapat dihapus karena sudah memiliki pembelian']);
        }

        DB::beginTransaction();
        try {
            if ($bundle->thumbnail) {
                Storage::disk('public')->delete($bundle->thumbnail);
            }

            $bundle->delete();

            DB::commit();

            return redirect()->route('bundles.index')
                ->with('success', 'Bundle berhasil dihapus!');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Bundle deletion failed: ' . $e->getMessage());

            return back()->withErrors(['error' => 'Gagal menghapus bundle']);
        }
    }

    public function publish(Bundle $bundle)
    {
        $bundle->update(['status' => 'published']);

        return back()->with('success', 'Bundle berhasil dipublish!');
    }

    public function archive(Bundle $bundle)
    {
        $bundle->update(['status' => 'archived']);

        return back()->with('success', 'Bundle berhasil diarsipkan!');
    }

    public function duplicate(Bundle $bundle)
    {
        DB::beginTransaction();
        try {
            $newBundle = $bundle->replicate();
            $newBundle->title = $bundle->title . ' (Copy)';

            $slug = Str::slug($newBundle->title);
            $originalSlug = $slug;
            $counter = 1;
            while (Bundle::where('slug', $slug)->exists()) {
                $slug = $originalSlug . '-' . $counter++;
            }

            $newBundle->slug = $slug;
            $newBundle->status = 'draft';
            $newBundle->bundle_url = url('/bundle/' . $slug);
            $newBundle->registration_url = url('/bundle/' . $slug . '/checkout');

            if ($bundle->thumbnail && Storage::disk('public')->exists($bundle->thumbnail)) {
                $originalPath = $bundle->thumbnail;
                $extension = pathinfo($originalPath, PATHINFO_EXTENSION);
                $newFileName = 'bundles/' . uniqid('copy_') . '.' . $extension;
                Storage::disk('public')->copy($originalPath, $newFileName);
                $newBundle->thumbnail = $newFileName;
            }

            $newBundle->save();

            foreach ($bundle->bundleItems as $item) {
                BundleItem::create([
                    'bundle_id' => $newBundle->id,
                    'bundleable_type' => $item->bundleable_type,
                    'bundleable_id' => $item->bundleable_id,
                    'order' => $item->order,
                    'price' => $item->price,
                ]);
            }

            DB::commit();

            return redirect()->route('bundles.edit', $newBundle->id)
                ->with('success', 'Bundle berhasil diduplikasi!');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Bundle duplication failed: ' . $e->getMessage());

            return back()->withErrors(['error' => 'Gagal menduplikasi bundle']);
        }
    }

    private function getBundleableModel(string $type, string $id)
    {
        return match ($type) {
            'course' => Course::find($id),
            'bootcamp' => Bootcamp::find($id),
            'webinar' => Webinar::find($id),
            default => null,
        };
    }
}
