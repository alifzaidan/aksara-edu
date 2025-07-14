<?php

namespace App\Http\Controllers\User\Profile;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\CertificateParticipant;
use App\Models\Invoice;
use App\Services\CertificatePdfService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class WebinarController extends Controller
{
    protected $pdfService;

    public function __construct(CertificatePdfService $pdfService)
    {
        $this->pdfService = $pdfService;
    }

    public function index()
    {
        $userId = Auth::id();
        $myWebinars = Invoice::with('webinarItems.webinar.category')
            ->where('user_id', $userId)
            ->where('status', 'paid')
            ->orderBy('created_at', 'desc')
            ->get();
        return Inertia::render('user/profile/webinar/index', ['myWebinars' => $myWebinars]);
    }

    public function detail($slug)
    {
        $userId = Auth::id();
        $webinar = Invoice::with('webinarItems.webinar.category')
            ->where('user_id', $userId)
            ->whereHas('webinarItems.webinar', function ($query) use ($slug) {
                $query->where('slug', $slug);
            })
            ->first();

        $certificate = null;
        $certificateParticipant = null;

        if ($webinar && $webinar->webinarItems->isNotEmpty()) {
            $webinarId = $webinar->webinarItems->first()->webinar_id;

            $certificate = Certificate::where('webinar_id', $webinarId)->first();

            if ($certificate) {
                $certificateParticipant = CertificateParticipant::where('certificate_id', $certificate->id)
                    ->where('user_id', $userId)
                    ->first();
            }
        }

        return Inertia::render('user/profile/webinar/detail', [
            'webinar' => $webinar,
            'certificate' => $certificate,
            'certificateParticipant' => $certificateParticipant
        ]);
    }

    public function downloadCertificate($slug)
    {
        try {
            $userId = Auth::id();

            $webinar = Invoice::with('webinarItems.webinar')
                ->where('user_id', $userId)
                ->where('status', 'paid')
                ->whereHas('webinarItems.webinar', function ($query) use ($slug) {
                    $query->where('slug', $slug);
                })
                ->first();

            if (!$webinar) {
                return back()->with('error', 'Webinar tidak ditemukan atau Anda belum terdaftar.');
            }

            $webinarId = $webinar->webinarItems->first()->webinar_id;
            $webinarData = $webinar->webinarItems->first()->webinar;

            $webinarEndDate = new \Carbon\Carbon($webinarData->end_time);

            if ($webinarEndDate->isFuture()) {
                return back()->with('error', 'Sertifikat belum tersedia. Webinar masih berlangsung.');
            }

            $certificate = Certificate::where('webinar_id', $webinarId)->first();

            if (!$certificate) {
                return back()->with('error', 'Sertifikat belum dibuat untuk webinar ini.');
            }

            $participant = CertificateParticipant::where('certificate_id', $certificate->id)
                ->where('user_id', $userId)
                ->first();

            if (!$participant) {
                return back()->with('error', 'Data participant sertifikat tidak ditemukan.');
            }

            if (!$this->pdfService) {
                $this->pdfService = new CertificatePdfService();
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

            $webinar = Invoice::with('webinarItems.webinar')
                ->where('user_id', $userId)
                ->where('status', 'paid')
                ->whereHas('webinarItems.webinar', function ($query) use ($slug) {
                    $query->where('slug', $slug);
                })
                ->first();

            if (!$webinar) {
                return back()->with('error', 'Webinar tidak ditemukan atau Anda belum terdaftar.');
            }

            $webinarId = $webinar->webinarItems->first()->webinar_id;
            $webinarData = $webinar->webinarItems->first()->webinar;

            $webinarEndDate = new \Carbon\Carbon($webinarData->end_time);

            if ($webinarEndDate->isFuture()) {
                return back()->with('error', 'Sertifikat belum tersedia. Webinar masih berlangsung.');
            }

            $certificate = Certificate::where('webinar_id', $webinarId)->first();

            if (!$certificate) {
                return back()->with('error', 'Sertifikat belum dibuat untuk webinar ini.');
            }

            $participant = CertificateParticipant::where('certificate_id', $certificate->id)
                ->where('user_id', $userId)
                ->first();

            if (!$participant) {
                return back()->with('error', 'Data participant sertifikat tidak ditemukan.');
            }

            if (!$this->pdfService) {
                $this->pdfService = new CertificatePdfService();
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
