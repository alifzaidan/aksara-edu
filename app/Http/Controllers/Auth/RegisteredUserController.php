<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Show the registration page.
     */
    public function create(Request $request): Response
    {
        $referralCode = $request->query('ref');

        if ($referralCode) {
            session(['referral_code' => $referralCode]);
        }

        $affiliateCode = $referralCode ?? session('referral_code');

        return Inertia::render('auth/register', [
            'affiliate_code' => $affiliateCode,
        ]);
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:' . User::class,
            'phone_number' => 'required|string|max:20',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'affiliate_code' => 'nullable|string|exists:users,affiliate_code',
        ]);

        $affiliateCode = $request->affiliate_code
            ?? session('referral_code')
            ?? 'ATM2025';

        $referred_by_user_id = null;
        if ($affiliateCode) {
            $affiliateUser = User::where('affiliate_code', $affiliateCode)->first();
            if ($affiliateUser) {
                $referred_by_user_id = $affiliateUser->id;
            }
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone_number' => $request->phone_number,
            'password' => Hash::make($request->password),
            'referred_by_user_id' => $referred_by_user_id,
        ]);

        $user->assignRole('user');

        event(new Registered($user));

        Auth::login($user);

        session()->forget('referral_code');

        // return to_route('home');
        return to_route('verification.notice')->with('status', 'Pendaftaran berhasil! Silakan periksa email Anda untuk tautan verifikasi.');
    }
}
