<?php

namespace App\Http\Controllers;

use App\Models\CourseRating;
use App\Models\Course;
use App\Models\EnrollmentCourse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CourseRatingController extends Controller
{
    public function store(Request $request, $courseId)
    {
        $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'review' => 'required|string|min:1|max:1000'
        ]);

        $course = Course::findOrFail($courseId);

        $enrollment = EnrollmentCourse::where('course_id', $courseId)
            ->where('progress', 100)
            ->whereHas('invoice', function ($query) {
                $query->where('user_id', Auth::id())
                    ->where('status', 'paid');
            })
            ->first();

        if (!$enrollment) {
            return redirect()->back()->with('error', 'Anda harus menyelesaikan kelas terlebih dahulu untuk memberikan rating.');
        }

        $existingRating = CourseRating::where('user_id', Auth::id())
            ->where('course_id', $courseId)
            ->first();

        if ($existingRating) {
            return redirect()->back()->with('error', 'Anda sudah memberikan rating untuk kelas ini.');
        }

        CourseRating::create([
            'user_id' => Auth::id(),
            'course_id' => $courseId,
            'rating' => $request->rating,
            'review' => $request->review,
            'status' => 'pending'
        ]);

        return redirect()->back()->with('success', 'Terima kasih! Rating Anda telah dikirim. Sertifikat kelulusan sekarang tersedia untuk diunduh.');
    }

    public function approve(CourseRating $rating)
    {
        $rating->update(['status' => 'approved']);

        return redirect()->back()->with('success', 'Rating berhasil disetujui.');
    }

    public function reject(CourseRating $rating)
    {
        $rating->update(['status' => 'rejected']);

        return redirect()->back()->with('success', 'Rating berhasil ditolak.');
    }
}
