<?php

namespace App\Exports;

use App\Models\Question;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class QuestionExport implements FromArray, WithHeadings, WithColumnWidths, WithStyles
{
    protected $quizId;

    public function __construct($quizId)
    {
        $this->quizId = $quizId;
    }

    public function array(): array
    {
        $questions = Question::where('quiz_id', $this->quizId)
            ->with(['options' => function ($query) {
                $query->orderBy('created_at', 'asc');
            }])
            ->get();

        $data = [];

        foreach ($questions as $question) {
            $options = $question->options->values();

            $correctOptionLetter = '';

            $optA = isset($options[0]) ? $options[0]->option_text : '';
            $optB = isset($options[1]) ? $options[1]->option_text : '';
            $optC = isset($options[2]) ? $options[2]->option_text : '';
            $optD = isset($options[3]) ? $options[3]->option_text : '';
            $optE = isset($options[4]) ? $options[4]->option_text : '';

            foreach ($options as $index => $opt) {
                if ($opt->is_correct) {
                    $correctOptionLetter = chr(65 + $index);
                    break;
                }
            }

            $data[] = [
                'question' => $question->question_text,
                'option_a' => $optA,
                'option_b' => $optB,
                'option_c' => $optC,
                'option_d' => $optD,
                'option_e' => $optE,
                'correct_option' => $correctOptionLetter,
                'explanation' => $question->explanation ?? '',
            ];
        }

        return $data;
    }

    public function headings(): array
    {
        return [
            'question',
            'option_a',
            'option_b',
            'option_c',
            'option_d',
            'option_e',
            'correct_option',
            'explanation',
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 40,
            'B' => 25,
            'C' => 25,
            'D' => 25,
            'E' => 25,
            'F' => 25,
            'G' => 15,
            'H' => 30,
        ];
    }

    public function styles(Worksheet $sheet)
    {
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
