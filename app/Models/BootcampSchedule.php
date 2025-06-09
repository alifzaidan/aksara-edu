<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class BootcampSchedule extends Model
{
    use HasUuids;

    protected $guarded = ['created_at', 'updated_at'];

    public function bootcamp()
    {
        return $this->belongsTo(Bootcamp::class, 'bootcamp_id');
    }
}
