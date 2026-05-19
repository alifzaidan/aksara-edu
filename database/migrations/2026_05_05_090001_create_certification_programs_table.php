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
        Schema::create('certification_programs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('category_id')->constrained('categories')->onDelete('cascade');
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('short_description')->nullable();
            $table->text('description')->nullable();
            $table->string('batch')->nullable();
            $table->text('scholarship_flow')->nullable();
            $table->text('benefits')->nullable();
            $table->text('terms_conditions')->nullable();
            $table->string('thumbnail')->nullable();
            $table->boolean('document_required')->default(false);
            $table->text('document_description')->nullable();
            $table->dateTime('registration_deadline')->nullable();
            $table->dateTime('socialization_registration_deadline')->nullable();
            $table->bigInteger('strikethrough_price')->default(0);
            $table->bigInteger('price')->default(0);
            $table->bigInteger('scholarship_price')->default(0);
            $table->string('group_url')->nullable();
            $table->string('socialization_group_url')->nullable();
            $table->string('program_url')->nullable();
            $table->string('registration_url')->nullable();
            $table->enum('type', ['regular', 'scholarship'])->default('regular');
            $table->enum('status', ['draft', 'published', 'archived', 'hidden'])->default('draft');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('certification_programs');
    }
};
