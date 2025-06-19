<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Webinar;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WebinarController extends Controller
{
    public function index()
    {
        $categories = Category::all();
        $webinars = Webinar::with(['category'])
            ->where('status', 'published')
            ->orderBy('created_at', 'desc')
            ->get();
        return Inertia::render('user/webinar/dashboard/index', ['categories' => $categories, 'webinars' => $webinars]);
    }
}
