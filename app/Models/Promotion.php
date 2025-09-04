<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Promotion extends Model
{
    use HasUuids;

    protected $fillable = [
        'promotion_flyer',
        'start_date',
        'end_date',
        'is_active',
        'url_redirect',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'is_active' => 'boolean',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', true)
            ->where('start_date', '<=', now())
            ->where('end_date', '>=', now());
    }

    public function isValidNow(): bool
    {
        $now = now();
        return $this->is_active &&
            $this->start_date <= $now &&
            $this->end_date >= $now;
    }
}
