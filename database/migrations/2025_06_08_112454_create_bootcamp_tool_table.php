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
        Schema::create('bootcamp_tool', function (Blueprint $table) {
            $table->foreignUuid('bootcamp_id')->constrained()->onDelete('cascade');
            $table->foreignUuid('tool_id')->constrained()->onDelete('cascade');
            $table->primary(['bootcamp_id', 'tool_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bootcamp_tool');
    }
};
