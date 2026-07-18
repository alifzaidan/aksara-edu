<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->text('value')->nullable();
            $table->timestamps();
        });

        // Seed default referral configurations
        DB::table('settings')->insert([
            [
                'key' => 'referral_reward',
                'value' => '5000',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'buyer_reward',
                'value' => '2000',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'key' => 'referral_only_first_purchase',
                'value' => 'true',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
