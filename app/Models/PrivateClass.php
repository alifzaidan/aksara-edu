<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class PrivateClass extends Model
{
    use HasUuids;

    protected $guarded = ['created_at', 'updated_at'];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'registration_deadline' => 'datetime',
        'max_participants' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function mentor()
    {
        return $this->user();
    }

    public function category()
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    public function enrollmentPrivates()
    {
        return $this->hasMany(\App\Models\EnrollmentPrivate::class, 'private_class_id');
    }

    public function schedules()
    {
        return $this->hasMany(\App\Models\PrivateClassSchedule::class, 'private_class_id')
            ->orderBy('start_time', 'asc');
    }
}
