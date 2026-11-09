<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Link Zoom per webinar / per sesi (Fase F, keputusan D07).
 *
 * - `meeting_url`     : link masuk Zoom. Berbeda dari `webinar_url` / `bootcamp_url`
 *                       yang berisi halaman program/LMS.
 * - `zoom_meeting_id` : string karena ID Zoom bisa melebihi integer 32-bit;
 *                       dipakai mencocokkan rekaman cloud ke sesi.
 * - `auto_meeting_link` (per produk, default false): admin mencentang bila kelas
 *   memakai akun Zoom perusahaan. Agent hanya membuat meeting untuk produk ini;
 *   kelas dengan akun Zoom pinjaman diisi manual.
 * - `agent_audit_logs.payload`: isi body request tulis agent untuk jejak audit.
 */
return new class extends Migration
{
    private const SESSION_TABLES = ['webinars', 'bootcamp_schedules', 'certification_program_schedules'];

    private const PRODUCT_TABLES = ['webinars', 'bootcamps', 'certification_programs'];

    public function up(): void
    {
        foreach (self::SESSION_TABLES as $tableName) {
            Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                if (! Schema::hasColumn($tableName, 'meeting_url')) {
                    $table->string('meeting_url', 500)->nullable()->after('recording_url');
                }
                if (! Schema::hasColumn($tableName, 'zoom_meeting_id')) {
                    $table->string('zoom_meeting_id', 32)->nullable()->after('meeting_url')->index();
                }
            });
        }

        foreach (self::PRODUCT_TABLES as $tableName) {
            Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                if (! Schema::hasColumn($tableName, 'auto_meeting_link')) {
                    $table->boolean('auto_meeting_link')->default(false);
                }
            });
        }

        Schema::table('agent_audit_logs', function (Blueprint $table) {
            if (! Schema::hasColumn('agent_audit_logs', 'payload')) {
                $table->json('payload')->nullable()->after('query');
            }
        });
    }

    public function down(): void
    {
        foreach (self::SESSION_TABLES as $tableName) {
            if (Schema::hasColumn($tableName, 'zoom_meeting_id')) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->dropIndex(['zoom_meeting_id']);
                    $table->dropColumn('zoom_meeting_id');
                });
            }
            if (Schema::hasColumn($tableName, 'meeting_url')) {
                Schema::table($tableName, fn (Blueprint $table) => $table->dropColumn('meeting_url'));
            }
        }

        foreach (self::PRODUCT_TABLES as $tableName) {
            if (Schema::hasColumn($tableName, 'auto_meeting_link')) {
                Schema::table($tableName, fn (Blueprint $table) => $table->dropColumn('auto_meeting_link'));
            }
        }

        if (Schema::hasColumn('agent_audit_logs', 'payload')) {
            Schema::table('agent_audit_logs', fn (Blueprint $table) => $table->dropColumn('payload'));
        }
    }
};
