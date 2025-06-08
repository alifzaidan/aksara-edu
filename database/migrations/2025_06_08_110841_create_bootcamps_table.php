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
        Schema::create('bootcamps', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignUuid('category_id')->constrained('categories')->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->text('requirements')->nullable();
            $table->text('benefits')->nullable();
            $table->text('curriculum')->nullable();
            $table->string('thumbnail')->nullable();
            $table->dateTime('start_time');
            $table->dateTime('end_time')->nullable();
            $table->dateTime('registration_start_time')->nullable();
            $table->dateTime('registration_end_time')->nullable();
            $table->string('host_name')->nullable();
            $table->string('host_description')->nullable();
            $table->bigInteger('price')->default(0);
            $table->integer('quota')->default(0);
            $table->string('registration_link')->nullable();
            $table->string('batch')->nullable();
            $table->enum('status', ['draft', 'published', 'archived'])->default('draft');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bootcamps');
    }
};
