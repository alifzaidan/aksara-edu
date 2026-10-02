<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Webinar extends Model
{
    use HasUuids;

    protected function groupUrl(): Attribute
    {
        return Attribute::make(
            get: fn (?string $value) => $value ? (preg_match('~^https?://~i', trim($value)) ? trim($value) : 'https://' . trim($value)) : $value,
            set: fn (?string $value) => $value ? (preg_match('~^https?://~i', trim($value)) ? trim($value) : 'https://' . trim($value)) : $value,
        );
    }

    protected $guarded = ['created_at', 'updated_at'];

    protected $appends = ['next_step_product'];

    protected $casts = [
        'has_certificate' => 'boolean',
        'requires_review' => 'boolean',
        'installment_enabled' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function mentor()
    {
        return $this->user();
    }

    public function category()
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    public function tools()
    {
        return $this->belongsToMany(Tool::class, 'webinar_tool');
    }

    public function certificate()
    {
        return $this->hasOne(Certificate::class);
    }

    public function bundleItems()
    {
        return $this->morphMany(BundleItem::class, 'bundleable');
    }

    public function isInBundle(): bool
    {
        return $this->bundleItems()->whereHas('bundle', function ($q) {
            $q->where('status', 'published');
        })->exists();
    }

    public function installmentTerms()
    {
        return $this->morphMany(ProductInstallmentTerm::class, 'termable')->orderBy('term_number');
    }

    public function getNextStepProductAttribute()
    {
        if (!$this->next_step_type || !$this->next_step_id) {
            return null;
        }

        $item = null;
        $url = null;
        $typeLabel = null;
        $adminUrl = null;

        if ($this->next_step_type === 'webinar') {
            $item = Webinar::where('id', $this->next_step_id)->select('id', 'title', 'slug', 'thumbnail', 'price', 'strikethrough_price', 'batch')->first();
            if ($item) {
                $url = route('webinar.detail', $item->slug);
                $adminUrl = route('webinars.show', $item->id);
                $typeLabel = 'Webinar';
            }
        } elseif ($this->next_step_type === 'bootcamp') {
            $item = Bootcamp::where('id', $this->next_step_id)->select('id', 'title', 'slug', 'thumbnail', 'price', 'strikethrough_price', 'batch')->first();
            if ($item) {
                $url = route('bootcamp.detail', $item->slug);
                $adminUrl = route('bootcamps.show', $item->id);
                $typeLabel = 'Bootcamp';
            }
        } elseif ($this->next_step_type === 'certification_program') {
            $item = CertificationProgram::where('id', $this->next_step_id)->select('id', 'title', 'slug', 'thumbnail', 'price', 'strikethrough_price')->first();
            if ($item) {
                $url = route('certification-programs.detail', $item->slug);
                $adminUrl = route('certification-programs.show', $item->id);
                $typeLabel = 'Program Sertifikasi';
            }
        }

        if (!$item) {
            return null;
        }

        return [
            'id' => $item->id,
            'title' => $item->title,
            'slug' => $item->slug,
            'thumbnail' => $item->thumbnail,
            'price' => $item->price,
            'strikethrough_price' => $item->strikethrough_price ?? null,
            'batch' => $item->batch ?? null,
            'type' => $this->next_step_type,
            'type_label' => $typeLabel,
            'url' => $url,
            'admin_url' => $adminUrl,
        ];
    }

}
