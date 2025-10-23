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
        Schema::create('bundle_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('bundle_id')->constrained('bundles')->onDelete('cascade');
            $table->uuidMorphs('bundleable');
            $table->integer('order')->default(0);
            $table->bigInteger('price');
            $table->timestamps();

            $table->unique(['bundle_id', 'bundleable_type', 'bundleable_id'], 'bundle_items_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bundle_items');
    }
};
