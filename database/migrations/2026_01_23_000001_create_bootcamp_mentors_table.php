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
        Schema::create('bootcamp_mentors', function (Blueprint $table) {
            $table->id();
            $table->uuid('bootcamp_id');
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['bootcamp_id', 'user_id']);

            $table->foreign('bootcamp_id')->references('id')->on('bootcamps')->cascadeOnDelete();
            $table->index(['user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bootcamp_mentors');
    }
};
