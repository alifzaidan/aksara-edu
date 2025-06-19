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
        $course->load(['category', 'modules', 'tools']);
        return Inertia::render('user/course/detail/index', ['course' => $course]);
    }
}
