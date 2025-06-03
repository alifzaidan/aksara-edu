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
        Schema::create('course_tool', function (Blueprint $table) {
            $table->foreignUuid('course_id')->constrained()->onDelete('cascade');
            $table->foreignUuid('tool_id')->constrained()->onDelete('cascade');
            $table->primary(['course_id', 'tool_id']); // composite primary key
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('course_tool');
    }
};
