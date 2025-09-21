<?php

namespace App\Imports;

use App\Models\Question;
use App\Models\QuestionOption;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use Maatwebsite\Excel\Concerns\Importable;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;

class QuestionImport implements ToCollection, WithHeadingRow, SkipsEmptyRows, WithValidation
{
    use Importable;

    protected $quizId;

    public function __construct($quizId)
    {
        $this->quizId = $quizId;
    }

    public function collection(Collection $collection)
    {
        foreach ($collection as $row) {
            if (empty($row['question'])) {
                continue;
            }

            $question = Question::create([
                'quiz_id' => $this->quizId,
                'question_text' => $row['question'],
                'type' => 'multiple_choice',
            ]);

            $correctOption = strtoupper($row['correct_option']);

            $options = [
                'A' => $row['option_a'] ?? null,
                'B' => $row['option_b'] ?? null,
                'C' => $row['option_c'] ?? null,
                'D' => $row['option_d'] ?? null,
            ];

            foreach ($options as $optionKey => $optionText) {
                if (!empty($optionText)) {
                    QuestionOption::create([
                        'question_id' => $question->id,
                        'option_text' => $optionText,
                        'is_correct' => $optionKey === $correctOption,
                    ]);
                }
            }
        }
    }

    public function rules(): array
    {
        return [
            'question' => 'required|string|max:1000',
            'option_a' => 'required|string|max:500',
            'option_b' => 'required|string|max:500',
            'option_c' => 'nullable|string|max:500',
            'option_d' => 'nullable|string|max:500',
            'correct_option' => ['required', Rule::in(['A', 'B', 'C', 'D', 'a', 'b', 'c', 'd'])],
        ];
    }

    public function customValidationMessages()
    {
        return [
            'question.required' => 'Kolom pertanyaan tidak boleh kosong.',
            'option_a.required' => 'Pilihan A tidak boleh kosong.',
            'option_b.required' => 'Pilihan B tidak boleh kosong.',
            'correct_option.required' => 'Jawaban benar harus diisi (A, B, C, atau D).',
            'correct_option.in' => 'Jawaban benar harus berupa A, B, C, atau D.',
        ];
    }
}
