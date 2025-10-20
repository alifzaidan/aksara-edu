<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\LessonCompletion;
use App\Models\Quiz;
use App\Models\Question;
use App\Models\QuizAttempt;
use App\Models\QuizAnswer;
use App\Services\QuizSequenceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;

class QuizController extends Controller
{
    protected $quizSequenceService;

    public function __construct(QuizSequenceService $quizSequenceService)
    {
        $this->quizSequenceService = $quizSequenceService;
    }

    public function show($quizId)
    {
        $user = Auth::user();

        if (!$user) {
            return redirect()->route('login');
        }

        $quiz = Quiz::with(['lesson', 'questions.options'])
            ->findOrFail($quizId);

        // Check if user has access to this quiz's lesson
        // Add your authorization logic here based on your enrollment system

        return Inertia::render('user/quiz/show', [
            'quiz' => [
                'id' => $quiz->id,
                'title' => $quiz->title,
                'instructions' => $quiz->instructions,
                'time_limit' => $quiz->time_limit,
                'passing_score' => $quiz->passing_score,
                'lesson' => [
                    'id' => $quiz->lesson->id,
                    'title' => $quiz->lesson->title ?? 'Unknown Lesson',
                ],
                'questions' => $quiz->questions->map(function ($question) {
                    return [
                        'id' => $question->id,
                        'question_text' => $question->question_text,
                        'type' => $question->type,
                        'explanation' => $question->explanation,
                        'options' => $question->options->map(function ($option) {
                            return [
                                'id' => $option->id,
                                'option_text' => $option->option_text,
                                // Don't include is_correct for security
                            ];
                        }),
                    ];
                }),
            ],
        ]);
    }

