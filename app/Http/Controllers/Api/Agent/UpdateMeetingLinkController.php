<?php

namespace App\Http\Controllers\Api\Agent;

use App\Services\Agent\ScheduleItems;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * POST /api/v1/agent/update-meeting-link   (ability agent:write-meeting)
 *
 * Body: type (webinar|bootcamp_session|certification_session), id,
 *       meeting_url (https://…zoom.us/…), zoom_meeting_id (angka).
 *
 * Hanya untuk produk dengan `auto_meeting_link` = true dan bila `meeting_url`
 * + `zoom_meeting_id` masih kosong. Tidak pernah menyentuh `webinar_url` /
 * `bootcamp_url` (halaman LMS).
 */
class UpdateMeetingLinkController extends AgentWriteController
{
    public function __invoke(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type' => self::typeRule(),
            'id' => 'required|uuid',
            'meeting_url' => ['required', 'string', 'max:500', 'regex:#^https://([a-z0-9-]+\.)*zoom\.us/#i'],
            'zoom_meeting_id' => ['required', 'string', 'regex:/^\d{9,20}$/'],
        ]);

        return $this->idempotent($request, $data, fn () => $this->fillIfEmpty(
            $data['type'],
            $data['id'],
            ['meeting_url' => $data['meeting_url'], 'zoom_meeting_id' => $data['zoom_meeting_id']],
            function (Model $session) use ($data): ?JsonResponse {
                if (! ScheduleItems::productOf($session)?->auto_meeting_link) {
                    return response()->json([
                        'status' => 'manual',
                        'message' => 'Produk ini tidak dicentang "link Zoom otomatis"; link diisi admin.',
                        'type' => $data['type'],
                        'id' => $data['id'],
                    ], 409);
                }

                return null;
            },
        ));
    }
}
