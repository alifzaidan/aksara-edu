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
        Schema::create('certification_program_applications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('certification_program_id');
            $table->foreign('certification_program_id', 'fk_cp_applications_prog_id')
                ->references('id')
                ->on('certification_programs')
                ->onDelete('cascade');
            $table->foreignUuid('user_id')->constrained('users')->onDelete('cascade');
            $table->string('document_attachment')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['certification_program_id', 'user_id'], 'uq_cp_applications_cp_user');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('certification_program_applications');
    }
};
