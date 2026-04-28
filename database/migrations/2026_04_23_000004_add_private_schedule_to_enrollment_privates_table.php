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
        Schema::table('enrollment_privates', function (Blueprint $table) {
            $table->foreignUuid('private_class_schedule_id')
                ->nullable()
                ->after('private_class_id')
                ->constrained('private_class_schedules')
                ->nullOnDelete();

            $table->index('private_class_schedule_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('enrollment_privates', function (Blueprint $table) {
            $table->dropForeign(['private_class_schedule_id']);
            $table->dropIndex(['private_class_schedule_id']);
            $table->dropColumn('private_class_schedule_id');
        });
    }
};
