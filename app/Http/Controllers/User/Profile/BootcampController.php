<?php

namespace App\Http\Controllers\User\Profile;

use App\Http\Controllers\Controller;
use App\Models\BootcampAttendance;
use App\Models\Certificate;
use App\Models\CertificateParticipant;
use App\Models\EnrollmentBootcamp;
use App\Models\Invoice;
use App\Services\CertificatePdfService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class BootcampController extends Controller
{
    protected $pdfService;

    public function __construct(CertificatePdfService $pdfService)
    {
        $this->pdfService = $pdfService;
    }

    public function index()
    {
        $userId = Auth::id();
        $myBootcamps = Invoice::with('bootcampItems.bootcamp.category')
            ->where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->get();
        return Inertia::render('user/profile/bootcamp/index', ['myBootcamps' => $myBootcamps]);
    }

    public function detail($slug)
    {
        $userId = Auth::id();
        $bootcamp = Invoice::with([
            'bootcampItems.bootcamp.category',
            'bootcampItems.bootcamp.schedules',
            'bootcampItems.attendances.bootcampSchedule'
        ])
            ->where('user_id', $userId)
            ->whereHas('bootcampItems.bootcamp', function ($query) use ($slug) {
                $query->where('slug', $slug);
            })
            ->first();

        $certificate = null;
        $certificateParticipant = null;

        if ($bootcamp && $bootcamp->bootcampItems->isNotEmpty()) {
            $bootcampId = $bootcamp->bootcampItems->first()->bootcamp_id;

            $certificate = Certificate::where('bootcamp_id', $bootcampId)->first();

            if ($certificate) {
                $certificateParticipant = CertificateParticipant::where('certificate_id', $certificate->id)
                    ->where('user_id', $userId)
                    ->first();
            }
        }

        return Inertia::render('user/profile/bootcamp/detail', [
            'bootcamp' => $bootcamp,
            'certificate' => $certificate,
            'certificateParticipant' => $certificateParticipant
        ]);
    }

    public function uploadAttendanceProof(Request $request)
    {
        $userId = Auth::id();

        $request->validate([
            'attendance_proof' => 'required|image|mimes:jpeg,jpg,png,webp|max:5120',
            'enrollment_id' => 'required|exists:enrollment_bootcamps,id',
            'schedule_id' => 'required|exists:bootcamp_schedules,id',
            'notes' => 'nullable|string|max:500'
        ]);

        $enrollment = EnrollmentBootcamp::findOrFail($request->enrollment_id);

        if ($enrollment->invoice->user_id !== $userId) {
            abort(403);
        }

        $existingAttendance = BootcampAttendance::where('enrollment_bootcamp_id', $enrollment->id)
            ->where('bootcamp_schedule_id', $request->schedule_id)
            ->first();

        if ($request->hasFile('attendance_proof')) {
            if ($existingAttendance && $existingAttendance->attendance_proof) {
                Storage::disk('public')->delete($existingAttendance->attendance_proof);
            }

            $attendanceProofPath = $request->file('attendance_proof')->store('bootcamp-attendances', 'public');

            if ($existingAttendance) {
                $existingAttendance->update([
                    'attendance_proof' => $attendanceProofPath,
                    'verified' => true,
                    'notes' => $request->notes
                ]);
            } else {
                BootcampAttendance::create([
                    'enrollment_bootcamp_id' => $enrollment->id,
                    'bootcamp_schedule_id' => $request->schedule_id,
                    'attendance_proof' => $attendanceProofPath,
                    'verified' => true,
                    'notes' => $request->notes
                ]);
            }
        }

        return redirect()->back()->with('success', 'Bukti kehadiran berhasil diupload dan akan diverifikasi oleh tim kami.');
    }

    public function submitSubmission(Request $request)
    {
        $userId = Auth::id();

        $request->validate([
            'submission' => 'required|url|max:255',
            'enrollment_id' => 'required|exists:enrollment_bootcamps,id'
        ]);

        $enrollment = EnrollmentBootcamp::with('bootcamp')->findOrFail($request->enrollment_id);

        if ($enrollment->invoice->user_id !== $userId) {
            abort(403);
        }

        if (!$enrollment->bootcamp->has_submission_link) {
            return back()->with('error', 'Bootcamp ini tidak memerlukan submission.');
        }

        $enrollment->update([
            'submission' => $request->submission,
            'submission_verified' => true
        ]);

        return redirect()->back()->with('success', 'Link submission berhasil dikirim!');
    }

    public function submitReview(Request $request)
    {
        $userId = Auth::id();

        $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'review' => 'required|string|max:500',
            'enrollment_id' => 'required|exists:enrollment_bootcamps,id'
        ]);

        $enrollment = EnrollmentBootcamp::findOrFail($request->enrollment_id);

        if ($enrollment->invoice->user_id !== $userId) {
            abort(403);
        }

        $enrollment->update([
            'rating' => $request->rating,
            'review' => $request->review,
            'reviewed_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Rating dan review berhasil dikirim! Anda sekarang dapat mengunduh sertifikat.');
    }

    public function downloadCertificate($slug)
    {
        try {
            $userId = Auth::id();

            $bootcamp = Invoice::with(['bootcampItems.bootcamp.schedules', 'bootcampItems.attendances'])
                ->where('user_id', $userId)
                ->where('status', 'paid')
                ->whereHas('bootcampItems.bootcamp', function ($query) use ($slug) {
                    $query->where('slug', $slug);
                })
                ->first();

            if (!$bootcamp) {
                return back()->with('error', 'Bootcamp tidak ditemukan atau Anda belum terdaftar.');
            }

            $enrollment = $bootcamp->bootcampItems->first();
            $bootcampData = $enrollment->bootcamp;

            $bootcampEndDate = new \Carbon\Carbon($bootcampData->end_date);
            $bootcampEndDate->setTime(23, 59, 59);

            if ($bootcampEndDate->isFuture()) {
                return back()->with('error', 'Sertifikat belum tersedia. Bootcamp masih berlangsung.');
            }

            if (!$enrollment->canDownloadCertificate()) {
                $missing = $enrollment->getMissingRequirements();
                return back()->with('error', 'Persyaratan belum lengkap: ' . implode(', ', $missing));
            }

            $certificate = Certificate::where('bootcamp_id', $bootcampData->id)->first();

            if (!$certificate) {
                return back()->with('error', 'Sertifikat belum dibuat untuk bootcamp ini.');
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

            $bootcamp = Invoice::with(['bootcampItems.bootcamp.schedules', 'bootcampItems.attendances'])
                ->where('user_id', $userId)
                ->where('status', 'paid')
                ->whereHas('bootcampItems.bootcamp', function ($query) use ($slug) {
                    $query->where('slug', $slug);
                })
                ->first();

            if (!$bootcamp) {
                return back()->with('error', 'Bootcamp tidak ditemukan atau Anda belum terdaftar.');
            }

            $enrollment = $bootcamp->bootcampItems->first();
            $bootcampData = $enrollment->bootcamp;

            $bootcampEndDate = new \Carbon\Carbon($bootcampData->end_date);
            $bootcampEndDate->setTime(23, 59, 59);

            $schedules = $bootcampData->schedules()->orderBy('schedule_date', 'desc')->orderBy('end_time', 'desc')->first();

            if ($schedules) {
                $lastScheduleDateTime = new \Carbon\Carbon($schedules->schedule_date . ' ' . $schedules->end_time);

                if ($lastScheduleDateTime->isFuture()) {
                    return back()->with('error', 'Sertifikat belum tersedia. Bootcamp masih berlangsung.');
                }
            } else {
                return back()->with('error', 'Jadwal bootcamp tidak ditemukan.');
            }

            if (!$enrollment->canDownloadCertificate()) {
                $missing = $enrollment->getMissingRequirements();
                return back()->with('error', 'Persyaratan belum lengkap: ' . implode(', ', $missing));
            }

            $certificate = Certificate::where('bootcamp_id', $bootcampData->id)->first();

            if (!$certificate) {
                return back()->with('error', 'Sertifikat belum dibuat untuk bootcamp ini.');
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
