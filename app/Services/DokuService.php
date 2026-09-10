<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DokuService
{
    private $clientId;
    private $secretKey;
    private $sandbox;

    public function __construct()
    {
        $this->clientId = config('services.doku.client_id');
        $this->secretKey = config('services.doku.secret_key');
        $this->sandbox = config('services.doku.sandbox', true);
    }

    private function sanitizeForDoku(string $value): string
    {
        // Normalize whitespace
        $value = preg_replace('/\s+/', ' ', $value);

        // Replace common disallowed tokens
        $replacements = [
            '&' => 'dan',
            '“' => '"',
            '”' => '"',
            '‘' => "'",
            '’' => "'",
        ];
        $value = strtr($value, $replacements);

        // Strip any character not in the allowed set
        // Allowed: letters, digits, space, . - / + , = _ : ' @ %
        $value = preg_replace("/[^a-zA-Z0-9 \.\-\/\+\,\=\_\:\'@%]/", '', $value);

        // Trim to safe length if needed
        return trim(substr($value, 0, 255));
    }

    /**
     * Create DOKU Checkout for standard and bundle purchases
     */
    public function createCheckout($orderId, $amount, $customerData = []): array
    {
        try {
            $url = $this->sandbox
                ? "https://api-sandbox.doku.com/checkout/v1/payment"
                : "https://api.doku.com/checkout/v1/payment";

            $path = "/checkout/v1/payment";
            $requestId = uniqid();
            $requestTimestamp = gmdate("Y-m-d\TH:i:s\Z");

            $customerId = $customerData['customer_id'] ?? 'CUST-' . time();
            $customerName = $customerData['customer_name'] ?? 'Customer';
            $customerEmail = $customerData['customer_email'] ?? 'customer@example.com';
            $customerPhone = $customerData['customer_phone'] ?? null;
            $itemName = $this->sanitizeForDoku($customerData['item_name'] ?? 'Product');
            $itemDescription = $this->sanitizeForDoku($customerData['item_description'] ?? 'Product Purchase');

            $body = [
                "order" => [
                    "invoice_number" => $orderId,
                    "amount" => $amount,
                    "currency" => "IDR",
                    "callback_url" => route('doku.callback.web', ['invoice_number' => $orderId], true),
                    "callback_url_cancel" => route('doku.callback.web', ['invoice_number' => $orderId], true),
                ],
                "payment" => [
                    "payment_due_date" => 60
                ],
                "customer" => [
                    "id" => $customerId,
                    "name" => $customerName,
                    "email" => $customerEmail
                ]
            ];

            if ($customerPhone) {
                $body['customer']['phone'] = $customerPhone;
            }

            if ($itemName || $itemDescription) {
                $body['order']['line_items'] = [
                    [
                        "name" => $itemName,
                        "description" => $itemDescription,
                        "quantity" => 1,
                        "price" => $amount
                    ]
                ];
            }

            $digest = base64_encode(hash('sha256', json_encode($body), true));

            $componentSignature = "Client-Id:" . $this->clientId . "\n" .
                "Request-Id:" . $requestId . "\n" .
                "Request-Timestamp:" . $requestTimestamp . "\n" .
                "Request-Target:" . $path . "\n" .
                "Digest:" . $digest;

            $signature = base64_encode(hash_hmac('sha256', $componentSignature, $this->secretKey, true));

            $response = Http::withHeaders([
                "Client-Id" => $this->clientId,
                "Request-Id" => $requestId,
                "Request-Timestamp" => $requestTimestamp,
                "Signature" => "HMACSHA256=" . $signature,
                "Content-Type" => "application/json"
            ])->post($url, $body);

            $responseData = $response->json();

            if (!$response->successful()) {
                throw new \Exception('DOKU API error: ' . $response->status() . ' - ' . json_encode($responseData));
            }

            Log::info('DOKU Checkout created successfully', [
                'order_id' => $orderId,
                'payment_url' => $responseData['response']['payment']['url'] ?? null
            ]);

            return $responseData;
        } catch (\Exception $e) {
            Log::error('DOKU Service Error', [
                'message' => $e->getMessage(),
                'order_id' => $orderId
            ]);
            throw $e;
        }
    }

    /**
     * Create DOKU Checkout for installment term payments
     */
    public function createCheckoutInstallment($orderId, $amount, $customerData = [], $termNumber = 1): array
    {
        $itemName = ($customerData['item_name'] ?? 'Produk') . ' (Cicilan ke-' . $termNumber . ')';
        $customerData['item_name'] = $itemName;
        $customerData['item_description'] = 'Cicilan ke-' . $termNumber . ' untuk ' . ($customerData['item_name']);

        return $this->createCheckout($orderId, $amount, $customerData);
    }

    /**
     * Verify DOKU callback signature (placeholder / pass-through)
     */
    public function verifyCallback($request): bool
    {
        return true;
    }

    /**
     * Cancel invoice placeholder
     */
    public function cancelInvoice($invoiceCode): bool
    {
        return true;
    }
}
