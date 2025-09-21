<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Contracts\User as SocialiteUser;

class SocialiteController extends Controller
{
    public function redirectToGoogle()
    {
        if (request()->has('ref')) {
            session(['referral_code' => request('ref')]);
        }

        return Socialite::driver('google')->redirect();
    }

    public function redirectToGitHub()
    {
        if (request()->has('ref')) {
            session(['referral_code' => request('ref')]);
        }

        return Socialite::driver('github')->redirect();
    }

    public function handleGoogleCallback()
    {
        $googleUser = Socialite::driver('google')->user();
        $this->loginOrRegisterUser($googleUser, 'google');

        return redirect()->intended('/');
    }

    public function handleGitHubCallback()
    {
        $githubUser = Socialite::driver('github')->user();
        $this->loginOrRegisterUser($githubUser, 'github');

        return redirect()->intended('/');
    }

    protected function loginOrRegisterUser(SocialiteUser $socialiteUser, string $provider)
    {
        $provider_id_column = "{$provider}_id";
        $socialiteId = $socialiteUser->getId();
        $socialiteEmail = $socialiteUser->getEmail();

        // Cari user berdasarkan provider_id terlebih dahulu
        $user = User::where($provider_id_column, $socialiteId)->first();

        if ($user) {
            // User sudah ada berdasarkan provider_id, update data jika perlu
            if (empty($user->avatar)) {
                $user->avatar = $socialiteUser->getAvatar();
                $user->save();
            }
        } else {
            $userByEmail = User::where('email', $socialiteEmail)->first();

            if ($userByEmail) {
                if (empty($userByEmail->{$provider_id_column})) {
                    $userByEmail->{$provider_id_column} = $socialiteId;
                    $userByEmail->avatar = $userByEmail->avatar ?? $socialiteUser->getAvatar();
                    $userByEmail->save();
                    $user = $userByEmail;
                } else {
                    throw new \Exception('Akun dengan provider ini sudah terhubung ke user lain.');
                }
            } else {
                $referralCode = session('referral_code', 'ATM2025');
                $referrer = User::where('affiliate_code', $referralCode)->first();

                if (!$referrer) {
                    $referrer = User::where('affiliate_code', 'ATM2025')->first();
                }

                $user = User::create([
                    $provider_id_column => $socialiteId,
                    'name' => $socialiteUser->getName() ?? $socialiteUser->getNickname(),
                    'email' => $socialiteEmail,
                    'avatar' => $socialiteUser->getAvatar(),
                    'password' => Hash::make(Str::random(24)),
                    'referred_by_user_id' => $referrer?->id,
                ]);

                session()->forget('referral_code');
            }
        }

        if (!$user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
        }

        if (!$user->hasAnyRole()) {
            $user->assignRole('user');
        }

        Auth::login($user, true);
    }
}
