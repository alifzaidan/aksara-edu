<?php

namespace App\Http\Controllers;

use App\Models\Lesson;
use App\Models\LessonCompletion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LessonController extends Controller
{
    public function markComplete(Request $request, Lesson $lesson)
    {
        $user = Auth::user();
        
        // Check if already completed
        $completion = LessonCompletion::where('user_id', $user->id)
            ->where('lesson_id', $lesson->id)
            ->first();
            
        if (!$completion) {
            LessonCompletion::create([
                'user_id' => $user->id,
                'lesson_id' => $lesson->id,
                'completed_at' => now()
            ]);
        }
        
        return response()->json([
            'success' => true,
            'message' => 'Materi berhasil diselesaikan!'
        ]);
    }
}