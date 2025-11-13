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
}
