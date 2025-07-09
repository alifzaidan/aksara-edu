<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
{
    Schema::create('quiz_progress', function (Blueprint $table) {
        $table->id();
        $table->uuid('user_id');
        $table->uuid('quiz_id');
        $table->json('answers')->nullable();
        $table->timestamps();

        $table->unique(['user_id', 'quiz_id']);
        $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        // $table->foreign('quiz_id')->references('id')->on('quizzes')->onDelete('cascade');
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quiz_progress');
    }
};
