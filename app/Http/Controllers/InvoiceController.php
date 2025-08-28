<?php

namespace App\Http\Controllers;

use App\Models\AffiliateEarning;
use App\Models\Bootcamp;
use App\Models\Certificate;
use App\Models\CertificateParticipant;
use App\Models\Course;
use App\Models\DiscountUsage;
use App\Models\EnrollmentBootcamp;
use App\Models\EnrollmentCourse;
use App\Models\EnrollmentWebinar;
use App\Models\FreeEnrollmentRequirement;
use App\Models\Invoice;
use App\Models\User;
use App\Models\Webinar;
use App\Traits\WablasTrait;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Haruncpi\LaravelIdGenerator\IdGenerator;
use Illuminate\Support\Facades\Log;

use Xendit\Configuration;
use Xendit\Invoice\CreateInvoiceRequest;
use Xendit\Invoice\InvoiceApi;

class InvoiceController extends Controller
{
    use WablasTrait;

    public function __construct()
    {
        Configuration::setXenditKey(config('xendit.API_KEY'));
    }

    public function index()
    {
        $invoices = Invoice::with([
            'user.referrer',
            'courseItems.course',
            'bootcampItems.bootcamp',
            'webinarItems.webinar'
        ])
            ->orderBy('created_at', 'desc')
            ->get();
        return Inertia::render('admin/transactions/index', ['invoices' => $invoices]);
    }

