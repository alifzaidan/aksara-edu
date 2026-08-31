<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $tables = ['courses', 'webinars', 'bootcamps', 'private_classes', 'certification_programs', 'bundles'];

        foreach ($tables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->boolean('installment_enabled')->default(false)->after('id');
            });
        }
    }

    public function down(): void
    {
        $tables = ['courses', 'webinars', 'bootcamps', 'private_classes', 'certification_programs', 'bundles'];

        foreach ($tables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->dropColumn('installment_enabled');
            });
        }
    }
};
