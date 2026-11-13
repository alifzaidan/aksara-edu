<?php

namespace App\Http\Controllers\Api\Agent;

use App\Http\Controllers\Controller;
use App\Models\Bootcamp;
use App\Models\Bundle;
use App\Models\CertificationProgram;
use App\Models\Course;
use App\Models\Invoice;
use App\Models\PrivateClass;
use App\Models\Webinar;
use App\Services\Agent\EnrollmentCounter;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * GET /api/v1/agent/financial-metrics?from=YYYY-MM-DD&to=YYYY-MM-DD&group=day|month&limit=20
 *
 * Rekap keuangan rentang tanggal untuk Fina (rekap tahunan/antarbulan), Morning Brief, dan
 * Mila (pendaftar lunas per produk untuk aturan Kill/Pause). Hanya agregat, tanpa data pribadi.
 *
 * - Pendapatan = nett_amount `Invoice::paidPayments` menurut `paid_at` (definisi dashboard admin;
 *   termin cicilan dihitung saat dibayar, invoice induk cicilan tidak).
 * - Pendapatan per produk: nett tiap pembayaran dibagi ke item invoice-nya sebanding harga item;
 *   invoice bundle diatribusikan ke bundle saja (enrollment per item hasil bundle tidak dihitung ganda).
 * - Pendaftar per produk = aturan EnrollmentCounter (paid/completed, atau cicilan termin 1 lunas),
 *   lunas dalam rentang; berbayar vs gratis menurut nominal invoice.
 */
class FinancialMetricsController extends Controller
{
    private const MAX_DAYS = 731;

    private const AUTO_DAY_GROUP_MAX_DAYS = 62;

    /** tipe => [tabel enrollment, kolom FK, model produk] */
    private const ITEMS = [
        'course' => ['enrollment_courses', 'course_id', Course::class],
        'webinar' => ['enrollment_webinars', 'webinar_id', Webinar::class],
        'bootcamp' => ['enrollment_bootcamps', 'bootcamp_id', Bootcamp::class],
        'certification_program' => ['enrollment_certification_programs', 'certification_program_id', CertificationProgram::class],
        'private' => ['enrollment_privates', 'private_class_id', PrivateClass::class],
        'bundle' => ['enrollment_bundles', 'bundle_id', Bundle::class],
    ];

    public function __construct(private EnrollmentCounter $counter) {}

    public function __invoke(Request $request): JsonResponse
    {
        $v = $request->validate([
            'from' => 'required|date_format:Y-m-d',
            'to' => 'required|date_format:Y-m-d|after_or_equal:from',
            'group' => 'nullable|in:day,month',
            'limit' => 'nullable|integer|min:1|max:100',
        ]);

        $from = Carbon::createFromFormat('Y-m-d', $v['from'])->startOfDay();
        $to = Carbon::createFromFormat('Y-m-d', $v['to'])->endOfDay();
        $days = (int) $from->diffInDays($to->copy()->startOfDay()) + 1;
        if ($days > self::MAX_DAYS) {
            return response()->json(['message' => 'Rentang maksimal '.self::MAX_DAYS.' hari.'], 422);
        }
        $group = $v['group'] ?? ($days <= self::AUTO_DAY_GROUP_MAX_DAYS ? 'day' : 'month');
        $limit = (int) ($v['limit'] ?? 20);

        $payments = Invoice::paidPayments()
            ->whereBetween('paid_at', [$from, $to])
            ->get(['id', 'parent_invoice_id', 'amount', 'nett_amount', 'discount_amount', 'points_redeemed',
                'payment_method', 'payment_channel', 'paid_at', 'referral_user_id', 'user_id']);

        $productRevenue = $this->revenueByProduct($payments);
        $registrations = $this->registrationsByProduct($from, $to);

        return response()->json([
            'generated_at' => now()->toIso8601String(),
            'timezone' => config('app.timezone'),
            'currency' => 'IDR',
            'from' => $from->toDateString(),
            'to' => $to->toDateString(),
            'group' => $group,
            'totals' => [
                'revenue' => (int) $payments->sum('nett_amount'),
                'gross' => (int) $payments->sum('amount'),
                'transaction_fee' => (int) $payments->sum(fn ($p) => max(0, $p->amount - $p->nett_amount)),
                'discount' => (int) $payments->sum('discount_amount'),
                'points_redeemed' => (int) $payments->sum('points_redeemed'),
                'transactions' => $payments->count(),
                'buyers' => $payments->pluck('user_id')->unique()->count(),
                'registrations' => [
                    'paid' => $registrations->sum('paid'),
                    'free' => $registrations->sum('free'),
                ],
            ],
            'series' => $this->series($payments, $from, $to, $group),
            'by_type' => collect(array_keys(self::ITEMS))->mapWithKeys(fn ($t) => [$t => [
                'revenue' => (int) round($productRevenue->where('type', $t)->sum('revenue')),
                'transactions' => $productRevenue->where('type', $t)->sum('transactions'),
            ]]),
            'products' => $this->products($productRevenue, $registrations, $limit),
            'payment_methods' => $payments
                ->groupBy(fn ($p) => ($p->payment_method ?: 'lainnya').'|'.($p->payment_channel ?: '-'))
                ->map(function (Collection $rows, string $key) {
                    [$method, $channel] = explode('|', $key);

                    return ['method' => $method, 'channel' => $channel === '-' ? null : $channel,
                        'transactions' => $rows->count(), 'revenue' => (int) $rows->sum('nett_amount')];
                })->sortByDesc('revenue')->values(),
            'installments' => [
                'terms_paid' => $payments->whereNotNull('parent_invoice_id')->count(),
                'revenue' => (int) $payments->whereNotNull('parent_invoice_id')->sum('nett_amount'),
            ],
            'referral' => [
                'transactions' => $payments->whereNotNull('referral_user_id')->count(),
                'revenue' => (int) $payments->whereNotNull('referral_user_id')->sum('nett_amount'),
            ],
            'discount_codes' => $this->discountCodes($payments),
        ]);
    }

