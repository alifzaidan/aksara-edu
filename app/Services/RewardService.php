<?php

namespace App\Services;

use App\Models\User;
use App\Models\Invoice;
use App\Models\Setting;
use App\Models\PointTransaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

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
        DB::transaction(function () use ($invoice) {
            // Ensure invoice is paid
            if ($invoice->status !== 'paid') {
                return;
            }

            // Check if there is an associated referrer
            if (!$invoice->referral_user_id) {
                return;
            }

            // Prevent duplicate rewards for the same invoice
            $rewardExists = PointTransaction::where('reference_type', Invoice::class)
                ->where('reference_id', $invoice->id)
                ->where('source', 'referral')
                ->exists();

            if ($rewardExists) {
                Log::info('Referral reward already processed for invoice', ['invoice_code' => $invoice->invoice_code]);
                return;
            }

            $buyer = User::find($invoice->user_id);
            $referrer = User::find($invoice->referral_user_id);

            if (!$buyer || !$referrer) {
                return;
            }

            // Check if referral reward is only allowed on first purchase
            $onlyFirstPurchase = Setting::get('referral_only_first_purchase', true);

            if ($onlyFirstPurchase) {
                // Since this invoice is already marked as paid, the count will be 1 if it's the first purchase
                $paidInvoicesCount = Invoice::where('user_id', $buyer->id)
                    ->where('status', 'paid')
                    ->count();

                if ($paidInvoicesCount > 1) {
                    Log::info('Referral reward skipped: not the buyer\'s first purchase', [
                        'buyer_id' => $buyer->id,
                        'invoice_code' => $invoice->invoice_code
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
                    $invoice->id
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
                    $invoice->id
                );
            }

            Log::info('Referral reward successfully processed', [
                'invoice_code' => $invoice->invoice_code,
                'referrer' => $referrer->name,
                'buyer' => $buyer->name
            ]);
        });
    }
}
