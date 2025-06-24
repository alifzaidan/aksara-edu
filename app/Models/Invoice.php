<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use HasUuids;

    protected $guarded = ['created_at', 'updated_at'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function courseItems()
    {
        return $this->hasMany(EnrollmentCourse::class);
    }

    public function bootcampItems()
    {
        return $this->hasMany(EnrollmentBootcamp::class);
    }

    public function webinarItems()
    {
        return $this->hasMany(EnrollmentWebinar::class);
    }
}
