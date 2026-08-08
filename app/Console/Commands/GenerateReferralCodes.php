<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class GenerateReferralCodes extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:generate-referral-codes';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate unique referral codes for existing users whose referral_code is null';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $users = User::whereNull('referral_code')->get();
        $count = $users->count();

        if ($count === 0) {
            $this->info('Semua user sudah memiliki referral code.');
            return 0;
        }

        $this->info("Menghasilkan referral code untuk {$count} user...");

        $bar = $this->output->createProgressBar($count);
        $bar->start();

        foreach ($users as $user) {
            do {
                $code = 'AKSA-' . strtoupper(Str::random(6));
            } while (User::where('referral_code', $code)->exists());

            $user->update([
                'referral_code' => $code
            ]);

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("Berhasil membuat referral code untuk {$count} user.");

        return 0;
    }
}
