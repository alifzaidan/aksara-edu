<?php

namespace App\Http\Middleware;

use App\Models\Invoice;
use App\Models\Quiz;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckQuizAccess
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $quizId = $request->route('quizId');
        $user = Auth::user();

        if (!$user) {
            return redirect()->route('login');
        }

        try {
            $quiz = Quiz::with(['lesson.module.course'])->findOrFail($quizId);
            $course = $quiz->lesson->module->course;

            $isEnrolled = Invoice::where('user_id', $user->id)
                ->where('status', 'paid')
                ->whereHas('courseItems', function ($query) use ($course) {
                    $query->where('course_id', $course->id);
                })
                ->exists();

            if (!$isEnrolled) {
                return redirect()->route('course.detail', $course->slug)
                    ->with('error', 'Anda belum terdaftar di kelas ini untuk mengerjakan quiz.');
            }

            // Add quiz and course to request for use in controller
            $request->merge([
                'quiz' => $quiz,
                'course' => $course
            ]);

            return $next($request);
        } catch (\Exception $e) {
            return redirect()->route('home')
                ->with('error', 'Quiz tidak ditemukan.');
        }
    }
}
