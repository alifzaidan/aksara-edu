<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Bootcamp extends Model
{
    use HasUuids;

    protected $guarded = ['created_at', 'updated_at'];

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
}
