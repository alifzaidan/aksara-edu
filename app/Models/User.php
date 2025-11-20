<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Notifications\CustomResetPasswordNotification;
use App\Notifications\CustomVerifyEmailNotification;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasUuids, HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'google_id',
        'github_id',
        'referred_by_user_id',
        'name',
        'email',
        'phone_number',
        'bio',
        'password',
        'affiliate_code',
        'affiliate_status',
        'commission',
        'avatar',
        'email_verified_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function getUserPermissions()
    {
        return $this->getAllPermissions()->mapWithKeys(fn($permission) => [$permission['name'] => true]);
    }

    public function sendPasswordResetNotification($token)
    {
        $this->notify(new CustomResetPasswordNotification($token));
    }

    public function sendEmailVerificationNotification()
    {
        $this->notify(new CustomVerifyEmailNotification());
    }

    public function referrer()
    {
        return $this->belongsTo(User::class, 'referred_by_user_id');
    }

    public function courses()
    {
        return $this->hasMany(Course::class);
    }

    public function bootcamps()
    {
        return $this->hasMany(Bootcamp::class);
    }

    public function webinars()
    {
        return $this->hasMany(Webinar::class);
    }

    public function articles()
    {
        return $this->hasMany(Article::class);
    }

    public function affiliateEarnings()
    {
        return $this->hasMany(AffiliateEarning::class, 'affiliate_user_id');
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }

    public function courseEnrollments()
    {
        return $this->hasManyThrough(
            EnrollmentCourse::class,
            Invoice::class,
            'user_id',
            'invoice_id',
            'id',
            'id'
        );
    }

    public function bootcampEnrollments()
    {
        return $this->hasManyThrough(
            EnrollmentBootcamp::class,
            Invoice::class,
            'user_id',
            'invoice_id',
            'id',
            'id'
        );
    }

    public function webinarEnrollments()
    {
        return $this->hasManyThrough(
            EnrollmentWebinar::class,
            Invoice::class,
            'user_id',
            'invoice_id',
            'id',
            'id'
        );
    }
}
