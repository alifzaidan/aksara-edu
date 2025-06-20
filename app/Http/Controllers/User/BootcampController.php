<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Bootcamp;
use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BootcampController extends Controller
{
    public function index()
    {
        $categories = Category::all();
        $bootcamps = Bootcamp::with(['category'])
            ->where('status', 'published')
            ->orderBy('created_at', 'desc')
            ->get();
        return Inertia::render('user/bootcamp/dashboard/index', ['categories' => $categories, 'bootcamps' => $bootcamps]);
    }

    public function detail(Bootcamp $bootcamp)
    {
        $bootcamp->load(['category', 'schedules', 'tools']);
        return Inertia::render('user/bootcamp/detail/index', ['bootcamp' => $bootcamp]);
    }
}
