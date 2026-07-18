<?php

namespace App\Listeners;

use App\Events\TransactionPaid;
use App\Services\RewardService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class RewardReferralListener implements ShouldQueue
{
    use InteractsWithQueue;

    protected $rewardService;

    /**
     * Create the event listener.
     */
    public function __construct(RewardService $rewardService)
    {
        $this->rewardService = $rewardService;
    }

    /**
     * Handle the event.
     */
    public function handle(TransactionPaid $event): void
    {
        try {
            $this->rewardService->processReferralReward($event->invoice);
        } catch (\Exception $e) {
            Log::error('Gagal memproses reward referral pada listener', [
                'invoice_code' => $event->invoice->invoice_code,
                'error' => $e->getMessage()
            ]);
            
            // Re-throw exception if we want the queue to retry
            throw $e;
        }
    }
}
