<?php

namespace App\Http\Controllers\User\Profile;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\CertificateParticipant;
use App\Models\Course;
use App\Models\CourseRating;
use App\Models\EnrollmentCourse;
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

        $courseData = Course::where('slug', $slug)->firstOrFail();
        $courseId = $courseData->id;

        $invoice = Invoice::where('user_id', $userId)
            ->where('status', 'paid')
            ->where(function ($query) use ($courseId) {
                $query->whereHas('courseItems', function ($q) use ($courseId) {
                    $q->where('course_id', $courseId);
                })
                    ->orWhereHas('bundleEnrollments.bundle.bundleItems', function ($q) use ($courseId) {
                        $q->where('bundleable_type', 'App\\Models\\Course')
                            ->where('bundleable_id', $courseId);
                    });
            })
            ->with(['courseItems.course.category'])
            ->orderBy('created_at', 'desc')
            ->first();

        if (!$invoice) {
            abort(404, 'Kelas tidak ditemukan atau Anda belum terdaftar.');
        }

        $enrollmentCourse = EnrollmentCourse::whereHas('invoice', function ($q) use ($userId) {
            $q->where('user_id', $userId);
        })
            ->where('course_id', $courseId)
            ->first();

        if (!$enrollmentCourse) {
            abort(404, 'Enrollment tidak ditemukan.');
        }

        $courseItem = $invoice->courseItems->where('course_id', $courseId)->first();

        if (!$courseItem) {
            $courseItem = (object)[
                'id' => $enrollmentCourse->id,
                'invoice_id' => $invoice->id,
                'course_id' => $courseId,
                'course' => $courseData->load('category'),
                'progress' => $enrollmentCourse->progress,
                'completed_at' => $enrollmentCourse->completed_at,
                'created_at' => $enrollmentCourse->created_at,
                'updated_at' => $enrollmentCourse->updated_at,
            ];

            $invoice->setRelation('courseItems', collect([$courseItem]));
        } else {
            $courseItem->progress = $enrollmentCourse->progress;
            $courseItem->completed_at = $enrollmentCourse->completed_at;
        }

        $courseRating = CourseRating::where('user_id', $userId)
            ->where('course_id', $courseId)
            ->first();

        $certificate = Certificate::where('course_id', $courseId)->first();
        $certificateParticipant = null;

        if ($certificate) {
            $certificateParticipant = CertificateParticipant::where('certificate_id', $certificate->id)
                ->where('user_id', $userId)
                ->first();
        }

        return Inertia::render('user/profile/course/detail', [
            'course' => $invoice,
            'enrollmentCourse' => $enrollmentCourse,
            'courseRating' => $courseRating,
            'certificate' => $certificate,
            'certificateParticipant' => $certificateParticipant
        ]);
    }

    public function downloadCertificate($slug)
    {
        try {
            $userId = Auth::id();

            $courseData = Course::where('slug', $slug)->firstOrFail();
            $courseId = $courseData->id;

            $enrollmentCourse = EnrollmentCourse::whereHas('invoice', function ($q) use ($userId) {
                $q->where('user_id', $userId);
            })
                ->where('course_id', $courseId)
                ->first();

            if (!$enrollmentCourse) {
                return back()->with('error', 'Anda belum terdaftar di course ini.');
            }

            if ($enrollmentCourse->progress < 100) {
                return back()->with('error', 'Sertifikat belum tersedia. Selesaikan seluruh materi course terlebih dahulu.');
            }

            $courseRating = CourseRating::where('user_id', $userId)
                ->where('course_id', $courseId)
                ->first();

            if (!$courseRating) {
                return back()->with('error', 'Berikan rating dan review terlebih dahulu untuk mendapatkan sertifikat.');
            }

            $certificate = Certificate::where('course_id', $courseId)->first();

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

            $courseData = Course::where('slug', $slug)->firstOrFail();
            $courseId = $courseData->id;

            $enrollmentCourse = EnrollmentCourse::whereHas('invoice', function ($q) use ($userId) {
                $q->where('user_id', $userId);
            })
                ->where('course_id', $courseId)
                ->first();

            if (!$enrollmentCourse) {
                return back()->with('error', 'Anda belum terdaftar di course ini.');
            }

            if ($enrollmentCourse->progress < 100) {
                return back()->with('error', 'Sertifikat belum tersedia. Selesaikan seluruh materi course terlebih dahulu.');
            }

            $courseRating = CourseRating::where('user_id', $userId)
                ->where('course_id', $courseId)
                ->first();

            if (!$courseRating) {
                return back()->with('error', 'Berikan rating dan review terlebih dahulu untuk mendapatkan sertifikat.');
            }

            $certificate = Certificate::where('course_id', $courseId)->first();

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
