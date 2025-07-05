<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\EnrollmentCourse;
use App\Models\Course;
use App\Models\LessonCompletion;

class EnrollmentProgressController extends Controller
{
    public function updateProgress(Request $request, $courseSlug)
    {
        try {
            $user = Auth::user();
            $course = Course::where('slug', $courseSlug)->firstOrFail();
            
            // Find enrollment for this user and course
            $enrollment = EnrollmentCourse::whereHas('invoice', function($query) use ($user) {
                $query->where('user_id', $user->id);
            })->where('course_id', $course->id)->firstOrFail();

            // Get total lessons count
            $totalLessons = $course->modules()
                ->withCount('lessons')
                ->get()
                ->sum('lessons_count');

            // Get completed lessons count
            $completedLessons = LessonCompletion::where('user_id', $user->id)
                ->whereHas('lesson.module', function($query) use ($course) {
                    $query->where('course_id', $course->id);
                })
                ->count();

            // Calculate progress percentage
            $progressPercentage = $totalLessons > 0 ? round(($completedLessons / $totalLessons) * 100) : 0;

            // Update enrollment progress
            $enrollment->update([
                'progress' => $progressPercentage,
                'completed_at' => $progressPercentage >= 100 ? now() : null
            ]);

            return response()->json([
                'success' => true,
                'progress' => $progressPercentage,
                'completed_lessons' => $completedLessons,
                'total_lessons' => $totalLessons
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update progress: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getProgress($courseSlug)
    {
        try {
            $user = Auth::user();
            $course = Course::where('slug', $courseSlug)->firstOrFail();
            
            // Find enrollment for this user and course
            $enrollment = EnrollmentCourse::whereHas('invoice', function($query) use ($user) {
                $query->where('user_id', $user->id);
            })->where('course_id', $course->id)->firstOrFail();

            return response()->json([
                'success' => true,
                'progress' => $enrollment->progress,
                'completed_at' => $enrollment->completed_at
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get progress: ' . $e->getMessage()
            ], 500);
        }
    }
}
