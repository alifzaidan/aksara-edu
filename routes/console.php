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

Artisan::command('agent:token {agent : Nama agent, mis. supervisor atau academic} {--keep : Jangan cabut token lama agent ini} {--write= : Izin tulis tambahan, pisahkan koma: meeting,recording}', function () {
    $agent = strtolower((string) $this->argument('agent'));

    if (!preg_match('/^[a-z][a-z0-9_]{1,30}$/', $agent)) {
        $this->error('Nama agent hanya boleh huruf kecil, angka, dan underscore.');
        return self::FAILURE;
    }

    // Validasi izin tulis sebelum menyentuh token lama.
    $writes = array_values(array_filter(array_map('trim', explode(',', strtolower((string) $this->option('write'))))));
    $unknown = array_diff($writes, ['meeting', 'recording']);
    if ($unknown) {
        $this->error('Izin tulis tidak dikenal: '.implode(', ', $unknown).'. Pilihan: meeting, recording.');
        return self::FAILURE;
    }
    $abilities = array_merge(['agent:read'], array_map(fn ($w) => "agent:write-{$w}", array_unique($writes)));

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

    $token = $user->createToken($tokenName, $abilities)->plainTextToken;

    $this->info("Token {$tokenName} (ability ".implode(', ', $abilities)."). Simpan di .env profile Hermes; tidak akan ditampilkan lagi:");
    $this->line($token);

    return self::SUCCESS;
})->purpose('Buat/rotasi token Sanctum untuk AI agent Hermes (read-only, opsional --write=meeting,recording)');
