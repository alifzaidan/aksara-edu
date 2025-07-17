<?php

namespace App\Traits;

use Illuminate\Support\Facades\Log;

trait WablasTrait
{
    /**
     * Kirim pesan teks WhatsApp
     *
     * @param array $data
     * @return bool
     */
    public static function sendText($data = [])
    {
        try {
            $curl = curl_init();
            $token = env('SECURITY_TOKEN_WABLAS');
            $secret_key = env('SECRET_KEY_WABLAS');
            $domain = env('DOMAIN_SERVER_WABLAS', 'https://sby.wablas.com');

            if (!$token || !$secret_key) {
                Log::error('Wablas token or secret key is missing');
                return false;
            }

            $payload = [
                "data" => $data
            ];

            curl_setopt($curl, CURLOPT_HTTPHEADER, [
                "Authorization: {$token}.{$secret_key}",
                "Content-Type: application/json"
            ]);

            curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "POST");
            curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($payload));
            curl_setopt($curl, CURLOPT_URL, "{$domain}/api/v2/send-message");
            curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
            curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);
            curl_setopt($curl, CURLOPT_TIMEOUT, 30);

            $result = curl_exec($curl);
            $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);

            if (curl_errno($curl)) {
                $error = curl_error($curl);
                curl_close($curl);
                Log::error('cURL error in WhatsApp message', [
                    'error' => $error,
                    'url' => "{$domain}/api/v2/send-message"
                ]);
                return false;
            }

            curl_close($curl);

            // Log response
            Log::info('Wablas Response', [
                'http_code' => $httpCode,
                'response' => $result,
                'payload' => $payload,
                'url' => "{$domain}/api/v2/send-message"
            ]);

            if ($httpCode == 200) {
                $response = json_decode($result, true);
                if (isset($response['status']) && $response['status'] === true) {
                    Log::info('WhatsApp message sent successfully', ['data' => $data]);
                    return true;
                } else {
                    Log::error('Wablas API returned error', ['response' => $response]);
                    return false;
                }
            } else {
                Log::error('Failed to send WhatsApp message', [
                    'http_code' => $httpCode,
                    'response' => $result
                ]);
                return false;
            }
        } catch (\Exception $e) {
            Log::error('Error sending WhatsApp message', ['error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Kirim pesan dengan link WhatsApp
     *
     * @param array $data
     * @return bool
     */
    public static function sendLink($data = [])
    {
        try {
            $curl = curl_init();
            $token = env('SECURITY_TOKEN_WABLAS');
            $secret_key = env('SECRET_KEY_WABLAS');
            $domain = env('DOMAIN_SERVER_WABLAS', 'https://sby.wablas.com');

            if (!$token || !$secret_key) {
                Log::error('Wablas token or secret key is missing');
                return false;
            }

            $payload = [
                "data" => $data
            ];

            curl_setopt($curl, CURLOPT_HTTPHEADER, [
                "Authorization: $token.$secret_key",
                "Content-Type: application/json"
            ]);

            curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "POST");
            curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($payload));
            curl_setopt($curl, CURLOPT_URL, "{$domain}/api/v2/send-message");
            curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
            curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);

            $result = curl_exec($curl);
            $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);

            if (curl_errno($curl)) {
                $error = curl_error($curl);
                curl_close($curl);
                Log::error('cURL error in WhatsApp link', ['error' => $error]);
                return false;
            }

            curl_close($curl);

            if ($httpCode == 200) {
                Log::info('WhatsApp link sent successfully', [
                    'data' => $data,
                    'response' => $result
                ]);
                return true;
            } else {
                Log::error('Failed to send WhatsApp link', [
                    'http_code' => $httpCode,
                    'response' => $result
                ]);
                return false;
            }
        } catch (\Exception $e) {
            Log::error('Error sending WhatsApp link', ['error' => $e->getMessage()]);
            return false;
        }
    }
}
