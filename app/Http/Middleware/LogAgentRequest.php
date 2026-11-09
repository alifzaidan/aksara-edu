<?php

namespace App\Http\Middleware;

use App\Models\AgentAuditLog;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class LogAgentRequest
{
    /**
     * Catat setiap request agent ke tabel agent_audit_logs.
     * Dicatat di terminate() agar respons 401/403/429 (dari exception) ikut tercatat.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $request->attributes->set('agent_audit_started_at', microtime(true));

        return $next($request);
    }

    public function terminate(Request $request, Response $response): void
    {
        try {
            $startedAt = (float) $request->attributes->get('agent_audit_started_at', microtime(true));
            $user = $request->user();
            $token = $user?->currentAccessToken();

            AgentAuditLog::create([
                'user_id' => $user?->id,
                'token_id' => $token?->id,
                'token_name' => $token?->name,
                'method' => $request->method(),
                'path' => '/'.ltrim($request->path(), '/'),
                'query' => $request->query() ?: null,
                'payload' => $this->payload($request),
                'status' => $response->getStatusCode(),
                'duration_ms' => (int) round((microtime(true) - $startedAt) * 1000),
                'ip' => $request->ip(),
            ]);
        } catch (\Throwable $e) {
            // Pencatatan gagal tidak boleh mengganggu respons.
            Log::warning('Agent audit log gagal ditulis', ['error' => $e->getMessage()]);
        }
    }

    /** Body request tulis (field yang dikenal saja) + Idempotency-Key. GET → null. */
    private function payload(Request $request): ?array
    {
        if ($request->isMethod('GET')) {
            return null;
        }

        $payload = array_filter(
            $request->only(['type', 'id', 'meeting_url', 'zoom_meeting_id', 'recording_url']),
            fn ($v) => $v !== null,
        );
        if ($key = $request->header('Idempotency-Key')) {
            $payload['idempotency_key'] = mb_substr((string) $key, 0, 100);
        }

        return $payload ?: null;
    }
}
