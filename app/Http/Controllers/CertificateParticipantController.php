<?php

namespace App\Http\Controllers;

use App\Models\Certificate;
use App\Models\CertificateParticipant;
use App\Models\EnrollmentWebinar;
use App\Models\EnrollmentCourse;
use App\Models\EnrollmentBootcamp;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CertificateParticipantController extends Controller
{
    public function show($code)
    {
        $participant = CertificateParticipant::where('certificate_code', $code)
            ->with(['user', 'certificate.course', 'certificate.bootcamp', 'certificate.webinar'])
            ->firstOrFail();

        return Inertia::render('admin/certificates/detail-participant', [
            'participant' => $participant
        ]);
    }

    public function checkForm(Request $request)
    {
        $email = $request->input('email');
        $phone = $request->input('phone_number');
        $participants = [];
        $searched = false;
        $error = null;

        if ($email && $phone) {
            $searched = true;
            
            // Normalize phone number: remove non-digits
            $cleanPhone = preg_replace('/[^0-9]/', '', $phone);
            if (str_starts_with($cleanPhone, '0')) {
                $cleanPhone = substr($cleanPhone, 1);
            } elseif (str_starts_with($cleanPhone, '62')) {
                $cleanPhone = substr($cleanPhone, 2);
            }

            // Find user where email matches, and phone matches the normalized phone number
            $user = User::where('email', $email)
                ->where(function ($q) use ($cleanPhone) {
                    $q->whereRaw("REPLACE(REPLACE(REPLACE(phone_number, ' ', ''), '-', ''), '+', '') = ?", [$cleanPhone])
                      ->orWhereRaw("REPLACE(REPLACE(REPLACE(phone_number, ' ', ''), '-', ''), '+', '') = ?", ['0' . $cleanPhone])
                      ->orWhereRaw("REPLACE(REPLACE(REPLACE(phone_number, ' ', ''), '-', ''), '+', '') = ?", ['62' . $cleanPhone]);
                })->first();

            if ($user) {
                // Pastikan participant records terbuat untuk webinar yang eligible
                $webinarEnrollments = EnrollmentWebinar::with(['webinar', 'invoice'])
                    ->whereHas('invoice', function ($query) use ($user) {
                        $query->where('user_id', $user->id);
                    })
                    ->get();

                foreach ($webinarEnrollments as $webinarEnrollment) {
                    if ($webinarEnrollment->canDownloadCertificate()) {
                        $cert = Certificate::where('webinar_id', $webinarEnrollment->webinar_id)->first();
                        if ($cert) {
                            CertificateParticipant::firstOrCreate([
                                'certificate_id' => $cert->id,
                                'user_id' => $user->id,
                            ]);
                        }
                    }
                }

                // Pastikan participant records terbuat untuk bootcamp yang eligible
                $bootcampEnrollments = EnrollmentBootcamp::with(['bootcamp.schedules', 'invoice', 'attendances'])
                    ->whereHas('invoice', function ($query) use ($user) {
                        $query->where('user_id', $user->id);
                    })
                    ->get();

                foreach ($bootcampEnrollments as $bootcampEnrollment) {
                    if ($bootcampEnrollment->canDownloadCertificate()) {
                        $cert = Certificate::where('bootcamp_id', $bootcampEnrollment->bootcamp_id)->first();
                        if ($cert) {
                            CertificateParticipant::firstOrCreate([
                                'certificate_id' => $cert->id,
                                'user_id' => $user->id,
                            ]);
                        }
                    }
                }

                // Pastikan participant records terbuat untuk course yang eligible
                $courseEnrollments = EnrollmentCourse::with(['invoice'])
                    ->whereHas('invoice', function ($query) use ($user) {
                        $query->where('user_id', $user->id);
                    })
                    ->get();

                foreach ($courseEnrollments as $courseEnrollment) {
                    if ($courseEnrollment->canDownloadCertificate()) {
                        $cert = Certificate::where('course_id', $courseEnrollment->course_id)->first();
                        if ($cert) {
                            CertificateParticipant::firstOrCreate([
                                'certificate_id' => $cert->id,
                                'user_id' => $user->id,
                            ]);
                        }
                    }
                }

                $participants = CertificateParticipant::where('user_id', $user->id)
                    ->with(['user', 'certificate.course', 'certificate.bootcamp', 'certificate.webinar', 'certificate.design'])
                    ->orderBy('created_at', 'desc')
                    ->get()
                    ->filter(fn($participant) => $participant->isEligible())
                    ->values();
            } else {
                $error = "Peserta dengan email dan nomor WhatsApp tersebut tidak ditemukan di sistem.";
            }
        }

        return Inertia::render('user/check-certificate', [
            'participants' => $participants,
            'searched' => $searched,
            'error' => $error,
            'filters' => [
                'email' => $email,
                'phone_number' => $phone,
            ]
        ]);
    }

    public function viewPdf($code)
    {
        try {
            $participant = CertificateParticipant::where('certificate_code', $code)
                ->firstOrFail();

            if (!$participant->isEligible()) {
                abort(403, 'Sertifikat belum memenuhi kriteria kelulusan.');
            }

            $pdfService = app(\App\Services\CertificatePdfService::class);
            $pdf = $pdfService->generateParticipantCertificate($participant);

            $filename = 'sertifikat-' . $participant->certificate_code . '.pdf';

            return response($pdf)
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Disposition', 'inline; filename="' . $filename . '"');
        } catch (\Exception $e) {
            abort($e instanceof \Symfony\Component\HttpKernel\Exception\HttpExceptionInterface ? $e->getStatusCode() : 404, $e->getMessage());
        }
    }

    public function downloadPdf($code)
    {
        try {
            $participant = CertificateParticipant::where('certificate_code', $code)
                ->firstOrFail();

            if (!$participant->isEligible()) {
                abort(403, 'Sertifikat belum memenuhi kriteria kelulusan.');
            }

            $pdfService = app(\App\Services\CertificatePdfService::class);
            $pdf = $pdfService->generateParticipantCertificate($participant);

            $filename = 'sertifikat-' . $participant->certificate_code . '.pdf';

            return response($pdf)
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
        } catch (\Exception $e) {
            abort($e instanceof \Symfony\Component\HttpKernel\Exception\HttpExceptionInterface ? $e->getStatusCode() : 404, $e->getMessage());
        }
    }
}
