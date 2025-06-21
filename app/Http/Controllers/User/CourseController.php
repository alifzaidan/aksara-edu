<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Course;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CourseController extends Controller
{
    public function index()
    {
        $categories = Category::all();
        $courses = Course::with(['category'])
            ->where('status', 'published')
            ->orderBy('created_at', 'desc')
            ->get();
        return Inertia::render('user/course/dashboard/index', ['categories' => $categories, 'courses' => $courses]);
    }

    public function detail(Course $course)
    {
        $course->load(['category', 'user', 'tools', 'images', 'modules.lessons.quizzes.questions']);
        return Inertia::render('user/course/detail/index', ['course' => $course]);
    }

    public function showCheckout(Course $course)
    {
        $course->load(['modules.lessons']);
        return Inertia::render('user/course/checkout/index', ['course' => $course]);
    }

    public function showCheckoutSuccess()
    {
        return Inertia::render('user/course/checkout/success');
    }

    // public function showCheckoutFailed()
    // {
    //     return Inertia::render('user/course/checkout/failed');
    // }

    // public function showCheckoutPending()
    // {
    //     return Inertia::render('user/course/checkout/pending');
    // }

    // public function showCheckoutCancel()
    // {
    //     return Inertia::render('user/course/checkout/cancel');
    // }
}
