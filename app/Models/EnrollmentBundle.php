<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class EnrollmentBundle extends Model
{
    use HasUuids;

    protected $guarded = ['created_at', 'updated_at'];

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    public function bundle()
    {
        return $this->belongsTo(Bundle::class);
    }

    /**
     * Get user from invoice
     */
    public function user()
    {
        return $this->invoice->user;
    }
}
