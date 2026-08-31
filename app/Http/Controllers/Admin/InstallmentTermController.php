<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Bootcamp;
use App\Models\Bundle;
use App\Models\CertificationProgram;
use App\Models\Course;
use App\Models\PrivateClass;
use App\Models\ProductInstallmentTerm;
use App\Models\Webinar;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class InstallmentTermController extends Controller
{
    private function resolveProduct(string $type, string $id): mixed
    {
        return match ($type) {
            'course' => Course::findOrFail($id),
            'bootcamp' => Bootcamp::findOrFail($id),
            'webinar' => Webinar::findOrFail($id),
            'private' => PrivateClass::findOrFail($id),
            'certification_program' => CertificationProgram::findOrFail($id),
            'bundle' => Bundle::findOrFail($id),
            default => abort(404, 'Tipe produk tidak valid'),
        };
    }

    /**
     * Toggle installment_enabled untuk produk
     */
    public function toggleEnabled(Request $request, string $type, string $id)
    {
        $product = $this->resolveProduct($type, $id);
        $product->update(['installment_enabled' => !$product->installment_enabled]);

        return response()->json([
            'success' => true,
            'installment_enabled' => $product->installment_enabled,
            'message' => $product->installment_enabled
                ? 'Cicilan berhasil diaktifkan.'
                : 'Cicilan berhasil dinonaktifkan.',
        ]);
    }

    /**
     * Simpan konfigurasi termin cicilan (batch: update status enabled + hapus semua termin lama, buat ulang)
     */
    public function store(Request $request)
    {
        $request->validate([
            'type' => 'required|string|in:course,bootcamp,webinar,private,certification_program,bundle',
            'id' => 'required|string',
            'installment_enabled' => 'required|boolean',
            'terms' => 'nullable|array',
            'terms.*.term_number' => 'required_with:terms|integer|min:1',
            'terms.*.amount' => 'required_with:terms|integer|min:1000',
            'terms.*.due_date' => 'required_with:terms|date',
        ]);

        DB::beginTransaction();
        try {
            $product = $this->resolveProduct($request->type, $request->id);
            $enabled = (bool) $request->installment_enabled;

            $product->update(['installment_enabled' => $enabled]);

            if ($enabled && !empty($request->terms)) {
                // Hapus semua termin lama
                $product->installmentTerms()->delete();

                // Buat termin baru
                foreach ($request->terms as $termData) {
                    ProductInstallmentTerm::create([
                        'termable_type' => get_class($product),
                        'termable_id' => $product->id,
                        'term_number' => $termData['term_number'],
                        'amount' => $termData['amount'],
                        'due_date' => $termData['due_date'],
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => $enabled
                    ? 'Konfigurasi cicilan berhasil disimpan dan diaktifkan.'
                    : 'Pengaturan cicilan berhasil dinonaktifkan.',
                'installment_enabled' => $product->installment_enabled,
                'terms' => $product->installmentTerms()->get(),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('InstallmentTermController::store failed', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    /**
     * Update satu termin
     */
    public function update(Request $request, string $id)
    {
        $request->validate([
            'amount' => 'required|integer|min:1000',
            'due_date' => 'required|date',
        ]);

        $term = ProductInstallmentTerm::findOrFail($id);
        $term->update([
            'amount' => $request->amount,
            'due_date' => $request->due_date,
        ]);

        return response()->json(['success' => true, 'term' => $term]);
    }

    /**
     * Hapus satu termin
     */
    public function destroy(string $id)
    {
        $term = ProductInstallmentTerm::findOrFail($id);
        $term->delete();

        return response()->json(['success' => true]);
    }
}
