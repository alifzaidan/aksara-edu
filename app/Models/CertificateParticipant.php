<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class CertificateParticipant extends Model
{
    use HasUuids;

    protected $guarded = ['created_at', 'updated_at'];

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
}