    /** @return Collection<int, array{type: string, id: string, revenue: float, transactions: int}> */
    private function revenueByProduct(Collection $payments): Collection
    {
        // Item produk ada di invoice induk (untuk termin cicilan) atau invoice itu sendiri.
        $owner = $payments->mapWithKeys(fn ($p) => [$p->id => $p->parent_invoice_id ?: $p->id]);
        $items = collect();
        foreach (self::ITEMS as $type => [$table, $fk]) {
            if ($owner->isEmpty()) {
                break;
            }
            DB::table($table)->whereIn('invoice_id', $owner->values()->unique()->all())
                ->get(['invoice_id', "{$fk} as product_id", 'price'])
                ->each(fn ($r) => $items->push(['invoice_id' => $r->invoice_id, 'type' => $type,
                    'id' => $r->product_id, 'price' => (float) $r->price]));
        }
        $byInvoice = $items->groupBy('invoice_id')->map(function (Collection $rows) {
            $bundle = $rows->where('type', 'bundle');

            return $bundle->isNotEmpty() ? $bundle : $rows;   // bundle: abaikan enrollment per item
        });

        $acc = [];
        foreach ($payments as $p) {
            $rows = $byInvoice->get($owner[$p->id]);
            if (! $rows || $rows->isEmpty()) {
                continue;
            }
            $total = $rows->sum('price');
            foreach ($rows as $r) {
                $share = $total > 0 ? $r['price'] / $total : 1 / $rows->count();
                $key = $r['type'].'|'.$r['id'];
                $acc[$key] ??= ['type' => $r['type'], 'id' => $r['id'], 'revenue' => 0.0, 'transactions' => 0];
                $acc[$key]['revenue'] += $p->nett_amount * $share;
                $acc[$key]['transactions']++;
            }
        }

        return collect(array_values($acc));
    }

