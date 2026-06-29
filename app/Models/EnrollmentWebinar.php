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

    /**
     * Check if all requirements are completed for certificate
     */
    public function canDownloadCertificate(): bool
    {
        if (!$this->invoice || $this->invoice->status !== 'paid') {
            return false;
        }

        // Must have attendance proof and verified
        if (is_null($this->attendance_proof) || !$this->attendance_verified) {
            return false;
        }

        // Must have rating and review
        if (is_null($this->rating) || is_null($this->review)) {
            return false;
        }

        return true;
    }
}
