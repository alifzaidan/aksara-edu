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
        Schema::create('certification_program_scholarship_applications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('certification_program_id');
            $table->foreign('certification_program_id', 'fk_cp_scholarship_prog_id')
                ->references('id')
                ->on('certification_programs')
                ->onDelete('cascade');
            $table->string('name');
            $table->string('email');
            $table->string('phone');
            $table->string('university');
            $table->string('major');
            $table->integer('semester');
            $table->string('nim');
            $table->string('ktm_photo');
            $table->string('transcript_photo');
            $table->string('instagram_follow_photo');
            $table->string('tiktok_follow_photo');
            $table->string('comment_tag_photo');
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->timestamps();

            $table->index(['email'], 'idx_cp_scholarship_email');
            $table->index(['phone'], 'idx_cp_scholarship_phone');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('certification_program_scholarship_applications');
    }
};
