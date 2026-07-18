<?php

namespace App\Http\Controllers;

use App\Services\ReferralService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ReferralController extends Controller
{
    protected $referralService;

    public function __construct(ReferralService $referralService)
    {
        $this->referralService = $referralService;
    }

    public function validateCode(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
            'email' => 'nullable|email',
        ]);

        $user = Auth::user();
        $email = $request->input('email');

        if ($user && !$email) {
            $email = $user->email;
        }

        $result = $this->referralService->validateReferralCode($request->code, $email, $user);

        return response()->json($result);
    }

    /**
     * Get the authenticated user's point balance.
     */
    public function getPoints(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json([
                'point_balance' => 0
            ], 401);
        }

        return response()->json([
            'point_balance' => (int) $user->point_balance
        ]);
    }
}
