<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Bootcamp extends Model
{
    use HasUuids;

    protected $guarded = ['created_at', 'updated_at'];

    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'registration_deadline' => 'datetime',
        'has_submission_link' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function category()
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    public function schedules()
    {
        return $this->hasMany(BootcampSchedule::class);
    }

    public function tools()
    {
        return $this->belongsToMany(Tool::class, 'bootcamp_tool');
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
