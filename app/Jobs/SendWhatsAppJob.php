<?php
namespace App\Jobs;

use App\Traits\MessaraTrait;
use App\Traits\WablasTrait;
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

        $gateway = config('services.default_wa_gateway', 'messara');

        $phone = preg_replace('/[^0-9]/', '', $this->phone);
        if (str_starts_with($phone, '0')) {
            $phone = '62' . substr($phone, 1);
        } elseif (!str_starts_with($phone, '62')) {
            $phone = '62' . $phone;
        }

        $success = false;

        try {
            if ($gateway === 'messara') {
                $success = MessaraTrait::sendText([
                    [
                        'phone' => $phone,
                        'message' => $this->message,
                        'isGroup' => 'false',
                    ]
                ]);
            } elseif ($gateway === 'evolution') {
                $service = app(\App\Services\EvolutionApiService::class);
                $success = $service->send($this->phone, $this->message);
            } else {
                $success = WablasTrait::sendText([
                    [
                        'phone' => $phone,
                        'message' => $this->message,
                        'isGroup' => 'false',
                    ]
                ]);
            }
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