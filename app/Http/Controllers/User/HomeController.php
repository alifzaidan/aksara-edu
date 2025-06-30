<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Bootcamp;
use App\Models\Course;
use App\Models\Invoice;
use App\Models\Tool;
use App\Models\Webinar;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class HomeController extends Controller
{
    public function index()
    {
        $tools = Tool::all();

        // Ambil data dari ketiga model
        $courses = Course::with(['category'])
            ->where('status', 'published')
            ->orderBy('created_at', 'desc')
            ->take(2)
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
            ->take(2)
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
            ->take(2)
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

        // Gabungkan semua produk dan urutkan berdasarkan tanggal terbaru
        $latestProducts = collect()
            ->merge($courses)
            ->merge($bootcamps)
            ->merge($webinars)
            ->sortByDesc('created_at')
            ->take(6)
            ->values();

        // Ambil ID produk yang sudah dimiliki user
        $myProductIds = [
            'courses' => [],
            'bootcamps' => [],
            'webinars' => [],
        ];

        if (Auth::check()) {
            $userId = Auth::id();

            // Course IDs
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

            // Bootcamp IDs
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

            // Webinar IDs
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

            $myProductIds = [
                'courses' => $myCourseIds,
                'bootcamps' => $myBootcampIds,
                'webinars' => $myWebinarIds,
            ];
        }

        return Inertia::render('user/home/index', [
            'tools' => $tools,
            'latestProducts' => $latestProducts,
            'myProductIds' => $myProductIds,
        ]);
    }
}
