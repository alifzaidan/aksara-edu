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
        return Socialite::driver('google')->redirect();
    }

    public function redirectToGitHub()
    {
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
        $user = User::where('email', $socialiteUser->getEmail())->first();

        $provider_id_column = "{$provider}_id";

        if ($user) {
            $user->{$provider_id_column} = $socialiteUser->getId();
            $user->avatar = $user->avatar ?? $socialiteUser->getAvatar();
            $user->save();
        } else {
            $referrer = User::where('affiliate_code', 'ATM2025')->first();

            $user = User::create([
                $provider_id_column => $socialiteUser->getId(),
                'name' => $socialiteUser->getName() ?? $socialiteUser->getNickname(),
                'email' => $socialiteUser->getEmail(),
                'avatar' => $socialiteUser->getAvatar(),
                'password' => Hash::make(Str::random(24)),
                'referred_by_user_id' => $referrer?->id,
            ]);
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
