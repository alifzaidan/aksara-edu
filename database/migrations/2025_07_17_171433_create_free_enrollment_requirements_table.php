<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('free_enrollment_requirements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('enrollment_id');
            $table->string('enrollment_type');
            $table->string('ig_follow_proof')->nullable();
            $table->string('tag_friend_proof')->nullable();
            $table->string('tiktok_follow_proof')->nullable();
            $table->timestamps();

            $table->index(['enrollment_id', 'enrollment_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('free_enrollment_requirements');
    }
};
