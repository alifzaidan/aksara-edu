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
        Schema::create('webinars', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignUuid('category_id')->constrained('categories')->onDelete('cascade');
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->text('benefits')->nullable();
            $table->string('thumbnail')->nullable();
            $table->dateTime('start_time');
            $table->dateTime('end_time')->nullable();
            $table->dateTime('registration_deadline')->nullable();
            $table->bigInteger('strikethrough_price')->default(0);
            $table->bigInteger('price')->default(0);
            $table->integer('quota')->default(0);
            $table->integer('batch')->default(0);
            $table->string('webinar_url')->nullable();
            $table->string('registration_url')->nullable();
            $table->string('group_url')->nullable();
            $table->string('recording_url')->nullable();
            $table->enum('status', ['draft', 'published', 'archived'])->default('draft');
            $table->text('requirement_1')->nullable();
            $table->text('requirement_2')->nullable();
            $table->text('requirement_3')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('webinars');
    }
};