    public function store(Request $request)
    {
        DB::beginTransaction();
        try {
            $userId = Auth::id();
            $type = $request->input('type', 'course');
            $itemId = $request->input('id');

            $discountAmount = $request->input('discount_amount', 0);
            $nettAmount = $request->input('nett_amount', 0);
            $transactionFee = $request->input('transaction_fee', 5000);
            $totalAmount = $request->input('total_amount');

            $discountCodeId = $request->input('discount_code_id');
            $discountCodeAmount = $request->input('discount_code_amount', 0);

            if ($type === 'course') {
                $item = Course::findOrFail($itemId);
                $enrollmentTable = EnrollmentCourse::class;
                $enrollmentField = 'course_id';
            } elseif ($type === 'bootcamp') {
                $item = Bootcamp::findOrFail($itemId);
                $enrollmentTable = EnrollmentBootcamp::class;
                $enrollmentField = 'bootcamp_id';
            } elseif ($type === 'webinar') {
                $item = Webinar::findOrFail($itemId);
                $enrollmentTable = EnrollmentWebinar::class;
                $enrollmentField = 'webinar_id';
            } else {
                throw new \Exception('Tipe pembelian tidak valid');
            }

            $discountCode = null;
            if ($discountCodeId) {
                $discountCode = \App\Models\DiscountCode::find($discountCodeId);

                if (!$discountCode) {
                    throw new \Exception('Kode diskon tidak ditemukan');
                }

                if (!$discountCode->isValid()) {
                    throw new \Exception('Kode diskon tidak valid atau sudah kedaluwarsa');
                }

                if (!$discountCode->canBeUsed()) {
                    throw new \Exception('Kode diskon sudah mencapai batas penggunaan');
                }

                if (!$discountCode->canBeUsedByUser($userId)) {
                    throw new \Exception('Anda sudah mencapai batas penggunaan kode diskon ini');
                }

                if (!$discountCode->isApplicableToProduct($type, $itemId)) {
                    throw new \Exception('Kode diskon tidak berlaku untuk produk ini');
                }

                $calculatedDiscount = $discountCode->calculateDiscount($item->price);
                if ($discountCodeAmount !== $calculatedDiscount) {
                    throw new \Exception('Jumlah diskon tidak sesuai');
                }
            }

            $expectedNettAmount = $item->price - $discountCodeAmount;
            $expectedTotal = $expectedNettAmount > 0 ? $expectedNettAmount + $transactionFee : 0;

            if ($nettAmount != $expectedNettAmount) {
                throw new \Exception('Harga nett tidak sesuai');
            }

            if ($discountAmount > 0 && $discountAmount != $item->strikethrough_price) {
                throw new \Exception('Discount amount tidak sesuai');
            }

            if ($totalAmount != $expectedTotal) {
                throw new \Exception('Total amount tidak sesuai');
            }

            $fees = [];
            if ($discountAmount > 0) {
                $fees[] = ['type' => 'Diskon', 'value' => -$discountAmount];
            }
            if ($discountCodeAmount > 0) {
                $fees[] = ['type' => 'Diskon Promo (' . $discountCode->code . ')', 'value' => -$discountCodeAmount];
            }
            $fees[] = ['type' => 'Biaya Transaksi', 'value' => $transactionFee];

            $items = [
                [
                    'name' => $item->title,
                    'price' => $item->price,
                    'quantity' => 1,
                ]
            ];

            $invoice_code = IdGenerator::generate([
                'table' => 'invoices',
                'field' => 'invoice_code',
                'length' => 11,
                'reset_on_prefix_change' => true,
                'prefix' => 'AKS-' . date('y')
            ]);

            $expiresAt = Carbon::now()->addHours(24);

            $invoice = Invoice::create([
                'user_id' => $userId,
                'invoice_code' => $invoice_code,
                'discount_amount' => $discountAmount,
                'amount' => $totalAmount,
                'nett_amount' => $nettAmount,
                'expires_at' => $expiresAt,
            ]);

            if ($discountCode) {
                DiscountUsage::create([
                    'discount_code_id' => $discountCode->id,
                    'user_id' => $userId,
                    'invoice_id' => $invoice->id,
                    'discount_amount' => $discountCodeAmount,
                ]);

                $discountCode->incrementUsage();
            }

            $xendit_create_invoice = new CreateInvoiceRequest([
                'external_id' => $invoice_code,
                'customer' => [
                    'given_names' => Auth::user()->name,
                    'email' => Auth::user()->email,
                    'mobile_number' => Auth::user()->phone_number,
                ],
                'customer_notification_preference' => [
                    'invoice_created' => ['email', 'whatsapp'],
                    'invoice_reminder' => ['email', 'whatsapp'],
                    'invoice_paid' => ['email'],
                ],
                'description' => 'Invoice pembayaran transaksi produk ' . $item->title . ' untuk user ' . Auth::user()->name,
                'amount' => $totalAmount,
                'items' => $items,
                'fees' => $fees,
                'failure_redirect_url' => route('invoice.show', ['id' => $invoice->id]),
                'success_redirect_url' => route('invoice.show', ['id' => $invoice->id]),
            ]);

            $xendit_api_instance = new InvoiceApi();
            $xendit_invoice = $xendit_api_instance->createInvoice($xendit_create_invoice);

            $invoice->update([
                'invoice_url' => $xendit_invoice['invoice_url'],
            ]);

            $enrollmentTable::create([
                'invoice_id' => $invoice->id,
                $enrollmentField => $item->id,
                'price' => $item->price,
                'completed_at' => null,
                'progress' => 0,
            ]);

            $this->addToCertificateParticipants($type, $item->id, $userId);

            DB::commit();

            return response()->json([
                'url' => $xendit_invoice['invoice_url'],
                'invoice' => $invoice
            ], 200);
        } catch (\Throwable $th) {
            DB::rollBack();
            return response()->json([
                'message' => $th->getMessage(),
            ], 500);
        }
    }

