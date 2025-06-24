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

    public function detail(Webinar $webinar)
    {
        $webinar->load(['category', 'tools']);
        return Inertia::render('user/webinar/detail/index', ['webinar' => $webinar]);
    }


    public function showRegister(Webinar $webinar)
    {
        $webinar->load(['tools']);
        return Inertia::render('user/webinar/register/index', ['webinar' => $webinar]);
    }

    public function showRegisterSuccess()
    {
        return Inertia::render('user/webinar/register/success');
    }
}
