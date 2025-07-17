<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class EnrollmentWebinar extends Model
{
    use HasUuids;

    protected $guarded = ['created_at', 'updated_at'];

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    public function webinar()
    {
        return $this->belongsTo(Webinar::class);
    }

    public function freeRequirement()
    {
        return $this->hasOne(FreeEnrollmentRequirement::class, 'enrollment_id')
            ->where('enrollment_type', 'webinar');
    }
}
