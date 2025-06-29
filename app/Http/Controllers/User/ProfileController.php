<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Course;
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

        $recentTransactions = Invoice::with([
            'courseItems.course:id,title,slug',
            'bootcampItems.bootcamp:id,title,slug',
            'webinarItems.webinar:id,title,slug',
        ])
            ->where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        return Inertia::render('user/profile/index', [
            'stats' => [
                'courses' => $courseCount,
                'bootcamps' => $bootcampCount,
                'webinars' => $webinarCount,
                'total' => $courseCount + $bootcampCount + $webinarCount,
            ],
            'recentTransactions' => $recentTransactions,
        ]);
    }

    public function showMyCourses()
    {
        $userId = Auth::id();
        $myCourses = Invoice::with('courseItems.course.category')->where('user_id', $userId)->orderBy('created_at', 'desc')->get();
        return Inertia::render('user/profile/course/index', ['myCourses' => $myCourses]);
    }

    public function detailMyCourse($slug)
    {
        $userId = Auth::id();
        $course = Invoice::with('courseItems.course.category')
            ->where('user_id', $userId)
            ->whereHas('courseItems.course', function ($query) use ($slug) {
                $query->where('slug', $slug);
            })
            ->first();

        return Inertia::render('user/profile/course/detail', ['course' => $course]);
    }

    public function showMyBootcamps()
    {
        $userId = Auth::id();
        $myBootcamps = Invoice::with('bootcampItems.bootcamp.category')->where('user_id', $userId)->orderBy('created_at', 'desc')->get();
        return Inertia::render('user/profile/bootcamp/index', ['myBootcamps' => $myBootcamps]);
    }

    public function detailMyBootcamp($slug)
    {
        $userId = Auth::id();
        $bootcamp = Invoice::with(['bootcampItems.bootcamp.category', 'bootcampItems.bootcamp.schedules'])
            ->where('user_id', $userId)
            ->whereHas('bootcampItems.bootcamp', function ($query) use ($slug) {
                $query->where('slug', $slug);
            })
            ->first();

        return Inertia::render('user/profile/bootcamp/detail', ['bootcamp' => $bootcamp]);
    }

    public function showMyWebinars()
    {
        $userId = Auth::id();
        $myWebinars = Invoice::with('webinarItems.webinar.category')->where('user_id', $userId)->orderBy('created_at', 'desc')->get();
        return Inertia::render('user/profile/webinar/index', ['myWebinars' => $myWebinars]);
    }

    public function detailMyWebinar($slug)
    {
        $userId = Auth::id();
        $webinar = Invoice::with('webinarItems.webinar.category')
            ->where('user_id', $userId)
            ->whereHas('webinarItems.webinar', function ($query) use ($slug) {
                $query->where('slug', $slug);
            })
            ->first();

        return Inertia::render('user/profile/webinar/detail', ['webinar' => $webinar]);
    }

    public function showTransactions()
    {
        $userId = Auth::id();
        $myTransactions = Invoice::with([
            'courseItems.course',
            'bootcampItems.bootcamp',
            'webinarItems.webinar'
        ])
            ->where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();

        return Inertia::render('user/profile/transactions', ['myTransactions' => $myTransactions]);
    }
}
