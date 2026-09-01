<?php

namespace App\Http\Controllers\User\Profile;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CertificationProgramController extends Controller
{
    public function index()
    {
        $userId = Auth::id();

        $invoices = Invoice::with(['certificationProgramItems.certificationProgram.category', 'installmentTerms'])
            ->purchasedByUser($userId)
            ->orderBy('created_at', 'desc')
            ->get();

        // Explicitly structure data for Inertia
        $myCertificationPrograms = $invoices->map(function ($invoice) {
            $terms = $invoice->installmentTerms ?: collect();
            $isInstallment = $invoice->is_installment || $invoice->status === 'installment_pending' || $terms->count() > 0;
            $paidTerms = $terms->where('status', 'paid')->count();
            $totalTerms = $terms->count();
            $isSuspended = $invoice->isAccessSuspended();

            return [
                'id' => $invoice->id,
                'invoice_code' => $invoice->invoice_code,
                'invoice_url' => $invoice->invoice_url,
                'status' => $invoice->status,
                'is_installment' => $isInstallment,
                'is_access_suspended' => $isSuspended,
                'paid_terms' => $paidTerms,
                'total_terms' => $totalTerms,
                'paid_at' => $invoice->paid_at,
                'created_at' => $invoice->created_at,
                'payment_method' => $invoice->payment_method,
                'payment_channel' => $invoice->payment_channel,
                'amount' => $invoice->amount,
                'nett_amount' => $invoice->nett_amount,
                'discount_amount' => $invoice->discount_amount,
                'certificationProgramItems' => $invoice->certificationProgramItems->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'price' => $item->price,
                        'is_scholarship' => $item->is_scholarship,
                        'created_at' => $item->created_at,
                        'certificationProgram' => [
                            'id' => $item->certificationProgram?->id,
                            'title' => $item->certificationProgram?->title,
                            'slug' => $item->certificationProgram?->slug,
                            'thumbnail' => $item->certificationProgram?->thumbnail,
                            'category' => [
                                'id' => $item->certificationProgram?->category?->id,
                                'name' => $item->certificationProgram?->category?->name,
                            ],
                        ],
                    ];
                })->toArray(),
            ];
        })->toArray();

        return Inertia::render('user/profile/certification-program/index', [
            'myCertificationPrograms' => $myCertificationPrograms,
        ]);
    }

    public function detail(string $program)
    {
        $userId = Auth::id();

        // Get all purchased invoices with certification items
        $invoices = Invoice::with([
            'certificationProgramItems.certificationProgram.category',
            'certificationProgramItems.certificationProgram.schedules' => function($q) {
                $q->orderBy('schedule_date')->orderBy('start_time');
            },
            'certificationProgramItems.certificationProgram.socializationSchedules' => function($q) {
                $q->orderBy('schedule_date')->orderBy('start_time');
            },
            'installmentTerms',
        ])
            ->purchasedByUser($userId)
            ->orderBy('created_at', 'desc')
            ->get();

        // Find the matching invoice and filter items
        $matchedInvoice = null;
        $matchedItem = null;

        foreach ($invoices as $invoice) {
            foreach ($invoice->certificationProgramItems as $item) {
                if ($item->certificationProgram && $item->certificationProgram->slug === $program) {
                    $matchedInvoice = $invoice;
                    $matchedItem = $item;
                    break 2;
                }
            }
        }

        if (!$matchedInvoice || !$matchedItem) {
            abort(404, 'Sertifikasi program tidak ditemukan atau Anda belum terdaftar.');
        }

        $terms = $matchedInvoice->installmentTerms ?: collect();
        $isInstallment = $matchedInvoice->is_installment || $matchedInvoice->status === 'installment_pending' || $terms->count() > 0;
        $paidTerms = $terms->where('status', 'paid')->count();
        $totalTerms = $terms->count();
        $isSuspended = $matchedInvoice->isAccessSuspended();
        $isFullyPaid = $matchedInvoice->status === 'paid' || $matchedInvoice->isFullyPaid();

        // Explicitly structure data for Inertia serialization
        return Inertia::render('user/profile/certification-program/detail', [
            'invoice' => [
                'id' => $matchedInvoice->id,
                'invoice_code' => $matchedInvoice->invoice_code,
                'invoice_url' => $matchedInvoice->invoice_url,
                'amount' => $matchedInvoice->amount,
                'nett_amount' => $matchedInvoice->nett_amount,
                'discount_amount' => $matchedInvoice->discount_amount,
                'status' => $matchedInvoice->status,
                'is_installment' => $isInstallment,
                'is_access_suspended' => $isSuspended,
                'is_fully_paid' => $isFullyPaid,
                'paid_terms' => $paidTerms,
                'total_terms' => $totalTerms,
                'paid_at' => $matchedInvoice->paid_at,
                'created_at' => $matchedInvoice->created_at,
                'payment_method' => $matchedInvoice->payment_method,
                'payment_channel' => $matchedInvoice->payment_channel,
            ],
            'programItem' => [
                'id' => $matchedItem->id,
                'price' => $matchedItem->price,
                'is_scholarship' => $matchedItem->is_scholarship,
                'created_at' => $matchedItem->created_at,
                'certificationProgram' => [
                    'id' => $matchedItem->certificationProgram->id,
                    'title' => $matchedItem->certificationProgram->title,
                    'slug' => $matchedItem->certificationProgram->slug,
                    'thumbnail' => $matchedItem->certificationProgram->thumbnail,
                    'price' => $matchedItem->certificationProgram->price,
                    'scholarship_price' => $matchedItem->certificationProgram->scholarship_price,
                    'description' => $matchedItem->certificationProgram->description,
                    'benefits' => $matchedItem->certificationProgram->benefits,
                    'group_url' => $matchedItem->certificationProgram->group_url,
                    'socialization_group_url' => $matchedItem->certificationProgram->socialization_group_url,
                    'program_url' => $matchedItem->certificationProgram->program_url,
                    'category' => [
                        'id' => $matchedItem->certificationProgram->category?->id,
                        'name' => $matchedItem->certificationProgram->category?->name,
                    ],
                    'schedules' => $matchedItem->certificationProgram->schedules->map(function ($schedule) {
                        return [
                            'id' => $schedule->id,
                            'title' => $schedule->title,
                            'schedule_date' => $schedule->schedule_date,
                            'day' => $schedule->day,
                            'start_time' => $schedule->start_time,
                            'end_time' => $schedule->end_time,
                            'recording_url' => $schedule->recording_url,
                        ];
                    })->toArray(),
                    'socializationSchedules' => $matchedItem->certificationProgram->socializationSchedules->map(function ($schedule) {
                        return [
                            'id' => $schedule->id,
                            'title' => $schedule->title,
                            'schedule_date' => $schedule->schedule_date,
                            'day' => $schedule->day,
                            'start_time' => $schedule->start_time,
                            'end_time' => $schedule->end_time,
                            'recording_url' => $schedule->recording_url,
                        ];
                    })->toArray(),
                ],
            ],
        ]);
    }
}
