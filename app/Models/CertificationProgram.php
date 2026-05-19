<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class CertificationProgram extends Model
{
    use HasUuids;

    protected $guarded = ['created_at', 'updated_at'];

    protected $casts = [
        'registration_deadline' => 'datetime',
        'socialization_registration_deadline' => 'datetime',
        'document_required' => 'boolean',
        'strikethrough_price' => 'integer',
        'price' => 'integer',
        'scholarship_price' => 'integer',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    public function mentors()
    {
        return $this->belongsToMany(User::class, 'certification_program_mentors')->withTimestamps();
    }

    public function schedules()
    {
        return $this->hasMany(CertificationProgramSchedule::class);
    }

    public function socializationSchedules()
    {
        return $this->hasMany(CertificationProgramSocializationSchedule::class);
    }

    public function applications()
    {
        return $this->hasMany(CertificationProgramApplication::class);
    }

    public function scholarshipApplications()
    {
        return $this->hasMany(CertificationProgramScholarshipApplication::class);
    }

    public function enrollments()
    {
        return $this->hasMany(EnrollmentCertificationProgram::class);
    }
}
