<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        if (env(key: 'APP_ENV') !== 'local') {
            URL::forceScheme(scheme: 'https');
        }
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Batas request AI agent: 60/menit per token (fallback per IP).
        RateLimiter::for('agent', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->currentAccessToken()?->id ?: $request->ip());
        });

        // if (app()->environment('local')) {
        //     URL::forceScheme('https');
        // }
        
        // Force the root URL to match the one defined in .env
        // This prevents generating URLs with or without 'www' depending on the request host,
        // which can cause CORS issues in frontend apps.
        // if (config('app.url')) {
        //     URL::forceRootUrl(config('app.url'));
        // }
    }
}

