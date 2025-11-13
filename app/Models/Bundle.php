<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Bundle extends Model
{
    use HasUuids;

    protected $guarded = ['created_at', 'updated_at'];

    protected $casts = [
        'registration_deadline' => 'datetime',
    ];

    protected $appends = ['bundle_items_count'];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($bundle) {
            if (empty($bundle->slug)) {
                $bundle->slug = Str::slug($bundle->title);
            }
            if (empty($bundle->bundle_url)) {
                $bundle->bundle_url = url('/bundle/' . $bundle->slug);
            }
        });

        static::updating(function ($bundle) {
            if ($bundle->isDirty('title')) {
                $bundle->slug = Str::slug($bundle->title);
                $bundle->bundle_url = url('/bundle/' . $bundle->slug);
            }
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function bundleItems()
    {
        return $this->hasMany(BundleItem::class)->orderBy('order');
    }

    public function enrollments()
    {
        return $this->hasMany(EnrollmentBundle::class);
    }

    /**
     * Get bundle items count attribute
     */
    public function getBundleItemsCountAttribute()
    {
        // Check if it's already loaded by withCount
        if (array_key_exists('bundle_items_count', $this->attributes)) {
            return $this->attributes['bundle_items_count'];
        }

        // Otherwise, check if relation is loaded
        if ($this->relationLoaded('bundleItems')) {
            return $this->bundleItems->count();
        }

        // Last resort: query the database
        return $this->bundleItems()->count();
    }

    /**
     * Check if bundle is available for purchase
     */
    public function isAvailable(): bool
    {
        if ($this->status !== 'published') {
            return false;
        }

        if ($this->registration_deadline && now()->gt($this->registration_deadline)) {
            return false;
        }

        return true;
    }

    /**
     * Check if user already purchased this bundle
     */
    public function isPurchasedByUser($userId): bool
    {
        return $this->enrollments()
            ->whereHas('invoice', function ($query) use ($userId) {
                $query->where('user_id', $userId)
                    ->where('status', 'paid');
            })
            ->exists();
    }

    /**
     * Calculate total original price from all items
     */
    public function calculateOriginalPrice(): int
    {
        return $this->bundleItems->sum('price');
    }

    /**
     * Calculate discount amount
     */
    public function calculateDiscountAmount(): int
    {
        return $this->calculateOriginalPrice() - $this->price;
    }

    /**
     * Calculate discount percentage
     */
    public function calculateDiscountPercentage(): int
    {
        $originalPrice = $this->calculateOriginalPrice();

        if ($originalPrice <= 0) {
            return 0;
        }

        $discount = $originalPrice - $this->price;
        return (int) round(($discount / $originalPrice) * 100);
    }

    /**
     * Get grouped items by type
     */
    public function getGroupedItems()
    {
        $items = $this->bundleItems()->with('bundleable')->get();

        return [
            'courses' => $items->where('bundleable_type', Course::class)->pluck('bundleable'),
            'bootcamps' => $items->where('bundleable_type', Bootcamp::class)->pluck('bundleable'),
            'webinars' => $items->where('bundleable_type', Webinar::class)->pluck('bundleable'),
        ];
    }

    /**
     * Get all items count
     */
    public function getTotalItemsCount(): int
    {
        return $this->bundleItems()->count();
    }
}
