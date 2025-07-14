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
        $bootcamp = Invoice::with(['bootcampItems.bootcamp.category', 'bootcampItems.bootcamp.schedules'])
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

    public function downloadCertificate($slug)
    {
        try {
            $userId = Auth::id();

            $bootcamp = Invoice::with('bootcampItems.bootcamp')
                ->where('user_id', $userId)
                ->where('status', 'paid')
                ->whereHas('bootcampItems.bootcamp', function ($query) use ($slug) {
                    $query->where('slug', $slug);
                })
                ->first();

            if (!$bootcamp) {
                return back()->with('error', 'Bootcamp tidak ditemukan atau Anda belum terdaftar.');
            }

            $bootcampId = $bootcamp->bootcampItems->first()->bootcamp_id;
            $bootcampData = $bootcamp->bootcampItems->first()->bootcamp;

            $bootcampEndDate = new \Carbon\Carbon($bootcampData->end_date);
            $bootcampEndDate->setTime(23, 59, 59);

            if ($bootcampEndDate->isFuture()) {
                return back()->with('error', 'Sertifikat belum tersedia. Bootcamp masih berlangsung.');
            }

            $certificate = Certificate::where('bootcamp_id', $bootcampId)->first();

            if (!$certificate) {
                return back()->with('error', 'Sertifikat belum dibuat untuk bootcamp ini.');
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

            $bootcamp = Invoice::with('bootcampItems.bootcamp')
                ->where('user_id', $userId)
                ->where('status', 'paid')
                ->whereHas('bootcampItems.bootcamp', function ($query) use ($slug) {
                    $query->where('slug', $slug);
                })
                ->first();

            if (!$bootcamp) {
                return back()->with('error', 'Bootcamp tidak ditemukan atau Anda belum terdaftar.');
            }

            $bootcampId = $bootcamp->bootcampItems->first()->bootcamp_id;
            $bootcampData = $bootcamp->bootcampItems->first()->bootcamp;

            $bootcampEndDate = new \Carbon\Carbon($bootcampData->end_date);
            $bootcampEndDate->setTime(23, 59, 59);

            if ($bootcampEndDate->isFuture()) {
                return back()->with('error', 'Sertifikat belum tersedia. Bootcamp masih berlangsung.');
            }

            $certificate = Certificate::where('bootcamp_id', $bootcampId)->first();

            if (!$certificate) {
                return back()->with('error', 'Sertifikat belum dibuat untuk bootcamp ini.');
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
