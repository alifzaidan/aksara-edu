<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $supportedLocales = ['id', 'en'];
        $locale = 'id';

        // 1. User database preference (if authenticated)
        $user = $request->user();
        if ($user && !empty($user->preferred_locale) && in_array($user->preferred_locale, $supportedLocales, true)) {
            $locale = $user->preferred_locale;
        }
        // 2. Session preference
        elseif ($request->session()->has('locale') && in_array($request->session()->get('locale'), $supportedLocales, true)) {
            $locale = $request->session()->get('locale');
        }
        // 3. Cookie preference
        elseif ($request->hasCookie('locale') && in_array($request->cookie('locale'), $supportedLocales, true)) {
            $locale = $request->cookie('locale');
        }
        // 4. Browser Accept-Language header
        else {
            $browserLang = substr($request->server('HTTP_ACCEPT_LANGUAGE', 'id'), 0, 2);
            if (in_array($browserLang, $supportedLocales, true)) {
                $locale = $browserLang;
            }
        }

        App::setLocale($locale);

        return $next($request);
    }
}
