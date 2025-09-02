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
        Schema::create('bootcamp_attendances', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('enrollment_bootcamp_id')->constrained('enrollment_bootcamps')->onDelete('cascade');
            $table->foreignUuid('bootcamp_schedule_id')->constrained('bootcamp_schedules')->onDelete('cascade');
            $table->string('attendance_proof');
            $table->boolean('verified')->default(false);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bootcamp_attendances');
    }
};
