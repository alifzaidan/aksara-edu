<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Quiz;
use Illuminate\Http\Request;
use Inertia\Inertia;

class QuizController extends Controller
{
    public function show(string $courseId, string $quizId)
    {
        $course = Course::with(['modules.lessons.quizzes'])->findOrFail($courseId);
        $user = auth()->user();
        if ($user && $user->hasRole('mentor') && $course->user_id !== $user->id) {
            abort(403, 'Anda hanya dapat mengakses kuis pada kelas milik Anda sendiri.');
        }
        $quiz = Quiz::with(['questions.options'])->findOrFail($quizId);
        $submissions = $quiz->attempts()->with('user')->orderByDesc('score')->orderByDesc('submitted_at')->get()
            ->unique('user_id')
            ->values()
            ->map(function ($attempt) {
                return [
                    'id' => $attempt->id,
                    'user_name' => $attempt->user?->name ?? '-',
                    'user_email' => $attempt->user?->email ?? '-',
                    'score' => $attempt->score,
                    'is_passed' => $attempt->is_passed,
                    'submitted_at' => $attempt->submitted_at?->toIso8601String(),
                ];
            });
        return Inertia::render('admin/quizzes/show', [
            'course' => $course,
            'quiz' => $quiz,
            'submissions' => $submissions,
        ]);
    }
}
