<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use HasUuids;

    protected $guarded = ['created_at', 'updated_at'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function courseItems()
    {
        return $this->hasMany(EnrollmentCourse::class);
    }

    public function bootcampItems()
    {
        return $this->hasMany(EnrollmentBootcamp::class);
    }

    public function webinarItems()
    {
        return $this->hasMany(EnrollmentWebinar::class);
    }

    public function bundleEnrollments()
    {
        return $this->hasMany(EnrollmentBundle::class);
    }

    public function hasBundle()
    {
        return $this->bundleEnrollments()->exists();
    }

    public function discountUsage()
    {
        return $this->hasOne(DiscountUsage::class);
    }

    public function discountCode()
    {
        return $this->hasOneThrough(DiscountCode::class, DiscountUsage::class, 'invoice_id', 'id', 'id', 'discount_code_id');
    }

    protected function casts(): array
    {
        return [
            'paid_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    public function getInvoiceType(): string
    {
        if ($this->hasBundle()) {
            return 'bundle';
        }

        if ($this->courseItems->count() > 0) {
            return 'course';
        }

        if ($this->bootcampItems->count() > 0) {
            return 'bootcamp';
        }

        if ($this->webinarItems->count() > 0) {
            return 'webinar';
        }

        return 'unknown';
    }

    public function getDisplayItems()
    {
        if ($this->hasBundle()) {
            return $this->bundleEnrollments()->with('bundle.bundleItems.bundleable')->get();
        }

        return [
            'courses' => $this->courseItems()->with('course')->get(),
            'bootcamps' => $this->bootcampItems()->with('bootcamp')->get(),
            'webinars' => $this->webinarItems()->with('webinar')->get(),
        ];
    }

    public function getAllEnrollmentItems()
    {
        $items = collect();

        // Direct enrollments
        $items = $items->merge($this->courseItems()->with('course')->get()->map(function ($item) {
            return [
                'type' => 'course',
                'enrollment' => $item,
                'item' => $item->course,
            ];
        }));

        $items = $items->merge($this->bootcampItems()->with('bootcamp')->get()->map(function ($item) {
            return [
                'type' => 'bootcamp',
                'enrollment' => $item,
                'item' => $item->bootcamp,
            ];
        }));

        $items = $items->merge($this->webinarItems()->with('webinar')->get()->map(function ($item) {
            return [
                'type' => 'webinar',
                'enrollment' => $item,
                'item' => $item->webinar,
            ];
        }));

        // Bundle items
        foreach ($this->bundleEnrollments as $bundleEnrollment) {
            $bundle = $bundleEnrollment->bundle()->with('bundleItems.bundleable')->first();
            if ($bundle) {
                foreach ($bundle->bundleItems as $bundleItem) {
                    $items->push([
                        'type' => $bundleItem->getTypeSlug(),
                        'enrollment' => $bundleEnrollment,
                        'item' => $bundleItem->bundleable,
                        'bundle' => $bundle,
                    ]);
                }
            }
        }

        return $items;
    }

    public function hasProduct(string $type, string $productId): bool
    {
        switch ($type) {
            case 'course':
                return $this->courseItems()->where('course_id', $productId)->exists();

            case 'bootcamp':
                return $this->bootcampItems()->where('bootcamp_id', $productId)->exists();

            case 'webinar':
                return $this->webinarItems()->where('webinar_id', $productId)->exists();

            case 'bundle':
                return $this->bundleEnrollments()->where('bundle_id', $productId)->exists();

            default:
                return false;
        }
    }

    public function getTotalItemsCount(): int
    {
        $count = 0;

        $count += $this->courseItems->count();
        $count += $this->bootcampItems->count();
        $count += $this->webinarItems->count();

        // Count items from bundles
        foreach ($this->bundleEnrollments as $bundleEnrollment) {
            if ($bundleEnrollment->bundle) {
                $count += $bundleEnrollment->bundle->bundleItems->count();
            }
        }

        return $count;
    }

    public function isExpired(): bool
    {
        if (!$this->expires_at) {
            return false;
        }

        return $this->status === 'pending' && now()->gt($this->expires_at);
    }

    public function getStatusColor(): string
    {
        return match ($this->status) {
            'paid' => 'green',
            'pending' => 'yellow',
            'failed' => 'red',
            'expired' => 'gray',
            default => 'gray',
        };
    }
}
