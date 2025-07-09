<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\QuizProgress;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class QuizProgressController extends Controller
{
    public function save(Request $request)
    {
        $request->validate([
            'quiz_id' => 'required',
            'answers' => 'required|array',
        ]);
        $userId = Auth::id();
        $quizId = $request->quiz_id;

        // Debug log jika perlu
        Log::info('QuizProgress Save', ['user_id' => $userId, 'quiz_id' => $quizId, 'answers' => $request->answers]);

        $progress = QuizProgress::updateOrCreate(
            [
                'user_id' => $userId,
                'quiz_id' => $quizId,
            ],
            [
                'answers' => json_encode($request->answers),
            ]
        );

        return response()->json(['success' => true]);
    }

    public function get(Request $request)
    {
        $userId = Auth::id();
        $quizId = $request->quiz_id;
        $progress = QuizProgress::where('user_id', $userId)
            ->where('quiz_id', $quizId)
            ->first();

        return response()->json([
            'answers' => $progress ? json_decode($progress->answers, true) : null,
        ]);
    }

    public function clear(Request $request)
    {
        $request->validate([
            'quiz_id' => 'required',
        ]);
        $userId = Auth::id();
        $quizId = $request->quiz_id;
        $deleted = QuizProgress::where('user_id', $userId)
            ->where('quiz_id', $quizId)
            ->delete();
        return response()->json(['success' => true, 'deleted' => $deleted]);
    }
}