    public function start($quizId)
    {
        $user = Auth::user();

        if (!$user) {
            return redirect()->route('login');
        }

        $quiz = Quiz::with(['lesson.module.course', 'questions.options'])
            ->findOrFail($quizId);

        // Check if there's an ongoing attempt
        $ongoingAttempt = QuizAttempt::where('user_id', $user->id)
            ->where('quiz_id', $quiz->id)
            ->whereNull('submitted_at')
            ->first();

        if (!$ongoingAttempt) {
            // Create new attempt
            $ongoingAttempt = QuizAttempt::create([
                'id' => Str::uuid(),
                'user_id' => $user->id,
                'quiz_id' => $quiz->id,
                'total_questions' => $quiz->questions->count(),
                'started_at' => now(),
            ]);
        }

        return Inertia::render('user/quiz/index', [
            'quiz' => [
                'id' => $quiz->id,
                'title' => $quiz->title,
                'instructions' => $quiz->instructions,
                'time_limit' => $quiz->time_limit,
                'course' => [
                    'id' => $quiz->lesson->module->course->id,
                    'slug' => $quiz->lesson->module->course->slug,
                ],
                'questions' => $quiz->questions->map(function ($question) {
                    return [
                        'id' => $question->id,
                        'question_text' => $question->question_text,
                        'question_image' => $question->question_image ? asset('storage/' . $question->question_image) : null,
                        'type' => $question->type,
                        'options' => $question->options->map(function ($option) {
                            return [
                                'id' => $option->id,
                                'option_text' => $option->option_text,
                                'option_image' => $option->option_image ? asset('storage/' . $option->option_image) : null,
                            ];
                        }),
                    ];
                }),
            ],
            'attempt' => [
                'id' => $ongoingAttempt->id,
                'started_at' => $ongoingAttempt->started_at,
            ],
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ]
        ]);
    }

    public function submit(Request $request, $quizId)
    {
        $user = Auth::user();

        if (!$user) {
            return redirect()->route('login');
        }

        $request->validate([
            'attempt_id' => 'required|uuid',
            'answers' => 'required|array',
            'answers.*.question_id' => 'required|uuid',
            'answers.*.selected_option_id' => 'required|uuid',
        ]);

        try {
            $quiz = Quiz::findOrFail($quizId);

            $attempt = QuizAttempt::where('id', $request->attempt_id)
                ->where('user_id', $user->id)
                ->where('quiz_id', $quiz->id)
                ->whereNull('submitted_at')
                ->firstOrFail();

            $correctCount = 0;
            $answersData = [];

            foreach ($request->answers as $answerData) {
                $question = Question::with('options')->find($answerData['question_id']);
                $selectedOption = $question->options
                    ->where('id', $answerData['selected_option_id'])
                    ->first();

                $isCorrect = $selectedOption ? $selectedOption->is_correct : false;

                if ($isCorrect) {
                    $correctCount++;
                }

                // Store answer
                QuizAnswer::create([
                    'id' => Str::uuid(),
                    'quiz_attempt_id' => $attempt->id,
                    'question_id' => $answerData['question_id'],
                    'selected_option_id' => $answerData['selected_option_id'],
                    'is_correct' => $isCorrect,
                ]);

                $answersData[] = [
                    'question_id' => $answerData['question_id'],
                    'selected_option_id' => $answerData['selected_option_id'],
                    'is_correct' => $isCorrect,
                ];
            }

            // Calculate score and results
            $totalQuestions = $attempt->total_questions;
            $scorePercentage = $totalQuestions > 0 ? ($correctCount / $totalQuestions) * 100 : 0;
            $isPassed = $scorePercentage >= $quiz->passing_score;

            // Calculate time taken
            $timeTakenSeconds = $attempt->started_at->diffInSeconds(now());

            // Update attempt
            $attempt->update([
                'score' => $scorePercentage,
                'correct_answers' => $correctCount,
                'is_passed' => $isPassed,
                'submitted_at' => now(),
                'time_taken' => $timeTakenSeconds,
                'answers_summary' => json_encode($answersData),
            ]);

            if ($isPassed) {
                $existingCompletion = LessonCompletion::where('user_id', $user->id)
                    ->where('lesson_id', $quiz->lesson->id)
                    ->first();

                if (!$existingCompletion) {
                    LessonCompletion::create([
                        'id' => Str::uuid(),
                        'user_id' => $user->id,
                        'lesson_id' => $quiz->lesson->id,
                        'completed_at' => now(),
                    ]);

                    Log::info('Lesson completion saved for passed quiz:', [
                        'user_id' => $user->id,
                        'lesson_id' => $quiz->lesson->id,
                        'quiz_id' => $quiz->id,
                        'attempt_id' => $attempt->id,
                        'score' => $scorePercentage
                    ]);
                }
            }

            Log::info('Quiz submitted successfully:', [
                'attempt_id' => $attempt->id,
                'score' => $scorePercentage,
                'correct_answers' => $correctCount,
                'total_questions' => $totalQuestions,
                'is_passed' => $isPassed,
                'time_taken' => $timeTakenSeconds,
            ]);

            return redirect()->route('quiz.result', $quizId)
                ->with('success', 'Quiz berhasil dikumpulkan!');
        } catch (\Exception $e) {
            Log::error('Quiz submission error: ' . $e->getMessage());
            return redirect()->back()
                ->with('error', 'Gagal menyimpan jawaban quiz.')
                ->withInput();
        }
    }

    public function result($quizId)
    {
        $user = Auth::user();

        if (!$user) {
            return redirect()->route('login');
        }

        $quiz = Quiz::with(['lesson.module.course'])->findOrFail($quizId);

        // Get the latest quiz attempt
        $quizAttempt = QuizAttempt::where('user_id', $user->id)
            ->where('quiz_id', $quiz->id)
            ->whereNotNull('submitted_at')
            ->orderBy('submitted_at', 'desc')
            ->first();

        if (!$quizAttempt) {
            return redirect()->route('quiz.show', $quizId)
                ->with('error', 'Hasil quiz tidak ditemukan. Silakan kerjakan quiz terlebih dahulu.');
        }

        return Inertia::render('user/quiz/result', [
            'quiz' => [
                'id' => $quiz->id,
                'title' => $quiz->title,
                'passing_score' => $quiz->passing_score,
                'course' => [
                    'slug' => $quiz->lesson->module->course->slug,
                ],
                'lesson' => [
                    'id' => $quiz->lesson->id,
                    'title' => $quiz->lesson->title ?? 'Unknown Lesson',
                ],
            ],
            'attempt' => [
                'id' => $quizAttempt->id,
                'score' => $quizAttempt->score,
                'correct_answers' => $quizAttempt->correct_answers,
                'total_questions' => $quizAttempt->total_questions,
                'is_passed' => $quizAttempt->is_passed,
                'time_taken' => $quizAttempt->time_taken,
                'submitted_at' => $quizAttempt->submitted_at,
            ],
        ]);
    }

    public function answers($quizId)
    {
        $user = Auth::user();

        if (!$user) {
            return redirect()->route('login');
        }

        $quiz = Quiz::with(['lesson.module.course'])->findOrFail($quizId);

        $quizAttempt = QuizAttempt::where('user_id', $user->id)
            ->where('quiz_id', $quiz->id)
            ->whereNotNull('submitted_at')
            ->orderBy('submitted_at', 'desc')
            ->first();

        if (!$quizAttempt) {
            return redirect()->route('quiz.show', $quizId)
                ->with('error', 'Hasil quiz tidak ditemukan.');
        }

        // Get detailed answers
        $detailedAnswers = QuizAnswer::where('quiz_attempt_id', $quizAttempt->id)
            ->with([
                'question.options',
                'selectedOption'
            ])
            ->get()
            ->map(function ($answer) {
                $question = $answer->question;
                $correctOption = $question->options->where('is_correct', true)->first();

                return [
                    'question_id' => $question->id,
                    'question_text' => $question->question_text,
                    'question_image' => $question->question_image ? asset('storage/' . $question->question_image) : null, // ✅ Tambahkan ini
                    'type' => $question->type,
                    'explanation' => $question->explanation,
                    'options' => $question->options->map(function ($option) use ($answer) {
                        return [
                            'id' => $option->id,
                            'option_text' => $option->option_text,
                            'option_image' => $option->option_image ? asset('storage/' . $option->option_image) : null, // ✅ Tambahkan ini
                            'is_correct' => $option->is_correct,
                            'is_selected' => $option->id === $answer->selected_option_id
                        ];
                    }),
                    'user_answer' => $answer->selectedOption->option_text,
                    'correct_answer' => $correctOption->option_text,
                    'is_correct' => $answer->is_correct,
                ];
            });

        return Inertia::render('user/quiz/answers', [
            'quiz' => [
                'id' => $quiz->id,
                'title' => $quiz->title,
                'passing_score' => $quiz->passing_score,
                'course' => [
                    'id' => $quiz->lesson->module->course->id,
                    'slug' => $quiz->lesson->module->course->slug,
                ],
                'lesson' => [
                    'id' => $quiz->lesson->id,
                    'title' => $quiz->lesson->title ?? 'Unknown Lesson',
                ],
            ],
            'attempt' => [
                'id' => $quizAttempt->id,
                'score' => $quizAttempt->score,
                'correct_answers' => $quizAttempt->correct_answers,
                'total_questions' => $quizAttempt->total_questions,
                'is_passed' => $quizAttempt->is_passed,
                'submitted_at' => $quizAttempt->submitted_at,
            ],
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'answers' => $detailedAnswers
        ]);
    }

    public function history($quizId)
    {
        $user = Auth::user();

        if (!$user) {
            return redirect()->route('login');
        }

        $quiz = Quiz::with(['lesson.module.course'])->findOrFail($quizId);

        $attempts = QuizAttempt::where('user_id', $user->id)
            ->where('quiz_id', $quiz->id)
            ->whereNotNull('submitted_at')
            ->orderBy('submitted_at', 'desc')
            ->get()
            ->map(function ($attempt) {
                return [
                    'id' => $attempt->id,
                    'score' => $attempt->score,
                    'correct_answers' => $attempt->correct_answers,
                    'total_questions' => $attempt->total_questions,
                    'is_passed' => $attempt->is_passed,
                    'time_taken' => $attempt->time_taken,
                    'submitted_at' => $attempt->submitted_at,
                ];
            });

        return Inertia::render('user/quiz/history', [
            'quiz' => [
                'id' => $quiz->id,
                'title' => $quiz->title,
                'passing_score' => $quiz->passing_score,
                'course' => [
                    'slug' => $quiz->lesson->module->course->slug,
                ],
                'lesson' => [
                    'id' => $quiz->lesson->id,
                    'title' => $quiz->lesson->title ?? 'Unknown Lesson',
                ],
            ],
            'attempts' => $attempts,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ]
        ]);
    }

    public function cancel($quizId)
    {
        $user = Auth::user();

        if (!$user) {
            return redirect()->route('login');
        }

        try {
            $quiz = Quiz::with(['lesson.module.course'])->findOrFail($quizId);

            $ongoingAttempt = QuizAttempt::where('user_id', $user->id)
                ->where('quiz_id', $quizId)
                ->whereNull('submitted_at')
                ->first();

            if ($ongoingAttempt) {
                QuizAnswer::where('quiz_attempt_id', $ongoingAttempt->id)->delete();

                $ongoingAttempt->delete();

                Log::info('Quiz attempt cancelled and deleted:', [
                    'user_id' => $user->id,
                    'quiz_id' => $quizId,
                    'attempt_id' => $ongoingAttempt->id
                ]);
            }

            return redirect("/learn/course/{$quiz->lesson->module->course->slug}")
                ->with('success', 'Quiz berhasil dibatalkan');
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Gagal membatalkan quiz');
        }
    }
}
