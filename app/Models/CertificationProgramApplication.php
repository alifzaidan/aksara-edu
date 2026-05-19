<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class CertificationProgramApplication extends Model
{
    use HasUuids;

    protected $guarded = ['created_at', 'updated_at'];

    protected $casts = [
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
    ];

    public function certificationProgram()
    {
        return $this->belongsTo(CertificationProgram::class, 'certification_program_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
