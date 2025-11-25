<?php

namespace App\Http\Controllers;

use App\Models\Bootcamp;
use App\Models\Certificate;
use App\Models\CertificateDesign;
use App\Models\CertificateParticipant;
use App\Models\CertificateSign;
use App\Models\Course;
use App\Models\Webinar;
use App\Services\CertificatePdfService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use ZipArchive;

class CertificateController extends Controller
{
    protected $pdfService;

    public function __construct(CertificatePdfService $pdfService)
    {
        $this->pdfService = $pdfService;
    }

    public function index()
    {
        $certificates = Certificate::with([
            'design',
            'sign',
            'course',
            'bootcamp',
            'webinar',
            'participants'
        ])->latest()->get();

        $totalCertificates = $certificates->count();

        $certificatesForCourses = $certificates->whereNotNull('course_id')->count();
        $certificatesForBootcamps = $certificates->whereNotNull('bootcamp_id')->count();
        $certificatesForWebinars = $certificates->whereNotNull('webinar_id')->count();

        $totalParticipants = CertificateParticipant::whereIn('certificate_id', $certificates->pluck('id'))->count();
        $averageParticipantsPerCertificate = $totalCertificates > 0 ? round($totalParticipants / $totalCertificates, 1) : 0;

        $now = Carbon::now();
        $certificatesIssuedThisMonth = $certificates->filter(function ($cert) use ($now) {
            return $cert->issued_date && Carbon::parse($cert->issued_date)->isSameMonth($now);
        })->count();

        $certificatesIssuedThisYear = $certificates->filter(function ($cert) use ($now) {
            return $cert->issued_date && Carbon::parse($cert->issued_date)->isSameYear($now);
        })->count();

        $recentCertificates = $certificates->filter(function ($cert) {
            return $cert->created_at && Carbon::parse($cert->created_at)->isAfter(now()->subDays(30));
        })->count();

        $statistics = [
            'overview' => [
                'total_certificates' => $totalCertificates,
                'total_participants' => $totalParticipants,
                'average_participants' => $averageParticipantsPerCertificate,
                'recent_certificates' => $recentCertificates,
            ],
            'program_type' => [
                'courses' => $certificatesForCourses,
                'bootcamps' => $certificatesForBootcamps,
                'webinars' => $certificatesForWebinars,
            ],
            'issued' => [
                'this_month' => $certificatesIssuedThisMonth,
                'this_year' => $certificatesIssuedThisYear,
            ],
        ];

        return Inertia::render('admin/certificates/index', [
            'certificates' => $certificates,
            'statistics' => $statistics,
        ]);
    }

    public function show(Certificate $certificate)
    {
        $certificate->load([
            'design',
            'sign',
            'course',
            'bootcamp',
            'webinar',
            'participants.user'
        ]);

        return Inertia::render('admin/certificates/show', [
            'certificate' => $certificate
        ]);
    }

    public function create(Request $request)
    {
        $designs = CertificateDesign::all();
        $signs = CertificateSign::all();

        $courses = Course::whereDoesntHave('certificate')
            ->select(['id', 'title'])
            ->get();

        $bootcamps = Bootcamp::whereDoesntHave('certificate')
            ->select(['id', 'title'])
            ->get();

        $webinars = Webinar::whereDoesntHave('certificate')
            ->select(['id', 'title'])
            ->get();

        $prefilledData = [];

        if ($request->has('program_type')) {
            $prefilledData['program_type'] = $request->get('program_type');
        }

        if ($request->has('course_id')) {
            $courseId = $request->get('course_id');
            $course = Course::find($courseId);

            if ($course) {
                $prefilledData['program_type'] = 'course';
                $prefilledData['course_id'] = $courseId;
                $prefilledData['title'] = "Sertifikat {$course->title}";
                $prefilledData['description'] = "Sertifikat {$course->title} yang diselenggarakan oleh Aksademy";

                if (!$courses->contains('id', $courseId)) {
                    $courses->push((object)[
                        'id' => $course->id,
                        'title' => $course->title
                    ]);
                }
            }
        }

        if ($request->has('bootcamp_id')) {
            $bootcampId = $request->get('bootcamp_id');
            $bootcamp = Bootcamp::find($bootcampId);

            if ($bootcamp) {
                $prefilledData['program_type'] = 'bootcamp';
                $prefilledData['bootcamp_id'] = $bootcampId;
                $prefilledData['title'] = "Sertifikat {$bootcamp->title}";
                $prefilledData['description'] = "Sertifikat {$bootcamp->title} yang diselenggarakan oleh Aksademy";

                if (!$bootcamps->contains('id', $bootcampId)) {
                    $bootcamps->push((object)[
                        'id' => $bootcamp->id,
                        'title' => $bootcamp->title
                    ]);
                }
            }
        }

        if ($request->has('webinar_id')) {
            $webinarId = $request->get('webinar_id');
            $webinar = Webinar::find($webinarId);

            if ($webinar) {
                $prefilledData['program_type'] = 'webinar';
                $prefilledData['webinar_id'] = $webinarId;
                $prefilledData['title'] = "Sertifikat {$webinar->title}";
                $prefilledData['description'] = "Sertifikat {$webinar->title} yang diselenggarakan oleh Aksademy";

                if (!$webinars->contains('id', $webinarId)) {
                    $webinars->push((object)[
                        'id' => $webinar->id,
                        'title' => $webinar->title
                    ]);
                }
            }
        }

        return Inertia::render('admin/certificates/create', [
            'designs' => $designs,
            'signs' => $signs,
            'courses' => $courses,
            'bootcamps' => $bootcamps,
            'webinars' => $webinars,
            'prefilledData' => $prefilledData
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'design_id' => 'required|exists:certificate_designs,id',
            'sign_id' => 'required|exists:certificate_signs,id',
            'certificate_number' => 'required|string|unique:certificates',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'header_top' => 'nullable|string',
            'header_bottom' => 'nullable|string',
            'issued_date' => 'nullable|date',
            'period' => 'nullable|string',
            'program_type' => 'required|in:course,bootcamp,webinar',
            'course_id' => 'required_if:program_type,course|nullable|exists:courses,id',
            'bootcamp_id' => 'required_if:program_type,bootcamp|nullable|exists:bootcamps,id',
            'webinar_id' => 'required_if:program_type,webinar|nullable|exists:webinars,id',
        ]);

        $data = $request->all();
        if ($request->program_type !== 'course') {
            $data['course_id'] = null;
        }
        if ($request->program_type !== 'bootcamp') {
            $data['bootcamp_id'] = null;
        }
        if ($request->program_type !== 'webinar') {
            $data['webinar_id'] = null;
        }

        Certificate::create($data);

        return redirect()->route('certificates.index')
            ->with('success', 'Sertifikat berhasil ditambahkan');
    }

