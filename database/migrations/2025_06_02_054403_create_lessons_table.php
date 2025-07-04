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
        Schema::create('lessons', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('module_id')->constrained('modules')->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('type', ['text', 'video', 'file', 'quiz'])->default('text');
            $table->text('video_url')->nullable();
            $table->text('content')->nullable();
            $table->text('attachment')->nullable();
            $table->integer('duration')->default(0);
            $table->integer('order')->default(0);
            $table->boolean('is_free')->default(false);
            $table->boolean('is_preview')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lessons');
    }
};
