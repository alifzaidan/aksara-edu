<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureTokenHasAbility
{
    /**
     * Ensure request is authenticated via personal access token and has required ability.
     */
    public function handle(Request $request, Closure $next, string $ability = 'external-api')
    {
        $user = $request->user();

        if (!$user || !$user->currentAccessToken()) {
            return response()->json([
                'message' => 'Unauthorized token access.',
            ], 401);
        }

        if (!$user->tokenCan($ability)) {
            return response()->json([
                'message' => 'Token does not have required ability.',
            ], 403);
        }

        return $next($request);
    }
}
