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
        Schema::create('partnership_products', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('category_id')->constrained('categories')->onDelete('cascade');
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('short_description')->nullable();
            $table->text('description')->nullable();
            $table->text('key_points')->nullable();
            $table->string('thumbnail')->nullable();
            $table->dateTime('registration_deadline')->nullable();
            $table->integer('duration_days')->default(0);
            $table->json('schedule_days')->nullable();
            $table->bigInteger('strikethrough_price')->default(0);
            $table->bigInteger('price')->default(0);
            $table->string('product_url')->nullable();
            $table->string('registration_url')->nullable();
            $table->enum('type', ['regular', 'scholarship'])->default('regular');
            $table->string('scholarship_group_link')->nullable();
            $table->dateTime('event_deadline')->nullable();
            $table->string('payment_code')->nullable();
            $table->enum('status', ['draft', 'published', 'archived'])->default('draft');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('partnership_products');
    }
};
