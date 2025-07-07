<?php

namespace App\Http\Controllers;

use App\Models\Certificate;
use App\Models\CertificateParticipant;
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
}
