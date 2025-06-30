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
        Schema::create('quiz_attempts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignUuid('quiz_id')->constrained('quizzes')->onDelete('cascade');
            $table->integer('score')->default(0); // Nilai yang diperoleh (0-100)
            $table->integer('total_questions'); // Total pertanyaan
            $table->integer('correct_answers')->default(0); // Jumlah jawaban benar
            $table->boolean('is_passed')->default(false); // Apakah lulus berdasarkan passing_score
            $table->timestamp('started_at'); // Waktu mulai quiz
            $table->timestamp('submitted_at')->nullable(); // Waktu submit quiz
            $table->integer('time_taken')->nullable(); // Waktu yang digunakan (dalam menit)
            $table->json('answers_summary')->nullable(); // Ringkasan jawaban dalam format JSON
            $table->timestamps();
            
            // Index untuk performa
            $table->index(['user_id', 'quiz_id']);
            $table->index('submitted_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quiz_attempts');
    }
};