<?php

namespace App\Http\Controllers;

use App\Models\Certificate;
use App\Models\CertificateParticipant;
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
                $participants = CertificateParticipant::where('user_id', $user->id)
                    ->with(['user', 'certificate.course', 'certificate.bootcamp', 'certificate.webinar', 'certificate.design'])
                    ->orderBy('created_at', 'desc')
                    ->get();
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

            $pdfService = app(\App\Services\CertificatePdfService::class);
            $pdf = $pdfService->generateParticipantCertificate($participant);

            $filename = 'sertifikat-' . $participant->certificate_code . '.pdf';

            return response($pdf)
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Disposition', 'inline; filename="' . $filename . '"');
        } catch (\Exception $e) {
            abort(404, 'Sertifikat tidak ditemukan: ' . $e->getMessage());
        }
    }

    public function downloadPdf($code)
    {
        try {
            $participant = CertificateParticipant::where('certificate_code', $code)
                ->firstOrFail();

            $pdfService = app(\App\Services\CertificatePdfService::class);
            $pdf = $pdfService->generateParticipantCertificate($participant);

            $filename = 'sertifikat-' . $participant->certificate_code . '.pdf';

            return response($pdf)
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
        } catch (\Exception $e) {
            abort(404, 'Sertifikat tidak ditemukan: ' . $e->getMessage());
        }
    }
}