    /** @return Collection<string, array{type: string, id: string, paid: int, free: int}> kunci "tipe|id" */
    private function registrationsByProduct(Carbon $from, Carbon $to): Collection
    {
        $out = collect();
        foreach (EnrollmentCounter::PRODUCTS as $type => [$table, $fk]) {
            $ids = DB::table($table)->join('invoices', "{$table}.invoice_id", '=', 'invoices.id')
                ->whereBetween(DB::raw('COALESCE(invoices.paid_at, invoices.created_at)'), [$from, $to])
                ->distinct()->pluck("{$table}.{$fk}")->all();
            if (empty($ids)) {
                continue;
            }
            $until = fn ($q) => $q->where(DB::raw('COALESCE(invoices.paid_at, invoices.created_at)'), '<=', $to);
            $paid = $this->counter->count($type, $ids, $from, fn ($q) => $until($q)->where('invoices.amount', '>', 0));
            $free = $this->counter->count($type, $ids, $from, fn ($q) => $until($q)->where('invoices.amount', 0));
            foreach ($ids as $id) {
                if (($paid[$id] ?? 0) + ($free[$id] ?? 0) > 0) {
                    $out->put("{$type}|{$id}", ['type' => $type, 'id' => $id, 'paid' => $paid[$id] ?? 0, 'free' => $free[$id] ?? 0]);
                }
            }
        }

        return $out;
    }

    private function products(Collection $revenue, Collection $registrations, int $limit): Collection
    {
        $rows = collect();
        foreach ($revenue as $r) {
            $rows->put("{$r['type']}|{$r['id']}", $r + ['registrations' => ['paid' => 0, 'free' => 0]]);
        }
        foreach ($registrations as $key => $reg) {
            $row = $rows->get($key, ['type' => $reg['type'], 'id' => $reg['id'], 'revenue' => 0.0, 'transactions' => 0]);
            $row['registrations'] = ['paid' => $reg['paid'], 'free' => $reg['free']];
            $rows->put($key, $row);
        }
        $rows = $rows->sortByDesc(fn ($r) => [$r['revenue'], $r['registrations']['paid'], $r['registrations']['free']])
            ->take($limit)->values();

        $titles = $rows->groupBy('type')->flatMap(function (Collection $group, string $type) {
            $model = self::ITEMS[$type][2];

            return $model::whereIn('id', $group->pluck('id'))->get()
                ->mapWithKeys(fn ($m) => ["{$type}|{$m->id}" => ['title' => $m->title, 'batch' => $m->batch ?? null]]);
        });

        return $rows->map(fn ($r) => [
            'type' => $r['type'],
            'id' => $r['id'],
            'title' => $titles["{$r['type']}|{$r['id']}"]['title'] ?? null,
            'batch' => $titles["{$r['type']}|{$r['id']}"]['batch'] ?? null,
            'revenue' => (int) round($r['revenue']),
            'transactions' => $r['transactions'],
            'registrations' => $r['registrations'],
        ]);
    }

    private function series(Collection $payments, Carbon $from, Carbon $to, string $group): Collection
    {
        $fmt = $group === 'day' ? 'Y-m-d' : 'Y-m';
        $period = $group === 'day'
            ? CarbonPeriod::create($from->copy()->startOfDay(), '1 day', $to->copy()->startOfDay())
            : CarbonPeriod::create($from->copy()->startOfMonth(), '1 month', $to->copy()->startOfMonth());
        $buckets = collect($period)->mapWithKeys(fn (Carbon $d) => [$d->format($fmt) => ['revenue' => 0, 'transactions' => 0]]);
        foreach ($payments as $p) {
            $k = $p->paid_at->format($fmt);
            $b = $buckets->get($k, ['revenue' => 0, 'transactions' => 0]);
            $buckets->put($k, ['revenue' => $b['revenue'] + (int) $p->nett_amount, 'transactions' => $b['transactions'] + 1]);
        }

        return $buckets->map(fn ($b, $k) => ['period' => $k] + $b)->values();
    }

    private function discountCodes(Collection $payments): Collection
    {
        $ids = $payments->map(fn ($p) => $p->parent_invoice_id ?: $p->id)->unique()->values();
        if ($ids->isEmpty()) {
            return collect();
        }

        return DB::table('discount_usages')
            ->join('discount_codes', 'discount_usages.discount_code_id', '=', 'discount_codes.id')
            ->whereIn('discount_usages.invoice_id', $ids->all())
            ->groupBy('discount_codes.code')
            ->select('discount_codes.code', DB::raw('COUNT(*) as uses'), DB::raw('SUM(discount_usages.discount_amount) as discount'))
            ->orderByDesc('uses')->limit(10)->get()
            ->map(fn ($r) => ['code' => $r->code, 'uses' => (int) $r->uses, 'discount' => (int) $r->discount]);
    }
}
