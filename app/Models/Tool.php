<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Tool extends Model
{
    use HasUuids;

    protected $guarded = ['created_at', 'updated_at'];

    public function courses()
    {
        return $this->belongsToMany(Course::class);
    }
}
