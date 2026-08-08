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
        Schema::table('certification_program_scholarship_applications', function (Blueprint $table) {
            if (!Schema::hasColumn('certification_program_scholarship_applications', 'whatsapp_share_photo')) {
                $table->string('whatsapp_share_photo')->nullable()->after('comment_tag_photo');
            }
            if (!Schema::hasColumn('certification_program_scholarship_applications', 'instagram_story_photo')) {
                $table->string('instagram_story_photo')->nullable()->after('whatsapp_share_photo');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('certification_program_scholarship_applications', function (Blueprint $table) {
            if (Schema::hasColumn('certification_program_scholarship_applications', 'whatsapp_share_photo')) {
                $table->dropColumn('whatsapp_share_photo');
            }
            if (Schema::hasColumn('certification_program_scholarship_applications', 'instagram_story_photo')) {
                $table->dropColumn('instagram_story_photo');
            }
        });
    }
};
