<?php

namespace App\Http\Controllers\Api\Agent;

use App\Services\Agent\ScheduleItems;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * POST /api/v1/agent/update-recording-url   (ability agent:write-recording)
 *
 * Body: type, id, recording_url (YouTube, atau link share Zoom selama audit
 *       YouTube API belum lulus).
 *
 * Hanya untuk sesi produk `auto_meeting_link` yang punya `zoom_meeting_id`,
 * dan bila `recording_url` masih kosong.
 */
class UpdateRecordingUrlController extends AgentWriteController
{
    public function __invoke(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type' => self::typeRule(),
            'id' => 'required|uuid',
            'recording_url' => [
                'required', 'string', 'max:255',
                'regex:#^https://((www\.|m\.)?youtube\.com/|youtu\.be/|([a-z0-9-]+\.)*zoom\.us/)#i',
            ],
        ]);

        return $this->idempotent($request, $data, fn () => $this->fillIfEmpty(
            $data['type'],
            $data['id'],
            ['recording_url' => $data['recording_url']],
            function (Model $session) use ($data): ?JsonResponse {
                if (blank($session->zoom_meeting_id) || ! ScheduleItems::productOf($session)?->auto_meeting_link) {
                    return response()->json([
                        'status' => 'manual',
                        'message' => 'Sesi ini bukan meeting akun Zoom perusahaan (produk tidak otomatis / tanpa zoom_meeting_id); rekaman diisi admin.',
                        'type' => $data['type'],
                        'id' => $data['id'],
                    ], 409);
                }

                return null;
            },
        ));
    }
}
