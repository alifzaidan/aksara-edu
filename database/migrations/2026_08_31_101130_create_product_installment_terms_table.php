<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_installment_terms', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('termable_type');
            $table->uuid('termable_id');
            $table->integer('term_number');
            $table->bigInteger('amount');
            $table->date('due_date');
            $table->timestamps();

            $table->index(['termable_type', 'termable_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_installment_terms');
    }
};
