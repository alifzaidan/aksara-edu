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
        Schema::create('partnership_product_clicks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('partnership_product_id')->constrained('partnership_products')->onDelete('cascade');
            $table->foreignUuid('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->string('referrer')->nullable();
            $table->timestamp('created_at');

            $table->index('partnership_product_id', 'pp_clicks_product_id_idx');
            $table->index('user_id', 'pp_clicks_user_id_idx');
            $table->index('created_at', 'pp_clicks_created_at_idx');
            $table->index(['partnership_product_id', 'created_at'], 'pp_clicks_product_created_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('partnership_product_clicks');
    }
};
