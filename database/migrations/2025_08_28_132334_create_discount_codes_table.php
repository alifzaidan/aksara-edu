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
        Schema::create('discount_codes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('type', ['percentage', 'fixed']); // percentage atau fixed amount
            $table->bigInteger('value'); // nilai diskon (percentage: 1-100, fixed: amount in cents)
            $table->bigInteger('minimum_amount')->nullable(); // minimum pembelian
            $table->bigInteger('maximum_discount')->nullable(); // maksimum diskon (untuk percentage)
            $table->integer('usage_limit')->nullable(); // limit penggunaan total
            $table->integer('usage_limit_per_user')->nullable(); // limit per user
            $table->integer('used_count')->default(0); // sudah digunakan berapa kali
            $table->datetime('starts_at'); // tanggal mulai
            $table->datetime('expires_at'); // tanggal berakhir
            $table->boolean('is_active')->default(true);
            $table->json('applicable_types')->nullable(); // ['course', 'bootcamp', 'webinar'] atau null untuk semua
            $table->json('applicable_ids')->nullable(); // ID specific products atau null untuk semua
            $table->timestamps();

            $table->index(['code', 'is_active']);
            $table->index(['starts_at', 'expires_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('discount_codes');
    }
};
