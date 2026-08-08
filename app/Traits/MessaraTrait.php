<?php

namespace App\Traits;

use Illuminate\Support\Facades\Log;

trait MessaraTrait
{
    /**
     * Kirim pesan teks WhatsApp melalui Messara API
     *
     * @param array $data
     * @return bool
     */
    public static function sendText($data = [])
    {
        try {
            $curl = curl_init();
            $token = env('API_KEY_MESSARA');
            $domain = env('DOMAIN_SERVER_MESSARA', 'https://messara.aksarateknologi.co.id');

            if (!$token) {
                Log::error('Messara API Key is missing');
                return false;
            }

            $payload = [
                "data" => $data
            ];

            curl_setopt($curl, CURLOPT_HTTPHEADER, [
                "Authorization: {$token}", // Sesuai dengan format yang kita buat di Messara
                "Content-Type: application/json"
            ]);

            curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "POST");
            curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($payload));
            curl_setopt($curl, CURLOPT_URL, rtrim($domain, '/') . "/api/v2/send-message");
            curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
            curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);
            curl_setopt($curl, CURLOPT_TIMEOUT, 30);

            $result = curl_exec($curl);
            $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);

            if (curl_errno($curl)) {
                $error = curl_error($curl);
                curl_close($curl);
                Log::error('cURL error in Messara message', [
                    'error' => $error,
                    'url' => rtrim($domain, '/') . "/api/v2/send-message"
                ]);
                return false;
            }

            curl_close($curl);

            // Log response
            Log::info('Messara Response', [
                'http_code' => $httpCode,
                'response' => $result,
                'payload' => $payload,
                'url' => rtrim($domain, '/') . "/api/v2/send-message"
            ]);

            if ($httpCode == 200) {
                $response = json_decode($result, true);
                if (isset($response['status']) && $response['status'] === true) {
                    Log::info('Messara message sent successfully', ['data' => $data]);
                    return true;
                } else {
                    Log::error('Messara API returned error', ['response' => $response]);
                    return false;
                }
            } else {
                Log::error('Failed to send Messara message', [
                    'http_code' => $httpCode,
                    'response' => $result
                ]);
                return false;
            }
        } catch (\Exception $e) {
            Log::error('Error sending Messara message', ['error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Kirim pesan dengan link WhatsApp melalui Messara API
     * (Untuk sekarang, formatnya sama dengan sendText)
     *
     * @param array $data
     * @return bool
     */
    public static function sendLink($data = [])
    {
        return self::sendText($data);
    }
}
