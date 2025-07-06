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
}
