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
        Schema::table('certificates', function (Blueprint $table) {
            $table->integer('page_count')->default(1)->after('period');
            $table->boolean('second_page_grade')->default(false)->after('page_count');
            $table->boolean('second_page_material')->default(false)->after('second_page_grade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('certificates', function (Blueprint $table) {
            $table->dropColumn(['page_count', 'second_page_grade', 'second_page_material']);
        });
    }
};
