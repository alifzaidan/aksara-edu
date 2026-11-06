<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class MessaraService
{
    /**
     * Kirim pesan teks WhatsApp melalui Messara API
     *
     * @param array $data
     * @return bool
     */
    public static function sendText(array $data = []): bool
    {
        return self::sendRequest('/api/v2/send-message', $data);
    }

    /**
     * Kirim template pesan WhatsApp (Official API) melalui Messara API
     *
     * @param array $data
     * @return bool
     */
    public static function sendTemplate(array $data = []): bool
    {
        return self::sendRequest('/api/v2/send-template', $data);
    }

    /**
     * Kirim pesan dengan link WhatsApp melalui Messara API
     *
     * @param array $data
     * @return bool
     */
    public static function sendLink(array $data = []): bool
    {
        return self::sendText($data);
    }

    /**
     * Kirim request ke Messara API Gateway
     *
     * @param string $endpoint
     * @param array $data
     * @return bool
     */
    public static function sendRequest(string $endpoint, array $data = []): bool
    {
        try {
            $curl = curl_init();
            $token = config('services.messara.api_key', env('MESSARA_API_KEY', env('API_KEY_MESSARA')));
            $secretKey = config('services.messara.secret_key', env('MESSARA_SECRET_KEY', env('SECRET_KEY_MESSARA')));
            $domain = config('services.messara.domain', env('MESSARA_DOMAIN_SERVER', env('DOMAIN_SERVER_MESSARA', 'https://messara.aksarateknologi.co.id')));

            if (!$token) {
                Log::error('Messara API Key is missing');
                return false;
            }

            // Cegah deadlock di lingkungan local hanya jika memanggil port yang sama (self-call pada single-threaded server)
            $currentPort = app()->runningInConsole() ? null : request()->getPort();
            $targetPort = parse_url($domain, PHP_URL_PORT) ?: 80;
            if (app()->environment('local') && (str_contains($domain, 'localhost') || str_contains($domain, '127.0.0.1')) && $currentPort === $targetPort) {
                Log::info('Messara skipped in local environment to prevent deadlock with self', ['data' => $data]);
                return true;
            }

            $payload = [
                "data" => $data
            ];

            $headers = [
                "Content-Type: application/json"
            ];

            if (!empty($secretKey)) {
                $headers[] = "Authorization: {$token}.{$secretKey}";
                $headers[] = "X-Api-Key: {$token}";
                $headers[] = "X-Secret-Key: {$secretKey}";
            } else {
                $headers[] = "Authorization: {$token}";
                $headers[] = "X-Api-Key: {$token}";
            }

            $apiUrl = rtrim($domain, '/') . '/' . ltrim($endpoint, '/');

            curl_setopt($curl, CURLOPT_HTTPHEADER, $headers);
            curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "POST");
            curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($payload));
            curl_setopt($curl, CURLOPT_URL, $apiUrl);
            curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
            curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);
            curl_setopt($curl, CURLOPT_CONNECTTIMEOUT, 10);
            curl_setopt($curl, CURLOPT_TIMEOUT, 30);

            $result = curl_exec($curl);
            $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);

            if (curl_errno($curl)) {
                $error = curl_error($curl);
                curl_close($curl);
                Log::error('cURL error in Messara request', [
                    'error' => $error,
                    'url' => $apiUrl
                ]);
                return false;
            }

            curl_close($curl);

            // Log response
            Log::info('Messara Response', [
                'http_code' => $httpCode,
                'response' => $result,
                'payload' => $payload,
                'url' => $apiUrl
            ]);

            if ($httpCode == 200) {
                $response = json_decode($result, true);
                if (isset($response['status']) && $response['status'] === true) {
                    Log::info('Messara request succeeded', ['data' => $data, 'endpoint' => $endpoint]);
                    return true;
                } else {
                    Log::error('Messara API returned error', ['response' => $response]);
                    return false;
                }
            } else {
                Log::error('Failed to send Messara request', [
                    'http_code' => $httpCode,
                    'response' => $result,
                    'url' => $apiUrl
                ]);
                return false;
            }
        } catch (\Exception $e) {
            Log::error('Error sending Messara request', ['error' => $e->getMessage()]);
            return false;
        }
    }
}
