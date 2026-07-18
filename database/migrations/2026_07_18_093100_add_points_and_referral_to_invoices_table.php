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
        Schema::table('invoices', function (Blueprint $table) {
            $table->bigInteger('points_redeemed')->default(0)->after('nett_amount');
            $table->foreignUuid('referral_user_id')->nullable()->constrained('users')->onDelete('set null')->after('points_redeemed');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropForeign(['referral_user_id']);
            $table->dropColumn(['points_redeemed', 'referral_user_id']);
        });
    }
};
