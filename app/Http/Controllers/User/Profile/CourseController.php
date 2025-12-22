<?php

namespace App\Http\Controllers\User\Profile;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\CertificateParticipant;
use App\Models\CourseRating;
use App\Models\Invoice;
use App\Services\CertificatePdfService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CourseController extends Controller
{
    protected $pdfService;

    public function __construct(CertificatePdfService $pdfService)
    {
        $this->pdfService = $pdfService;
    }

    public function index()
    {
        $userId = Auth::id();
        $myCourses = Invoice::with('courseItems.course.category')
            ->where('user_id', $userId)
            ->where('status', 'paid')
            ->orderBy('created_at', 'desc')
            ->get();
        return Inertia::render('user/profile/course/index', ['myCourses' => $myCourses]);
    }

    public function detail($slug)
    {
        $userId = Auth::id();

        $course = Invoice::with(['courseItems' => function ($query) use ($slug) {
            $query->whereHas('course', function ($q) use ($slug) {
                $q->where('slug', $slug);
            })->with('course.category');
        }])
            ->where('user_id', $userId)
            ->where('status', 'paid')
            ->whereHas('courseItems.course', function ($query) use ($slug) {
                $query->where('slug', $slug);
            })
            ->orderBy('created_at', 'desc')
            ->first();

        if (!$course || $course->courseItems->isEmpty()) {
            abort(404, 'Kelas tidak ditemukan atau Anda belum terdaftar.');
        }

        $courseRating = null;
        $certificate = null;
        $certificateParticipant = null;

        $courseItem = $course->courseItems->first();
        $courseId = $courseItem->course_id;

        $courseRating = CourseRating::where('user_id', $userId)
            ->where('course_id', $courseId)
            ->first();

        $certificate = Certificate::where('course_id', $courseId)->first();

        if ($certificate) {
            $certificateParticipant = CertificateParticipant::where('certificate_id', $certificate->id)
                ->where('user_id', $userId)
                ->first();
        }

        return Inertia::render('user/profile/course/detail', [
            'course' => $course,
            'courseRating' => $courseRating,
            'certificate' => $certificate,
            'certificateParticipant' => $certificateParticipant
        ]);
    }

    public function downloadCertificate($slug)
    {
        try {
            $userId = Auth::id();

            $course = Invoice::with('courseItems.course')
                ->where('user_id', $userId)
                ->where('status', 'paid')
                ->whereHas('courseItems.course', function ($query) use ($slug) {
                    $query->where('slug', $slug);
                })
                ->orderBy('created_at', 'desc')
                ->first();

            if (!$course) {
                return back()->with('error', 'Course tidak ditemukan atau Anda belum terdaftar.');
            }

            $courseItem = $course->courseItems->first();
            $courseData = $courseItem->course;

            if ($courseItem->progress < 100) {
                return back()->with('error', 'Sertifikat belum tersedia. Selesaikan seluruh materi course terlebih dahulu.');
            }

            $courseRating = CourseRating::where('user_id', $userId)
                ->where('course_id', $courseData->id)
                ->first();

            if (!$courseRating) {
                return back()->with('error', 'Berikan rating dan review terlebih dahulu untuk mendapatkan sertifikat.');
            }

            $certificate = Certificate::where('course_id', $courseData->id)->first();

            if (!$certificate) {
                return back()->with('error', 'Sertifikat belum dibuat untuk course ini.');
            }

            $participant = CertificateParticipant::where('certificate_id', $certificate->id)
                ->where('user_id', $userId)
                ->first();

            if (!$participant) {
                return back()->with('error', 'Data participant sertifikat tidak ditemukan.');
            }

            $pdf = $this->pdfService->generateParticipantCertificate($participant);
            $filename = 'sertifikat-' . $participant->certificate_code . '.pdf';

            return response($pdf)
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
        } catch (\Exception $e) {
            return back()->with('error', 'Gagal mengunduh sertifikat: ' . $e->getMessage());
        }
    }

    public function previewCertificate($slug)
    {
        try {
            $userId = Auth::id();

            $course = Invoice::with('courseItems.course')
                ->where('user_id', $userId)
                ->where('status', 'paid')
                ->whereHas('courseItems.course', function ($query) use ($slug) {
                    $query->where('slug', $slug);
                })
                ->orderBy('created_at', 'desc')
                ->first();

            if (!$course) {
                return back()->with('error', 'Course tidak ditemukan atau Anda belum terdaftar.');
            }

            $courseItem = $course->courseItems->first();
            $courseData = $courseItem->course;

            if ($courseItem->progress < 100) {
                return back()->with('error', 'Sertifikat belum tersedia. Selesaikan seluruh materi course terlebih dahulu.');
            }

            $courseRating = CourseRating::where('user_id', $userId)
                ->where('course_id', $courseData->id)
                ->first();

            if (!$courseRating) {
                return back()->with('error', 'Berikan rating dan review terlebih dahulu untuk mendapatkan sertifikat.');
            }

            $certificate = Certificate::where('course_id', $courseData->id)->first();

            if (!$certificate) {
                return back()->with('error', 'Sertifikat belum dibuat untuk course ini.');
            }

            $participant = CertificateParticipant::where('certificate_id', $certificate->id)
                ->where('user_id', $userId)
                ->first();

            if (!$participant) {
                return back()->with('error', 'Data participant sertifikat tidak ditemukan.');
            }

            $pdf = $this->pdfService->generateParticipantCertificate($participant);

            return response($pdf)
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Disposition', 'inline; filename="preview-sertifikat-' . $participant->certificate_code . '.pdf"');
        } catch (\Exception $e) {
            return back()->with('error', 'Gagal memuat preview sertifikat: ' . $e->getMessage());
        }
    }
}