    public function enrollFree(Request $request)
    {
        DB::beginTransaction();
        try {
            $userId = Auth::id();
            $type = $request->input('type', 'course');
            $itemId = $request->input('id');

            $item = null;
            $enrollmentTable = null;
            $enrollmentField = null;

            if ($type === 'course') {
                $item = Course::findOrFail($itemId);
                $enrollmentTable = EnrollmentCourse::class;
                $enrollmentField = 'course_id';
            } elseif ($type === 'bootcamp') {
                $item = Bootcamp::findOrFail($itemId);
                $enrollmentTable = EnrollmentBootcamp::class;
                $enrollmentField = 'bootcamp_id';
            } elseif ($type === 'webinar') {
                $item = Webinar::findOrFail($itemId);
                $enrollmentTable = EnrollmentWebinar::class;
                $enrollmentField = 'webinar_id';
            } else {
                throw new \Exception('Tipe pendaftaran tidak valid');
            }

            if ($item->price > 0) {
                throw new \Exception('Item ini tidak gratis');
            }

            $existingEnrollment = $enrollmentTable::where($enrollmentField, $item->id)
                ->whereHas('invoice', function ($query) use ($userId) {
                    $query->where('user_id', $userId)
                        ->where('status', 'paid');
                })
                ->first();

            if ($existingEnrollment) {
                throw new \Exception('Anda sudah terdaftar untuk item ini');
            }

            $invoice_code = IdGenerator::generate([
                'table' => 'invoices',
                'field' => 'invoice_code',
                'length' => 11,
                'reset_on_prefix_change'  => true,
                'prefix' => 'AKS-' . date('y')
            ]);

            $invoice = Invoice::create([
                'user_id' => $userId,
                'invoice_code' => $invoice_code,
                'discount_amount' => 0,
                'amount' => 0,
                'nett_amount' => 0,
                'status' => 'paid',
                'paid_at' => Carbon::now('Asia/Jakarta'),
                'payment_method' => 'FREE',
                'payment_channel' => 'FREE_ENROLLMENT',
                'expires_at' => null,
            ]);

            $enrollment = $enrollmentTable::create([
                'invoice_id' => $invoice->id,
                $enrollmentField => $item->id,
                'price' => 0,
                'completed_at' => null,
                'progress' => 0,
            ]);

            if ($type === 'webinar' || $type === 'bootcamp') {
                $requirementData = [
                    'enrollment_type' => $type,
                    'enrollment_id' => $enrollment->id
                ];

                if ($request->hasFile('ig_follow_proof')) {
                    $requirementData['ig_follow_proof'] = $request->file('ig_follow_proof')
                        ->store('free-requirements/ig', 'public');
                }

                if ($request->hasFile('tiktok_follow_proof')) {
                    $requirementData['tiktok_follow_proof'] = $request->file('tiktok_follow_proof')
                        ->store('free-requirements/tiktok', 'public');
                }

                if ($request->hasFile('tag_friend_proof')) {
                    $requirementData['tag_friend_proof'] = $request->file('tag_friend_proof')
                        ->store('free-requirements/tag', 'public');
                }

                FreeEnrollmentRequirement::create($requirementData);
            }

            $this->addToCertificateParticipants($type, $item->id, $userId);

            $this->sendWhatsAppFreeEnrollment($invoice, $type, $item);

            DB::commit();

            return response()->json([
                'message' => 'Pendaftaran berhasil!',
                'redirect_url' => route('invoice.show', ['id' => $invoice->id]),
                'invoice_code' => $invoice_code
            ], 200);
        } catch (\Throwable $th) {
            DB::rollBack();
            return response()->json([
                'message' => $th->getMessage(),
            ], 500);
        }
    }

    public function show($id)
    {
        $invoice = Invoice::with(['courseItems.course', 'bootcampItems.bootcamp', 'webinarItems.webinar'])->findOrFail($id);
        return Inertia::render('user/checkout/success', ['invoice' => $invoice]);
    }

