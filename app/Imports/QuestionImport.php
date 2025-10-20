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
use PhpOffice\PhpSpreadsheet\Cell\Cell;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use Maatwebsite\Excel\Concerns\WithCustomValueBinder;
use PhpOffice\PhpSpreadsheet\Cell\DefaultValueBinder;

class QuestionImport extends DefaultValueBinder implements ToCollection, WithHeadingRow, SkipsEmptyRows, WithValidation, WithCustomValueBinder
{
    use Importable;

    protected $quizId;

    public function __construct($quizId)
    {
        $this->quizId = $quizId;
    }

    public function bindValue(Cell $cell, $value)
    {
        if (is_numeric($value)) {
            $cell->setValueExplicit($value, DataType::TYPE_STRING);
            return true;
        }

        return parent::bindValue($cell, $value);
    }

    public function collection(Collection $collection)
    {
        foreach ($collection as $row) {
            $row = $row->map(function ($value) {
                return is_null($value) ? null : trim((string) $value);
            });

            if (empty($row['question'])) {
                continue;
            }

            $question = Question::create([
                'quiz_id' => $this->quizId,
                'question_text' => $row['question'],
                'type' => 'multiple_choice',
                'explanation' => $row['explanation'] ?? null,
            ]);

            $correctOption = strtoupper(trim((string) $row['correct_option']));

            $options = [
                'A' => $row['option_a'] ?? null,
                'B' => $row['option_b'] ?? null,
                'C' => $row['option_c'] ?? null,
                'D' => $row['option_d'] ?? null,
                'E' => $row['option_e'] ?? null,
            ];

            foreach ($options as $optionKey => $optionText) {
                $optionText = is_null($optionText) ? null : trim((string) $optionText);

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
            'question' => 'required',
            'option_a' => 'required',
            'option_b' => 'required',
            'option_c' => 'nullable',
            'option_d' => 'nullable',
            'option_e' => 'nullable',
            'correct_option' => ['required', Rule::in(['A', 'B', 'C', 'D', 'E', 'a', 'b', 'c', 'd', 'e'])],
            'explanation' => 'nullable',
        ];
    }

    public function prepareForValidation($data, $index)
    {
        return array_map(function ($value) {
            if (is_null($value)) {
                return null;
            }
            return trim((string) $value);
        }, $data);
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $data = $validator->getData();
            foreach ($data as $index => $row) {
                if (isset($row['correct_option'])) {
                    $correctOption = strtoupper(trim((string) $row['correct_option']));
                    $optionKey = 'option_' . strtolower($correctOption);

                    // Check if the correct option is empty
                    $optionValue = isset($row[$optionKey]) ? trim((string) $row[$optionKey]) : '';

                    if (empty($optionValue)) {
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
        ];
    }
}
