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
        Schema::create('private_class_schedules', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('private_class_id')->constrained('private_classes')->onDelete('cascade');
            $table->dateTime('start_time');
            $table->dateTime('end_time');
            $table->dateTime('registration_deadline')->nullable();
            $table->integer('max_participants')->default(1);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['private_class_id', 'start_time']);
            $table->index(['registration_deadline']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('private_class_schedules');
    }
};
