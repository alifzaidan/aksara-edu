<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use HasUuids;

    protected $guarded = ['created_at', 'updated_at'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function courseItems()
    {
        return $this->hasMany(EnrollmentCourse::class);
    }

    public function bootcampItems()
    {
        return $this->hasMany(EnrollmentBootcamp::class);
    }

    public function webinarItems()
    {
        return $this->hasMany(EnrollmentWebinar::class);
    }

    public function privateItems()
    {
        return $this->hasMany(EnrollmentPrivate::class);
    }

    public function certificationProgramItems()
    {
        return $this->hasMany(EnrollmentCertificationProgram::class);
    }

    public function bundleEnrollments()
    {
        return $this->hasMany(EnrollmentBundle::class);
    }

    public function hasBundle()
    {
        return $this->bundleEnrollments()->exists();
    }

    public function discountUsage()
    {
        return $this->hasOne(DiscountUsage::class);
    }

    public function discountCode()
    {
        return $this->hasOneThrough(DiscountCode::class, DiscountUsage::class, 'invoice_id', 'id', 'id', 'discount_code_id');
    }

    protected function casts(): array
    {
        return [
            'paid_at' => 'datetime',
            'expires_at' => 'datetime',
            'installment_due_date' => 'datetime',
            'access_suspended_at' => 'datetime',
            'is_installment' => 'boolean',
        ];
    }

    // ==================== Installment Relations ====================

    public function parentInvoice()
    {
        return $this->belongsTo(Invoice::class, 'parent_invoice_id');
    }

    /**
     * Relasi dari invoice induk ke semua invoice anak (termin)
     */
    public function installmentTerms()
    {
        return $this->hasMany(Invoice::class, 'parent_invoice_id')->orderBy('installment_number');
    }

    public function installmentTerm()
    {
        return $this->belongsTo(ProductInstallmentTerm::class, 'installment_term_id');
    }

    // ==================== Installment Helpers ====================

    /**
     * Scope untuk invoice yang sudah dibeli oleh user (lunas atau cicilan dengan DP terbayar)
     * Termasuk yang aksesnya sedang dibekukan (agar tetap tampil di dashboard/daftar produk user)
     */
    public function scopePurchasedByUser($query, $userId)
    {
        return $query->where('user_id', $userId)
            ->where(function ($q) {
                $q->whereIn('status', ['paid', 'completed'])
                    ->orWhere(function ($iq) {
                        $iq->where('status', 'installment_pending')
                            ->whereHas('installmentTerms', function ($tq) {
                                $tq->where('installment_number', 1)->where('status', 'paid');
                            });
                    });
            });
    }

    /**
     * Scope untuk invoice yang aktif dan dapat diakses materinya (lunas, atau cicilan dengan DP terbayar & tidak dibekukan)
     */
    public function scopeAccessibleForUser($query, $userId)
    {
        return $query->where('user_id', $userId)
            ->where(function ($q) {
                $q->whereIn('status', ['paid', 'completed'])
                    ->orWhere(function ($iq) {
                        $iq->where('status', 'installment_pending')
                            ->whereNull('access_suspended_at')
                            ->whereHas('installmentTerms', function ($tq) {
                                $tq->where('installment_number', 1)->where('status', 'paid');
                            });
                    });
            });
    }

    /**
     * Cek apakah semua termin cicilan sudah lunas
     */
    public function isFullyPaid(): bool
    {
        if (!$this->is_installment) {
            return $this->status === 'paid';
        }
        return $this->installmentTerms()->where('status', '!=', 'paid')->doesntExist();
    }

    /**
     * Jumlah termin yang sudah dibayar
     */
    public function paidTermsCount(): int
    {
        return $this->installmentTerms()->where('status', 'paid')->count();
    }

    /**
     * Invoice anak termin berikutnya yang belum dibayar
     */
    public function nextUnpaidTerm(): ?Invoice
    {
        return $this->installmentTerms()->where('status', 'pending')->orderBy('installment_number')->first();
    }

    /**
     * Cek apakah akses sedang dibekukan
     */
    public function isAccessSuspended(): bool
    {
        return !is_null($this->access_suspended_at);
    }

    /**
     * Cek apakah ini invoice induk cicilan
     */
    public function isInstallmentParent(): bool
    {
        return $this->is_installment && is_null($this->parent_invoice_id);
    }

    /**
     * Cek apakah ini invoice anak (termin cicilan)
     */
    public function isInstallmentChild(): bool
    {
        return !is_null($this->parent_invoice_id);
    }

    public function getInvoiceType(): string
    {
        if ($this->hasBundle()) {
            return 'bundle';
        }

        if ($this->courseItems->count() > 0) {
            return 'course';
        }

        if ($this->bootcampItems->count() > 0) {
            return 'bootcamp';
        }

        if ($this->webinarItems->count() > 0) {
            return 'webinar';
        }

        if ($this->privateItems->count() > 0) {
            return 'private';
        }

        if ($this->certificationProgramItems->count() > 0) {
            return 'certification_program';
        }

        return 'unknown';
    }

    public function getDisplayItems()
    {
        if ($this->hasBundle()) {
            return $this->bundleEnrollments()->with('bundle.bundleItems.bundleable')->get();
        }

        return [
            'courses' => $this->courseItems()->with('course')->get(),
            'bootcamps' => $this->bootcampItems()->with('bootcamp')->get(),
            'webinars' => $this->webinarItems()->with('webinar')->get(),
            'privates' => $this->privateItems()->with('privateClass', 'privateClassSchedule')->get(),
            'certification_programs' => $this->certificationProgramItems()->with('certificationProgram')->get(),
        ];
    }

    public function getAllEnrollmentItems()
    {
        $items = collect();

        // Direct enrollments
        $items = $items->merge($this->courseItems()->with('course')->get()->map(function ($item) {
            return [
                'type' => 'course',
                'enrollment' => $item,
                'item' => $item->course,
            ];
        }));

        $items = $items->merge($this->bootcampItems()->with('bootcamp')->get()->map(function ($item) {
            return [
                'type' => 'bootcamp',
                'enrollment' => $item,
                'item' => $item->bootcamp,
            ];
        }));

        $items = $items->merge($this->webinarItems()->with('webinar')->get()->map(function ($item) {
            return [
                'type' => 'webinar',
                'enrollment' => $item,
                'item' => $item->webinar,
            ];
        }));

        $items = $items->merge($this->privateItems()->with('privateClass', 'privateClassSchedule')->get()->map(function ($item) {
            return [
                'type' => 'private',
                'enrollment' => $item,
                'item' => $item->privateClass,
            ];
        }));

        $items = $items->merge($this->certificationProgramItems()->with('certificationProgram')->get()->map(function ($item) {
            return [
                'type' => 'certification_program',
                'enrollment' => $item,
                'item' => $item->certificationProgram,
            ];
        }));

        // Bundle items
        foreach ($this->bundleEnrollments as $bundleEnrollment) {
            $bundle = $bundleEnrollment->bundle()->with('bundleItems.bundleable')->first();
            if ($bundle) {
                foreach ($bundle->bundleItems as $bundleItem) {
                    $items->push([
                        'type' => $bundleItem->getTypeSlug(),
                        'enrollment' => $bundleEnrollment,
                        'item' => $bundleItem->bundleable,
                        'bundle' => $bundle,
                    ]);
                }
            }
        }

        return $items;
    }

    public function hasProduct(string $type, string $productId): bool
    {
        switch ($type) {
            case 'course':
                return $this->courseItems()->where('course_id', $productId)->exists();

            case 'bootcamp':
                return $this->bootcampItems()->where('bootcamp_id', $productId)->exists();

            case 'webinar':
                return $this->webinarItems()->where('webinar_id', $productId)->exists();

            case 'private':
                return $this->privateItems()->where('private_class_id', $productId)->exists();

            case 'bundle':
                return $this->bundleEnrollments()->where('bundle_id', $productId)->exists();

            case 'certification_program':
                return $this->certificationProgramItems()->where('certification_program_id', $productId)->exists();

            default:
                return false;
        }
    }

    public function getTotalItemsCount(): int
    {
        $count = 0;

        $count += $this->courseItems->count();
        $count += $this->bootcampItems->count();
        $count += $this->webinarItems->count();
        $count += $this->privateItems->count();
        $count += $this->certificationProgramItems->count();

        // Count items from bundles
        foreach ($this->bundleEnrollments as $bundleEnrollment) {
            if ($bundleEnrollment->bundle) {
                $count += $bundleEnrollment->bundle->bundleItems->count();
            }
        }

        return $count;
    }

    public function isExpired(): bool
    {
        if (!$this->expires_at) {
            return false;
        }

        return $this->status === 'pending' && now()->gt($this->expires_at);
    }

    public function getStatusColor(): string
    {
        return match ($this->status) {
            'paid' => 'green',
            'pending' => 'yellow',
            'failed' => 'red',
            'expired' => 'gray',
            'installment_pending' => 'blue',
            default => 'gray',
        };
    }

    public function referralUser()
    {
        return $this->belongsTo(User::class, 'referral_user_id');
    }
}
