<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Webinar extends Model
{
    use HasUuids;

    protected $guarded = ['created_at', 'updated_at'];

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
}
