<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Course;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
        return Inertia::render('user/course/dashboard/index', ['categories' => $categories, 'courses' => $courses, 'myCourseIds' => $myCourseIds]);
    }

    public function detail(Course $course)
    {
        $course->load(['category', 'user', 'tools', 'images', 'modules.lessons.quizzes.questions']);
        return Inertia::render('user/course/detail/index', ['course' => $course]);
    }

    public function showCheckout(Course $course)
    {
        $course->load(['modules.lessons']);
        $hasAccess = false;
        if (Auth::check()) {
            $userId = Auth::id();
            $hasAccess = Invoice::where('user_id', $userId)
                ->whereIn('status', ['paid', 'completed'])
                ->whereHas('courseItems', function ($query) use ($course) {
                    $query->where('course_id', $course->id);
                })
                ->exists();
            if (!$hasAccess) {
                $pendingInvoice = Invoice::where('user_id', $userId)
                    ->where('status', 'pending')
                    ->whereHas('courseItems', function ($query) use ($course) {
                        $query->where('course_id', $course->id);
                    })
                    ->latest()
                    ->first();

                if ($pendingInvoice && $pendingInvoice->invoice_url) {
                    $pendingInvoiceUrl = $pendingInvoice->invoice_url;
                }
            }
        }
        return Inertia::render('user/course/checkout/index', ['course' => $course, 'hasAccess' => $hasAccess, 'pendingInvoiceUrl' => $pendingInvoiceUrl ?? null]);
    }

    public function showCheckoutSuccess()
    {
        return Inertia::render('user/checkout/success');
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
