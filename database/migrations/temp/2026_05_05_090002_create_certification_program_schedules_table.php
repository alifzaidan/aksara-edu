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
        Schema::create('certification_program_schedules', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('certification_program_id');
            $table->foreign('certification_program_id', 'fk_cp_schedules_program_id')
                ->references('id')
                ->on('certification_programs')
                ->onDelete('cascade');
                $table->string('title')->nullable();
            $table->date('schedule_date');
            $table->enum('day', ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu']);
            $table->time('start_time');
            $table->time('end_time');
            $table->string('recording_url')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('certification_program_schedules');
    }
};
