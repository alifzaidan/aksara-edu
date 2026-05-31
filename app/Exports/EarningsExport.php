<?php

namespace App\Exports;

use App\Models\AffiliateEarning;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class EarningsExport implements FromQuery, WithHeadings, WithMapping, WithColumnWidths, WithStyles
{
    protected $startDate;
    protected $endDate;
    protected $userId;
    protected $isAdmin;

    public function __construct($filters = [], $userId = null, $isAdmin = false)
    {
        $this->startDate = $filters['start_date'] ?? null;
        $this->endDate   = $filters['end_date'] ?? null;
        $this->userId    = $userId;
        $this->isAdmin   = $isAdmin;
    }

    public function query()
    {
        $query = AffiliateEarning::with([
            'invoice.user',
            'invoice.courseItems.course',
            'invoice.bootcampItems.bootcamp',
            'invoice.webinarItems.webinar',
            'invoice.bundleEnrollments.bundle',
            'invoice.certificationProgramItems.certificationProgram',
        ]);

        // Non-admin hanya bisa export data miliknya sendiri
        if (!$this->isAdmin) {
            $query->where('affiliate_user_id', $this->userId);
        }

        // Filter tanggal
        if ($this->startDate && $this->endDate) {
            $query->whereBetween('created_at', [
                Carbon::parse($this->startDate)->startOfDay(),
                Carbon::parse($this->endDate)->endOfDay(),
            ]);
        }

        return $query->orderBy('created_at', 'desc');
    }

    public function headings(): array
    {
        return [
            'No',
            'Kode Invoice',
            'Nama Afiliator',
            'Nama Produk',
            'Harga (IDR)',
            'Komisi (IDR)',
            'Rate (%)',
            'Status',
            'Tanggal',
        ];
    }

    public function map($earning): array
    {
        static $index = 0;
        $index++;

        $invoice = $earning->invoice;

        $names = [];

        foreach ($invoice->courseItems ?? [] as $item) {
            $names[] = $item->course->title ?? '-';
        }
        foreach ($invoice->bootcampItems ?? [] as $item) {
            $names[] = $item->bootcamp->title ?? '-';
        }
        foreach ($invoice->webinarItems ?? [] as $item) {
            $names[] = $item->webinar->title ?? '-';
        }
        foreach ($invoice->bundleEnrollments ?? [] as $item) {
            $names[] = $item->bundle->title ?? '-';
        }
        foreach ($invoice->certificationProgramItems ?? [] as $item) {
            $names[] = $item->certificationProgram->title ?? '-';
        }

        $prices = [];
        foreach ($invoice->courseItems ?? [] as $item) $prices[] = $item->price;
        foreach ($invoice->bootcampItems ?? [] as $item) $prices[] = $item->price;
        foreach ($invoice->webinarItems ?? [] as $item) $prices[] = $item->price;
        foreach ($invoice->bundleEnrollments ?? [] as $item) $prices[] = $item->price;
        foreach ($invoice->certificationProgramItems ?? [] as $item) $prices[] = $item->price;

        $totalPrice = array_sum($prices);

        return [
            $index,
            $invoice->invoice_code ?? '-',
            $invoice->user->name ?? '-',
            implode(', ', $names) ?: '-',
            'Rp ' . number_format($totalPrice, 0, ',', '.'),
            'Rp ' . number_format($earning->amount, 0, ',', '.'),
            $earning->rate . '%',
            ucfirst($earning->status),
            $earning->created_at ? $earning->created_at->format('d M Y, H:i') : '-',
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 5,   // No
            'B' => 18,  // Kode Invoice
            'C' => 25,  // Nama Afiliator
            'D' => 45,  // Nama Produk
            'E' => 18,  // Harga
            'F' => 18,  // Komisi
            'G' => 10,  // Rate
            'H' => 12,  // Status
            'I' => 22,  // Tanggal
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            1 => [
                'font' => ['bold' => true],
                'fill' => [
                    'fillType'   => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'startColor' => ['rgb' => 'E0E0E0'],
                ],
            ],
        ];
    }
}
