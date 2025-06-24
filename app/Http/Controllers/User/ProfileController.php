<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Course;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ProfileController extends Controller
{
    public function index()
    {
        return Inertia::render('user/profile/index');
    }

    public function showMyCourses()
    {
        $userId = Auth::id();
        $myCourses = Invoice::with('courseItems.course.category')->where('user_id', $userId)->orderBy('created_at', 'desc')->get();
        return Inertia::render('user/profile/my-courses', ['myCourses' => $myCourses]);
    }

    public function showMyBootcamps()
    {
        $userId = Auth::id();
        $myBootcamps = Invoice::with('bootcampItems.bootcamp.category')->where('user_id', $userId)->orderBy('created_at', 'desc')->get();
        return Inertia::render('user/profile/my-bootcamps', ['myBootcamps' => $myBootcamps]);
    }

    public function showMyWebinars()
    {
        $userId = Auth::id();
        $myWebinars = Invoice::with('webinarItems.webinar.category')->where('user_id', $userId)->orderBy('created_at', 'desc')->get();
        return Inertia::render('user/profile/my-webinars', ['myWebinars' => $myWebinars]);
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
