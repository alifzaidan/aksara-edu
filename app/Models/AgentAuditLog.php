<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AgentAuditLog extends Model
{
    public const UPDATED_AT = null;

    protected $guarded = ['id'];

    protected $casts = [
        'query' => 'array',
        'created_at' => 'datetime',
    ];
}
