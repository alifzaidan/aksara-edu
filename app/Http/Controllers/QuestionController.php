<?php

namespace App\Http\Controllers;

use App\Imports\QuestionImport;
use App\Models\Course;
use App\Models\Question;
use App\Models\Quiz;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class QuestionController extends Controller
{
    public function create(Course $course, Quiz $quiz)
    {
        return Inertia::render('admin/quizzes/create', [
            'course' => $course->only(['id', 'title']),
            'quiz' => $quiz->only(['id', 'title']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'quiz_id' => ['required', 'exists:quizzes,id'],
            'question_text' => ['required', 'string'],
            'question_image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif', 'max:2048'],
            'type' => ['required', Rule::in(['multiple_choice', 'true_false'])],
            'options' => ['required', 'array', 'min:2'],
            'options.*.option_text' => ['nullable', 'string'],
            'options.*.option_image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif', 'max:2048'],
            'options.*.is_correct' => ['required', 'boolean'],
            'explanation' => ['nullable', 'string'],
        ]);

        // Validasi jumlah opsi jawaban
        $correctCount = collect($validated['options'])->where('is_correct', true)->count();
        if ($correctCount !== 1) {
            return back()->withErrors(['options' => 'Harus ada tepat satu jawaban benar.'])->withInput();
        }

        // Validasi opsi harus punya text atau image
        foreach ($validated['options'] as $index => $opt) {
            $hasText = !empty($opt['option_text']) && trim(strip_tags($opt['option_text'])) !== '';
            $hasImage = $request->hasFile("options.{$index}.option_image");

            if (!$hasText && !$hasImage) {
                return back()->withErrors([
                    "options.{$index}" => "Opsi " . chr(65 + $index) . " harus memiliki teks atau gambar."
                ])->withInput();
            }
        }

        // Upload gambar pertanyaan
        $questionImagePath = null;
        if ($request->hasFile('question_image')) {
            $questionImagePath = $request->file('question_image')->store('questions', 'public');
        }

        // Simpan pertanyaan
        $question = Question::create([
            'quiz_id' => $validated['quiz_id'],
            'question_text' => $validated['question_text'],
            'question_image' => $questionImagePath,
            'type' => $validated['type'],
            'explanation' => $validated['explanation'] ?? null,
        ]);

        foreach ($validated['options'] as $index => $opt) {
            $optionImagePath = null;
            if ($request->hasFile("options.{$index}.option_image")) {
                $optionImagePath = $request->file("options.{$index}.option_image")->store('question-options', 'public');
            }

            $question->options()->create([
                'option_text' => $opt['option_text'] ?? null,
                'option_image' => $optionImagePath,
                'is_correct' => $opt['is_correct'],
            ]);
        }

        $quiz = Quiz::with('lesson.module.course')->findOrFail($validated['quiz_id']);
        $courseId = $quiz->lesson->module->course->id;

        return redirect()
            ->route('quizzes.show', ['course' => $courseId, 'quiz' => $quiz->id])
            ->with('success', 'Pertanyaan berhasil ditambahkan!');
    }

    public function edit(Course $course, Quiz $quiz, Question $question)
    {
        $question->load('options');

        return Inertia::render('admin/quizzes/edit', [
            'course' => $course->only(['id', 'title']),
            'quiz' => $quiz->only(['id', 'title']),
            'question' => [
                'id' => $question->id,
                'question_text' => $question->question_text,
                'question_image' => $question->question_image ? asset('storage/' . $question->question_image) : null,
                'type' => $question->type,
                'explanation' => $question->explanation,
                'options' => $question->options->map(fn($opt) => [
                    'id' => $opt->id,
                    'option_text' => $opt->option_text,
                    'option_image' => $opt->option_image ? asset('storage/' . $opt->option_image) : null,
                    'is_correct' => $opt->is_correct,
                ]),
            ],
        ]);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'question_text' => ['required', 'string'],
            'question_image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif', 'max:2048'],
            'remove_question_image' => ['nullable', 'boolean'],
            'type' => ['required', Rule::in(['multiple_choice', 'true_false'])],
            'options' => ['required', 'array', 'min:2'],
            'options.*.option_text' => ['nullable', 'string'],
            'options.*.option_image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif', 'max:2048'],
            'options.*.remove_option_image' => ['nullable', 'boolean'],
            'options.*.existing_option_image' => ['nullable', 'string'],
            'options.*.is_correct' => ['required', 'boolean'],
            'explanation' => ['nullable', 'string'],
        ]);

        $question = Question::with('options')->findOrFail($id);

        $oldOptions = $question->options->values()->all();

        foreach ($validated['options'] as $index => $opt) {
            $hasText = !empty($opt['option_text']) && trim(strip_tags($opt['option_text'])) !== '';
            $hasNewImage = $request->hasFile("options.{$index}.option_image");
            $hasExistingImage = !empty($opt['existing_option_image']) && !($opt['remove_option_image'] ?? false);

            if (!$hasText && !$hasNewImage && !$hasExistingImage) {
                return back()->withErrors([
                    "options.{$index}" => "Opsi " . chr(65 + $index) . " harus memiliki teks atau gambar."
                ])->withInput();
            }
        }

        // Handle gambar pertanyaan
        $questionImagePath = $question->question_image;

        if ($request->input('remove_question_image')) {
            if ($questionImagePath) {
                Storage::disk('public')->delete($questionImagePath);
            }
            $questionImagePath = null;
        } elseif ($request->hasFile('question_image')) {
            if ($questionImagePath) {
                Storage::disk('public')->delete($questionImagePath);
            }
            $questionImagePath = $request->file('question_image')->store('questions', 'public');
        }

        $question->update([
            'question_text' => $validated['question_text'],
            'question_image' => $questionImagePath,
            'type' => $validated['type'],
            'explanation' => $validated['explanation'] ?? null,
        ]);

        $question->options()->delete();

        foreach ($validated['options'] as $index => $opt) {
            $optionImagePath = null;

            if ($request->hasFile("options.{$index}.option_image")) {
                if (isset($oldOptions[$index]) && $oldOptions[$index]->option_image) {
                    Storage::disk('public')->delete($oldOptions[$index]->option_image);
                }
                $optionImagePath = $request->file("options.{$index}.option_image")->store('question-options', 'public');
            } elseif (!($opt['remove_option_image'] ?? false) && !empty($opt['existing_option_image'])) {
                $existingUrl = $opt['existing_option_image'];

                if (strpos($existingUrl, 'storage/') !== false) {
                    $parts = explode('storage/', $existingUrl);
                    $optionImagePath = end($parts);
                } else {
                    if (isset($oldOptions[$index]) && $oldOptions[$index]->option_image) {
                        $optionImagePath = $oldOptions[$index]->option_image;
                    }
                }
            } elseif (($opt['remove_option_image'] ?? false) && isset($oldOptions[$index]) && $oldOptions[$index]->option_image) {
                Storage::disk('public')->delete($oldOptions[$index]->option_image);
                $optionImagePath = null;
            }

            $question->options()->create([
                'option_text' => $opt['option_text'] ?? null,
                'option_image' => $optionImagePath,
                'is_correct' => $opt['is_correct'],
            ]);
        }

        $courseId = $question->quiz->lesson->module->course->id;

        return redirect()
            ->route('quizzes.show', ['course' => $courseId, 'quiz' => $question->quiz_id])
            ->with('success', 'Pertanyaan berhasil diupdate.');
    }

    public function destroy($id)
    {
        $question = Question::with('options')->findOrFail($id);

        if ($question->question_image) {
            Storage::disk('public')->delete($question->question_image);
        }

        foreach ($question->options as $option) {
            if ($option->option_image) {
                Storage::disk('public')->delete($option->option_image);
            }
        }

        $question->options()->delete();
        $question->delete();

        return redirect()->back()->with('success', 'Pertanyaan berhasil dihapus.');
    }

    public function import(Request $request)
    {
        $request->validate([
            'quiz_id' => 'required|exists:quizzes,id',
            'file' => 'required|mimes:xlsx,csv,xls',
        ], [
            'file.required' => 'File Excel harus dipilih.',
            'file.mimes' => 'File harus berformat Excel (.xlsx, .xls, .csv).',
        ]);

        $quiz = Quiz::findOrFail($request->quiz_id);

        try {
            Excel::import(new QuestionImport($quiz->id), $request->file('file'));

            return redirect()
                ->back()
                ->with('success', 'Soal berhasil diimport!');
        } catch (\Maatwebsite\Excel\Validators\ValidationException $e) {
            $failures = $e->failures();
            $errorMessages = [];

            foreach ($failures as $failure) {
                $errorMessages[] = "Baris {$failure->row()}: " . implode(', ', $failure->errors());
            }

            return redirect()
                ->back()
                ->with('error', 'Import gagal! ' . implode(' | ', array_slice($errorMessages, 0, 5)))
                ->withInput();
        } catch (\Exception $e) {
            return redirect()
                ->back()
                ->with('error', 'Import gagal! ' . $e->getMessage())
                ->withInput();
        }
    }
}
