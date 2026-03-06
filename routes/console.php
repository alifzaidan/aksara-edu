<?php

use App\Models\User;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('api:generate-token {email : User email for token owner} {--name=external-web : Token name}', function () {
    $email = $this->argument('email');
    $name = (string) $this->option('name');

    $user = User::where('email', $email)->first();

    if (!$user) {
        $this->error("User with email {$email} not found.");
        return self::FAILURE;
    }

    $token = $user->createToken($name, ['external-api'])->plainTextToken;

    $this->info('External API token generated (store this securely, it will not be shown again):');
    $this->line($token);

    return self::SUCCESS;
})->purpose('Generate Sanctum token for external API access (no login flow)');