    public function edit(Certificate $certificate)
    {
        $designs = CertificateDesign::all();
        $signs = CertificateSign::all();

        $courses = Course::where(function ($query) use ($certificate) {
            $query->whereDoesntHave('certificate')
                ->orWhere('id', $certificate->course_id);
        })->select(['id', 'title'])->get();


        $bootcamps = Bootcamp::where(function ($query) use ($certificate) {
            $query->whereDoesntHave('certificate')
                ->orWhere('id', $certificate->bootcamp_id);
        })->select(['id', 'title'])->get();


        $webinars = Webinar::where(function ($query) use ($certificate) {
            $query->whereDoesntHave('certificate')
                ->orWhere('id', $certificate->webinar_id);
        })->select(['id', 'title'])->get();

        $programType = '';
        if ($certificate->course_id) {
            $programType = 'course';
        } elseif ($certificate->bootcamp_id) {
            $programType = 'bootcamp';
        } elseif ($certificate->webinar_id) {
            $programType = 'webinar';
        }

        return Inertia::render('admin/certificates/edit', [
            'certificate' => array_merge($certificate->toArray(), ['program_type' => $programType]),
            'designs' => $designs,
            'signs' => $signs,
            'courses' => $courses,
            'bootcamps' => $bootcamps,
            'webinars' => $webinars
        ]);
    }

    public function update(Request $request, Certificate $certificate)
    {
        $request->validate([
            'design_id' => 'required|exists:certificate_designs,id',
            'sign_id' => 'required|exists:certificate_signs,id',
            'certificate_number' => 'required|string|unique:certificates,certificate_number,' . $certificate->id,
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'header_top' => 'nullable|string',
            'header_bottom' => 'nullable|string',
            'issued_date' => 'nullable|date',
            'period' => 'nullable|string',
            'program_type' => 'required|in:course,bootcamp,webinar',
            'course_id' => 'required_if:program_type,course|nullable|exists:courses,id',
            'bootcamp_id' => 'required_if:program_type,bootcamp|nullable|exists:bootcamps,id',
            'webinar_id' => 'required_if:program_type,webinar|nullable|exists:webinars,id',
        ]);

        $data = $request->all();
        if ($request->program_type !== 'course') {
            $data['course_id'] = null;
        }
        if ($request->program_type !== 'bootcamp') {
            $data['bootcamp_id'] = null;
        }
        if ($request->program_type !== 'webinar') {
            $data['webinar_id'] = null;
        }

        $certificate->update($data);

        return redirect()->route('certificates.show', $certificate->id)
            ->with('success', 'Sertifikat berhasil diperbarui');
    }

    public function destroy(Certificate $certificate)
    {
        $certificate->delete();

        return redirect()->route('certificates.index')
            ->with('success', 'Sertifikat berhasil dihapus');
    }

    /**
     * Preview sertifikat dalam bentuk PDF
     */
    public function preview(Certificate $certificate)
    {
        try {
            $certificate->load(['design', 'sign', 'course', 'bootcamp', 'webinar']);

            $pdf = $this->pdfService->generatePreview($certificate);

            return response($pdf)
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Disposition', 'inline; filename="preview-' . $certificate->certificate_number . '.pdf"');
        } catch (\Exception $e) {
            return back()->with('error', 'Gagal membuat preview sertifikat: ' . $e->getMessage());
        }
    }

    /**
     * Download sertifikat participant
     */
    public function downloadParticipant(CertificateParticipant $participant)
    {
        try {
            $pdf = $this->pdfService->generateParticipantCertificate($participant);

            $filename = 'sertifikat-' . $participant->certificate_code . '.pdf';

            return response($pdf)
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
        } catch (\Exception $e) {
            return back()->with('error', 'Gagal mengunduh sertifikat: ' . $e->getMessage());
        }
    }

    /**
     * Download semua sertifikat dalam ZIP
     */
    public function downloadAll(Certificate $certificate)
    {
        try {
            $participants = $certificate->participants;

            if ($participants->isEmpty()) {
                return back()->with('error', 'Tidak ada peserta untuk sertifikat ini.');
            }

            // Buat HTML page yang akan trigger download satu per satu
            $downloadUrls = [];
            foreach ($participants as $participant) {
                $downloadUrls[] = [
                    'url' => route('certificates.participant.download', $participant->id),
                    'filename' => 'sertifikat-' . $participant->certificate_code . '.pdf',
                    'participant_name' => $participant->user->name
                ];
            }

            return view('certificates.download-all', [
                'certificate' => $certificate,
                'downloads' => $downloadUrls
            ]);
        } catch (\Exception $e) {
            return back()->with('error', 'Gagal memproses download: ' . $e->getMessage());
        }
    }
}
