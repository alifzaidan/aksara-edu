<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Invoice;
use App\Models\Tool;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class HomeController extends Controller
{
    public function index()
    {
        $tools = Tool::all();
        $courses = Course::with(['category'])
            ->where('status', 'published')
            ->orderBy('created_at', 'desc')
            ->take(3)
            ->get();

        $myCourseIds = [];
        if (Auth::check()) {
            $userId = Auth::id();
            $myCourseIds = Invoice::with('courseItems.course.category')
                ->where('user_id', $userId)
                ->get()
                ->flatMap(function ($invoice) {
                    return $invoice->courseItems->pluck('course_id');
                })
                ->unique()
                ->values()
                ->all();
        }
        return Inertia::render('user/home/index', ['tools' => $tools, 'courses' => $courses, 'myCourseIds' => $myCourseIds]);
    }
}
