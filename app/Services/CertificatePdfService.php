<?php

namespace App\Services;

use App\Models\Certificate;
use App\Models\CertificateParticipant;
use Dompdf\Dompdf;
use Dompdf\Options;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Facades\Log;
use Milon\Barcode\DNS2D;

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
            $certificate->load(['design', 'sign', 'course', 'bootcamp', 'webinar']);

            if ($certificate->design && $certificate->design->image_1) {
                $imagePath = storage_path('app/public/' . $certificate->design->image_1);
            }

            // Data dummy untuk preview
            $dummyData = [
                'participant_name' => 'Aksademy',
                'certificate_code' => 'AKS-25AHBEFJ',
                'participant_issued_at' => now(),
                'certificate_number' => '0001',
                'completion_date' => now()->format('d F Y'),
                'program_name' => $this->getProgramName($certificate),
                'program_type' => $this->getProgramType($certificate)
            ];

            // Generate QR Code
            $certificateUrl = "https://aksademy.id/certificate/{$dummyData['certificate_code']}";
            $qrCodeBase64 = $this->generateQrCode($certificateUrl);

            $html = $this->generateHtml($certificate, $dummyData, $qrCodeBase64, $certificateUrl);

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

            $certificate->load(['design', 'sign', 'course', 'bootcamp', 'webinar']);
            $participant->load(['user']);

            $participantData = [
                'participant_name' => $participant->user->name,
                'certificate_code' => $participant->certificate_code,
                'participant_issued_at' => $participant->created_at,
                'certificate_number' => str_pad($participant->certificate_number, 4, '0', STR_PAD_LEFT),
                'completion_date' => $participant->created_at->format('d F Y'),
                'program_name' => $this->getProgramName($certificate),
                'program_type' => $this->getProgramType($certificate)
            ];

            // Generate QR Code
            $certificateUrl = "https://aksademy.id/certificate/{$participant->certificate_code}";
            $qrCodeBase64 = $this->generateQrCode($certificateUrl);

            $html = $this->generateHtml($certificate, $participantData, $qrCodeBase64, $certificateUrl);

            $this->dompdf->loadHtml($html);
            $this->dompdf->setPaper('A4', 'landscape');
            $this->dompdf->render();

            return $this->dompdf->output();
        } catch (\Exception $e) {
            Log::error('Error generating participant certificate: ' . $e->getMessage());
            throw $e;
        }
    }

    private function generateQrCode($url)
    {
        try {
            $qrCodeGenerator = new DNS2D();

            $qrCodePng = $qrCodeGenerator->getBarcodePNG($url, 'QRCODE', 10, 10);
            if ($qrCodePng) {
                return 'data:image/png;base64,' . $qrCodePng;
            }

            $qrCodeSvg = $qrCodeGenerator->getBarcodeSVG($url, 'QRCODE', 8, 8, 'black', false);
            if ($qrCodeSvg) {
                $qrCodeSvg = str_replace(['<?xml version="1.0" encoding="UTF-8"?>', '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">'], '', $qrCodeSvg);
                return 'data:image/svg+xml;base64,' . base64_encode($qrCodeSvg);
            }

            return null;
        } catch (\Exception $e) {
            Log::warning('Failed to generate QR code: ' . $e->getMessage());
            return null;
        }
    }

    private function generateHtml(Certificate $certificate, array $data, $qrCode = null, $certificateUrl = null)
    {
        return View::make('certificates.template', [
            'certificate' => $certificate,
            'data' => $data,
            'qrCode' => $qrCode,
            'certificateUrl' => $certificateUrl
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
