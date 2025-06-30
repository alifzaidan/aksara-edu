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
        Schema::create('quiz_answers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('quiz_attempt_id')->constrained('quiz_attempts')->onDelete('cascade');
            $table->foreignUuid('question_id')->constrained('questions')->onDelete('cascade');
            $table->foreignUuid('selected_option_id')->constrained('question_options')->onDelete('cascade');
            $table->boolean('is_correct')->default(false); // Apakah jawaban benar
            $table->timestamps();
            
            // Index untuk performa
            $table->index(['quiz_attempt_id', 'question_id']);
            $table->unique(['quiz_attempt_id', 'question_id']); // Satu pertanyaan hanya bisa dijawab sekali per attempt
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quiz_answers');
    }
};