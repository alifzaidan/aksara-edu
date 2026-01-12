<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class PartnershipProductScholarship extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $guarded = ['created_at', 'updated_at'];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    public function partnershipProduct()
    {
        return $this->belongsTo(PartnershipProduct::class);
    }
}
