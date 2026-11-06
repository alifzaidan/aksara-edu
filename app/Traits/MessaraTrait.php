<?php

namespace App\Traits;

use App\Services\MessaraService;

trait MessaraTrait
{
    /**
     * Kirim pesan teks WhatsApp melalui Messara API
     *
     * @param array $data
     * @return bool
     */
    public static function sendText(array $data = []): bool
    {
        return MessaraService::sendText($data);
    }

    /**
     * Kirim template pesan WhatsApp (Official API) melalui Messara API
     *
     * @param array $data
     * @return bool
     */
    public static function sendTemplate(array $data = []): bool
    {
        return MessaraService::sendTemplate($data);
    }

    /**
     * Kirim pesan dengan link WhatsApp melalui Messara API
     *
     * @param array $data
     * @return bool
     */
    public static function sendLink(array $data = []): bool
    {
        return MessaraService::sendLink($data);
    }
}
