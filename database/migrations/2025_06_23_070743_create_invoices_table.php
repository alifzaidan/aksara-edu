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
        Schema::create('invoices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->onDelete('cascade');
            $table->bigInteger('discount_amount')->default(0);
            $table->bigInteger('amount');
            $table->bigInteger('nett_amount');
            $table->enum('status', ['pending', 'paid', 'failed'])->default('pending');
            $table->string('invoice_code');
            $table->string('invoice_url')->nullable(); //xendit
            $table->string('payment_method')->nullable(); //xendit
            $table->string('payment_channel')->nullable(); //xendit
            $table->timestamp('paid_at')->nullable(); //callback
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
