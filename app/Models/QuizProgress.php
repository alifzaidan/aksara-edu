<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class QuizProgress extends Model
{
    protected $fillable = [
        'user_id',
        'quiz_id',
        'answers',
    ];
}
