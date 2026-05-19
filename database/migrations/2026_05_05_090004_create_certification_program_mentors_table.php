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
        Schema::create('certification_program_mentors', function (Blueprint $table) {
            $table->id();
            $table->uuid('certification_program_id');
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['certification_program_id', 'user_id'], 'uq_cp_mentors_cp_user');
            $table->foreign('certification_program_id', 'fk_cp_mentors_program_id')
                ->references('id')
                ->on('certification_programs')
                ->onDelete('cascade');
            $table->index(['user_id'], 'idx_cp_mentors_user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('certification_program_mentors');
    }
};
