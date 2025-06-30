<?php

namespace App\Http\Controllers;

use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CourseDetailController extends Controller
{
    public function index(Course $course)
    {
        $userId = Auth::id();
        
        // Jika user tidak login, redirect ke login
        if (!$userId) {
            return redirect()->route('login');
        }
        
        $course->load([
            'modules.lessons.quizzes.questions.options',
            'modules.lessons.quizzes.attempts' => function ($query) use ($userId) {
                $query->where('user_id', $userId)
                      ->with(['answers.selectedOption', 'answers.question.options'])
                      ->orderBy('created_at', 'desc');
            }
        ]);

        return Inertia::render('user/course-detail/index', [
            'course' => $course
        ]);
    }
}
