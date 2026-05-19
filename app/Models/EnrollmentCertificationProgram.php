<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class EnrollmentCertificationProgram extends Model
{
    use HasUuids;

    protected $guarded = ['created_at', 'updated_at'];

    protected $casts = [
        'completed_at' => 'datetime',
        'is_scholarship' => 'boolean',
    ];

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    public function certificationProgram()
    {
        return $this->belongsTo(CertificationProgram::class, 'certification_program_id');
    }
}
