<?php

namespace App\Services;

use App\Models\User;
use App\Models\Invoice;
use App\Models\Setting;

class ReferralService
{
    /**
     * Validate a referral code for a specific user or email.
     *
     * @param string $code
     * @param string|null $email
     * @param User|null $user
     * @return array
     */
    public function validateReferralCode(string $code, ?string $email = null, ?User $user = null): array
    {
        $code = strtoupper(trim($code));

        if (empty($code)) {
            return [
                'valid' => false,
                'message' => 'Kode referral tidak boleh kosong.',
                'referrer' => null
            ];
        }

        // Find referrer user
        $referrer = User::where('referral_code', $code)->first();

        if (!$referrer) {
            return [
                'valid' => false,
                'message' => 'Kode referral tidak ditemukan.',
                'referrer' => null
            ];
        }

        // Resolve user by email or $user
        if (!$user && !empty($email)) {
            $user = User::where('email', $email)->first();
        }

        if ($user) {
            // Check if referring oneself
            if ($referrer->id === $user->id) {
                return [
                    'valid' => false,
                    'message' => 'Anda tidak bisa menggunakan kode referral Anda sendiri.',
                    'referrer' => null
                ];
            }

            // // Check if user already has a permanent referrer assigned
            // if ($user->referred_by_user_id) {
            //     return [
            //         'valid' => false,
            //         'message' => 'Anda sudah terdaftar menggunakan referral lain sebelumnya.',
            //         'referrer' => null
            //     ];
            // }

            // Check if it is the user's first purchase
            if (Setting::get('referral_only_first_purchase', true)) {
                $hasPaidInvoice = Invoice::where('user_id', $user->id)
                    ->where('status', 'paid')
                    ->exists();

                if ($hasPaidInvoice) {
                    return [
                        'valid' => false,
                        'message' => 'Referral hanya berlaku untuk pembelian pertama Anda.',
                        'referrer' => null
                    ];
                }
            }
        } else {
            // If email is provided but no user exists in the DB, it's a guest registration.
            // Check if the guest email belongs to the referrer's email (prevent self-referral by email)
            if ($email && strtolower(trim($email)) === strtolower($referrer->email)) {
                return [
                    'valid' => false,
                    'message' => 'Anda tidak bisa menggunakan kode referral Anda sendiri.',
                    'referrer' => null
                ];
            }
        }

        return [
            'valid' => true,
            'message' => 'Kode referral valid.',
            'referrer' => $referrer
        ];
    }
}
