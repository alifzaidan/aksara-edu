<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class PartnershipProduct extends Model
{
    use HasUuids;

    protected $guarded = ['created_at', 'updated_at'];

    protected $casts = [
        'registration_deadline' => 'datetime',
        'event_deadline' => 'datetime',
        'schedule_days' => 'array',
        'strikethrough_price' => 'integer',
        'price' => 'integer',
        'duration_days' => 'integer',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function clicks()
    {
        return $this->hasMany(PartnershipProductClick::class);
    }

    public function getClickCountAttribute(): int
    {
        return $this->clicks()->count();
    }

    public function getClickCountForPeriod($days = 30): int
    {
        return $this->clicks()
            ->where('created_at', '>=', now()->subDays($days))
            ->count();
    }

    public function getUniqueClickCountAttribute(): int
    {
        return $this->clicks()
            ->whereNotNull('user_id')
            ->distinct('user_id')
            ->count('user_id');
    }

    public function getFormattedPriceAttribute(): string
    {
        return 'Rp ' . number_format($this->price, 0, ',', '.');
    }

    public function getFormattedStrikethroughPriceAttribute(): string
    {
        return 'Rp ' . number_format($this->strikethrough_price, 0, ',', '.');
    }

    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    public function scopePopular($query, $days = 30)
    {
        return $query->withCount(['clicks' => function ($q) use ($days) {
            $q->where('created_at', '>=', now()->subDays($days));
        }])->orderBy('clicks_count', 'desc');
    }
}
