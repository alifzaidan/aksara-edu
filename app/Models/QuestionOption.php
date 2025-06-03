<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class QuestionOption extends Model
{
    use HasUuids;

    protected $guarded = ['created_at', 'updated_at'];

    public function question()
    {
        return $this->belongsTo(Question::class, 'question_id');
    }
}
