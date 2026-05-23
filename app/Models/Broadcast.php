<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Broadcast extends Model
{
    use HasUuids;

    protected $guarded = ['created_at', 'updated_at'];

    protected function casts(): array
    {
        return [
            'filters' => 'array',
            'last_sent_at' => 'datetime',
        ];
    }
}
