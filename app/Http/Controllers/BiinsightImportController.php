<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class BiinsightImportController extends Controller
{
    /**
     * Fetch programs from Biinsight as a proxy JSON response.
     */
    public function getPrograms(Request $request)
    {
        $baseUrl = env('BIINSIGHT_API_BASE_URL', 'http://127.0.0.1:8000/api');
        $token = env('BIINSIGHT_API_TOKEN');

        try {
            $response = Http::withToken($token)
                ->timeout(10)
                ->get($baseUrl . '/program-events', [
                    'all' => 'true',
                    'type' => $request->query('type'),
                ]);

            if ($response->successful()) {
                return response()->json([
                    'success' => true,
                    'data' => $response->json('data') ?? []
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data dari Biinsight: ' . ($response->json('message') ?? 'Server Error')
            ], 500);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Koneksi ke Biinsight gagal: ' . $e->getMessage()
            ], 500);
        }
    }
}
