<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class AffiliateEarning extends Model
{
    use HasUuids;

    protected $guarded = ['created_at', 'updated_at'];

    public function affiliate()
    {
        return $this->belongsTo(User::class, 'affiliate_user_id');
    }

    public function invoice()
    {
        return $this->belongsTo(Invoice::class, 'invoice_id');
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }
}
