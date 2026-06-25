<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class CertificateParticipantsTemplateExport implements FromArray, WithHeadings, WithColumnWidths, WithStyles
{
    public function array(): array
    {
        return [
            [
                'nama' => 'John Doe',
                'email' => 'johndoe@gmail.com',
                'no_hp' => '081234567890',
            ],
        ];
    }

    public function headings(): array
    {
        return ['nama', 'email', 'no_hp'];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 30,
            'B' => 30,
            'C' => 20,
        ];
    }

    public function styles(Worksheet $sheet)
    {
        $sheet->getComment('A1')->getText()->createTextRun('Nama lengkap peserta sesuai yang terdaftar di sistem');
        $sheet->getComment('B1')->getText()->createTextRun('Email peserta yang terdaftar di sistem');
        $sheet->getComment('C1')->getText()->createTextRun('Nomor HP peserta (opsional, untuk membantu pencocokan)');

        return [
            1 => [
                'font' => ['bold' => true],
                'fill' => [
                    'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'startColor' => ['rgb' => 'E0E0E0'],
                ],
            ],
        ];
    }
}
