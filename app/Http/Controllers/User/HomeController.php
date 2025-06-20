<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Tool;
use Illuminate\Http\Request;
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
        return Inertia::render('user/home/index', ['tools' => $tools, 'courses' => $courses,]);
    }
}
