<?php

namespace App\Http\Controllers;

use App\Models\AffiliateEarning;
use App\Models\Bootcamp;
use App\Models\Course;
use App\Models\EnrollmentBootcamp;
use App\Models\EnrollmentCourse;
use App\Models\EnrollmentWebinar;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\User;
use App\Models\Webinar;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    public function index()
    {
        $user = User::find(Auth::user()->id);
        $role =  $user->hasRole('admin') ? 'admin' : ($user->hasRole('affiliate') ? 'affiliate' : 'mentor');
        $stats = [];

        switch ($role) {
            case 'admin':
                $stats = $this->getAdminStats();
                break;
            case 'affiliate':
                $stats = $this->getAffiliateStats($user);
                break;
            case 'mentor':
                $stats = $this->getMentorStats($user);
                break;
        }

        return Inertia::render('admin/dashboard', [
            'stats' => $stats,
        ]);
    }

    private function getAdminStats()
    {
        return [
            'total_revenue' => Invoice::where('status', 'paid')->sum('amount'),
            'total_participants' => EnrollmentCourse::count() + EnrollmentBootcamp::count() + EnrollmentWebinar::count(),
            'new_users_last_week' => User::where('created_at', '>=', now()->subWeek())->count(),
            'total_mentors' => User::role('mentor')->count(),
            'total_affiliates' => User::role('affiliate')->count(),
            'total_courses' => Course::count(),
            'total_bootcamps' => Bootcamp::count(),
            'total_webinars' => Webinar::count(),
            'recent_sales' => Invoice::with(['user', 'courseItems.course', 'bootcampItems.bootcamp', 'webinarItems.webinar'])
                ->where('status', 'paid')->latest()->take(5)->get(),
            'popular_courses' => EnrollmentCourse::select('course_id', DB::raw('count(*) as enrollment_count'))
                ->groupBy('course_id')->orderByDesc('enrollment_count')->with('course:id,title')->take(5)->get(),
        ];
    }

    private function getAffiliateStats(User $user)
    {
        $earnings = AffiliateEarning::where('affiliate_user_id', $user->id);
        return [
            'total_commission' => $earnings->sum('amount'),
            'total_referrals' => User::where('referred_by_user_id', $user->id)->count(),
            'conversion_rate' => 0, // Data klik belum ada, jadi kita set 0
            'total_clicks' => 0, // Data klik belum ada, jadi kita set 0
            'recent_referrals' => AffiliateEarning::where('affiliate_user_id', $user->id)
                ->with(['invoice.user', 'invoice.courseItems.course', 'invoice.bootcampItems.bootcamp', 'invoice.webinarItems.webinar'])
                ->latest()->take(3)->get(),
        ];
    }

    private function getMentorStats(User $user)
    {
        $mentorCourses = Course::where('user_id', $user->id)->pluck('id');
        $studentIds = Invoice::whereHas('courseItems', function ($query) use ($mentorCourses) {
            $query->whereIn('course_id', $mentorCourses);
        })->distinct()->pluck('user_id');

        return [
            'revenue_this_month' => Invoice::whereHas('courseItems', fn($q) => $q->whereIn('course_id', $mentorCourses))
                ->where('status', 'paid')->whereMonth('created_at', now()->month)->sum('amount'),
            'total_students' => $studentIds->count(),
            'active_courses' => $mentorCourses->count(),
            'average_rating' => '4.9',
            'recent_enrollments' => EnrollmentCourse::whereIn('course_id', $mentorCourses)
                ->with(['invoice.user:id,name', 'course:id,title'])->latest()->take(3)->get(),
        ];
    }
}
