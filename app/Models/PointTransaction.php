<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class PointTransaction extends Model
{
    use HasUuids;

    protected $guarded = ['created_at', 'updated_at'];

    /**
     * Get the user who owns the transaction.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the parent reference model (e.g., Invoice).
     */
    public function reference()
    {
        return $this->morphTo();
    }
}
