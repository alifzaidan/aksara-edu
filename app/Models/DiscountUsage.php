<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class DiscountUsage extends Model
{
    use HasUuids;

    protected $fillable = [
        'discount_code_id',
        'user_id',
        'invoice_id',
        'discount_amount',
    ];

    public function discountCode()
    {
        return $this->belongsTo(DiscountCode::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }
}
