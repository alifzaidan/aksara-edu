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
        $quiz = Quiz::with(['questions.options'])->findOrFail($quizId);
        return Inertia::render('admin/quizzes/show', ['course' => $course, 'quiz' => $quiz]);
    }
}
