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
        Schema::create('private_classes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignUuid('category_id')->constrained('categories')->onDelete('cascade');
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->text('requirements')->nullable();
            $table->text('benefits')->nullable();
            $table->text('curriculum')->nullable();
            $table->string('thumbnail')->nullable();
            $table->enum('mode', ['online', 'offline'])->default('online');
            $table->string('location')->nullable();
            $table->dateTime('start_time')->nullable();
            $table->dateTime('end_time')->nullable();
            $table->dateTime('registration_deadline')->nullable();
            $table->bigInteger('strikethrough_price')->default(0);
            $table->bigInteger('price')->default(0);
            $table->integer('max_participants')->default(1);
            $table->string('private_url')->nullable();
            $table->string('registration_url')->nullable();
            $table->string('group_url')->nullable();
            $table->enum('status', ['draft', 'published', 'archived'])->default('draft');
            $table->text('requirement_1')->nullable();
            $table->text('requirement_2')->nullable();
            $table->text('requirement_3')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('registration_deadline');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('private_classes');
    }
};
