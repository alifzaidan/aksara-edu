<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class PrivateClassSchedule extends Model
{
    use HasUuids;

    protected $guarded = ['created_at', 'updated_at'];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'registration_deadline' => 'datetime',
        'max_participants' => 'integer',
        'is_active' => 'boolean',
    ];

    public function privateClass()
    {
        return $this->belongsTo(PrivateClass::class, 'private_class_id');
    }

    public function enrollments()
    {
        return $this->hasMany(EnrollmentPrivate::class, 'private_class_schedule_id');
    }
}
