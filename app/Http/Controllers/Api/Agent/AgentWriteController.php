<?php

namespace App\Http\Controllers\Api\Agent;

use App\Http\Controllers\Controller;
use App\Services\Agent\ScheduleItems;
use Closure;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Dasar endpoint tulis agent.
 *
 * Aturan:
 * - Header `Idempotency-Key` wajib. Request ulang dengan kunci + payload sama
 *   mendapat respons yang sama (24 jam); kunci sama dengan payload berbeda → 422.
 * - Hanya mengisi kolom yang masih kosong. Nilai sama → `unchanged`;
 *   nilai berbeda → 409, data tidak diubah (koreksi dilakukan admin).
 * - Baris dikunci (`lockForUpdate`) selama pengecekan + penulisan.
 */
abstract class AgentWriteController extends Controller
{
    protected function idempotent(Request $request, array $payload, Closure $handler): JsonResponse
    {
        $key = (string) $request->header('Idempotency-Key', '');
        if ($key === '' || strlen($key) > 100) {
            return response()->json(['message' => 'Header Idempotency-Key wajib (maksimal 100 karakter).'], 400);
        }

        $tokenId = $request->user()?->currentAccessToken()?->id;
        $cacheKey = 'agent-idempotency:'.$tokenId.':'.hash('sha256', $key);
        $fingerprint = hash('sha256', json_encode($payload));

        if ($cached = Cache::get($cacheKey)) {
            if ($cached['fingerprint'] !== $fingerprint) {
                return response()->json(['message' => 'Idempotency-Key sudah dipakai untuk payload lain.'], 422);
            }

            return response()->json($cached['body'], $cached['status'])->header('Idempotent-Replayed', 'true');
        }

        /** @var JsonResponse $response */
        $response = $handler();

        if ($response->getStatusCode() < 500) {
            Cache::put($cacheKey, [
                'fingerprint' => $fingerprint,
                'body' => $response->getData(true),
                'status' => $response->getStatusCode(),
            ], now()->addDay());
        }

        return $response;
    }

    /**
     * Isi kolom-kolom $values pada sesi bila semuanya masih kosong.
     *
     * @param  Closure(Model): ?JsonResponse  $guard  pemeriksaan tambahan; kembalikan respons untuk menolak.
     */
    protected function fillIfEmpty(string $type, string $id, array $values, Closure $guard): JsonResponse
    {
        $modelClass = ScheduleItems::MODELS[$type];

        return DB::transaction(function () use ($modelClass, $type, $id, $values, $guard) {
            /** @var Model|null $session */
            $session = $modelClass::query()->lockForUpdate()->find($id);

            if (! $session) {
                return response()->json(['message' => 'Sesi tidak ditemukan.', 'type' => $type, 'id' => $id], 404);
            }

            if ($rejected = $guard($session)) {
                return $rejected;
            }

            $current = collect($values)->mapWithKeys(fn ($v, $column) => [$column => $session->getAttribute($column)]);

            if ($current->every(fn ($v, $column) => (string) $v === (string) $values[$column])) {
                return response()->json(['status' => 'unchanged', 'type' => $type, 'id' => $id]);
            }

            if ($current->contains(fn ($v) => filled($v))) {
                return response()->json([
                    'status' => 'conflict',
                    'message' => 'Kolom sudah terisi dengan nilai lain; perubahan harus lewat admin.',
                    'type' => $type,
                    'id' => $id,
                    'filled' => $current->filter(fn ($v) => filled($v))->keys()->values(),
                ], 409);
            }

            $session->forceFill($values)->save();

            return response()->json(['status' => 'updated', 'type' => $type, 'id' => $id]);
        });
    }

    protected static function typeRule(): string
    {
        return 'required|string|in:'.implode(',', array_keys(ScheduleItems::MODELS));
    }
}