    /**
     * Cancel invoice manually (both in database and Xendit)
     */
    public function cancel($id)
    {
        DB::beginTransaction();
        try {
            $invoice = Invoice::with('discountUsage.discountCode')
                ->where('id', $id)
                ->where('user_id', Auth::id())
                ->where('status', 'pending')
                ->firstOrFail();

            $this->expireInvoiceInXendit($invoice->invoice_code);

            if ($invoice->discountUsage) {
                $discountCode = $invoice->discountUsage->discountCode;
                if ($discountCode) {
                    $discountCode->decrement('used_count');
                }
                $invoice->discountUsage->delete();
            }

            if ($invoice->courseItems->count() > 0) {
                EnrollmentCourse::where('invoice_id', $invoice->id)->delete();
            }

            if ($invoice->bootcampItems->count() > 0) {
                EnrollmentBootcamp::where('invoice_id', $invoice->id)->delete();
            }

            if ($invoice->webinarItems->count() > 0) {
                EnrollmentWebinar::where('invoice_id', $invoice->id)->delete();
            }

            $userId = $invoice->user_id;

            foreach ($invoice->courseItems as $courseItem) {
                $certificate = Certificate::where('course_id', $courseItem->course_id)->first();
                if ($certificate) {
                    $hasOtherPaidEnrollment = EnrollmentCourse::where('course_id', $courseItem->course_id)
                        ->whereHas('invoice', function ($query) use ($userId) {
                            $query->where('user_id', $userId)
                                ->where('status', 'paid');
                        })
                        ->exists();

                    if (!$hasOtherPaidEnrollment) {
                        CertificateParticipant::where('certificate_id', $certificate->id)
                            ->where('user_id', $userId)
                            ->delete();
                    }
                }
            }

            foreach ($invoice->bootcampItems as $bootcampItem) {
                $certificate = Certificate::where('bootcamp_id', $bootcampItem->bootcamp_id)->first();
                if ($certificate) {
                    $hasOtherPaidEnrollment = EnrollmentBootcamp::where('bootcamp_id', $bootcampItem->bootcamp_id)
                        ->whereHas('invoice', function ($query) use ($userId) {
                            $query->where('user_id', $userId)
                                ->where('status', 'paid');
                        })
                        ->exists();

                    if (!$hasOtherPaidEnrollment) {
                        CertificateParticipant::where('certificate_id', $certificate->id)
                            ->where('user_id', $userId)
                            ->delete();
                    }
                }
            }

            foreach ($invoice->webinarItems as $webinarItem) {
                $certificate = Certificate::where('webinar_id', $webinarItem->webinar_id)->first();
                if ($certificate) {
                    $hasOtherPaidEnrollment = EnrollmentWebinar::where('webinar_id', $webinarItem->webinar_id)
                        ->whereHas('invoice', function ($query) use ($userId) {
                            $query->where('user_id', $userId)
                                ->where('status', 'paid');
                        })
                        ->exists();

                    if (!$hasOtherPaidEnrollment) {
                        CertificateParticipant::where('certificate_id', $certificate->id)
                            ->where('user_id', $userId)
                            ->delete();
                    }
                }
            }

            $invoice->update(['status' => 'failed']);

            DB::commit();

            return response()->json([
                'message' => 'Invoice berhasil dibatalkan.',
                'success' => true
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Gagal membatalkan invoice. ' . $e->getMessage(),
                'success' => false
            ], 400);
        }
    }

    /**
     * Expire invoice di Xendit menggunakan external_id
     */
    private function expireInvoiceInXendit($externalId)
    {
        try {
            $xendit_api_instance = new InvoiceApi();

            $invoices = $xendit_api_instance->getInvoices(null, null, $externalId);

            if (!empty($invoices) && isset($invoices[0]['id'])) {
                $xenditInvoiceId = $invoices[0]['id'];

                $xendit_api_instance->expireInvoice($xenditInvoiceId);
            }
        } catch (\Exception $e) {
            Log::error('Failed to expire invoice in Xendit: ' . $e->getMessage(), [
                'external_id' => $externalId
            ]);
        }
    }

    /**
     * Check and expire old invoices (to be called by scheduler)
     */
    public function expireOldInvoices()
    {
        $expiredInvoices = Invoice::where('status', 'pending')
            ->where('expires_at', '<', Carbon::now())
            ->get();

        foreach ($expiredInvoices as $invoice) {
            $this->expireInvoiceInXendit($invoice->invoice_code);
            $invoice->update(['status' => 'failed']);
        }

        return response()->json([
            'message' => count($expiredInvoices) . ' invoices expired and updated.',
            'expired_count' => count($expiredInvoices)
        ]);
    }

