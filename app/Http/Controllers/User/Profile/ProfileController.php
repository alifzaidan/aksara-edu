<?php

namespace App\Http\Controllers\User\Profile;

use App\Http\Controllers\Controller;
use App\Models\EnrollmentBootcamp;
use App\Models\EnrollmentCourse;
use App\Models\EnrollmentWebinar;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ProfileController extends Controller
{
    public function index()
    {
        $userId = Auth::id();

        $courseCount = EnrollmentCourse::whereHas('invoice', function ($query) use ($userId) {
            $query->where('user_id', $userId)->where('status', 'paid');
        })->count();

        $bootcampCount = EnrollmentBootcamp::whereHas('invoice', function ($query) use ($userId) {
            $query->where('user_id', $userId)->where('status', 'paid');
        })->count();

        $webinarCount = EnrollmentWebinar::whereHas('invoice', function ($query) use ($userId) {
            $query->where('user_id', $userId)->where('status', 'paid');
        })->count();

        // Ambil enrollment courses dengan progress
        $enrolledCourses = EnrollmentCourse::with(['course:id,title,slug', 'invoice'])
            ->whereHas('invoice', function ($query) use ($userId) {
                $query->where('user_id', $userId)->where('status', 'paid');
            })
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($enrollment) {
                return [
                    'id' => $enrollment->course->id,
                    'title' => $enrollment->course->title,
                    'slug' => $enrollment->course->slug,
                    'type' => 'course',
                    'progress' => $enrollment->progress,
                    'completed_at' => $enrollment->completed_at,
                    'enrolled_at' => $enrollment->created_at,
                ];
            });

        // Ambil enrollment bootcamps dengan jadwal dan group URL
        $enrolledBootcamps = EnrollmentBootcamp::with(['bootcamp:id,title,slug,start_date,end_date,group_url', 'invoice'])
            ->whereHas('invoice', function ($query) use ($userId) {
                $query->where('user_id', $userId)->where('status', 'paid');
            })
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($enrollment) {
                return [
                    'id' => $enrollment->bootcamp->id,
                    'title' => $enrollment->bootcamp->title,
                    'slug' => $enrollment->bootcamp->slug,
                    'type' => 'bootcamp',
                    'start_date' => $enrollment->bootcamp->start_date,
                    'end_date' => $enrollment->bootcamp->end_date,
                    'group_url' => $enrollment->bootcamp->group_url,
                    'enrolled_at' => $enrollment->created_at,
                ];
            });

        // Ambil enrollment webinars dengan jadwal dan group URL
        $enrolledWebinars = EnrollmentWebinar::with(['webinar:id,title,slug,start_time,end_time,group_url', 'invoice'])
            ->whereHas('invoice', function ($query) use ($userId) {
                $query->where('user_id', $userId)->where('status', 'paid');
            })
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($enrollment) {
                return [
                    'id' => $enrollment->webinar->id,
                    'title' => $enrollment->webinar->title,
                    'slug' => $enrollment->webinar->slug,
                    'type' => 'webinar',
                    'start_time' => $enrollment->webinar->start_time,
                    'end_time' => $enrollment->webinar->end_time,
                    'group_url' => $enrollment->webinar->group_url,
                    'enrolled_at' => $enrollment->created_at,
                ];
            });

        // Gabungkan semua produk dan urutkan berdasarkan tanggal enrollment
        $recentProducts = collect()
            ->merge($enrolledCourses)
            ->merge($enrolledBootcamps)
            ->merge($enrolledWebinars)
            ->sortByDesc('enrolled_at')
            ->take(10)
            ->values();

        return Inertia::render('user/profile/index', [
            'stats' => [
                'courses' => $courseCount,
                'bootcamps' => $bootcampCount,
                'webinars' => $webinarCount,
                'total' => $courseCount + $bootcampCount + $webinarCount,
            ],
            'recentProducts' => $recentProducts,
        ]);
    }
}
