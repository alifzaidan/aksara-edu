<?php

namespace App\Exports;

use App\Models\AffiliateEarning;
use Carbon\Carbon;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class EarningsExport implements FromQuery, WithHeadings, WithMapping, WithColumnWidths, WithColumnFormatting, WithStyles
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

        $totalPrice = $invoice->nett_amount;

        return [
            $index,                                              // A: No        → integer
            $invoice->invoice_code ?? '-',                       // B: Invoice   → text
            $invoice->user->name ?? '-',                         // C: Afiliator → text
            implode(', ', $names) ?: '-',                        // D: Produk    → text
            (float) $totalPrice,                                 // E: Harga     → number (format Rupiah)
            (float) $earning->amount,                            // F: Komisi    → number (format Rupiah)
            (float) ($earning->rate / 100),                      // G: Rate      → number (format %)
            ucfirst($earning->status),                           // H: Status    → text
            $earning->created_at ? $earning->created_at->format('d M Y, H:i') : '-', // I: Tanggal
        ];
    }

    /**
     * Format kolom agar angka tampil sebagai Rupiah atau persentase di Excel,
     * namun tetap bisa dihitung (SUM, dsb).
     */
    public function columnFormats(): array
    {
        return [
            'E' => '"Rp "#,##0',   // Harga  → Rp 1.500.000
            'F' => '"Rp "#,##0',   // Komisi → Rp 150.000
            'G' => '0.00%',        // Rate   → 10.00%
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 5,   // No
            'B' => 18,  // Kode Invoice
            'C' => 25,  // Nama Afiliator
            'D' => 45,  // Nama Produk
            'E' => 20,  // Harga
            'F' => 20,  // Komisi
            'G' => 10,  // Rate
            'H' => 12,  // Status
            'I' => 22,  // Tanggal
        ];
    }

    public function styles(Worksheet $sheet)
    {
        // Baris header: bold + background abu-abu
        $sheet->getStyle('A1:I1')->applyFromArray([
            'font' => ['bold' => true],
            'fill' => [
                'fillType'   => Fill::FILL_SOLID,
                'startColor' => ['rgb' => 'E0E0E0'],
            ],
        ]);

        // Rata kanan untuk kolom angka (Harga, Komisi, Rate)
        $lastRow = $sheet->getHighestRow();
        if ($lastRow > 1) {
            $sheet->getStyle("E2:G{$lastRow}")->getAlignment()
                ->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_RIGHT);
        }

        return [];
    }
}
