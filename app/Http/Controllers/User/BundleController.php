<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Bundle;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BundleController extends Controller
{
    public function index()
    {
        $bundles = Bundle::with(['bundleItems.bundleable'])
            ->where('status', 'published')
            ->where(function ($query) {
                $query->whereNull('registration_deadline')
                    ->orWhere('registration_deadline', '>=', now());
            })
            ->withCount('bundleItems')
            ->orderBy('registration_deadline', 'asc')
            ->get()
            ->map(function ($bundle) {
                $totalOriginalPrice = $bundle->bundleItems->sum('price');
                $bundle->strikethrough_price = $totalOriginalPrice;

                if (!isset($bundle->bundle_items_count)) {
                    $bundle->bundle_items_count = $bundle->bundleItems->count();
                }

                return $bundle;
            });

        return Inertia::render('user/bundling/dashboard/index', [
            'bundles' => $bundles,
        ]);
    }

    public function detail(Bundle $bundle)
    {
        if ($bundle->status !== 'published') {
            abort(404);
        }

        if ($bundle->registration_deadline && now()->gt($bundle->registration_deadline)) {
            return redirect()->route('bundle.index')->with('error', 'Pendaftaran untuk bundle ini sudah ditutup.');
        }

        $bundle->load([
            'bundleItems.bundleable',
            'user'
        ]);

        $bundle->load([
            'bundleItems' => function ($query) {
                $query->orderBy('order');
            },
            'bundleItems.bundleable' => function ($query) {
                $query->select(['id', 'title', 'slug', 'price', 'thumbnail']);
            },
            'user'
        ]);

        $bundle->bundle_items_count = $bundle->bundleItems->count();

        $totalOriginalPrice = $bundle->bundleItems->sum('price');
        $bundle->strikethrough_price = $totalOriginalPrice;

        $groupedItems = [
            'courses' => $bundle->bundleItems->filter(function ($item) {
                return $item->bundleable && str_contains($item->bundleable_type, 'Course');
            })->values(),
            'bootcamps' => $bundle->bundleItems->filter(function ($item) {
                return $item->bundleable && str_contains($item->bundleable_type, 'Bootcamp');
            })->values(),
            'webinars' => $bundle->bundleItems->filter(function ($item) {
                return $item->bundleable && str_contains($item->bundleable_type, 'Webinar');
            })->values(),
        ];

        // Calculate discount
        $discountAmount = $totalOriginalPrice - $bundle->price;
        $discountPercentage = $totalOriginalPrice > 0
            ? round(($discountAmount / $totalOriginalPrice) * 100)
            : 0;

        $relatedBundles = Bundle::with(['bundleItems.bundleable'])
            ->where('status', 'published')
            ->where('id', '!=', $bundle->id)
            ->where(function ($query) {
                $query->whereNull('registration_deadline')
                    ->orWhere('registration_deadline', '>=', now());
            })
            ->withCount('bundleItems')
            ->orderBy('registration_deadline', 'asc')
            ->limit(3)
            ->get()
            ->map(function ($bundle) {
                $totalOriginalPrice = $bundle->bundleItems->sum('price');
                $bundle->strikethrough_price = $totalOriginalPrice;

                if (!isset($bundle->bundle_items_count)) {
                    $bundle->bundle_items_count = $bundle->bundleItems->count();
                }

                return $bundle;
            });

        return Inertia::render('user/bundling/detail/index', [
            'bundle' => $bundle,
            'groupedItems' => $groupedItems,
            'totalOriginalPrice' => $totalOriginalPrice,
            'discountAmount' => $discountAmount,
            'discountPercentage' => $discountPercentage,
            'relatedBundles' => $relatedBundles,
        ]);
    }
}
