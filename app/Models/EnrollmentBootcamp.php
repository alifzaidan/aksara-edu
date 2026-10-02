<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class EnrollmentBootcamp extends Model
{
    use HasUuids;

    protected $guarded = ['created_at', 'updated_at'];

    protected $casts = [
        'completed_at' => 'datetime',
        'reviewed_at' => 'datetime',
        'submission_verified' => 'boolean',
    ];

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    public function bootcamp()
    {
        return $this->belongsTo(Bootcamp::class);
    }

    public function attendances()
    {
        return $this->hasMany(BootcampAttendance::class);
    }

    public function freeRequirement()
    {
        return $this->hasOne(FreeEnrollmentRequirement::class, 'enrollment_id')
            ->where('enrollment_type', 'bootcamp');
    }

    /**
     * Check if all requirements are completed for certificate
     */
    public function canDownloadCertificate(): bool
    {
        // Must have bootcamp and certificate enabled
        if (!$this->bootcamp || !$this->bootcamp->has_certificate) {
            return false;
        }

        // Must be paid (or fully paid for installment)
        if (!$this->invoice || !$this->invoice->isFullyPaid()) {
            return false;
        }

        // If requires review is disabled, can download immediately after payment
        if (!$this->bootcamp->requires_review) {
            return true;
        }

        // Must have all attendances verified
        $totalSchedules = $this->bootcamp->schedules ? $this->bootcamp->schedules->count() : 0;
        $verifiedAttendances = $this->attendances ? $this->attendances->where('verified', true)->count() : 0;

        if ($verifiedAttendances < $totalSchedules) {
            return false;
        }

        // If bootcamp has submission, must be submitted and verified
        if ($this->bootcamp->has_submission_link) {
            if (!$this->submission || !$this->submission_verified) {
                return false;
            }
        }

        // Must have rating and review
        if (!$this->rating || !$this->review) {
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

        if (!$this->bootcamp || !$this->bootcamp->has_certificate) {
            $missing[] = 'Bootcamp ini tidak menyediakan sertifikat';
            return $missing;
        }

        if (!$this->invoice || !$this->invoice->isFullyPaid()) {
            $missing[] = 'Selesaikan pembayaran';
        }

        if ($this->bootcamp->requires_review) {
            $totalSchedules = $this->bootcamp->schedules ? $this->bootcamp->schedules->count() : 0;
            $verifiedAttendances = $this->attendances ? $this->attendances->where('verified', true)->count() : 0;

            if ($verifiedAttendances < $totalSchedules) {
                $missing[] = "Lengkapi bukti kehadiran ({$verifiedAttendances}/{$totalSchedules} terverifikasi)";
            }

            if ($this->bootcamp->has_submission_link) {
                if (!$this->submission) {
                    $missing[] = 'Upload link submission project';
                } elseif (!$this->submission_verified) {
                    $missing[] = 'Menunggu verifikasi submission';
                }
            }

            if (!$this->rating || !$this->review) {
                $missing[] = 'Berikan rating dan review';
            }
        }

        return $missing;
    }
}
