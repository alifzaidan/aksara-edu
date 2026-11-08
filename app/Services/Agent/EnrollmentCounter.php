<?php

namespace App\Services\Agent;

use Carbon\CarbonInterface;
use Closure;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Menghitung peserta terdaftar per produk dengan aturan yang sama seperti
 * dashboard admin (BootcampController@index): invoice induk berstatus
 * paid/completed, atau cicilan yang termin ke-1 sudah paid.
 *
 * Catatan: pembelian bundle membuat enrollment per item
 * (EnrollmentBundle::createIndividualEnrollments), jadi hitungan per produk
 * sudah termasuk pembeli bundle.
 */
class EnrollmentCounter
{
    /** @var array<string, array{0: string, 1: string}> tipe => [tabel enrollment, kolom FK produk] */
    public const PRODUCTS = [
        'course' => ['enrollment_courses', 'course_id'],
        'webinar' => ['enrollment_webinars', 'webinar_id'],
        'bootcamp' => ['enrollment_bootcamps', 'bootcamp_id'],
        'bundle' => ['enrollment_bundles', 'bundle_id'],
        'certification_program' => ['enrollment_certification_programs', 'certification_program_id'],
    ];

    /**
     * @param  array<int, string>  $productIds
     * @param  CarbonInterface|null  $since  hanya pendaftaran yang lunas sejak waktu ini
     * @param  Closure|null  $extra  filter tambahan: fn ($query, string $table)
     * @return Collection<string, int> product_id => jumlah peserta
     */
    public function count(string $type, array $productIds, ?CarbonInterface $since = null, ?Closure $extra = null): Collection
    {
        if (empty($productIds)) {
            return collect();
        }

        [$table, $foreignKey] = self::PRODUCTS[$type];

        $query = DB::table($table)
            ->join('invoices', "{$table}.invoice_id", '=', 'invoices.id')
            ->whereIn("{$table}.{$foreignKey}", $productIds)
            ->whereNull('invoices.parent_invoice_id')
            ->where(function ($q) {
                $q->whereIn('invoices.status', ['paid', 'completed'])
                    ->orWhere(function ($sq) {
                        $sq->where('invoices.status', 'installment_pending')
                            ->whereExists(function ($eq) {
                                $eq->select(DB::raw(1))
                                    ->from('invoices as terms')
                                    ->whereColumn('terms.parent_invoice_id', 'invoices.id')
                                    ->where('terms.installment_number', 1)
                                    ->where('terms.status', 'paid');
                            });
                    });
            });

        if ($since) {
            $query->where(DB::raw('COALESCE(invoices.paid_at, invoices.created_at)'), '>=', $since);
        }

        if ($extra) {
            $extra($query, $table);
        }

        return $query
            ->groupBy("{$table}.{$foreignKey}")
            ->select("{$table}.{$foreignKey} as product_id", DB::raw('COUNT(*) as total'))
            ->pluck('total', 'product_id')
            ->map(fn ($total) => (int) $total);
    }
}
