<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class CertificationProgram extends Model
{
    use HasUuids;

    protected function groupUrl(): Attribute
    {
        return Attribute::make(
            get: fn (?string $value) => $value ? (preg_match('~^https?://~i', trim($value)) ? trim($value) : 'https://' . trim($value)) : $value,
            set: fn (?string $value) => $value ? (preg_match('~^https?://~i', trim($value)) ? trim($value) : 'https://' . trim($value)) : $value,
        );
    }

    protected function socializationGroupUrl(): Attribute
    {
        return Attribute::make(
            get: fn (?string $value) => $value ? (preg_match('~^https?://~i', trim($value)) ? trim($value) : 'https://' . trim($value)) : $value,
            set: fn (?string $value) => $value ? (preg_match('~^https?://~i', trim($value)) ? trim($value) : 'https://' . trim($value)) : $value,
        );
    }

    protected $guarded = ['created_at', 'updated_at'];

    protected $casts = [
        'installment_enabled' => 'boolean',
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

    public function installmentTerms()
    {
        return $this->morphMany(ProductInstallmentTerm::class, 'termable')->orderBy('term_number');
    }
}
