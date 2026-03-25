<?php

namespace App\Http\Controllers;

use App\Models\EnrollmentCourse;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonAssignmentSubmission;
use App\Models\LessonCompletion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class LessonAssignmentController extends Controller
{
    public function submit(Request $request, Lesson $lesson)
    {
        if ($lesson->type !== 'assignment') {
            return response()->json([
                'success' => false,
                'message' => 'Materi ini bukan tipe penugasan.'
            ], 422);
        }

        $user = Auth::user();
        $courseId = $lesson->module?->course_id;
        $hasEnrollment = EnrollmentCourse::where('course_id', $courseId)
            ->whereHas('invoice', function ($query) use ($user) {
                $query->where('user_id', $user->id)
                    ->where('status', 'paid');
            })
            ->exists();

        if (!$hasEnrollment) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses untuk mengirim tugas pada materi ini.'
            ], 403);
        }

        $validated = $request->validate([
            'assignment_file' => 'required|file|mimes:pdf|max:10240',
        ]);

        $existingSubmission = LessonAssignmentSubmission::where('lesson_id', $lesson->id)
            ->where('user_id', $user->id)
            ->first();

        if ($existingSubmission?->file_path) {
            Storage::disk('public')->delete($existingSubmission->file_path);
        }

        $filePath = $validated['assignment_file']->store('lesson_assignments', 'public');

        $submission = LessonAssignmentSubmission::updateOrCreate(
            [
                'lesson_id' => $lesson->id,
                'user_id' => $user->id,
            ],
            [
                'file_path' => $filePath,
                'status' => 'pending',
                'admin_note' => null,
                'reviewed_by' => null,
                'reviewed_at' => null,
            ]
        );

        LessonCompletion::where('lesson_id', $lesson->id)
            ->where('user_id', $user->id)
            ->delete();

        $this->updateEnrollmentCourseProgress($user->id, $courseId);

        return response()->json([
            'success' => true,
            'message' => 'Tugas berhasil diunggah. Status: masih di cek admin.',
            'submission' => $submission,
        ]);
    }

    public function approve(LessonAssignmentSubmission $submission)
    {
        if ($submission->lesson->type !== 'assignment') {
            return back()->with('error', 'Submission ini bukan penugasan.');
        }

        $submission->update([
            'status' => 'approved',
            'reviewed_by' => Auth::id(),
            'reviewed_at' => now(),
        ]);

        LessonCompletion::updateOrCreate(
            [
                'lesson_id' => $submission->lesson_id,
                'user_id' => $submission->user_id,
            ],
            [
                'completed_at' => now(),
            ]
        );

        $courseId = $submission->lesson?->module?->course_id;
        $this->updateEnrollmentCourseProgress($submission->user_id, $courseId);

        return back()->with('success', 'Tugas berhasil di-ACC. Materi ditandai selesai untuk peserta.');
    }

    public function reject(Request $request, LessonAssignmentSubmission $submission)
    {
        if ($submission->lesson->type !== 'assignment') {
            return back()->with('error', 'Submission ini bukan penugasan.');
        }

        $validated = $request->validate([
            'admin_note' => 'nullable|string|max:1000',
        ]);

        $submission->update([
            'status' => 'rejected',
            'admin_note' => $validated['admin_note'] ?? null,
            'reviewed_by' => Auth::id(),
            'reviewed_at' => now(),
        ]);

        LessonCompletion::where('lesson_id', $submission->lesson_id)
            ->where('user_id', $submission->user_id)
            ->delete();

        $courseId = $submission->lesson?->module?->course_id;
        $this->updateEnrollmentCourseProgress($submission->user_id, $courseId);

        return back()->with('success', 'Tugas ditolak. Peserta perlu upload ulang tugas.');
    }

    private function updateEnrollmentCourseProgress(string $userId, ?string $courseId): void
    {
        if (!$courseId) {
            return;
        }

        $course = Course::where('id', $courseId)->first();
        if (!$course) {
            return;
        }

        $enrollment = EnrollmentCourse::where('course_id', $courseId)
            ->whereHas('invoice', function ($query) use ($userId) {
                $query->where('user_id', $userId)
                    ->where('status', 'paid');
            })
            ->first();

        if (!$enrollment) {
            return;
        }

        $totalLessons = $course->modules()
            ->withCount('lessons')
            ->get()
            ->sum('lessons_count');

        $completedLessons = LessonCompletion::where('user_id', $userId)
            ->whereHas('lesson.module', function ($query) use ($courseId) {
                $query->where('course_id', $courseId);
            })
            ->count();

        $progressPercentage = $totalLessons > 0 ? round(($completedLessons / $totalLessons) * 100) : 0;

        $enrollment->update([
            'progress' => $progressPercentage,
            'completed_at' => $progressPercentage >= 100 ? now() : null,
        ]);
    }
}