    public function callbackXendit(Request $request)
    {
        $getToken = $request->header('x-callback-token');
        $callbackToken = config('xendit.CALLBACK_TOKEN');

        if ($getToken != $callbackToken) {
            return response()->json(['message' => 'unauthorized'], 401);
        }

        $invoice = Invoice::with([
            'user',
            'courseItems.course',
            'bootcampItems.bootcamp',
            'webinarItems.webinar'
        ])->where('invoice_code', $request->external_id)->first();

        if (!$invoice) {
            return response()->json(['message' => 'Invoice Not Found'], 404);
        }

        // Hanya proses jika status invoice masih pending untuk menghindari duplikasi
        if ($invoice->status !== 'pending') {
            return response()->json(['message' => 'Invoice already processed'], 200);
        }

        $isSuccess = ($request->status == 'PAID' || $request->status == 'SETTLED');

        if ($isSuccess) {
            $invoice->update([
                'paid_at' => Carbon::now('Asia/Jakarta'),
                'status' => 'paid',
                'payment_method' => $request->payment_method,
                'payment_channel' => $request->payment_channel
            ]);

            $this->recordAffiliateCommission($invoice);
            $this->addEnrollmentToCertificateParticipants($invoice);

            // Kirim WhatsApp setelah pembayaran berhasil
            $this->sendWhatsAppNotification($invoice);
        } else {
            $invoice->update(['status' => 'failed']);

            // Kirim WhatsApp untuk pembayaran gagal (opsional)
            $this->sendWhatsAppPaymentFailed($invoice);
        }

        return response()->json(['message' => 'Success'], 200);
    }

