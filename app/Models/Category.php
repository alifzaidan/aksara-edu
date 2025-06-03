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
}
