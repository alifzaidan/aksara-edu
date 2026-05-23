<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class CertificateGradesTemplateExport implements FromArray, WithHeadings, WithColumnWidths, WithStyles
{
    protected $certificate;

    public function __construct($certificate)
    {
        $this->certificate = $certificate;
    }

    public function array(): array
    {
        $data = [];
        $participants = $this->certificate->participants()->with('user')->get();
        
        foreach ($participants as $participant) {
            $row = [
                'nama' => $participant->user->name ?? '',
                'no_hp' => $participant->user->phone_number ?? '',
            ];
            
            $subjects = $this->certificate->assessment_subjects ?? [];
            foreach ($subjects as $idx => $subj) {
                $existingGrade = isset($participant->grades[$idx]) ? $participant->grades[$idx] : null;
                $row['score_' . $idx] = $existingGrade['score'] ?? '';
            }
            
            $data[] = $row;
        }

        if (empty($data)) {
            $dummy = [
                'nama' => 'Nesya Puspa Leviana, S.Ak.',
                'no_hp' => '85225345264',
            ];
            $subjects = $this->certificate->assessment_subjects ?? [];
            foreach ($subjects as $idx => $subj) {
                $dummy['score_' . $idx] = '85';
            }
            $data[] = $dummy;
        }

        return $data;
    }

    public function headings(): array
    {
        $headers = ['nama', 'no_hp'];
        $subjects = $this->certificate->assessment_subjects ?? [];
        foreach ($subjects as $subj) {
            $headers[] = 'kolom_1';
        }
        return $headers;
    }

    public function columnWidths(): array
    {
        $widths = [
            'A' => 30, // nama
            'B' => 15, // no_hp
        ];
        
        $subjects = $this->certificate->assessment_subjects ?? [];
        $colIdx = 2;
        foreach ($subjects as $subj) {
            $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIdx + 1);
            $widths[$colLetter] = 15;
            $colIdx += 1;
        }
        
        return $widths;
    }

    public function styles(Worksheet $sheet)
    {
        $subjects = $this->certificate->assessment_subjects ?? [];
        $colIdx = 2;
        
        foreach ($subjects as $idx => $subj) {
            $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($colIdx + 1);
            $sheet->getComment($colLetter . '1')->getText()->createTextRun("Nilai Angka untuk: " . $subj);
            $colIdx += 1;
        }

        return [
            1 => [
                'font' => ['bold' => true],
                'fill' => [
                    'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'startColor' => ['rgb' => 'E0E0E0']
                ],
            ],
        ];
    }
}
