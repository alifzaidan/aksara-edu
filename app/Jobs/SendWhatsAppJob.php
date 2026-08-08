<?php
namespace App\Jobs;

use App\Services\WablasService;
use App\Services\EvolutionApiService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendWhatsAppJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public array $backoff = [30, 60, 120];

    public function __construct(
        public string $phone,
        public string $message
    ) {}

    public function handle(): void
    {
        Log::info("Memproses SendWhatsAppJob untuk {$this->phone}");

        $gateway = config('services.default_wa_gateway', 'wablas');

        if ($gateway === 'evolution') {
            $service = app(\App\Services\EvolutionApiService::class);
        } else {
            $service = app(\App\Services\WablasService::class);
        }

        try {
            $success = $service->send($this->phone, $this->message);
        } catch (\Exception $e) {
            if ($e->getMessage() === 'DAILY_LIMIT_REACHED') {
                $this->fail($e);
                return;
            }
            throw $e;
        }

        if (!$success) {
            throw new \Exception("Gagal mengirim WhatsApp via {$gateway} ke {$this->phone}");
        }


    }
}