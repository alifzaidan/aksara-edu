<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $tables = ['webinars', 'bootcamps'];

        foreach ($tables as $tableName) {
            if (Schema::hasTable($tableName)) {
                Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                    $afterCol = Schema::hasColumn($tableName, 'recording_url')
                        ? 'recording_url'
                        : (Schema::hasColumn($tableName, 'has_submission_link') ? 'has_submission_link' : null);

                    if (!Schema::hasColumn($tableName, 'has_certificate')) {
                        $col = $table->boolean('has_certificate')->default(true);
                        if ($afterCol) {
                            $col->after($afterCol);
                        }
                    }
                    if (!Schema::hasColumn($tableName, 'requires_review')) {
                        $table->boolean('requires_review')->default(true)->after('has_certificate');
                    }
                    if (!Schema::hasColumn($tableName, 'next_step_type')) {
                        $table->string('next_step_type')->nullable()->after('requires_review');
                    }
                    if (!Schema::hasColumn($tableName, 'next_step_id')) {
                        $table->string('next_step_id', 36)->nullable()->after('next_step_type');
                    }
                });
            }
        }
    }

    public function down(): void
    {
        $tables = ['webinars', 'bootcamps'];

        foreach ($tables as $tableName) {
            if (Schema::hasTable($tableName)) {
                Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                    $columnsToDrop = [];
                    foreach (['has_certificate', 'requires_review', 'next_step_type', 'next_step_id'] as $col) {
                        if (Schema::hasColumn($tableName, $col)) {
                            $columnsToDrop[] = $col;
                        }
                    }
                    if (!empty($columnsToDrop)) {
                        $table->dropColumn($columnsToDrop);
                    }
                });
            }
        }
    }
};
