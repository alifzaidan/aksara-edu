<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class CertificateParticipant extends Model
{
    use HasUuids;

    protected $guarded = ['created_at', 'updated_at'];

    protected $casts = [
        'grades' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function certificate()
    {
        return $this->belongsTo(Certificate::class);
    }

    // Generate certificate code otomatis
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->certificate_code)) {
                $model->certificate_code = self::generateCertificateCode();
            }

            if (empty($model->certificate_number)) {
                $model->certificate_number = self::getNextCertificateNumber($model->certificate_id);
            }
        });
    }

    private static function generateCertificateCode()
    {
        do {
            $year = date('y');
            $randomString = self::generateRandomString(4);
            $code = 'AKS-' . $year . $randomString;
        } while (self::where('certificate_code', $code)->exists());

        return $code;
    }

    private static function generateRandomString($length = 6)
    {
        $characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        $charactersLength = strlen($characters);
        $randomString = '';

        for ($i = 0; $i < $length; $i++) {
            $randomString .= $characters[rand(0, $charactersLength - 1)];
        }

        return $randomString;
    }

    private static function getNextCertificateNumber($certificateId)
    {
        return self::where('certificate_id', $certificateId)->count() + 1;
    }

    /**
     * Determine if this participant is eligible to view/download the certificate
     */
    public function isEligible(): bool
    {
        $certificate = $this->certificate;
        if (!$certificate) {
            return false;
        }

        // 1. Course Certificate
        if ($certificate->course_id) {
            $enrollment = EnrollmentCourse::with(['invoice'])
                ->where('course_id', $certificate->course_id)
                ->whereHas('invoice', function ($query) {
                    $query->where('user_id', $this->user_id);
                })->first();
            
            return $enrollment && $enrollment->canDownloadCertificate();
        }

        // 2. Webinar Certificate
        if ($certificate->webinar_id) {
            $enrollment = EnrollmentWebinar::with(['invoice'])
                ->where('webinar_id', $certificate->webinar_id)
                ->whereHas('invoice', function ($query) {
                    $query->where('user_id', $this->user_id);
                })->first();

            return $enrollment && $enrollment->canDownloadCertificate();
        }

        // 3. Bootcamp Certificate
        if ($certificate->bootcamp_id) {
            $enrollment = EnrollmentBootcamp::with(['invoice', 'bootcamp.schedules', 'attendances'])
                ->where('bootcamp_id', $certificate->bootcamp_id)
                ->whereHas('invoice', function ($query) {
                    $query->where('user_id', $this->user_id);
                })->first();

            return $enrollment && $enrollment->canDownloadCertificate();
        }

        // Independent or other certificates
        return true;
    }
}
