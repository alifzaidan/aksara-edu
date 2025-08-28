<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class DiscountCode extends Model
{
    use HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $guarded = ['created_at', 'updated_at'];

    protected $casts = [
        'starts_at' => 'datetime',
        'expires_at' => 'datetime',
        'is_active' => 'boolean',
        'applicable_types' => 'array',
        'applicable_ids' => 'array',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    // Relationship dengan discount usages
    public function usages()
    {
        return $this->hasMany(DiscountUsage::class);
    }

    // Check apakah kode masih valid
    public function isValid(): bool
    {
        $now = Carbon::now();

        return $this->is_active
            && $this->starts_at <= $now
            && $this->expires_at >= $now
            && ($this->usage_limit === null || $this->used_count < $this->usage_limit);
    }

    // Check apakah masih bisa digunakan (belum mencapai usage limit)
    public function canBeUsed(): bool
    {
        // Jika tidak ada limit, selalu bisa digunakan
        if ($this->usage_limit === null) {
            return true;
        }

        // Check apakah usage count masih di bawah limit
        return $this->used_count < $this->usage_limit;
    }

    // Check apakah user sudah mencapai limit
    public function canBeUsedByUser(string $userId): bool
    {
        if ($this->usage_limit_per_user === null) {
            return true;
        }

        $userUsageCount = $this->usages()->where('user_id', $userId)->count();
        return $userUsageCount < $this->usage_limit_per_user;
    }

    // Check apakah bisa digunakan untuk produk tertentu
    public function isApplicableToProduct(string $type, string $productId): bool
    {
        // Jika tidak ada pembatasan, berlaku untuk semua
        if (empty($this->applicable_types) && empty($this->applicable_ids)) {
            return true;
        }

        // Check type restriction
        if (!empty($this->applicable_types) && !in_array($type, $this->applicable_types)) {
            return false;
        }

        // Check specific product IDs
        if (!empty($this->applicable_ids)) {
            $productKey = $type . ':' . $productId;
            return in_array($productKey, $this->applicable_ids);
        }

        return true;
    }

    // Hitung diskon
    public function calculateDiscount(int $amount): int
    {
        if ($this->minimum_amount && $amount < $this->minimum_amount) {
            return 0;
        }

        if ($this->type === 'percentage') {
            $discount = ($amount * $this->value) / 100;

            // Apply maximum discount limit
            if ($this->maximum_discount && $discount > $this->maximum_discount) {
                $discount = $this->maximum_discount;
            }

            return (int) $discount;
        }

        // Fixed discount
        return min($this->value, $amount); // Tidak boleh lebih dari total amount
    }

    // Scope untuk kode aktif
    public function scopeActive($query)
    {
        return $query->where('is_active', true)
            ->where('starts_at', '<=', Carbon::now())
            ->where('expires_at', '>=', Carbon::now());
    }

    // Format value untuk display
    public function getFormattedValueAttribute(): string
    {
        if ($this->type === 'percentage') {
            return $this->value . '%';
        }

        return 'Rp ' . number_format($this->value, 0, ',', '.');
    }

    public function incrementUsage(): void
    {
        $this->increment('used_count');
    }
}
