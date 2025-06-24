<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class EnrollmentCourse extends Model
{
    use HasUuids;

    protected $guarded = ['created_at', 'updated_at'];

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }
}
