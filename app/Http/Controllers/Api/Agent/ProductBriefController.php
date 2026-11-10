<?php

namespace App\Http\Controllers\Api\Agent;

use App\Http\Controllers\Controller;
use App\Models\Bootcamp;
use App\Models\Bundle;
use App\Models\CertificationProgram;
use App\Models\Course;
use App\Models\Webinar;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * GET /api/v1/agent/product-brief?type=bootcamp&id=<uuid>
 *
 * Isi produk sebagai teks polos (HTML editor dibuang) untuk bahan konten Kira:
 * ringkasan, deskripsi, benefit, kurikulum/poin materi, syarat. Informasi yang
 * sama dengan halaman publik produk; tanpa data peserta.
 */
class ProductBriefController extends Controller
{
    private const MODELS = [
        'course' => Course::class,
        'webinar' => Webinar::class,
        'bootcamp' => Bootcamp::class,
        'bundle' => Bundle::class,
        'certification_program' => CertificationProgram::class,
    ];

    private const FIELDS = ['short_description', 'description', 'benefits', 'curriculum', 'key_points', 'requirements'];

    private const MAX_CHARS = 1500;

    public function __invoke(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type' => 'required|string|in:'.implode(',', array_keys(self::MODELS)),
            'id' => 'required|uuid',
        ]);

        $product = self::MODELS[$data['type']]::with('category:id,name')->findOrFail($data['id']);

        $brief = [];
        foreach (self::FIELDS as $field) {
            $text = $this->plain($product->getAttribute($field));
            if ($text !== '') {
                $brief[$field] = $text;
            }
        }

        return response()->json([
            'type' => $data['type'],
            'id' => $product->id,
            'title' => $product->title,
            'batch' => filled($product->batch ?? null) ? (string) $product->batch : null,
            'category' => $product->category?->name,
            'price' => (int) $product->price,
            'registration_url' => $product->registration_url,
            'brief' => $brief,
        ]);
    }

    /** HTML/JSON editor → teks polos rapi, dipotong MAX_CHARS. */
    private function plain(mixed $value): string
    {
        if (is_array($value)) {
            $value = implode("\n", array_map(fn ($v) => is_array($v) ? implode(' ', $v) : (string) $v, $value));
        }
        $text = preg_replace('#<\s*(br|/p|/li|/h[1-6]|/div)\s*/?>#i', "\n", (string) $value);
        $text = html_entity_decode(strip_tags($text), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $text = trim(preg_replace(["/[ \t\x{00A0}]+/u", "/\n\s*\n+/"], [' ', "\n"], $text));

        return mb_strlen($text) > self::MAX_CHARS ? mb_substr($text, 0, self::MAX_CHARS).'…' : $text;
    }
}
