<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Promotion extends Model
{
    protected $fillable = [
        'promotion_flyer',
        'start_date',
        'end_date',
        'is_active',
        'url_redirect',
    ];
}