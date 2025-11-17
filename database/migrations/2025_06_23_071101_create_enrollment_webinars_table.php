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
        Schema::create('enrollment_webinars', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('invoice_id')->constrained('invoices')->onDelete('cascade');
            $table->foreignUuid('webinar_id')->constrained('webinars')->onDelete('cascade');
            $table->bigInteger('price');
            $table->timestamp('completed_at')->nullable();
            $table->integer('progress')->default(0);
            $table->string('attendance_proof')->nullable();
            $table->boolean('attendance_verified')->default(false);
            $table->integer('rating')->nullable();
            $table->text('review')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('enrollment_webinars');
    }
};
