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
        Schema::create('partnership_product_scholarships', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('partnership_product_id')->constrained('partnership_products')->onDelete('cascade');
            $table->string('name');
            $table->string('email');
            $table->string('phone');
            $table->string('nim');
            $table->string('university');
            $table->string('major');
            $table->integer('semester');
            $table->string('ktm_photo');
            $table->string('transcript_photo');
            $table->string('instagram_proof_photo');
            $table->string('instagram_tag_proof_photo');
            $table->boolean('is_accepted')->default(false);
            $table->timestamp('accepted_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('partnership_product_scholarships');
    }
};
