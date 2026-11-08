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

Artisan::command('agent:token {agent : Nama agent, mis. supervisor atau academic} {--keep : Jangan cabut token lama agent ini}', function () {
    $agent = strtolower((string) $this->argument('agent'));

    if (!preg_match('/^[a-z][a-z0-9_]{1,30}$/', $agent)) {
        $this->error('Nama agent hanya boleh huruf kecil, angka, dan underscore.');
        return self::FAILURE;
    }

    // User khusus agent: tanpa role, password acak (tidak dipakai login).
    $user = User::firstOrCreate(
        ['email' => "agent-{$agent}@agents.aksademy.local"],
        [
            'name' => 'AI Agent ' . ucfirst($agent),
            'password' => \Illuminate\Support\Facades\Hash::make(\Illuminate\Support\Str::random(64)),
        ]
    );

    $tokenName = "agent-{$agent}";

    if (!$this->option('keep')) {
        $revoked = $user->tokens()->where('name', $tokenName)->delete();
        if ($revoked) {
            $this->warn("{$revoked} token lama {$tokenName} dicabut.");
        }
    }

    $token = $user->createToken($tokenName, ['agent:read'])->plainTextToken;

    $this->info("Token {$tokenName} (ability agent:read). Simpan di .env profile Hermes; tidak akan ditampilkan lagi:");
    $this->line($token);

    return self::SUCCESS;
})->purpose('Buat/rotasi token Sanctum read-only untuk AI agent Hermes');
