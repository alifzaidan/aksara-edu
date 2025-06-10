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
        Schema::create('webinar_tool', function (Blueprint $table) {
            $table->foreignUuid('webinar_id')->constrained()->onDelete('cascade');
            $table->foreignUuid('tool_id')->constrained()->onDelete('cascade');
            $table->primary(['webinar_id', 'tool_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('webinar_tool');
    }
};
