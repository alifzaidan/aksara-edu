<?php

namespace App\Imports;

use App\Models\CertificateParticipant;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;

class CertificateGradesImport implements ToCollection, SkipsEmptyRows
{
    protected $certificate;
    protected $errors = [];
    protected $successCount = 0;

    public function __construct($certificate)
    {
        $this->certificate = $certificate;
    }

    public function collection(Collection $rows)
    {
        if ($rows->isEmpty()) {
            return;
        }

        $dataRows = $rows->slice(1);
        $subjects = $this->certificate->assessment_subjects ?? [];
        $subjectCount = count($subjects);

        foreach ($dataRows as $index => $row) {
            $name = isset($row[0]) ? trim((string)$row[0]) : null;
            $phone = isset($row[1]) ? trim((string)$row[1]) : null;

            if (empty($name) && empty($phone)) {
                continue;
            }

            $participant = null;
            
            // 1. Match by phone first
            if (!empty($phone)) {
                $cleanPhone = preg_replace('/[^0-9]/', '', $phone);
                // Strip leading '0' or '62' if necessary for relative matching
                if (str_starts_with($cleanPhone, '0')) {
                    $cleanPhone = substr($cleanPhone, 1);
                } elseif (str_starts_with($cleanPhone, '62')) {
                    $cleanPhone = substr($cleanPhone, 2);
                }

                if (!empty($cleanPhone)) {
                    $participant = CertificateParticipant::where('certificate_id', $this->certificate->id)
                        ->whereHas('user', function ($query) use ($cleanPhone) {
                            $query->whereRaw("REPLACE(REPLACE(REPLACE(phone_number, ' ', ''), '-', ''), '+', '') LIKE ?", ['%' . $cleanPhone]);
                        })->first();
                }
            }

            // 2. Fallback to name match
            if (!$participant && !empty($name)) {
                $participant = CertificateParticipant::where('certificate_id', $this->certificate->id)
                    ->whereHas('user', function ($query) use ($name) {
                        $query->where('name', 'like', '%' . $name . '%');
                    })->first();
            }

            if (!$participant) {
                $this->errors[] = "Baris " . ($index + 1) . ": Peserta '{$name}' (" . ($phone ?? '-') . ") tidak ditemukan terdaftar.";
                continue;
            }

            // Parse grades
            $grades = [];
            for ($i = 0; $i < $subjectCount; $i++) {
                $scoreCol = 2 + $i;

                $score = isset($row[$scoreCol]) ? trim((string)$row[$scoreCol]) : '';
                
                // Calculate letter grade automatically
                $grade = '';
                if ($score !== '') {
                    $scoreVal = floatval($score);
                    if ($scoreVal >= 80) {
                        $grade = 'A';
                    } elseif ($scoreVal >= 70) {
                        $grade = 'B';
                    } elseif ($scoreVal >= 45) {
                        $grade = 'C';
                    } elseif ($scoreVal >= 25) {
                        $grade = 'D';
                    } else {
                        $grade = 'E';
                    }
                }

                $grades[] = [
                    'subject' => $subjects[$i],
                    'score' => $score,
                    'grade' => $grade,
                ];
            }

            $participant->update([
                'grades' => $grades,
            ]);
            
            $this->successCount++;
        }
    }

    public function getErrors(): array
    {
        return $this->errors;
    }

    public function getSuccessCount(): int
    {
        return $this->successCount;
    }
}
