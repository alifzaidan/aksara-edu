<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\CertificationProgram;
use App\Models\CertificationProgramApplication;
use App\Models\CertificationProgramScholarshipApplication;
use App\Models\Invoice;
use App\Traits\MessaraTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class CertificationProgramController extends Controller
{
    use MessaraTrait;

    private const ADMIN_WHATSAPP_URL = 'https://wa.me/+6285142505794';
    private const ADMIN_WHATSAPP_NUMBER = '6285142505794';

    public function index()
    {
        $categories = Category::all();
        $programs = CertificationProgram::with(['category'])
            ->where('status', 'published')
            ->where(function ($query) {
                $query->where(function ($q) {
                    $q->where('type', 'scholarship')
                        ->where(function ($sq) {
                            $sq->whereNull('socialization_registration_deadline')
                                ->orWhere('socialization_registration_deadline', '>=', now());
                        });
                })->orWhere(function ($q) {
                    $q->where('type', 'regular')
                        ->where(function ($rq) {
                            $rq->whereNull('registration_deadline')
                                ->orWhere('registration_deadline', '>=', now());
                        });
                });
            })
            ->orderBy('registration_deadline', 'asc')
            ->get();

        $myProgramIds = [];
        $approvedScholarshipProgramIds = [];
        if (Auth::check()) {
            $userId = Auth::id();
            $myProgramIds = Invoice::with('certificationProgramItems')
                ->purchasedByUser($userId)
                ->get()
                ->flatMap(function ($invoice) {
                    return $invoice->certificationProgramItems->pluck('certification_program_id');
                })
                ->unique()
                ->values()
                ->all();

            $approvedScholarshipProgramIds = \App\Models\CertificationProgramScholarshipApplication::where('email', Auth::user()->email)
                ->where('status', 'approved')
                ->pluck('certification_program_id')
                ->toArray();
        }

        return Inertia::render('user/certification-program/dashboard/index', [
            'categories' => $categories,
            'programs' => $programs,
            'myProgramIds' => $myProgramIds,
            'approvedScholarshipProgramIds' => $approvedScholarshipProgramIds,
        ]);
    }

    public function detail(Request $request, CertificationProgram $program)
    {
        $this->handleReferralCode($request);

        if (!in_array($program->status, ['published', 'hidden'], true)) {
            return Inertia::render('user/unavailable/index', [
                'title' => 'Program Tidak Tersedia',
                'item' => $program->only(['title', 'slug', 'status']),
                'adminWhatsappUrl' => self::ADMIN_WHATSAPP_URL,
                'message' => 'Program tidak tersedia. Silahkan hubungi admin.',
                'backUrl' => route('certification-programs.index'),
                'backLabel' => 'Kembali ke Daftar Sertifikasi',
            ])->toResponse($request)->setStatusCode(404);
        }

        $program->load(['category', 'schedules', 'socializationSchedules', 'mentors']);

        $relatedPrograms = CertificationProgram::with(['category', 'mentors'])
            ->where('status', 'published')
            ->where('category_id', $program->category_id)
            ->where('id', '!=', $program->id)
            ->where(function ($query) {
                $query->where(function ($q) {
                    $q->where('type', 'scholarship')
                        ->where(function ($sq) {
                            $sq->whereNull('socialization_registration_deadline')
                                ->orWhere('socialization_registration_deadline', '>=', now());
                        });
                })->orWhere(function ($q) {
                    $q->where('type', 'regular')
                        ->where(function ($rq) {
                            $rq->whereNull('registration_deadline')
                                ->orWhere('registration_deadline', '>=', now());
                        });
                });
            })
            ->orderBy('registration_deadline', 'asc')
            ->limit(3)
            ->get();

        $myProgramIds = [];
        $scholarshipApplication = null;
        $approvedScholarshipProgramIds = [];
        if (Auth::check()) {
            $userId = Auth::id();
            $myProgramIds = Invoice::with('certificationProgramItems')
                ->purchasedByUser($userId)
                ->get()
                ->flatMap(function ($invoice) {
                    return $invoice->certificationProgramItems->pluck('certification_program_id');
                })
                ->unique()
                ->values()
                ->all();

            if ($program->type === 'scholarship') {
                $scholarshipApplication = \App\Models\CertificationProgramScholarshipApplication::where('certification_program_id', $program->id)
                    ->where('email', Auth::user()->email)
                    ->latest()
                    ->first();
            }

            $approvedScholarshipProgramIds = \App\Models\CertificationProgramScholarshipApplication::where('email', Auth::user()->email)
                ->where('status', 'approved')
                ->pluck('certification_program_id')
                ->toArray();
        }

        return Inertia::render('user/certification-program/detail/index', [
            'program' => $program,
            'relatedPrograms' => $relatedPrograms,
            'myProgramIds' => $myProgramIds,
            'scholarshipApplication' => $scholarshipApplication,
            'approvedScholarshipProgramIds' => $approvedScholarshipProgramIds,
            'referralInfo' => $this->getReferralInfo(),
        ]);
    }

    public function showRegister(Request $request, CertificationProgram $program)
    {
        $this->handleReferralCode($request);

        if (!in_array($program->status, ['published', 'hidden'], true)) {
            return Inertia::render('user/unavailable/index', [
                'title' => 'Program Tidak Tersedia',
                'item' => $program->only(['title', 'slug', 'status']),
                'adminWhatsappUrl' => self::ADMIN_WHATSAPP_URL,
                'message' => 'Program tidak tersedia. Silahkan hubungi admin.',
                'backUrl' => route('certification-programs.index'),
                'backLabel' => 'Kembali ke Daftar Sertifikasi',
            ])->toResponse($request)->setStatusCode(404);
        }

        $program->load(['schedules', 'socializationSchedules', 'category', 'mentors']);

        $hasAccess = false;
        $activeInstallment = null;
        $pendingInvoice = null;
        $pendingInvoiceUrl = null;
        $regularApplication = null;
        $scholarshipApplication = null;

        $isScholarship = $request->boolean('scholarship', false);
        if ($program->type === 'scholarship') {
            $isScholarship = true;
        }

        if (Auth::check()) {
            $userId = Auth::id();

            $activeInstallment = Invoice::getActiveInstallmentForUser($userId, 'certification_program', $program->id);

            // Full access: paid normally or installment is 100% completed
            $hasRegularPaid = Invoice::where('user_id', $userId)
                ->whereNull('parent_invoice_id')
                ->where('is_installment', false)
                ->whereIn('status', ['paid', 'completed'])
                ->whereHas('certificationProgramItems', function ($query) use ($program) {
                    $query->where('certification_program_id', $program->id);
                })
                ->exists();

            $isInstallmentCompleted = $activeInstallment && $activeInstallment['is_fully_paid'];
            $hasAccess = $hasRegularPaid || $isInstallmentCompleted;

            if (!$hasAccess && !$activeInstallment) {
                $invoice = Invoice::where('user_id', $userId)
                    ->where('status', 'pending')
                    ->where('is_installment', false)
                    ->whereHas('certificationProgramItems', function ($query) use ($program) {
                        $query->where('certification_program_id', $program->id);
                    })
                    ->latest()
                    ->first();

                if ($invoice) {
                    $pendingInvoice = [
                        'id' => $invoice->id,
                        'invoice_code' => $invoice->invoice_code,
                        'status' => $invoice->status,
                        'amount' => $invoice->amount,
                        'payment_method' => $invoice->payment_method,
                        'invoice_url' => $invoice->invoice_url,
                        'created_at' => $invoice->created_at?->toISOString() ?? (string) $invoice->created_at,
                        'expires_at' => $invoice->expires_at ? $invoice->expires_at->toISOString() : null,
                    ];
                    $pendingInvoiceUrl = $invoice->invoice_url;
                }
            }

            if ($program->document_required && !$isScholarship) {
                $regularApplication = CertificationProgramApplication::where('certification_program_id', $program->id)
                    ->where('user_id', $userId)
                    ->latest()
                    ->first();
            }

            if ($isScholarship) {
                $scholarshipApplication = CertificationProgramScholarshipApplication::where('certification_program_id', $program->id)
                    ->where('email', Auth::user()->email)
                    ->latest()
                    ->first();
            }
        }

        return Inertia::render('user/certification-program/register/index', [
            'program' => $program,
            'hasAccess' => $hasAccess,
            'activeInstallment' => $activeInstallment,
            'pendingInvoice' => $pendingInvoice,
            'pendingInvoiceUrl' => $pendingInvoiceUrl,
            'regularApplication' => $regularApplication,
            'scholarshipApplication' => $scholarshipApplication,
            'isScholarship' => $isScholarship,
            'referralInfo' => $this->getReferralInfo(),
            'installmentTerms' => $program->installmentTerms()->get(['term_number', 'amount', 'due_date']),
        ]);
    }

    public function applyRegular(Request $request, CertificationProgram $program)
    {
        if ($program->type !== 'regular') {
            abort(404, 'Program ini bukan tipe reguler');
        }

        if (!$program->document_required) {
            return back()->with('error', 'Program ini tidak memerlukan lampiran dokumen.');
        }

        $request->validate([
            'document_attachment' => 'required|file|mimes:pdf,jpg,jpeg,png,webp|max:5120',
        ]);

        $userId = Auth::id();
        $existing = CertificationProgramApplication::where('certification_program_id', $program->id)
            ->where('user_id', $userId)
            ->first();

        if ($existing && $existing->status === 'rejected') {
            return back()->with('error', 'Pengajuan Anda sudah ditolak dan tidak dapat diajukan ulang.');
        }

        $documentPath = $request->file('document_attachment')->store('certification-programs/documents', 'public');

        if ($existing) {
            if ($existing->document_attachment) {
                Storage::disk('public')->delete($existing->document_attachment);
            }
            $existing->update([
                'document_attachment' => $documentPath,
                'status' => 'pending',
                'approved_at' => null,
                'rejected_at' => null,
            ]);
        } else {
            CertificationProgramApplication::create([
                'certification_program_id' => $program->id,
                'user_id' => $userId,
                'document_attachment' => $documentPath,
                'status' => 'pending',
            ]);
        }

        $this->notifyAdminNewApplication($program, Auth::user()->name, Auth::user()->phone_number);
        $this->notifyUserApplicationSubmitted(
            $program,
            Auth::user()->name,
            Auth::user()->phone_number,
            $program->registration_url,
            $program->socialization_group_url
        );

        return back()->with('success', 'Dokumen berhasil dikirim. Menunggu verifikasi admin.');
    }

    public function scholarshipApply(CertificationProgram $program)
    {
        if ($program->type !== 'scholarship' || $program->status !== 'published') {
            abort(404, 'Program beasiswa tidak ditemukan atau tidak tersedia');
        }

        return Inertia::render('user/certification-program/scholarship-apply/index', [
            'program' => $program,
        ]);
    }

    public function scholarshipStore(Request $request, CertificationProgram $program)
    {
        if ($program->type !== 'scholarship' || $program->status !== 'published') {
            abort(404, 'Program beasiswa tidak ditemukan atau tidak tersedia');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'required|string|max:20',
            'nim' => 'required|string|max:50',
            'university' => 'required|string|max:255',
            'major' => 'required|string|max:255',
            'semester' => 'required|integer|min:1|max:14',
            'ktm_photo' => 'required|image|mimes:jpeg,jpg,png,webp|max:5120',
            'transcript_photo' => 'required|image|mimes:jpeg,jpg,png,webp|max:5120',
            'instagram_follow_photo' => 'required|image|mimes:jpeg,jpg,png,webp|max:5120',
            'tiktok_follow_photo' => 'required|image|mimes:jpeg,jpg,png,webp|max:5120',
            'comment_tag_photo' => 'required|image|mimes:jpeg,jpg,png,webp|max:5120',
            'whatsapp_share_photo' => 'required|image|mimes:jpeg,jpg,png,webp|max:5120',
            'instagram_story_photo' => 'required|image|mimes:jpeg,jpg,png,webp|max:5120',
        ]);

        $ktmPath = $request->file('ktm_photo')->store('certification-programs/scholarships/ktm', 'public');
        $transcriptPath = $request->file('transcript_photo')->store('certification-programs/scholarships/transcript', 'public');
        $instagramPath = $request->file('instagram_follow_photo')->store('certification-programs/scholarships/instagram', 'public');
        $tiktokPath = $request->file('tiktok_follow_photo')->store('certification-programs/scholarships/tiktok', 'public');
        $commentPath = $request->file('comment_tag_photo')->store('certification-programs/scholarships/comment', 'public');
        $waSharePath = $request->file('whatsapp_share_photo')->store('certification-programs/scholarships/whatsapp', 'public');
        $igStoryPath = $request->file('instagram_story_photo')->store('certification-programs/scholarships/story', 'public');

        CertificationProgramScholarshipApplication::create([
            'certification_program_id' => $program->id,
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'nim' => $validated['nim'],
            'university' => $validated['university'],
            'major' => $validated['major'],
            'semester' => $validated['semester'],
            'ktm_photo' => $ktmPath,
            'transcript_photo' => $transcriptPath,
            'instagram_follow_photo' => $instagramPath,
            'tiktok_follow_photo' => $tiktokPath,
            'comment_tag_photo' => $commentPath,
            'whatsapp_share_photo' => $waSharePath,
            'instagram_story_photo' => $igStoryPath,
            'status' => 'pending',
        ]);

        $this->notifyAdminNewApplication($program, $validated['name'], $validated['phone']);
        $this->notifyUserApplicationSubmitted(
            $program,
            $validated['name'],
            $validated['phone'],
            url('/certification-programs/' . $program->slug . '/register?scholarship=1'),
            $program->socialization_group_url
        );

        return redirect()->route('certification-programs.scholarship-success', $program->slug);
    }

    public function scholarshipSuccess(CertificationProgram $program)
    {
        if ($program->type !== 'scholarship' || $program->status !== 'published') {
            abort(404, 'Program beasiswa tidak ditemukan atau tidak tersedia');
        }

        return Inertia::render('user/certification-program/scholarship-apply/success', [
            'program' => [
                'id' => $program->id,
                'title' => $program->title,
                'slug' => $program->slug,
                'socialization_group_url' => $program->socialization_group_url,
            ],
        ]);
    }

    private function notifyAdminNewApplication(CertificationProgram $program, string $name, ?string $phoneNumber): void
    {
        $adminPhone = $this->formatPhoneNumber(self::ADMIN_WHATSAPP_NUMBER);

        $message = "*[Aksademy - Pendaftaran Sertifikasi Baru]* 🎓\n\n";
        $message .= "Halo Admin, ada pendaftaran baru untuk program berikut:\n\n";
        $message .= "• Program: *{$program->title}*\n";
        $message .= "• Nama: *{$name}*\n";
        if (!empty($phoneNumber)) {
            $message .= "• No. WA: {$phoneNumber}\n";
        }
        $message .= "\nJika Anda memiliki pertanyaan atau kendala, silakan hubungi Admin kami via WhatsApp di nomor *6285142505794* (atau klik wa.me/6285142505794).\n\n";
        $message .= "Silakan cek dashboard admin untuk verifikasi dokumen. Terima kasih 🙏\n";

        self::sendText([
            [
                'phone' => $adminPhone,
                'message' => $message,
                'isGroup' => 'false',
            ]
        ]);
    }

    private function notifyUserApplicationSubmitted(
        CertificationProgram $program,
        string $name,
        ?string $phoneNumber,
        string $registrationUrl,
        ?string $socializationGroupUrl
    ): void {
        if (empty($phoneNumber)) {
            return;
        }

        $userPhone = $this->formatPhoneNumber($phoneNumber);

        $message = "*[Aksademy - Form Beasiswa Berhasil Dikirim]* 🎉\n\n";
        $message .= "Halo *{$name}*,\n\n";
        $message .= "Terima kasih, form beasiswa untuk program *{$program->title}* sudah berhasil kami terima.\n";
        $message .= "Silakan pantau proses berikutnya melalui link pendaftaran ini:\n";
        $message .= "{$registrationUrl}\n\n";

        if (!empty($socializationGroupUrl)) {
            $message .= "Untuk mendapatkan update, silakan bergabung ke grup sosialisasi di bawah ini:\n";
            $message .= "{$socializationGroupUrl}\n\n";
        }

        $message .= "Jika Anda memiliki pertanyaan atau membutuhkan bantuan, silakan hubungi Admin kami via WhatsApp di nomor *6285142505794* (atau klik wa.me/6285142505794).\n\n";
        $message .= "Terima kasih dan selamat bergabung! 🚀\n\n";
        $message .= "*Araska - Customer Support*";

        self::sendText([
            [
                'phone' => $userPhone,
                'message' => $message,
                'isGroup' => 'false',
            ]
        ]);
    }

    private function formatPhoneNumber(string $phoneNumber): string
    {
        $phoneNumber = preg_replace('/[^0-9]/', '', $phoneNumber);

        if (str_starts_with($phoneNumber, '0')) {
            return '62' . substr($phoneNumber, 1);
        }

        if (str_starts_with($phoneNumber, '62')) {
            return $phoneNumber;
        }

        if (str_starts_with($phoneNumber, '8')) {
            return '62' . $phoneNumber;
        }

        return $phoneNumber;
    }

    /**
     * Get referral info untuk frontend
     */
    private function getReferralInfo(): array
    {
        $code = session('affiliate_code') ?? session('referral_code');
        return [
            'code' => $code,
            'hasActive' => $code && $code !== 'ATM2025',
        ];
    }

    /**
     * Handle referral code dari URL parameter
     */
    private function handleReferralCode(Request $request): void
    {
        $referralCode = $request->query('ref');
        if ($referralCode) {
            session([
                'affiliate_code' => $referralCode,
                'referral_code' => $referralCode,
            ]);
        }
    }
}