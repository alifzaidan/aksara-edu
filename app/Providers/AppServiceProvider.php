<?php

namespace App\Providers;

use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // if (env(key: 'APP_ENV') !== 'local') {
        //     URL::forceScheme(scheme: 'https');
        // }
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // if (app()->environment('local')) {
        //     URL::forceScheme('https');
        // }
        
        // Force the root URL to match the one defined in .env
        // This prevents generating URLs with or without 'www' depending on the request host,
        // which can cause CORS issues in frontend apps.
        if (config('app.url')) {
            URL::forceRootUrl(config('app.url'));
        }
    }
}
