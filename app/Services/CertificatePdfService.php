<?php

namespace App\Services;

use App\Models\Certificate;
use App\Models\CertificateParticipant;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class CertificatePdfService
{
    private $dompdf;

    public function __construct()
    {
        $options = new Options();
        $options->set('defaultFont', 'DejaVu Sans');
        $options->set('isRemoteEnabled', true);
        $options->set('isHtml5ParserEnabled', true);
        $options->set('isFontSubsettingEnabled', true);
        $options->set('debugKeepTemp', false);
        $options->set('debugCss', false);
        $options->set('tempDir', storage_path('app/temp'));
        $options->set('dpi', 250);

        // Enable local file access
        $options->set('chroot', [
            public_path(),
            storage_path('app/public'),
            base_path()
        ]);

        $this->dompdf = new Dompdf($options);
    }

    public function generatePreview(Certificate $certificate)
    {
        try {
            // Load relations yang diperlukan
            $certificate->load(['design', 'sign', 'course', 'bootcamp', 'webinar']);

            // Log untuk debugging
            if ($certificate->design && $certificate->design->image_1) {
                $imagePath = storage_path('app/public/' . $certificate->design->image_1);
                Log::info('Background image path: ' . $imagePath);
                Log::info('File exists: ' . (file_exists($imagePath) ? 'Yes' : 'No'));
            }

            // Data dummy untuk preview
            $dummyData = [
                'participant_name' => 'John Doe',
                'certificate_code' => 'AKS-25AHBEFJ',
                'certificate_number' => '0001',
                'completion_date' => now()->format('d F Y'),
                'program_name' => $this->getProgramName($certificate),
                'program_type' => $this->getProgramType($certificate)
            ];

            $html = $this->generateHtml($certificate, $dummyData);

            $this->dompdf->loadHtml($html);
            $this->dompdf->setPaper('A4', 'landscape');
            $this->dompdf->render();

            return $this->dompdf->output();
        } catch (\Exception $e) {
            Log::error('Error generating certificate preview: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            throw $e;
        }
    }

    public function generateParticipantCertificate(CertificateParticipant $participant)
    {
        try {
            $certificate = $participant->certificate;

            // Load relations yang diperlukan
            $certificate->load(['design', 'sign', 'course', 'bootcamp', 'webinar']);
            $participant->load(['user']);

            $participantData = [
                'participant_name' => $participant->user->name,
                'certificate_code' => $participant->certificate_code,
                'certificate_number' => str_pad($participant->certificate_number, 4, '0', STR_PAD_LEFT),
                'completion_date' => $participant->created_at->format('d F Y'),
                'program_name' => $this->getProgramName($certificate),
                'program_type' => $this->getProgramType($certificate)
            ];

            $html = $this->generateHtml($certificate, $participantData);

            $this->dompdf->loadHtml($html);
            $this->dompdf->setPaper('A4', 'landscape');
            $this->dompdf->render();

            return $this->dompdf->output();
        } catch (\Exception $e) {
            Log::error('Error generating participant certificate: ' . $e->getMessage());
            throw $e;
        }
    }

    private function generateHtml(Certificate $certificate, array $data)
    {
        return View::make('certificates.template', [
            'certificate' => $certificate,
            'data' => $data
        ])->render();
    }

    private function getProgramName(Certificate $certificate)
    {
        if ($certificate->course) {
            return $certificate->course->title;
        } elseif ($certificate->bootcamp) {
            return $certificate->bootcamp->title;
        } elseif ($certificate->webinar) {
            return $certificate->webinar->title;
        }

        return 'Program Tidak Diketahui';
    }

    private function getProgramType(Certificate $certificate)
    {
        if ($certificate->course) {
            return 'Kelas Online';
        } elseif ($certificate->bootcamp) {
            return 'Bootcamp';
        } elseif ($certificate->webinar) {
            return 'Webinar';
        }

        return 'Program';
    }
}
