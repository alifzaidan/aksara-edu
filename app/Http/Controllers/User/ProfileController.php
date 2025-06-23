<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Course;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProfileController extends Controller
{
    public function index()
    {
        return Inertia::render('user/profile/index');
    }

    public function showMyCourses()
    {
        $categories = Category::all();
        $courses = Course::with(['category'])
            ->where('status', 'published')
            ->orderBy('created_at', 'desc')
            ->get();
        return Inertia::render('user/profile/my-courses', ['categories' => $categories, 'courses' => $courses]);
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
        return Inertia::render('user/profile/transactions');
    }
}
