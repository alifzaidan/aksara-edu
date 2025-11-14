<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class BundleItem extends Model
{
    use HasUuids;

    protected $guarded = ['created_at', 'updated_at'];

    public function bundle()
    {
        return $this->belongsTo(Bundle::class);
    }

    public function bundleable()
    {
        return $this->morphTo();
    }

    /**
     * Get item type name
     */
    public function getTypeName(): string
    {
        return match ($this->bundleable_type) {
            Course::class => 'Kelas Online',
            Bootcamp::class => 'Bootcamp',
            Webinar::class => 'Webinar',
            default => 'Unknown'
        };
    }

    /**
     * Get item type slug
     */
    public function getTypeSlug(): string
    {
        return match ($this->bundleable_type) {
            Course::class => 'course',
            Bootcamp::class => 'bootcamp',
            Webinar::class => 'webinar',
            default => 'unknown'
        };
    }

    public function isAvailable(): bool
    {
        if (!$this->bundleable) {
            return false;
        }

        if (property_exists($this->bundleable, 'status') && $this->bundleable->status !== 'published') {
            return false;
        }

        return true;
    }
}
