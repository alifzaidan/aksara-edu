<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ProductInstallmentTerm extends Model
{
    use HasUuids;

    protected $guarded = ['created_at', 'updated_at'];

    protected $casts = [
        'due_date' => 'date',
        'amount' => 'integer',
    ];

    public function termable()
    {
        return $this->morphTo();
    }

    /**
     * Sinkronisasikan perubahan termin (due_date dan nominal) ke invoice anak yang masih pending
     */
    public function syncWithPendingInvoices(): void
    {
        $adminFeePerTerm = 5000;
        $childInvoices = Invoice::where('installment_term_id', $this->id)
            ->where('status', '!=', 'paid')
            ->get();

        $newDueDate = $this->due_date ? \Carbon\Carbon::parse($this->due_date) : null;

        foreach ($childInvoices as $child) {
            $child->update([
                'amount' => $this->amount + $adminFeePerTerm,
                'nett_amount' => $this->amount,
                'installment_due_date' => $newDueDate,
            ]);

            // Jika parent invoice sedang disuspend tapi deadline baru sudah di masa depan (tidak overdue lagi)
            if ($child->parentInvoice && $child->parentInvoice->access_suspended_at && $newDueDate) {
                $now = \Carbon\Carbon::now('Asia/Jakarta');
                $hasOtherOverdue = $child->parentInvoice->installmentTerms()
                    ->where('id', '!=', $child->id)
                    ->where('status', '!=', 'paid')
                    ->whereNotNull('installment_due_date')
                    ->where('installment_due_date', '<', $now->startOfDay())
                    ->exists();

                if (!$hasOtherOverdue && $newDueDate->endOfDay()->gte($now)) {
                    $child->parentInvoice->update(['access_suspended_at' => null]);
                }
            }

            // Sync total amount di parent invoice
            if ($child->parentInvoice) {
                $parent = $child->parentInvoice;
                $allTerms = $parent->installmentTerms;
                $parent->update([
                    'nett_amount' => $allTerms->sum('nett_amount'),
                    'amount' => $allTerms->sum('amount'),
                ]);
            }
        }
    }

    /**
     * Sinkronisasikan registration_deadline produk dengan Termin 1 (DP) dan invoice anak terkait
     */
    public static function syncFirstTermRegistrationDeadline(Model $model, mixed $newDeadline): void
    {
        if (empty($newDeadline)) {
            return;
        }

        $term1 = self::where('termable_type', get_class($model))
            ->where('termable_id', $model->id)
            ->where('term_number', 1)
            ->first();

        if ($term1) {
            $term1->update(['due_date' => \Carbon\Carbon::parse($newDeadline)]);
            $term1->syncWithPendingInvoices();
        }
    }
}

