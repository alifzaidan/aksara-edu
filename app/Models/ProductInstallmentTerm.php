<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ProductInstallmentTerm extends Model
{
    use HasUuids;

    protected $guarded = ['created_at', 'updated_at'];

    protected $casts = [
        'due_date' => 'date',
        'amount' => 'integer',
    ];

    public function termable()
    {
        return $this->morphTo();
    }
}