    /**
     * Kirim notifikasi WhatsApp setelah pembayaran berhasil
     *
     * @param Invoice $invoice
     * @return void
     */
    private function sendWhatsAppNotification(Invoice $invoice)
    {
        try {
            $user = $invoice->user;

            if (!$user->phone_number) {
                Log::warning('User does not have phone number', ['user_id' => $user->id, 'invoice_code' => $invoice->invoice_code]);
                return;
            }

            $phoneNumber = $this->formatPhoneNumber($user->phone_number);
            $message = $this->createWhatsAppMessage($invoice);

            $waData = [
                [
                    'phone' => $phoneNumber,
                    'message' => $message,
                    'isGroup' => 'false'
                ]
            ];

            $sent = self::sendText($waData);

            if ($sent) {
                Log::info('WhatsApp notification sent successfully', [
                    'invoice_code' => $invoice->invoice_code,
                    'user_id' => $user->id,
                    'phone' => $phoneNumber
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Failed to send WhatsApp notification', [
                'invoice_code' => $invoice->invoice_code,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Kirim notifikasi WhatsApp untuk pembayaran gagal
     *
     * @param Invoice $invoice
     * @return void
     */
    private function sendWhatsAppPaymentFailed(Invoice $invoice)
    {
        try {
            $user = $invoice->user;

            if (!$user->phone_number) {
                return;
            }

            $phoneNumber = $this->formatPhoneNumber($user->phone_number);

            $itemType = 'Program';
            if ($invoice->courseItems->count() > 0) {
                $itemType = 'Kelas Online';
            } elseif ($invoice->bootcampItems->count() > 0) {
                $itemType = 'Bootcamp';
            } elseif ($invoice->webinarItems->count() > 0) {
                $itemType = 'Webinar';
            }

            $message = "*[Aksademy - Pembayaran {$itemType} Gagal]*\n\n";
            $message .= "Hai *{$user->name}*,\n\n";
            $message .= "Maaf, pembayaran {$itemType} untuk invoice *{$invoice->invoice_code}* tidak berhasil atau telah kadaluarsa.\n\n";
            $message .= "Silakan melakukan pembelian ulang jika Anda masih berminat.\n\n";
            $message .= "Terima kasih atas perhatiannya.\n\n";
            $message .= "*Araska - Customer Support*";

            $waData = [
                [
                    'phone' => $phoneNumber,
                    'message' => $message,
                    'isGroup' => 'false'
                ]
            ];

            self::sendText($waData);
        } catch (\Exception $e) {
            Log::error('Failed to send WhatsApp payment failed notification', [
                'invoice_code' => $invoice->invoice_code,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Buat pesan WhatsApp berdasarkan item yang dibeli
     *
     * @param Invoice $invoice
     * @return string
     */
    private function createWhatsAppMessage(Invoice $invoice): string
    {
        $user = $invoice->user;
        $loginUrl = route('login');
        $profileUrl = route('profile.index');

        $invoice->load('discountUsage.discountCode');

        $itemType = null;
        $itemData = null;
        $typeInfo = null;

        if ($invoice->courseItems->count() > 0) {
            $itemType = 'course';
            $itemData = $invoice->courseItems->first();
            $typeInfo = [
                'icon' => '📚',
                'name' => 'Kelas Online',
                'menu' => 'Kelas Saya',
                'title' => $itemData->course->title,
                'item' => $itemData->course
            ];
        } elseif ($invoice->bootcampItems->count() > 0) {
            $itemType = 'bootcamp';
            $itemData = $invoice->bootcampItems->first();
            $typeInfo = [
                'icon' => '🎯',
                'name' => 'Bootcamp',
                'menu' => 'Bootcamp Saya',
                'title' => $itemData->bootcamp->title,
                'item' => $itemData->bootcamp
            ];
        } elseif ($invoice->webinarItems->count() > 0) {
            $itemType = 'webinar';
            $itemData = $invoice->webinarItems->first();
            $typeInfo = [
                'icon' => '📺',
                'name' => 'Webinar',
                'menu' => 'Webinar Saya',
                'title' => $itemData->webinar->title,
                'item' => $itemData->webinar
            ];
        }

        $isFreePurchase = $invoice->amount == 0;

        if ($isFreePurchase) {
            $message = "*[Aksademy - Pendaftaran {$typeInfo['name']} Berhasil]* ✅\n\n";
            $message .= "Hai *{$user->name}*,\n\n";
            $message .= "Selamat! Anda telah berhasil mendaftar untuk {$typeInfo['name']} GRATIS.\n\n";
        } else {
            $message = "*[Aksademy - Pembayaran {$typeInfo['name']} Berhasil]* ✅\n\n";
            $message .= "Hai *{$user->name}*,\n\n";
            $message .= "Terima kasih! Pembayaran {$typeInfo['name']} Anda telah berhasil diproses.\n\n";
        }

        $message .= "*Detail " . ($isFreePurchase ? 'Pendaftaran' : 'Pembelian') . ":*\n";
        $message .= "🧾 " . ($isFreePurchase ? 'Kode' : 'Invoice') . ": *{$invoice->invoice_code}*\n";
        $message .= "{$typeInfo['icon']} {$typeInfo['name']}: *{$typeInfo['title']}*\n";

        if ($isFreePurchase) {
            $message .= "💰 Biaya: *GRATIS* 🎉\n";
        } else {
            if ($invoice->discountUsage && $invoice->discountUsage->discountCode) {
                $discountCode = $invoice->discountUsage->discountCode;
                $message .= "🏷️ Kode Promo: *{$discountCode->code}* (-Rp " . number_format($invoice->discountUsage->discount_amount, 0, ',', '.') . ")\n";
            }
            $message .= "💰 Total: *Rp " . number_format($invoice->amount, 0, ',', '.') . "*\n";
        }

        $message .= "📅 " . ($isFreePurchase ? 'Terdaftar' : 'Dibayar') . ": " . Carbon::parse($invoice->paid_at)->format('d M Y H:i') . "\n\n";

        $message .= "*Cara Mengakses:*\n";
        $message .= "1. Login ke akun Anda: {$loginUrl}\n";
        $message .= "2. Kunjungi dashboard: {$profileUrl}\n";
        $message .= "3. Pilih menu '{$typeInfo['menu']}'\n";
        $message .= "4. Mulai belajar dan raih sertifikat! 🎓\n\n";

        if ($itemType === 'webinar') {
            $webinar = $typeInfo['item'];
            $startTime = Carbon::parse($webinar->start_time);
            $message .= "*Jadwal Webinar:*\n";
            $message .= "📅 {$startTime->format('d M Y')}\n";
            $message .= "🕐 {$startTime->format('H:i')} WIB\n\n";

            if (!empty($webinar->group_url)) {
                $message .= "*Join Group Webinar:*\n";
                $message .= "👥 {$webinar->group_url}\n\n";
                $message .= "⚠️ *Penting:* \n";
                $message .= "• Bergabung dengan group untuk update terbaru\n";
                $message .= "• Jangan lupa attend sesuai jadwal!\n\n";
            } else {
                $message .= "⚠️ *Penting:* Jangan lupa bergabung sesuai jadwal!\n\n";
            }
        } elseif ($itemType === 'bootcamp') {
            $bootcamp = $typeInfo['item'];
            $startDate = Carbon::parse($bootcamp->start_date);
            $endDate = Carbon::parse($bootcamp->end_date);
            $message .= "*Periode Bootcamp:*\n";
            $message .= "📅 {$startDate->format('d M Y')} - {$endDate->format('d M Y')}\n\n";

            if (!empty($bootcamp->group_url)) {
                $message .= "*Join Group Bootcamp:*\n";
                $message .= "👥 {$bootcamp->group_url}\n\n";
                $message .= "⚠️ *Penting:* \n";
                $message .= "• Bergabung dengan group untuk mendapatkan info penting dan diskusi\n";
                $message .= "• Aktif mengikuti seluruh kegiatan bootcamp\n\n";
            }
        }

        if ($isFreePurchase) {
            $message .= "Terima kasih telah bergabung dengan Aksademy! 🚀\n\n";
        } else {
            $message .= "Jika ada pertanyaan, jangan ragu untuk menghubungi kami.\n\n";
            $message .= "Selamat belajar! 🚀\n\n";
        }

        $message .= "*Araska - Customer Support*";

        return $message;
    }

    /**
     * Kirim notifikasi WhatsApp untuk pendaftaran gratis
     *
     * @param Invoice $invoice
     * @param string $type
     * @param mixed $item
     * @return void
     */
    private function sendWhatsAppFreeEnrollment(Invoice $invoice, string $type, $item)
    {
        try {
            $user = $invoice->user;

            if (!$user->phone_number) {
                Log::warning('User does not have phone number for free enrollment', [
                    'user_id' => $user->id,
                    'invoice_code' => $invoice->invoice_code
                ]);
                return;
            }

            $phoneNumber = $this->formatPhoneNumber($user->phone_number);
            $message = $this->createWhatsAppMessage($invoice);

            $waData = [
                [
                    'phone' => $phoneNumber,
                    'message' => $message,
                    'isGroup' => 'false'
                ]
            ];

            $sent = self::sendText($waData);

            if ($sent) {
                Log::info('WhatsApp free enrollment notification sent successfully', [
                    'invoice_code' => $invoice->invoice_code,
                    'user_id' => $user->id,
                    'phone' => $phoneNumber,
                    'type' => $type
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Failed to send WhatsApp free enrollment notification', [
                'invoice_code' => $invoice->invoice_code,
                'type' => $type,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Format nomor HP ke format WhatsApp (62...)
     *
     * @param string $phoneNumber
     * @return string
     */
    private function formatPhoneNumber(string $phoneNumber): string
    {
        // Hapus semua karakter non-digit
        $phoneNumber = preg_replace('/[^0-9]/', '', $phoneNumber);

        // Jika dimulai dengan 0, ganti dengan 62
        if (substr($phoneNumber, 0, 1) == '0') {
            $phoneNumber = '62' . substr($phoneNumber, 1);
        }

        // Jika belum dimulai dengan 62, tambahkan 62
        if (substr($phoneNumber, 0, 2) != '62') {
            $phoneNumber = '62' . $phoneNumber;
        }

        return $phoneNumber;
    }

    /**
     * Mencatat komisi untuk afiliasi jika ada.
     *
     * @param Invoice $invoice
     * @return void
     */
    private function recordAffiliateCommission(Invoice $invoice)
    {
        $buyer = $invoice->user;

        // Cek apakah pembeli ini direferensikan oleh seseorang
        if ($buyer && $buyer->referred_by_user_id) {
            $affiliate = User::find($buyer->referred_by_user_id);

            // Memastikan afiliasi ada, aktif, dan memiliki rate komisi
            if ($affiliate && $affiliate->affiliate_status === 'Active' && $affiliate->commission > 0) {
                $commissionAmount = $invoice->amount * ($affiliate->commission / 100);

                AffiliateEarning::create([
                    'affiliate_user_id' => $affiliate->id,
                    'invoice_id' => $invoice->id,
                    'amount' => $commissionAmount,
                    'rate' => $affiliate->commission,
                    'status' => 'pending',
                ]);
            }
        }

        $this->recordMentorCommission($invoice);
    }

    /**
     * Mencatat komisi untuk mentor dari penjualan kelas mereka
     *
     * @param Invoice $invoice
     * @return void
     */
    private function recordMentorCommission(Invoice $invoice)
    {
        $invoice->load(['courseItems.course.user']);

        foreach ($invoice->courseItems as $courseItem) {
            $course = $courseItem->course;
            $mentor = $course->user;

            if ($mentor && $mentor->hasRole('mentor') && $mentor->affiliate_status === 'Active' && $mentor->commission > 0) {
                $commissionAmount = $courseItem->price * ($mentor->commission / 100);

                AffiliateEarning::create([
                    'affiliate_user_id' => $mentor->id,
                    'invoice_id' => $invoice->id,
                    'amount' => $commissionAmount,
                    'rate' => $mentor->commission,
                    'status' => 'pending',
                    'type' => 'mentor_course',
                    'course_id' => $course->id,
                ]);
            }
        }
    }

    /**
     * Menambahkan peserta ke certificate participants berdasarkan tipe program
     *
     * @param string $type
     * @param string $itemId
     * @param string $userId
     * @return void
     */
    private function addToCertificateParticipants($type, $itemId, $userId)
    {
        $certificate = null;

        // Cari sertifikat berdasarkan tipe program
        switch ($type) {
            case 'course':
                $certificate = Certificate::where('course_id', $itemId)->first();
                break;
            case 'bootcamp':
                $certificate = Certificate::where('bootcamp_id', $itemId)->first();
                break;
            case 'webinar':
                $certificate = Certificate::where('webinar_id', $itemId)->first();
                break;
        }

        if ($certificate) {
            $existingParticipant = CertificateParticipant::where('certificate_id', $certificate->id)
                ->where('user_id', $userId)
                ->first();

            if (!$existingParticipant) {
                CertificateParticipant::create([
                    'certificate_id' => $certificate->id,
                    'user_id' => $userId,
                ]);
            }
        }
    }

    /**
     * Menambahkan enrollment ke certificate participants dari invoice yang dibayar
     *
     * @param Invoice $invoice
     * @return void
     */
    private function addEnrollmentToCertificateParticipants(Invoice $invoice)
    {
        $invoice->load(['courseItems', 'bootcampItems', 'webinarItems']);

        foreach ($invoice->courseItems as $courseItem) {
            $this->addToCertificateParticipants('course', $courseItem->course_id, $invoice->user_id);
        }

        foreach ($invoice->bootcampItems as $bootcampItem) {
            $this->addToCertificateParticipants('bootcamp', $bootcampItem->bootcamp_id, $invoice->user_id);
        }

        foreach ($invoice->webinarItems as $webinarItem) {
            $this->addToCertificateParticipants('webinar', $webinarItem->webinar_id, $invoice->user_id);
        }
    }

    public function generatePDF($id)
    {
        $invoice = Invoice::with([
            'user',
            'courseItems.course',
            'bootcampItems.bootcamp',
            'webinarItems.webinar'
        ])->findOrFail($id);

        if ($invoice->status !== 'paid') {
            abort(403, 'Invoice belum dibayar');
        }

        $data = [
            'invoice' => $invoice,
            'company' => [
                'name' => 'Aksademy',
                'address' => 'Perumahan Permata Permadani, Blok B1. Kel. Pendem Kec. Junrejo Kota Batu Prov. Jawa Timur, 65324',
                'phone' => '+6285142505794',
                'email' => 'aksarateknologi@gmail.com',
                'website' => 'www.aksademy.id'
            ]
        ];

        $pdf = PDF::loadView('invoices.pdf', $data);
        $pdf->setPaper('A4', 'portrait');

        return $pdf->stream("invoice-{$invoice->invoice_code}.pdf");
    }
}
