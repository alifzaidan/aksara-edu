<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Bootcamp;
use App\Models\Bundle;
use App\Models\Course;
use App\Models\Invoice;
use App\Models\PartnershipProduct;
use App\Models\Promotion;
use App\Models\Tool;
use App\Models\Webinar;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class HomeController extends Controller
{
    public function index(Request $request)
    {
        $referralCode = $request->query('ref');

        if ($referralCode) {
            session(['referral_code' => $referralCode]);
        }

        $tools = Tool::all();

        // Ambil promotion yang aktif
        $activePromotion = Promotion::where('is_active', true)
            ->where('start_date', '<=', now())
            ->where('end_date', '>=', now())
            ->latest()
            ->first();

        // Ambil data dari ketiga model
        $courses = Course::with(['category'])
            ->where('status', 'published')
            ->orderBy('created_at', 'desc')
            ->take(6)
            ->get()
            ->map(function ($course) {
                return [
                    'id' => $course->id,
                    'title' => $course->title,
                    'thumbnail' => $course->thumbnail,
                    'slug' => $course->slug,
                    'strikethrough_price' => $course->strikethrough_price,
                    'price' => $course->price,
                    'level' => $course->level,
                    'category' => $course->category,
                    'type' => 'course',
                    'created_at' => $course->created_at,
                ];
            });

        $bootcamps = Bootcamp::with(['category'])
            ->where('status', 'published')
            ->where('start_date', '>=', now())
            ->orderBy('created_at', 'desc')
            ->take(6)
            ->get()
            ->map(function ($bootcamp) {
                return [
                    'id' => $bootcamp->id,
                    'title' => $bootcamp->title,
                    'thumbnail' => $bootcamp->thumbnail,
                    'slug' => $bootcamp->slug,
                    'strikethrough_price' => $bootcamp->strikethrough_price,
                    'price' => $bootcamp->price,
                    'start_date' => $bootcamp->start_date,
                    'end_date' => $bootcamp->end_date,
                    'category' => $bootcamp->category,
                    'type' => 'bootcamp',
                    'created_at' => $bootcamp->created_at,
                ];
            });

        $webinars = Webinar::with(['category'])
            ->where('status', 'published')
            ->where('start_time', '>=', now())
            ->orderBy('created_at', 'desc')
            ->take(6)
            ->get()
            ->map(function ($webinar) {
                return [
                    'id' => $webinar->id,
                    'title' => $webinar->title,
                    'thumbnail' => $webinar->thumbnail,
                    'slug' => $webinar->slug,
                    'strikethrough_price' => $webinar->strikethrough_price ?? 0,
                    'price' => $webinar->price,
                    'start_time' => $webinar->start_time,
                    'category' => $webinar->category,
                    'type' => 'webinar',
                    'created_at' => $webinar->created_at,
                ];
            });

        // ✅ Add Bundles - Filter expired registration deadlines
        $bundles = Bundle::with(['user', 'bundleItems'])
            ->where('status', 'published')
            ->where(function ($query) {
                $query->whereNull('registration_deadline')
                    ->orWhere('registration_deadline', '>=', now());
            })
            ->orderBy('created_at', 'desc')
            ->take(6)
            ->get()
            ->map(function ($bundle) {
                // Calculate total price from bundle items
                $totalItemsPrice = $bundle->bundleItems->sum('price');

                return [
                    'id' => $bundle->id,
                    'title' => $bundle->title,
                    'thumbnail' => $bundle->thumbnail,
                    'slug' => $bundle->slug,
                    // ✅ Use manual strikethrough if > 0, else use total items price
                    'strikethrough_price' => ($bundle->strikethrough_price > 0)
                        ? $bundle->strikethrough_price
                        : $totalItemsPrice,
                    'price' => $bundle->price,
                    'registration_deadline' => $bundle->registration_deadline,
                    'type' => 'bundle',
                    'created_at' => $bundle->created_at,
                ];
            });

        // ✅ Add Partnership Products
        $partnershipProducts = PartnershipProduct::with(['category'])
            ->where('status', 'published')
            ->orderBy('created_at', 'desc')
            ->take(6)
            ->get()
            ->map(function ($product) {
                return [
                    'id' => $product->id,
                    'title' => $product->title,
                    'thumbnail' => $product->thumbnail,
                    'slug' => $product->slug,
                    'strikethrough_price' => $product->strikethrough_price,
                    'price' => $product->price,
                    'registration_deadline' => $product->registration_deadline,
                    'duration_days' => $product->duration_days,
                    'category' => $product->category,
                    'type' => 'partnership',
                    'created_at' => $product->created_at,
                ];
            });

        // Gabungkan semua produk dan urutkan berdasarkan tanggal terbaru
        $latestProducts = collect()
            ->merge($courses)
            ->merge($bootcamps)
            ->merge($webinars)
            ->merge($bundles)
            ->merge($partnershipProducts)
            ->sortByDesc('created_at')
            ->take(6)
            ->values();

        $allProducts = collect()
            ->merge($courses)
            ->merge($bootcamps)
            ->merge($webinars)
            ->merge($bundles)
            ->merge($partnershipProducts)
            ->map(function ($product) {
                return [
                    'id' => $product['id'],
                    'title' => $product['title'],
                    'type' => $product['type'],
                    'price' => $product['price'],
                ];
            });

        $myProductIds = [
            'courses' => [],
            'bootcamps' => [],
            'webinars' => [],
            'bundles' => [],
            'partnerships' => [],
        ];

        if (Auth::check()) {
            $userId = Auth::id();

            $myCourseIds = Invoice::with('courseItems')
                ->where('user_id', $userId)
                ->where('status', 'paid')
                ->get()
                ->flatMap(function ($invoice) {
                    return $invoice->courseItems->pluck('course_id');
                })
                ->unique()
                ->values()
                ->all();

            $myBootcampIds = Invoice::with('bootcampItems')
                ->where('user_id', $userId)
                ->where('status', 'paid')
                ->get()
                ->flatMap(function ($invoice) {
                    return $invoice->bootcampItems->pluck('bootcamp_id');
                })
                ->unique()
                ->values()
                ->all();

            $myWebinarIds = Invoice::with('webinarItems')
                ->where('user_id', $userId)
                ->where('status', 'paid')
                ->get()
                ->flatMap(function ($invoice) {
                    return $invoice->webinarItems->pluck('webinar_id');
                })
                ->unique()
                ->values()
                ->all();

            $myBundleIds = Invoice::with('bundleEnrollments')
                ->where('user_id', $userId)
                ->where('status', 'paid')
                ->get()
                ->flatMap(function ($invoice) {
                    return $invoice->bundleEnrollments->pluck('bundle_id');
                })
                ->unique()
                ->values()
                ->all();

            $myPartnershipIds = [];

            $myProductIds = [
                'courses' => $myCourseIds,
                'bootcamps' => $myBootcampIds,
                'webinars' => $myWebinarIds,
                'bundles' => $myBundleIds,
                'partnerships' => $myPartnershipIds,
            ];
        }

        return Inertia::render('user/home/index', [
            'tools' => $tools,
            'latestProducts' => $latestProducts,
            'myProductIds' => $myProductIds,
            'allProducts' => $allProducts,
            'activePromotion' => $activePromotion,
            'referralInfo' => [
                'code' => session('referral_code'),
                'hasActive' => session('referral_code') && session('referral_code') !== 'ATM2025',
            ],
        ]);
    }
}
