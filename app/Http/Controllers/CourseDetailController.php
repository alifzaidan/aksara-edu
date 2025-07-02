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
            },
            'modules.lessons.completions' => function($query) use ($userId) {
                $query->where('user_id', $userId);
            }
        ]);

        // Debug: Check if questions and options are loaded
        foreach ($course->modules as $module) {
            foreach ($module->lessons as $lesson) {
                $lesson->isCompleted = $lesson->completions->isNotEmpty();
                
                // For quiz lessons, check if user has passed attempt
                if ($lesson->type === 'quiz' && $lesson->quizzes && $lesson->quizzes->count() > 0) {
                    foreach ($lesson->quizzes as $quiz) {
                        // Ensure questions and options are loaded
                        if (!$quiz->relationLoaded('questions')) {
                            $quiz->load('questions.options');
                        }
                        
                        // Check if user has passed this quiz
                        $hasPassedAttempt = $quiz->attempts && $quiz->attempts->some(function($attempt) {
                            return $attempt->is_passed;
                        });
                        
                        if ($hasPassedAttempt) {
                            $lesson->isCompleted = true;
                        }
                    }
                }
            }
        }

        return Inertia::render('user/course-detail/index', [
            'course' => $course
        ]);
    }
}
