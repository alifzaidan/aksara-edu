<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Lesson;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CourseDetailController extends Controller
{
    public function index(Course $course)
    {
        $userId = Auth::id();

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
            'modules.lessons.completions' => function ($query) use ($userId) {
                $query->where('user_id', $userId);
            }
        ]);

        $lastCompletedLesson = null;
        $lastCompletedAt = null;
        $nextIncompleteLesson = null;
        $allLessonsInOrder = [];

        foreach ($course->modules as $module) {
            foreach ($module->lessons as $lesson) {
                // Determine if lesson is completed
                $isCompleted = false;
                $completedAt = null;

                // Check lesson completion table
                if ($lesson->completions && $lesson->completions->count() > 0) {
                    $isCompleted = true;
                    $completedAt = $lesson->completions->first()->completed_at;
                }

                // For quiz lessons, also check if user has passed attempt
                if ($lesson->type === 'quiz' && $lesson->quizzes && $lesson->quizzes->count() > 0) {
                    foreach ($lesson->quizzes as $quiz) {
                        // Check if user has any attempts
                        $allAttempts = $quiz->attempts ?? collect();
                        $hasAttempts = $allAttempts->count() > 0;
                        $hasPassedAttempt = $allAttempts->some(function ($attempt) {
                            return $attempt->is_passed;
                        });

                        // Quiz is completed if user has passed
                        if ($hasPassedAttempt) {
                            $isCompleted = true;
                            // Get the completion date from passed attempt
                            $passedAttempt = $allAttempts->first(function ($attempt) {
                                return $attempt->is_passed;
                            });
                            if ($passedAttempt && $passedAttempt->submitted_at) {
                                $attemptCompletedAt = \Carbon\Carbon::parse($passedAttempt->submitted_at);
                                if (!$completedAt || $attemptCompletedAt->gt($completedAt)) {
                                    $completedAt = $attemptCompletedAt;
                                }
                            }
                        }
                    }
                }

                $lesson->isCompleted = $isCompleted;
                $allLessonsInOrder[] = [
                    'lesson' => $lesson,
                    'is_completed' => $isCompleted,
                    'completed_at' => $completedAt
                ];

                // Track last completed lesson by date
                if ($isCompleted && $completedAt) {
                    if (!$lastCompletedAt || $completedAt->gt($lastCompletedAt)) {
                        $lastCompletedLesson = $lesson;
                        $lastCompletedAt = $completedAt;
                    }
                }

                // Track first incomplete lesson (in order)
                if (!$isCompleted && !$nextIncompleteLesson) {
                    $nextIncompleteLesson = $lesson;
                }
            }
        }

        // Determine which lesson to auto-select
        $autoSelectLesson = null;

        // Priority 1: First incomplete lesson (continue learning)
        if ($nextIncompleteLesson) {
            $autoSelectLesson = $nextIncompleteLesson;
        }
        // Priority 2: Last completed lesson (if all completed or user wants to review)
        else if ($lastCompletedLesson) {
            $autoSelectLesson = $lastCompletedLesson;
        }
        // Priority 3: First lesson as fallback
        else if (count($allLessonsInOrder) > 0) {
            $autoSelectLesson = $allLessonsInOrder[0]['lesson'];
        }

        return Inertia::render('user/course-detail/index', [
            'course' => $course,
            'auto_select_lesson_id' => $autoSelectLesson ? $autoSelectLesson->id : null,
            'progress_info' => [
                'has_completed_lessons' => $lastCompletedLesson !== null,
                'has_incomplete_lessons' => $nextIncompleteLesson !== null,
                'last_completed_lesson_id' => $lastCompletedLesson ? $lastCompletedLesson->id : null,
                'next_incomplete_lesson_id' => $nextIncompleteLesson ? $nextIncompleteLesson->id : null,
            ]
        ]);
    }

    public function showQuiz(Course $course, Lesson $lesson)
    {
        $userId = Auth::id();

        // Jika user tidak login, redirect ke login
        if (!$userId) {
            return redirect()->route('login');
        }

        // Pastikan lesson adalah tipe quiz
        if ($lesson->type !== 'quiz') {
            return redirect()->route('learn.course.detail', $course->slug);
        }

        // Get the quiz from the lesson
        $quiz = $lesson->quizzes()->first();

        if (!$quiz) {
            return redirect()->route('learn.course.detail', $course->slug)
                ->with('error', 'Quiz tidak ditemukan untuk materi ini.');
        }

        // Redirect to the new quiz route structure
        return redirect()->route('quiz.show', $quiz->id);
    }
}
