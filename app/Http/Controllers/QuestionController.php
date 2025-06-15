<?php

namespace App\Http\Controllers;

use App\Models\Question;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class QuestionController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'quiz_id' => ['required', 'exists:quizzes,id'],
            'question_text' => ['required', 'string'],
            'type' => ['required', Rule::in(['multiple_choice', 'true_false'])],
            'options' => ['required', 'array', 'min:2'],
            'options.*.option_text' => [
                Rule::requiredIf(fn() => $request->type === 'multiple_choice'),
                'string',
                'nullable'
            ],
            'options.*.is_correct' => ['required', 'boolean'],
        ]);

        // Validasi jumlah opsi jawaban
        $correctCount = collect($validated['options'])->where('is_correct', true)->count();
        if ($correctCount !== 1) {
            return back()->withErrors(['options' => 'Harus ada tepat satu jawaban benar.'])->withInput();
        }

        // Simpan pertanyaan
        $question = Question::create([
            'quiz_id' => $validated['quiz_id'],
            'question_text' => $validated['question_text'],
            'type' => $validated['type'],
        ]);

        // Simpan opsi jawaban
        foreach ($validated['options'] as $opt) {
            $question->options()->create([
                'option_text' => $opt['option_text'] ?? null,
                'is_correct' => $opt['is_correct'],
            ]);
        }

        return redirect()->back()->with('success', 'Pertanyaan berhasil ditambahkan.');
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'question_text' => ['required', 'string'],
            'type' => ['required', Rule::in(['multiple_choice', 'true_false'])],
            'options' => ['required', 'array', 'min:2'],
            'options.*.option_text' => [
                Rule::requiredIf(fn() => $request->type === 'multiple_choice'),
                'string',
                'nullable'
            ],
            'options.*.is_correct' => ['required', 'boolean'],
        ]);

        $question = Question::findOrFail($id);
        $question->update([
            'question_text' => $validated['question_text'],
            'type' => $validated['type'],
        ]);

        // Hapus opsi lama
        $question->options()->delete();

        // Simpan opsi baru
        foreach ($validated['options'] as $opt) {
            $question->options()->create([
                'option_text' => $opt['option_text'] ?? null,
                'is_correct' => $opt['is_correct'],
            ]);
        }

        return redirect()->back()->with('success', 'Pertanyaan berhasil diupdate.');
    }

    public function destroy($id)
    {
        $question = Question::findOrFail($id);
        $question->options()->delete();
        $question->delete();

        return redirect()->back()->with('success', 'Pertanyaan berhasil dihapus.');
    }
}
