<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    use HasUuids;

    protected $guarded = ['created_at', 'updated_at'];

    public function courses()
    {
        return $this->hasMany(Course::class);
    }

    public function partnershipProducts()
    {
        return $this->hasMany(PartnershipProduct::class);
    }

    public function articles()
    {
        return $this->hasMany(Article::class);
    }

    public function bootcamps()
    {
        return $this->hasMany(Bootcamp::class);
    }

    public function webinars()
    {
        return $this->hasMany(Webinar::class);
    }
}
