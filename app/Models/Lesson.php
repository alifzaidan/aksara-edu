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
}
