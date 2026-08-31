<?php

namespace App\Console\Commands;

use App\Models\Invoice;
use App\Traits\MessaraTrait;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CheckInstallmentOverdue extends Command
{
    use MessaraTrait;

    protected $signature = 'installment:check-overdue';
    protected $description = 'Cek jatuh tempo cicilan: kirim reminder H-7, H-3, H-0, dan bekukan akses jika melewati jatuh tempo';

    public function handle(): int
    {
        $today = Carbon::today('Asia/Jakarta');
        $this->info("Checking installment overdue at: {$today->toDateString()}");

        $pendingTerms = Invoice::with(['parentInvoice.user'])
            ->where('status', 'pending')
            ->whereNotNull('parent_invoice_id')
            ->whereNotNull('installment_due_date')
            ->get();

        $reminded = 0;
        $suspended = 0;

        foreach ($pendingTerms as $childInvoice) {
            $dueDate = Carbon::parse($childInvoice->installment_due_date)->startOfDay();
            $daysUntilDue = $today->diffInDays($dueDate, false); // negative = overdue

            $parentInvoice = $childInvoice->parentInvoice;
            if (!$parentInvoice) continue;

            $user = $parentInvoice->user;

            // Overdue: jatuh tempo sudah lewat
            if ($daysUntilDue < 0) {
                // Bekukan akses jika belum dibekukan
                if (!$parentInvoice->isAccessSuspended()) {
                    $parentInvoice->update(['access_suspended_at' => Carbon::now('Asia/Jakarta')]);

                    Log::info('Installment access suspended', [
                        'parent_invoice_code' => $parentInvoice->invoice_code,
                        'child_invoice_code' => $childInvoice->invoice_code,
                        'user_id' => $user->id,
                        'due_date' => $dueDate->toDateString(),
                    ]);

                    $this->sendSuspensionNotification($childInvoice, $parentInvoice, $user);
                    $suspended++;
                }
                continue;
            }

            // Reminder H-7, H-3, H-0
            if (in_array($daysUntilDue, [7, 3, 0])) {
                $this->sendReminderNotification($childInvoice, $parentInvoice, $user, (int) $daysUntilDue);
                $reminded++;

                Log::info("Installment reminder H-{$daysUntilDue} sent", [
                    'child_invoice_code' => $childInvoice->invoice_code,
                    'user_id' => $user->id,
                ]);
            }
        }

        $this->info("Done. Reminded: {$reminded}, Suspended: {$suspended}");
        return self::SUCCESS;
    }

    private function sendReminderNotification(Invoice $child, Invoice $parent, mixed $user, int $daysLeft): void
    {
        try {
            if (!$user?->phone_number) return;

            $phoneNumber = $this->formatPhoneNumber($user->phone_number);
            $dueDate = Carbon::parse($child->installment_due_date)->translatedFormat('d F Y');
            $termNumber = $child->installment_number;
            $totalTerms = $parent->installmentTerms()->count();
            $amount = 'Rp ' . number_format($child->amount, 0, ',', '.');

            $dayLabel = $daysLeft === 0 ? 'hari ini' : "{$daysLeft} hari lagi";

            $message = "*[Aksademy - Pengingat Cicilan]*\n\n";
            $message .= "Hai *{$user->name}*,\n\n";
            $message .= "Cicilan ke-*{$termNumber}/{$totalTerms}* sebesar *{$amount}* jatuh tempo *{$dayLabel}* ({$dueDate}).\n\n";
            $message .= "Segera bayar agar akses Anda tidak dibekukan.\n\n";
            $message .= "*Aksademy - Customer Support*";

            self::sendText([['phone' => $phoneNumber, 'message' => $message, 'isGroup' => 'false']]);
        } catch (\Throwable $e) {
            Log::error('Failed to send installment reminder', ['error' => $e->getMessage()]);
        }
    }

    private function sendSuspensionNotification(Invoice $child, Invoice $parent, mixed $user): void
    {
        try {
            if (!$user?->phone_number) return;

            $phoneNumber = $this->formatPhoneNumber($user->phone_number);
            $termNumber = $child->installment_number;
            $totalTerms = $parent->installmentTerms()->count();

            $message = "*[Aksademy - Akses Dibekukan]*\n\n";
            $message .= "Hai *{$user->name}*,\n\n";
            $message .= "Akses Anda telah *dibekukan* karena cicilan ke-*{$termNumber}/{$totalTerms}* melewati jatuh tempo.\n\n";
            $message .= "Segera bayar cicilan Anda melalui halaman *Cicilan Saya* di profil untuk memulihkan akses.\n\n";
            $message .= "*Aksademy - Customer Support*";

            self::sendText([['phone' => $phoneNumber, 'message' => $message, 'isGroup' => 'false']]);
        } catch (\Throwable $e) {
            Log::error('Failed to send installment suspension notification', ['error' => $e->getMessage()]);
        }
    }
}
