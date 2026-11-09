<?php

namespace App\Http\Controllers;

use App\Models\Bootcamp;
use App\Models\BootcampSchedule;
use App\Models\CertificationProgram;
use App\Models\CertificationProgramSchedule;
use App\Models\Webinar;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * Admin: link Zoom per webinar / per sesi dan sakelar "link Zoom otomatis".
 *
 * `meeting_url` terpisah dari `webinar_url` / `bootcamp_url` (halaman LMS).
 * Produk dengan `auto_meeting_link` = true dibuatkan meeting oleh agent Aska
 * di akun Zoom perusahaan; selain itu link diisi admin di sini.
 */
class MeetingLinkController extends Controller
{
    // --- Sakelar per produk ---------------------------------------------

    public function bootcampAuto(Request $request, string $bootcamp): RedirectResponse
    {
        return $this->setAuto($request, Bootcamp::findOrFail($bootcamp));
    }

    public function webinarAuto(Request $request, string $webinar): RedirectResponse
    {
        return $this->setAuto($request, Webinar::findOrFail($webinar));
    }

    public function programAuto(Request $request, string $program): RedirectResponse
    {
        return $this->setAuto($request, CertificationProgram::findOrFail($program));
    }

    // --- Link per sesi ---------------------------------------------------

    public function webinar(Request $request, string $webinar): RedirectResponse
    {
        return $this->save($request, Webinar::findOrFail($webinar));
    }

    public function webinarRemove(string $webinar): RedirectResponse
    {
        return $this->remove(Webinar::findOrFail($webinar));
    }

    public function bootcampSession(Request $request, string $bootcamp, string $schedule): RedirectResponse
    {
        return $this->save($request, BootcampSchedule::where('bootcamp_id', $bootcamp)->findOrFail($schedule));
    }

    public function bootcampSessionRemove(string $bootcamp, string $schedule): RedirectResponse
    {
        return $this->remove(BootcampSchedule::where('bootcamp_id', $bootcamp)->findOrFail($schedule));
    }

    public function programSession(Request $request, string $program, string $schedule): RedirectResponse
    {
        return $this->save($request, CertificationProgramSchedule::where('certification_program_id', $program)->findOrFail($schedule));
    }

    public function programSessionRemove(string $program, string $schedule): RedirectResponse
    {
        return $this->remove(CertificationProgramSchedule::where('certification_program_id', $program)->findOrFail($schedule));
    }

    // --- Internal ----------------------------------------------------------

    private function setAuto(Request $request, Model $product): RedirectResponse
    {
        $data = $request->validate(['enabled' => 'required|boolean']);

        $product->forceFill(['auto_meeting_link' => $data['enabled']])->save();

        return back()->with('success', $data['enabled']
            ? 'Link Zoom otomatis diaktifkan: agent akan membuat meeting di akun Zoom perusahaan.'
            : 'Link Zoom otomatis dimatikan: link Zoom diisi manual.');
    }

    private function save(Request $request, Model $session): RedirectResponse
    {
        $data = $request->validate([
            'meeting_url' => 'required|url:https|max:500',
            'zoom_meeting_id' => ['nullable', 'string', 'regex:/^\d{9,20}$/'],
        ], [
            'zoom_meeting_id.regex' => 'ID meeting Zoom berupa 9–20 digit angka.',
        ]);

        $zoomId = $data['zoom_meeting_id'] ?? null;
        if (! $zoomId && preg_match('#zoom\.us/(?:j|w|s)/(\d{9,20})#i', $data['meeting_url'], $m)) {
            $zoomId = $m[1];
        }

        $session->forceFill(['meeting_url' => $data['meeting_url'], 'zoom_meeting_id' => $zoomId])->save();

        return back()->with('success', 'Link Zoom berhasil disimpan.');
    }

    private function remove(Model $session): RedirectResponse
    {
        $session->forceFill(['meeting_url' => null, 'zoom_meeting_id' => null])->save();

        return back()->with('success', 'Link Zoom berhasil dihapus.');
    }
}
