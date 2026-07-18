<?php

namespace App\Services;

use App\Models\User;
use App\Models\Invoice;
use App\Models\PointTransaction;
use Illuminate\Support\Facades\DB;

class PointService
{
    /**
     * Add a point transaction to the ledger and update the user's cached balance.
     * Uses lockForUpdate to prevent race conditions.
     *
     * @param User $user
     * @param int $amount Positive for addition, negative for deduction
     * @param string $type reward, redeem, adjustment
     * @param string $source referral, checkout, admin
     * @param string $description
     * @param string|null $referenceType
     * @param string|null $referenceId
     * @return PointTransaction
     * @throws \Exception
     */
    public function addTransaction(
        User $user,
        int $amount,
        string $type,
        string $source,
        string $description,
        ?string $referenceType = null,
        ?string $referenceId = null
    ): PointTransaction {
        return DB::transaction(function () use ($user, $amount, $type, $source, $description, $referenceType, $referenceId) {
            // Pessimistic lock on user record
            $lockedUser = User::where('id', $user->id)->lockForUpdate()->first();
            if (!$lockedUser) {
                throw new \Exception('User tidak ditemukan saat memproses transaksi poin.');
            }

            $newBalance = $lockedUser->point_balance + $amount;

            if ($newBalance < 0) {
                throw new \Exception('Saldo poin tidak mencukupi untuk melakukan transaksi ini.');
            }

            // Update user balance
            $lockedUser->update([
                'point_balance' => $newBalance
            ]);

            // Sync the object's point_balance attribute in memory
            $user->point_balance = $newBalance;

            // Create ledger entry
            return PointTransaction::create([
                'user_id' => $lockedUser->id,
                'type' => $type,
                'source' => $source,
                'amount' => $amount,
                'description' => $description,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
            ]);
        });
    }

    /**
     * Redeem points as a discount for an invoice checkout.
     *
     * @param User $user
     * @param int $amount
     * @param Invoice $invoice
     * @return PointTransaction
     */
    public function redeemPoints(User $user, int $amount, Invoice $invoice): PointTransaction
    {
        return $this->addTransaction(
            $user,
            -$amount,
            'redeem',
            'checkout',
            "Penggunaan poin sebagai potongan harga invoice {$invoice->invoice_code}",
            Invoice::class,
            $invoice->id
        );
    }

    /**
     * Refund redeemed points from a cancelled or expired invoice.
     * Ensures points are not refunded more than once.
     *
     * @param Invoice $invoice
     * @return PointTransaction|null
     */
    public function refundPoints(Invoice $invoice): ?PointTransaction
    {
        return DB::transaction(function () use ($invoice) {
            // Find the original deduction transaction
            $deduction = PointTransaction::where('user_id', $invoice->user_id)
                ->where('reference_type', Invoice::class)
                ->where('reference_id', $invoice->id)
                ->where('type', 'redeem')
                ->where('amount', '<', 0)
                ->first();

            if (!$deduction) {
                return null;
            }

            $refundAmount = abs($deduction->amount);

            // Check if already refunded
            $alreadyRefunded = PointTransaction::where('user_id', $invoice->user_id)
                ->where('reference_type', Invoice::class)
                ->where('reference_id', $invoice->id)
                ->where('type', 'adjustment')
                ->where('amount', '>', 0)
                ->where('description', 'like', '%Pengembalian poin%')
                ->exists();

            if ($alreadyRefunded) {
                return null;
            }

            $user = User::find($invoice->user_id);
            if (!$user) {
                return null;
            }

            return $this->addTransaction(
                $user,
                $refundAmount,
                'adjustment',
                'checkout',
                "Pengembalian poin karena pembatalan/kadaluarsa invoice {$invoice->invoice_code}",
                Invoice::class,
                $invoice->id
            );
        });
    }

    /**
     * Adjust a user's points (wrapper for addTransaction).
     *
     * @param string|int $userId
     * @param int $amount
     * @param string $source
     * @param string $description
     * @return PointTransaction
     */
    public function adjustPoints($userId, int $amount, string $source, string $description): PointTransaction
    {
        $user = User::findOrFail($userId);
        $type = 'adjustment';
        
        return $this->addTransaction(
            $user,
            $amount,
            $type,
            $source,
            $description
        );
    }
}
