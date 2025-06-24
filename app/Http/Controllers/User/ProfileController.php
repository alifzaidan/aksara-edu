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
        $myCourses = Invoice::with('items.course.category')->where('user_id', $userId)->orderBy('created_at', 'desc')->get();
        return Inertia::render('user/profile/my-courses', ['myCourses' => $myCourses]);
    }

    public function showMyBootcamps()
    {
        return Inertia::render('user/profile/my-bootcamps');
    }

    public function showMyWebinars()
    {
        return Inertia::render('user/profile/my-webinars');
    }

    public function showTransactions()
    {
        $userId = Auth::id();
        $myCourses = Invoice::with('items.course')->where('user_id', $userId)->orderBy('created_at', 'desc')->get();
        return Inertia::render('user/profile/transactions', ['myCourses' => $myCourses]);
    }
}
