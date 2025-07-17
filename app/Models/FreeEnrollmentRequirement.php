<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class FreeEnrollmentRequirement extends Model
{
    use HasUuids;

    protected $fillable = [
        'enrollment_id',
        'enrollment_type',
        'ig_follow_proof',
        'tag_friend_proof',
        'tiktok_follow_proof',
    ];

    public function enrollmentWebinar()
    {
        return $this->belongsTo(EnrollmentWebinar::class, 'enrollment_id')
            ->where('enrollment_type', 'webinar');
    }

    public function enrollmentBootcamp()
    {
        return $this->belongsTo(EnrollmentBootcamp::class, 'enrollment_id')
            ->where('enrollment_type', 'bootcamp');
    }

    public function getEnrollment()
    {
        switch ($this->enrollment_type) {
            case 'webinar':
                return $this->enrollmentWebinar;
            case 'bootcamp':
                return $this->enrollmentBootcamp;
            default:
                return null;
        }
    }

    public function getUser()
    {
        $enrollment = $this->getEnrollment();
        return $enrollment ? $enrollment->invoice->user : null;
    }
}
