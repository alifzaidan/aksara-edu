<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class EnrollmentPrivate extends Model
{
    use HasUuids;

    protected $guarded = ['created_at', 'updated_at'];

    protected $casts = [
        'completed_at' => 'datetime',
    ];

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    public function privateClass()
    {
        return $this->belongsTo(\App\Models\PrivateClass::class, 'private_class_id');
    }

    public function privateClassSchedule()
    {
        return $this->belongsTo(\App\Models\PrivateClassSchedule::class, 'private_class_schedule_id');
    }
}
