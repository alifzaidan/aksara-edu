<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Certificate extends Model
{
    use HasUuids;

    protected $guarded = ['created_at', 'updated_at'];

    protected $casts = [
        'issued_date' => 'date'
    ];

    public function design()
    {
        return $this->belongsTo(CertificateDesign::class, 'design_id');
    }

    public function sign()
    {
        return $this->belongsTo(CertificateSign::class, 'sign_id');
    }

    public function participants()
    {
        return $this->hasMany(CertificateParticipant::class);
    }

    public function course()
    {
        return $this->belongsTo(Course::class, 'course_id');
    }

    public function bootcamp()
    {
        return $this->belongsTo(Bootcamp::class, 'bootcamp_id');
    }

    public function webinar()
    {
        return $this->belongsTo(Webinar::class, 'webinar_id');
    }
}
