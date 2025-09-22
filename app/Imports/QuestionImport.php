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
                'explanation' => $row['explanation'] ?? null,
            ]);

            $correctOption = strtoupper($row['correct_option']);

            $options = [
                'A' => $row['option_a'] ?? null,
                'B' => $row['option_b'] ?? null,
                'C' => $row['option_c'] ?? null,
                'D' => $row['option_d'] ?? null,
                'E' => $row['option_e'] ?? null,
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
            'option_e' => 'nullable|string|max:500',
            'correct_option' => ['required', Rule::in(['A', 'B', 'C', 'D', 'E', 'a', 'b', 'c', 'd', 'e'])],
            'explanation' => 'nullable|string|max:2000',
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $data = $validator->getData();
            foreach ($data as $index => $row) {
                if (isset($row['correct_option'])) {
                    $correctOption = strtoupper($row['correct_option']);
                    $optionKey = 'option_' . strtolower($correctOption);

                    if (empty($row[$optionKey])) {
                        $validator->errors()->add(
                            "$index.correct_option",
                            "Jawaban benar ($correctOption) tidak boleh kosong pada baris " . ($index + 2)
                        );
                    }
                }
            }
        });
    }

    public function customValidationMessages()
    {
        return [
            'question.required' => 'Kolom pertanyaan tidak boleh kosong.',
            'option_a.required' => 'Pilihan A tidak boleh kosong.',
            'option_b.required' => 'Pilihan B tidak boleh kosong.',
            'correct_option.required' => 'Jawaban benar harus diisi (A, B, C, D, atau E).',
            'correct_option.in' => 'Jawaban benar harus berupa A, B, C, D, atau E.',
            'explanation.string' => 'Pembahasan harus berupa teks.',
            'explanation.max' => 'Pembahasan maksimal 2000 karakter.',
        ];
    }
}
