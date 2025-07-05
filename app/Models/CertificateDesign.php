<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class CertificateDesign extends Model
{
    use HasUuids;

    protected $guarded = ['created_at', 'updated_at'];

    public function certificates()
    {
        return $this->hasMany(Certificate::class, 'design_id');
    }
}
