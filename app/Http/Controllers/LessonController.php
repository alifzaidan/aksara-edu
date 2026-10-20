<?php

namespace App\Http\Controllers;

use App\Models\Lesson;
use App\Models\LessonCompletion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LessonController extends Controller
{
    public function markComplete(Request $request, Lesson $lesson)
    {
        $user = Auth::user();

        if ($lesson->type === 'assignment') {
            return response()->json([
                'success' => false,
                'message' => 'Penugasan harus disetujui admin terlebih dahulu.'
            ], 422);
        }

        // Check if already completed
        $completion = LessonCompletion::where('user_id', $user->id)
            ->where('lesson_id', $lesson->id)
            ->first();

        if (!$completion) {
            LessonCompletion::create([
                'user_id' => $user->id,
                'lesson_id' => $lesson->id,
                'completed_at' => now()
            ]);
        }

        // Auto-update enrollment progress in the background
        $this->updateCourseProgress($user->id, $lesson);

        return response()->json([
            'success' => true,
            'message' => 'Materi berhasil diselesaikan!'
        ]);
    }

    private function updateCourseProgress(string $userId, Lesson $lesson): void
    {
        try {
            $course = $lesson->module?->course;
            if (!$course) {
                $lesson->load('module.course');
                $course = $lesson->module?->course;
            }

            if (!$course) {
                return;
            }

            $enrollment = \App\Models\EnrollmentCourse::where('course_id', $course->id)
                ->whereHas('invoice', function ($query) use ($userId) {
                    $query->purchasedByUser($userId);
                })
                ->latest('created_at')
                ->first();

            if (!$enrollment) {
                $enrollment = \App\Models\EnrollmentCourse::where('course_id', $course->id)
                    ->whereHas('invoice', function ($query) use ($userId) {
                        $query->where('user_id', $userId);
                    })
                    ->latest('created_at')
                    ->first();
            }

            if (!$enrollment) {
                return;
            }

            $totalLessons = $course->modules()
                ->withCount('lessons')
                ->get()
                ->sum('lessons_count');

            $completedLessons = LessonCompletion::where('user_id', $userId)
                ->whereHas('lesson.module', function ($query) use ($course) {
                    $query->where('course_id', $course->id);
                })
                ->count();

            $progressPercentage = $totalLessons > 0 ? round(($completedLessons / $totalLessons) * 100) : 0;

            $enrollment->update([
                'progress' => $progressPercentage,
                'completed_at' => $progressPercentage >= 100 ? ($enrollment->completed_at ?? now()) : null
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Failed to auto-update course progress in LessonController: ' . $e->getMessage());
        }
    }
}
