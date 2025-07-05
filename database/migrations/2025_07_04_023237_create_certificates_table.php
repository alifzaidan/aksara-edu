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
        Schema::create('certificates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('design_id')->constrained('certificate_designs')->onDelete('cascade');
            $table->foreignUuid('sign_id')->constrained('certificate_signs')->onDelete('cascade');
            $table->foreignUuid('course_id')->nullable()->constrained('courses')->onDelete('cascade');
            $table->foreignUuid('bootcamp_id')->nullable()->constrained('bootcamps')->onDelete('cascade');
            $table->foreignUuid('webinar_id')->nullable()->constrained('webinars')->onDelete('cascade');
            $table->string('certificate_number')->unique();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('header_top')->nullable();
            $table->string('header_bottom')->nullable();
            $table->date('issued_date')->nullable();
            $table->string('period')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('certificates');
    }
};
