<?php

namespace App\Services;

use App\Models\User;
use App\Models\Invoice;
use App\Models\Setting;
use App\Models\PointTransaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class RewardService
{
    protected $pointService;

    public function __construct(PointService $pointService)
    {
        $this->pointService = $pointService;
    }

    /**
     * Process referral rewards for a successful payment.
     *
     * @param Invoice $invoice
     * @return void
     */
    public function processReferralReward(Invoice $invoice): void
    {
        Log::info('processReferralReward started', [
            'invoice_code' => $invoice->invoice_code,
            'status' => $invoice->status,
            'referral_user_id' => $invoice->referral_user_id
        ]);

        // Atomic lock to serialize reward processing per invoice across distributed workers
        $lockKey = "referral_reward_invoice_{$invoice->id}";
        $lock = Cache::lock($lockKey, 15);

        try {
            $lock->block(5, function () use ($invoice) {
                DB::transaction(function () use ($invoice) {
                    // Re-fetch invoice with pessimistic lock to prevent concurrent execution
                    $lockedInvoice = Invoice::where('id', $invoice->id)->lockForUpdate()->first();

                    if (!$lockedInvoice) {
                        Log::warning('processReferralReward skipped: invoice not found', [
                            'invoice_id' => $invoice->id
                        ]);
                        return;
                    }

                    // Ensure invoice is paid
                    if ($lockedInvoice->status !== 'paid') {
                        Log::warning('processReferralReward skipped: invoice status is not paid', [
                            'invoice_code' => $lockedInvoice->invoice_code,
                            'status' => $lockedInvoice->status
                        ]);
                        return;
                    }

                    // Check if there is an associated referrer
                    if (!$lockedInvoice->referral_user_id) {
                        Log::warning('processReferralReward skipped: no referral_user_id on invoice', [
                            'invoice_code' => $lockedInvoice->invoice_code
                        ]);
                        return;
                    }

                    // Prevent duplicate rewards for the same invoice
                    $rewardExists = PointTransaction::where('reference_type', Invoice::class)
                        ->where('reference_id', $lockedInvoice->id)
                        ->where('source', 'referral')
                        ->exists();

                    if ($rewardExists) {
                        Log::info('Referral reward already processed for invoice', ['invoice_code' => $lockedInvoice->invoice_code]);
                        return;
                    }

                    $buyer = User::find($lockedInvoice->user_id);
                    $referrer = User::find($lockedInvoice->referral_user_id);

                    if (!$buyer || !$referrer) {
                        Log::error('processReferralReward skipped: buyer or referrer user not found', [
                            'buyer_id' => $lockedInvoice->user_id,
                            'referrer_id' => $lockedInvoice->referral_user_id
                        ]);
                        return;
                    }

                    // Secondary check: Ensure neither referrer nor buyer already received points for this invoice
                    $userAlreadyRewarded = PointTransaction::whereIn('user_id', [$referrer->id, $buyer->id])
                        ->where('reference_type', Invoice::class)
                        ->where('reference_id', $lockedInvoice->id)
                        ->where('source', 'referral')
                        ->exists();

                    if ($userAlreadyRewarded) {
                        Log::info('Referral reward already received by users for this invoice', [
                            'invoice_code' => $lockedInvoice->invoice_code
                        ]);
                        return;
                    }

                    // Check if referral reward is only allowed on first purchase
                    $onlyFirstPurchase = Setting::get('referral_only_first_purchase', true);
                    Log::info('Referral configurations', [
                        'only_first_purchase' => $onlyFirstPurchase,
                        'buyer_id' => $buyer->id,
                        'referrer_id' => $referrer->id
                    ]);

                    if ($onlyFirstPurchase) {
                        // Since this invoice is already marked as paid, the count will be 1 if it's the first purchase
                        $paidInvoicesCount = Invoice::where('user_id', $buyer->id)
                            ->where('status', 'paid')
                            ->count();

                        Log::info('Buyer paid invoices count', [
                            'buyer_id' => $buyer->id,
                            'paid_count' => $paidInvoicesCount
                        ]);

                        if ($paidInvoicesCount > 1) {
                            Log::info('Referral reward skipped: not the buyer\'s first purchase', [
                                'buyer_id' => $buyer->id,
                                'invoice_code' => $lockedInvoice->invoice_code
                            ]);
                            return;
                        }
                    }

                    // Save the referral connection permanently on the buyer's user record
                    if (empty($buyer->referred_by_user_id)) {
                        $buyer->update([
                            'referred_by_user_id' => $referrer->id
                        ]);
                    }

                    // Get reward configurations
                    $referrerRewardAmount = (int) Setting::get('referral_reward', 5000);
                    $buyerRewardAmount = (int) Setting::get('buyer_reward', 2000);

                    // Grant Referrer reward
                    if ($referrerRewardAmount > 0) {
                        $this->pointService->addTransaction(
                            $referrer,
                            $referrerRewardAmount,
                            'reward',
                            'referral',
                            "Bonus referral dari pembelian pertama oleh {$buyer->name}",
                            Invoice::class,
                            $lockedInvoice->id
                        );
                    }

                    // Grant Buyer reward
                    if ($buyerRewardAmount > 0) {
                        $this->pointService->addTransaction(
                            $buyer,
                            $buyerRewardAmount,
                            'reward',
                            'referral',
                            "Bonus pembelian menggunakan kode referral dari {$referrer->name}",
                            Invoice::class,
                            $lockedInvoice->id
                        );
                    }

                    Log::info('Referral reward successfully processed', [
                        'invoice_code' => $lockedInvoice->invoice_code,
                        'referrer' => $referrer->name,
                        'buyer' => $buyer->name
                    ]);
                });
            });
        } catch (\Illuminate\Contracts\Cache\LockTimeoutException $e) {
            Log::warning('processReferralReward lock timeout', [
                'invoice_code' => $invoice->invoice_code
            ]);
            return;
        }
    }
}
