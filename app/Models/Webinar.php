<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Webinar extends Model
{
    use HasUuids;

    protected function groupUrl(): Attribute
    {
        return Attribute::make(
            get: fn (?string $value) => $value ? (preg_match('~^https?://~i', trim($value)) ? trim($value) : 'https://' . trim($value)) : $value,
            set: fn (?string $value) => $value ? (preg_match('~^https?://~i', trim($value)) ? trim($value) : 'https://' . trim($value)) : $value,
        );
    }

    protected $guarded = ['created_at', 'updated_at'];

    protected $casts = [
        'installment_enabled' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function mentor()
    {
        return $this->user();
    }

    public function category()
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    public function tools()
    {
        return $this->belongsToMany(Tool::class, 'webinar_tool');
    }

    public function certificate()
    {
        return $this->hasOne(Certificate::class);
    }

    public function bundleItems()
    {
        return $this->morphMany(BundleItem::class, 'bundleable');
    }

    public function isInBundle(): bool
    {
        return $this->bundleItems()->whereHas('bundle', function ($q) {
            $q->where('status', 'published');
        })->exists();
    }

    public function installmentTerms()
    {
        return $this->morphMany(ProductInstallmentTerm::class, 'termable')->orderBy('term_number');
    }
}
