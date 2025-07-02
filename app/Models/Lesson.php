<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Lesson extends Model
{
    use HasUuids;

    protected $guarded = ['created_at', 'updated_at'];

    public function module()
    {
        return $this->belongsTo(Module::class, 'module_id');
    }

    public function quizzes()
    {
        return $this->hasMany(Quiz::class);
    }
    public function completions()
    {
        return $this->hasMany(LessonCompletion::class);
    }

    public function isCompletedByUser($userId)
    {
        return $this->completions()->where('user_id', $userId)->exists();
    }
}
