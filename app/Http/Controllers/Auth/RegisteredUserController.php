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
        return Inertia::render('auth/register', [
            'affiliate_code' => $request->query('ref'),
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
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'affiliate_code' => 'nullable|string|exists:users,affiliate_code',
        ]);

        $referred_by_user_id = null;
        if ($request->filled('affiliate_code')) {
            $affiliateUser = User::where('affiliate_code', $request->affiliate_code)->first();
            if ($affiliateUser) {
                $referred_by_user_id = $affiliateUser->id;
            }
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'referred_by_user_id' => $referred_by_user_id,
        ]);

        $user->assignRole('user');

        event(new Registered($user));

        Auth::login($user);

        return to_route('home');
    }
}
