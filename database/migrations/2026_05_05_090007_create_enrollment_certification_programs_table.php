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
        Schema::create('enrollment_certification_programs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('invoice_id')->constrained('invoices')->onDelete('cascade');
            $table->uuid('certification_program_id');
            $table->foreign('certification_program_id', 'fk_enroll_cp_prog_id')
                ->references('id')
                ->on('certification_programs')
                ->onDelete('cascade');
            $table->bigInteger('price');
            $table->boolean('is_scholarship')->default(false);
            $table->timestamp('completed_at')->nullable();
            $table->integer('progress')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('enrollment_certification_programs');
    }
};
