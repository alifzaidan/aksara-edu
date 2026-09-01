<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            if (!Schema::hasColumn('invoices', 'is_installment')) {
                $table->boolean('is_installment')->default(false)->after('expires_at');
            }
            if (!Schema::hasColumn('invoices', 'parent_invoice_id')) {
                $table->uuid('parent_invoice_id')->nullable()->after('is_installment');
            }
            if (!Schema::hasColumn('invoices', 'installment_term_id')) {
                $table->uuid('installment_term_id')->nullable()->after('parent_invoice_id');
            }
            if (!Schema::hasColumn('invoices', 'installment_number')) {
                $table->integer('installment_number')->nullable()->after('installment_term_id');
            }
            if (!Schema::hasColumn('invoices', 'installment_due_date')) {
                $table->timestamp('installment_due_date')->nullable()->after('installment_number');
            }
            if (!Schema::hasColumn('invoices', 'access_suspended_at')) {
                $table->timestamp('access_suspended_at')->nullable()->after('installment_due_date');
            }
        });

        // Tambahkan foreign keys jika belum ada
        try {
            Schema::table('invoices', function (Blueprint $table) {
                $table->foreign('parent_invoice_id')->references('id')->on('invoices')->onDelete('cascade');
            });
        } catch (\Throwable $e) {
            // Foreign key mungkin sudah ada
        }

        try {
            Schema::table('invoices', function (Blueprint $table) {
                $table->foreign('installment_term_id')->references('id')->on('product_installment_terms')->onDelete('set null');
            });
        } catch (\Throwable $e) {
            // Foreign key mungkin sudah ada
        }

        // Ubah enum status untuk mendukung installment_pending
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE invoices MODIFY COLUMN status ENUM('pending', 'paid', 'failed', 'installment_pending') NOT NULL DEFAULT 'pending'");
        }
    }

    public function down(): void
    {
        // Kembalikan enum status ke semula
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE invoices MODIFY COLUMN status ENUM('pending', 'paid', 'failed') NOT NULL DEFAULT 'pending'");
        }

        Schema::table('invoices', function (Blueprint $table) {
            try { $table->dropForeign(['parent_invoice_id']); } catch (\Throwable $e) {}
            try { $table->dropForeign(['installment_term_id']); } catch (\Throwable $e) {}
            $table->dropColumn([
                'is_installment',
                'parent_invoice_id',
                'installment_term_id',
                'installment_number',
                'installment_due_date',
                'access_suspended_at',
            ]);
        });
    }
};
