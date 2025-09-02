<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class BootcampAttendance extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $guarded = ['created_at', 'updated_at'];

    protected $casts = [
        'verified' => 'boolean',
    ];

    public function enrollmentBootcamp()
    {
        return $this->belongsTo(EnrollmentBootcamp::class);
    }

    public function bootcampSchedule()
    {
        return $this->belongsTo(BootcampSchedule::class);
    }
}
