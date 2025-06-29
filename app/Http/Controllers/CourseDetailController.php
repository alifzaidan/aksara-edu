<?php

namespace App\Http\Controllers;

use App\Models\Course;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CourseDetailController extends Controller
{
    public function index(Course $course)
    {
        $course->load(['modules.lessons']);
        return Inertia::render('user/course-detail/index', [
            'course' => $course
        ]);
    }
}
