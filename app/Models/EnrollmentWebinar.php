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
        // Must have webinar and certificate enabled
        if (!$this->webinar || !$this->webinar->has_certificate) {
            return false;
        }

        // Must be paid (or fully paid for installment)
        if (!$this->invoice || !$this->invoice->isFullyPaid()) {
            return false;
        }

        // If requires review is disabled, can download immediately after payment
        if (!$this->webinar->requires_review) {
            return true;
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

    /**
     * Get missing requirements for certificate
     */
    public function getMissingRequirements(): array
    {
        $missing = [];

        if (!$this->webinar || !$this->webinar->has_certificate) {
            $missing[] = 'Webinar ini tidak menyediakan sertifikat';
            return $missing;
        }

        if (!$this->invoice || !$this->invoice->isFullyPaid()) {
            $missing[] = 'Selesaikan pembayaran';
        }

        if ($this->webinar->requires_review) {
            if (is_null($this->attendance_proof) || !$this->attendance_verified) {
                $missing[] = 'Lengkapi bukti kehadiran yang terverifikasi';
            }

            if (is_null($this->rating) || is_null($this->review)) {
                $missing[] = 'Berikan rating dan review';
            }
        }

        return $missing;
    }
}
