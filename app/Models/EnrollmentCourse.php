<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class EnrollmentCourse extends Model
{
    use HasUuids;

    protected $guarded = ['created_at', 'updated_at'];

    protected $fillable = [
        'invoice_id',
        'course_id', 
        'price',
        'progress',
        'completed_at'
    ];

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
