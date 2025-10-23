<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Course extends Model
{
    use HasUuids;

    protected $guarded = ['created_at', 'updated_at'];

    public function images()
    {
        return $this->hasMany(CourseImage::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function category()
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    public function tools()
    {
        return $this->belongsToMany(Tool::class, 'course_tool');
    }

    public function modules()
    {
        return $this->hasMany(Module::class);
    }

    public function enrollmentCourses()
    {
        return $this->hasMany(EnrollmentCourse::class);
    }

    public function certificate()
    {
        return $this->hasOne(Certificate::class);
    }

    public function courseRatings()
    {
        return $this->hasMany(CourseRating::class);
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
