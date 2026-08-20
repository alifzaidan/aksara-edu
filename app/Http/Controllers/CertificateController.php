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
use App\Exports\CertificateGradesTemplateExport;
use App\Exports\CertificateParticipantsTemplateExport;
use App\Imports\CertificateGradesImport;
use App\Imports\CertificateManualParticipantsImport;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Facades\DB;

class CertificateController extends Controller
{
    protected $pdfService;

    public function __construct(CertificatePdfService $pdfService)
    {
        $this->pdfService = $pdfService;
    }

    public function index(Request $request)
    {
        $query = Certificate::with([
            'design',
            'sign',
            'course',
            'bootcamp',
            'webinar',
            'participants'
        ])->latest();

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('certificate_number', 'like', "%{$search}%")
                    ->orWhere('title', 'like', "%{$search}%");
            });
        }

        $totalCertificates = Certificate::count();
        $certificatesForCourses = Certificate::whereNotNull('course_id')->count();
        $certificatesForBootcamps = Certificate::whereNotNull('bootcamp_id')->count();
        $certificatesForWebinars = Certificate::whereNotNull('webinar_id')->count();

        $totalParticipants = CertificateParticipant::count();
        $averageParticipantsPerCertificate = $totalCertificates > 0 ? round($totalParticipants / $totalCertificates, 1) : 0;

        $recentCertificates = Certificate::where('created_at', '>=', now()->subDays(30))->count();

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
                'this_month' => 0,
                'this_year' => 0,
            ],
        ];

        $perPage = min(100, max(5, (int) $request->input('per_page', 10)));
        $certificates = $query->paginate($perPage)->withQueryString();

        return Inertia::render('admin/certificates/index', [
            'certificates' => $certificates,
            'statistics' => $statistics,
            'filters' => [
                'search' => $request->input('search'),
                'per_page' => $perPage,
            ],
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

        $programType = '';
        if ($certificate->is_independent) {
            $programType = 'independent';
        } elseif ($certificate->course_id) {
            $programType = 'course';
        } elseif ($certificate->bootcamp_id) {
            $programType = 'bootcamp';
        } elseif ($certificate->webinar_id) {
            $programType = 'webinar';
        }

        return Inertia::render('admin/certificates/show', [
            'certificate' => array_merge($certificate->toArray(), ['program_type' => $programType])
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
            ->select(['id', 'title', 'curriculum'])
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
                        'title' => $bootcamp->title,
                        'curriculum' => $bootcamp->curriculum,
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
            'program_type' => 'required|in:course,bootcamp,webinar,independent',
            'course_id' => 'required_if:program_type,course|nullable|exists:courses,id',
            'bootcamp_id' => 'required_if:program_type,bootcamp|nullable|exists:bootcamps,id',
            'webinar_id' => 'required_if:program_type,webinar|nullable|exists:webinars,id',
            'page_count' => 'nullable|integer|in:1,2',
            'second_page_grade' => 'nullable|boolean',
            'second_page_material' => 'nullable|boolean',
            'assessment_subjects' => 'nullable|array',
        ]);

        $data = $request->all();
        $programType = $request->program_type;

        // Handle is_independent flag
        $data['is_independent'] = ($programType === 'independent');

        // Always null-out program IDs first
        $data['course_id'] = null;
        $data['bootcamp_id'] = null;
        $data['webinar_id'] = null;

        if ($programType === 'course') {
            $data['course_id'] = $request->course_id;
        } elseif ($programType === 'webinar') {
            $data['webinar_id'] = $request->webinar_id;
        }

        // Page count / second page logic: applies to bootcamp and independent
        if (in_array($programType, ['bootcamp', 'independent'])) {
            if ($programType === 'bootcamp') {
                $data['bootcamp_id'] = $request->bootcamp_id;
            }
            $data['page_count'] = $request->input('page_count', 1);
            if ($data['page_count'] != 2) {
                $data['second_page_grade'] = false;
                $data['second_page_material'] = false;
                $data['assessment_subjects'] = null;
            } else {
                $data['second_page_grade'] = $request->boolean('second_page_grade');
                $data['second_page_material'] = $request->boolean('second_page_material');
                if ($data['second_page_grade'] || $data['second_page_material']) {
                    $data['assessment_subjects'] = array_values(array_filter($request->input('assessment_subjects', [])));
                } else {
                    $data['assessment_subjects'] = null;
                }
            }
        } else {
            $data['page_count'] = 1;
            $data['second_page_grade'] = false;
            $data['second_page_material'] = false;
            $data['assessment_subjects'] = null;
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
        })->select(['id', 'title', 'curriculum'])->get();


        $webinars = Webinar::where(function ($query) use ($certificate) {
            $query->whereDoesntHave('certificate')
                ->orWhere('id', $certificate->webinar_id);
        })->select(['id', 'title'])->get();

        $programType = '';
        if ($certificate->is_independent) {
            $programType = 'independent';
        } elseif ($certificate->course_id) {
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
            'program_type' => 'required|in:course,bootcamp,webinar,independent',
            'course_id' => 'required_if:program_type,course|nullable|exists:courses,id',
            'bootcamp_id' => 'required_if:program_type,bootcamp|nullable|exists:bootcamps,id',
            'webinar_id' => 'required_if:program_type,webinar|nullable|exists:webinars,id',
            'page_count' => 'nullable|integer|in:1,2',
            'second_page_grade' => 'nullable|boolean',
            'second_page_material' => 'nullable|boolean',
            'assessment_subjects' => 'nullable|array',
        ]);

        $data = $request->all();
        $programType = $request->program_type;

        // Handle is_independent flag
        $data['is_independent'] = ($programType === 'independent');

        // Always null-out program IDs first
        $data['course_id'] = null;
        $data['bootcamp_id'] = null;
        $data['webinar_id'] = null;

        if ($programType === 'course') {
            $data['course_id'] = $request->course_id;
        } elseif ($programType === 'webinar') {
            $data['webinar_id'] = $request->webinar_id;
        }

        // Page count / second page logic: applies to bootcamp and independent
        if (in_array($programType, ['bootcamp', 'independent'])) {
            if ($programType === 'bootcamp') {
                $data['bootcamp_id'] = $request->bootcamp_id;
            }
            $data['page_count'] = $request->input('page_count', 1);
            if ($data['page_count'] != 2) {
                $data['second_page_grade'] = false;
                $data['second_page_material'] = false;
                $data['assessment_subjects'] = null;
            } else {
                $data['second_page_grade'] = $request->boolean('second_page_grade');
                $data['second_page_material'] = $request->boolean('second_page_material');
                if ($data['second_page_grade'] || $data['second_page_material']) {
                    $data['assessment_subjects'] = array_values(array_filter($request->input('assessment_subjects', [])));
                } else {
                    $data['assessment_subjects'] = null;
                }
            }
        } else {
            $data['page_count'] = 1;
            $data['second_page_grade'] = false;
            $data['second_page_material'] = false;
            $data['assessment_subjects'] = null;
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

    /**
     * Download template Excel untuk pengisian nilai
     */
    public function downloadGradesTemplate(Certificate $certificate)
    {
        try {
            if (!$certificate->second_page_grade || empty($certificate->assessment_subjects)) {
                return back()->with('error', 'Sertifikat ini tidak memiliki konfigurasi aspek penilaian.');
            }

            $filename = 'Template_Nilai_' . str_replace(' ', '_', $certificate->title) . '.xlsx';
            return Excel::download(new CertificateGradesTemplateExport($certificate), $filename);
        } catch (\Exception $e) {
            return back()->with('error', 'Gagal mengunduh template: ' . $e->getMessage());
        }
    }

    /**
     * Import nilai dari file Excel
     */
    public function importGrades(Request $request, Certificate $certificate)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,csv,xls',
        ], [
            'file.required' => 'File Excel harus dipilih.',
            'file.mimes' => 'File harus berformat Excel (.xlsx, .xls, .csv).',
        ]);

        try {
            DB::beginTransaction();

            $import = new CertificateGradesImport($certificate);
            Excel::import($import, $request->file('file'));

            $emptyParticipants = $import->getEmptyScoreParticipants();
            if (!empty($emptyParticipants)) {
                DB::rollBack();
                $errorMessage = "Import dibatalkan karena terdapat nilai yang belum terisi. Silakan lengkapi nilai untuk peserta berikut terlebih dahulu:\n";
                foreach ($emptyParticipants as $name) {
                    $errorMessage .= "• " . $name . "\n";
                }
                return redirect()->back()->with('error', $errorMessage);
            }

            $errors = $import->getErrors();
            if (!empty($errors)) {
                DB::rollBack();
                $errorMessage = "Gagal mengimport nilai karena terdapat data yang tidak valid:\n" . implode("\n", $errors);
                return redirect()->back()->with('error', $errorMessage);
            }

            DB::commit();
            return redirect()->back()->with('success', 'Nilai berhasil diimport untuk ' . $import->getSuccessCount() . ' peserta!');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Gagal mengimport nilai: ' . $e->getMessage());
        }
    }

    /**
     * Download template Excel untuk import manual peserta
     */
    public function downloadParticipantsTemplate(Certificate $certificate)
    {
        $filename = 'Template_Import_Peserta_' . str_replace(' ', '_', $certificate->title) . '.xlsx';
        return Excel::download(new CertificateParticipantsTemplateExport(), $filename);
    }

    /**
     * Import manual peserta dari file Excel (tanpa koneksi ke program)
     */
    public function importManualParticipants(Request $request, Certificate $certificate)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,csv,xls',
        ], [
            'file.required' => 'File Excel harus dipilih.',
            'file.mimes' => 'File harus berformat Excel (.xlsx, .xls, .csv).',
        ]);

        try {
            DB::beginTransaction();

            $import = new CertificateManualParticipantsImport($certificate);
            Excel::import($import, $request->file('file'));

            $errors = $import->getErrors();
            $successCount = $import->getSuccessCount();
            $skippedCount = $import->getSkippedCount();
            $createdUserCount = $import->getCreatedUserCount();

            if (!empty($errors) && $successCount === 0) {
                DB::rollBack();
                $errorMessage = "Gagal mengimport peserta:\n" . implode("\n", $errors);
                return redirect()->back()->with('error', $errorMessage);
            }

            DB::commit();

            $message = $successCount . ' peserta berhasil diimport.';
            if ($createdUserCount > 0) {
                $message .= "\n" . $createdUserCount . ' akun user baru dibuat otomatis.';
            }
            if ($skippedCount > 0) {
                $message .= "\n" . $skippedCount . ' peserta dilewati (sudah terdaftar).';
            }
            if (!empty($errors)) {
                $message .= "\n\nBeberapa data tidak dapat diproses:\n" . implode("\n", $errors);
            }

            return redirect()->back()->with('success', $message);
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Gagal mengimport peserta: ' . $e->getMessage());
        }
    }
}
