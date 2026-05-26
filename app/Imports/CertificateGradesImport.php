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
    protected $emptyScoreParticipants = [];
    protected $successCount = 0;
    protected $processedParticipantIds = [];

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
            
            // 1. Prioritas Utama: Cocokkan keduanya (Nama EXACT DAN No HP EXACT) untuk mencegah tabrakan no HP yang sama
            if (!empty($name) && !empty($phone)) {
                $cleanPhone = preg_replace('/[^0-9]/', '', $phone);
                // Strip leading '0' or '62' if necessary for relative matching
                if (str_starts_with($cleanPhone, '0')) {
                    $cleanPhone = substr($cleanPhone, 1);
                } elseif (str_starts_with($cleanPhone, '62')) {
                    $cleanPhone = substr($cleanPhone, 2);
                }

                if (!empty($cleanPhone)) {
                    $participant = CertificateParticipant::where('certificate_id', $this->certificate->id)
                        ->whereNotIn('id', $this->processedParticipantIds)
                        ->whereHas('user', function ($query) use ($name, $cleanPhone) {
                            $query->where('name', $name)
                                  ->where(function ($q) use ($cleanPhone) {
                                      $q->whereRaw("REPLACE(REPLACE(REPLACE(phone_number, ' ', ''), '-', ''), '+', '') = ?", [$cleanPhone])
                                        ->orWhereRaw("REPLACE(REPLACE(REPLACE(phone_number, ' ', ''), '-', ''), '+', '') = ?", ['0' . $cleanPhone])
                                        ->orWhereRaw("REPLACE(REPLACE(REPLACE(phone_number, ' ', ''), '-', ''), '+', '') = ?", ['62' . $cleanPhone]);
                                  });
                        })->first();
                }
            }

            // 2. Fallback 1: Jika tidak cocok keduanya, cari berdasarkan NAMA EXACT saja (sangat aman dari tabrakan nomor HP)
            if (!$participant && !empty($name)) {
                $participant = CertificateParticipant::where('certificate_id', $this->certificate->id)
                    ->whereNotIn('id', $this->processedParticipantIds)
                    ->whereHas('user', function ($query) use ($name) {
                        $query->where('name', $name);
                    })->first();
            }

            // 3. Fallback 2: Jika nama di Excel kosong tapi no HP terisi, cari berdasarkan NO HP EXACT saja
            if (!$participant && empty($name) && !empty($phone)) {
                $cleanPhone = preg_replace('/[^0-9]/', '', $phone);
                if (str_starts_with($cleanPhone, '0')) {
                    $cleanPhone = substr($cleanPhone, 1);
                } elseif (str_starts_with($cleanPhone, '62')) {
                    $cleanPhone = substr($cleanPhone, 2);
                }

                if (!empty($cleanPhone)) {
                    $participant = CertificateParticipant::where('certificate_id', $this->certificate->id)
                        ->whereNotIn('id', $this->processedParticipantIds)
                        ->whereHas('user', function ($query) use ($cleanPhone) {
                            $query->where(function ($q) use ($cleanPhone) {
                                $q->whereRaw("REPLACE(REPLACE(REPLACE(phone_number, ' ', ''), '-', ''), '+', '') = ?", [$cleanPhone])
                                  ->orWhereRaw("REPLACE(REPLACE(REPLACE(phone_number, ' ', ''), '-', ''), '+', '') = ?", ['0' . $cleanPhone])
                                  ->orWhereRaw("REPLACE(REPLACE(REPLACE(phone_number, ' ', ''), '-', ''), '+', '') = ?", ['62' . $cleanPhone]);
                            });
                        })->first();
                }
            }

            if (!$participant) {
                $this->errors[] = "Baris " . ($index + 1) . ": Peserta '{$name}' (" . ($phone ?? '-') . ") tidak ditemukan terdaftar.";
                continue;
            }

            // Parse grades
            $grades = [];
            $rowHasErrors = false;
            for ($i = 0; $i < $subjectCount; $i++) {
                $scoreCol = 2 + $i;

                $score = isset($row[$scoreCol]) ? trim((string)$row[$scoreCol]) : '';
                
                if ($score === '') {
                    $displayName = !empty($name) ? $name : (($participant && $participant->user) ? $participant->user->name : 'Peserta Tanpa Nama');
                    if (!in_array($displayName, $this->emptyScoreParticipants)) {
                        $this->emptyScoreParticipants[] = $displayName;
                    }
                    $rowHasErrors = true;
                    continue;
                }

                // Calculate letter grade automatically
                $grade = '';
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

                $grades[] = [
                    'subject' => $subjects[$i],
                    'score' => $score,
                    'grade' => $grade,
                ];
            }

            if ($rowHasErrors) {
                continue;
            }

            $participant->update([
                'grades' => $grades,
            ]);
            
            $this->processedParticipantIds[] = $participant->id;
            $this->successCount++;
        }
    }

    public function getErrors(): array
    {
        return $this->errors;
    }

    public function getEmptyScoreParticipants(): array
    {
        return $this->emptyScoreParticipants;
    }

    public function getSuccessCount(): int
    {
        return $this->successCount;
    }
}
