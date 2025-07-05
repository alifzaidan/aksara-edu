<?php

namespace App\Http\Controllers;

use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizAnswer;
use App\Models\Question;
use App\Models\QuestionOption;
use App\Models\LessonCompletion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class QuizSubmissionController extends Controller
{
    public function submit(Request $request)
    {

        $request->validate([
            'quiz_id' => 'required|exists:quizzes,id',
            'answers' => 'required|array',
            'answers.*' => 'required|string' // We'll validate option existence in the processing loop
        ]);

        $quiz = Quiz::with(['questions.options', 'lesson'])->findOrFail($request->quiz_id);
        $userId = Auth::id();

        // Allow unlimited quiz attempts - removed the restriction for passed attempts

        $startTime = now();
        $totalQuestions = $quiz->questions->count();
        $correctAnswers = 0;
        $answersData = [];
        $answersSummary = [];

        DB::beginTransaction();

        try {
            // Create quiz attempt
            $attempt = QuizAttempt::create([
                'user_id' => $userId,
                'quiz_id' => $quiz->id,
                'started_at' => $startTime,
                'submitted_at' => $startTime,
                'time_taken' => 0, // Will be updated below
                'total_questions' => $totalQuestions,
                'correct_answers' => 0, // Will be updated below
                'score' => 0, // Will be updated below
                'is_passed' => false, // Will be updated below
                'answers_summary' => [] // Will be updated below
            ]);

            // Process each answer
            foreach ($request->answers as $questionId => $selectedOptionId) {
                $question = $quiz->questions->find($questionId);
                if (!$question) {
                    continue;
                }

                $selectedOption = $question->options->find($selectedOptionId);
                if (!$selectedOption) {
                    continue;
                }

                $isCorrect = $selectedOption->is_correct;
                if ($isCorrect) {
                    $correctAnswers++;
                }

                // Save answer
                QuizAnswer::create([
                    'quiz_attempt_id' => $attempt->id,
                    'question_id' => $questionId,
                    'selected_option_id' => $selectedOptionId,
                    'is_correct' => $isCorrect
                ]);

                // Prepare answer summary
                $answersSummary[] = [
                    'question_id' => $questionId,
                    'question' => $question->question_text,
                    'selected_option_id' => $selectedOptionId,
                    'is_correct' => $isCorrect,
                    'options' => $question->options->map(function ($option) {
                        return [
                            'id' => $option->id,
                            'option_text' => $option->option_text,
                            'is_correct' => $option->is_correct
                        ];
                    })->toArray()
                ];
            }

            // Calculate score
            $score = $totalQuestions > 0 ? round(($correctAnswers / $totalQuestions) * 100, 2) : 0;
            $isPassed = $score >= $quiz->passing_score;

            // Update attempt with calculated values
            $attempt->update([
                'correct_answers' => $correctAnswers,
                'score' => $score,
                'is_passed' => $isPassed,
                'answers_summary' => $answersSummary
            ]);

            // If the quiz is passed, record it as a lesson completion
            if ($isPassed && $quiz->lesson) {
                LessonCompletion::updateOrCreate(
                    [
                        'user_id' => $userId,
                        'lesson_id' => $quiz->lesson->id
                    ],
                    [
                        'completed_at' => now()
                    ]
                );
            }

            DB::commit();

            return response()->json([
                'id' => $attempt->id,
                'score' => $score,
                'correct_answers' => $correctAnswers,
                'total_questions' => $totalQuestions,
                'is_passed' => $isPassed,
                'time_taken' => 0,
                'submitted_at' => $attempt->submitted_at->toISOString(),
                'answers_summary' => $answersSummary
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'error' => 'Failed to submit quiz',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function getAttempt(Quiz $quiz)
    {
        $userId = Auth::id();
        
        $attempt = QuizAttempt::where('user_id', $userId)
            ->where('quiz_id', $quiz->id)
            ->with(['answers.question.options', 'answers.selectedOption'])
            ->first();

        if (!$attempt) {
            return response()->json([
                'error' => 'No attempt found'
            ], 404);
        }

        return response()->json($attempt);
    }
}
