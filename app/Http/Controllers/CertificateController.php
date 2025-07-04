<?php

namespace App\Http\Controllers;

use App\Models\Bootcamp;
use App\Models\Certificate;
use App\Models\CertificateDesign;
use App\Models\CertificateSign;
use App\Models\Course;
use App\Models\Webinar;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CertificateController extends Controller
{
    public function index()
    {
        $certificates = Certificate::with(['design', 'sign', 'course', 'bootcamp', 'webinar'])->latest()->get();

        return Inertia::render('admin/certificates/index', [
            'certificates' => $certificates
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

    public function create()
    {
        $designs = CertificateDesign::all();
        $signs = CertificateSign::all();

        $courses = Course::whereDoesntHave('certificates')
            ->select(['id', 'title'])
            ->get();

        $bootcamps = Bootcamp::whereDoesntHave('certificates')
            ->select(['id', 'title'])
            ->get();

        $webinars = Webinar::whereDoesntHave('certificates')
            ->select(['id', 'title'])
            ->get();

        return Inertia::render('admin/certificates/create', [
            'designs' => $designs,
            'signs' => $signs,
            'courses' => $courses,
            'bootcamps' => $bootcamps,
            'webinars' => $webinars
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
            $query->whereDoesntHave('certificates')
                ->orWhere('id', $certificate->course_id);
        })->select(['id', 'title'])->get();


        $bootcamps = Bootcamp::where(function ($query) use ($certificate) {
            $query->whereDoesntHave('certificates')
                ->orWhere('id', $certificate->bootcamp_id);
        })->select(['id', 'title'])->get();


        $webinars = Webinar::where(function ($query) use ($certificate) {
            $query->whereDoesntHave('certificates')
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

        return redirect()->route('certificates.index')
            ->with('success', 'Sertifikat berhasil diperbarui');
    }

    public function destroy(Certificate $certificate)
    {
        $certificate->delete();

        return redirect()->route('certificates.index')
            ->with('success', 'Sertifikat berhasil dihapus');
    }
}
