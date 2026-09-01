<?php

namespace Tests\Feature;

use App\Models\AffiliateEarning;
use App\Models\CertificationProgram;
use App\Models\EnrollmentCertificationProgram;
use App\Models\Invoice;
use App\Models\ProductInstallmentTerm;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class InstallmentFlowTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $affiliate;
    protected User $buyer;
    protected CertificationProgram $program;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();

        Role::firstOrCreate(['name' => 'admin']);
        Role::firstOrCreate(['name' => 'user']);
        Role::firstOrCreate(['name' => 'affiliate']);

        $this->admin = User::factory()->create(['email' => 'admin@test.com']);
        $this->admin->assignRole('admin');

        $this->affiliate = User::factory()->create([
            'email' => 'affiliate@test.com',
            'affiliate_status' => 'Active',
            'commission' => 10,
        ]);
        $this->affiliate->assignRole('affiliate');

        $this->buyer = User::factory()->create([
            'email' => 'buyer@test.com',
            'referred_by_user_id' => $this->affiliate->id,
        ]);
        $this->buyer->assignRole('user');

        $category = \App\Models\Category::create([
            'name' => 'Finance',
            'slug' => 'finance',
        ]);

        $this->program = CertificationProgram::create([
            'title' => 'Sertifikasi Keuangan Profesional',
            'slug' => 'sertifikasi-keuangan-profesional',
            'price' => 800000,
            'category_id' => $category->id,
            'installment_enabled' => true,
        ]);
    }

    /**
     * Test 1: Helper methods and scopes on Invoice model
     */
    public function test_invoice_model_installment_helpers_and_scopes()
    {
        // 1. Parent Invoice
        $parent = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-001',
            'amount' => 850000,
            'nett_amount' => 850000,
            'status' => 'installment_pending',
            'is_installment' => true,
        ]);

        // 2. Child Invoices (Terms)
        $child1 = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-001-T1',
            'amount' => 250000,
            'nett_amount' => 250000,
            'status' => 'pending',
            'is_installment' => false,
            'parent_invoice_id' => $parent->id,
            'installment_number' => 1,
            'installment_due_date' => Carbon::now()->addDays(5),
        ]);

        $child2 = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-001-T2',
            'amount' => 600000,
            'nett_amount' => 600000,
            'status' => 'pending',
            'is_installment' => false,
            'parent_invoice_id' => $parent->id,
            'installment_number' => 2,
            'installment_due_date' => Carbon::now()->addDays(15),
        ]);

        $this->assertTrue($parent->isInstallmentParent());
        $this->assertFalse($parent->isInstallmentChild());
        $this->assertTrue($child1->isInstallmentChild());
        $this->assertFalse($child1->isInstallmentParent());
        $this->assertFalse($parent->isFullyPaid());
        $this->assertEquals(0, $parent->paidTermsCount());
        $this->assertEquals($child1->id, $parent->nextUnpaidTerm()->id);

        // Before paying DP, scopePurchasedByUser should not return this parent
        $this->assertCount(0, Invoice::purchasedByUser($this->buyer->id)->get());

        // Pay DP (Term 1)
        $child1->update(['status' => 'paid', 'paid_at' => Carbon::now()]);

        $this->assertEquals(1, $parent->paidTermsCount());
        $this->assertFalse($parent->isFullyPaid());
        $this->assertEquals($child2->id, $parent->nextUnpaidTerm()->id);

        // After DP is paid, scopePurchasedByUser and scopeAccessibleForUser should include parent
        $this->assertCount(1, Invoice::purchasedByUser($this->buyer->id)->get());
        $this->assertCount(1, Invoice::accessibleForUser($this->buyer->id)->get());

        // Suspend access
        $parent->update(['access_suspended_at' => Carbon::now()]);
        $this->assertTrue($parent->isAccessSuspended());
        // Purchased still counts it, but accessible excludes it
        $this->assertCount(1, Invoice::purchasedByUser($this->buyer->id)->get());
        $this->assertCount(0, Invoice::accessibleForUser($this->buyer->id)->get());

        // Pay Term 2 (Final) and clear suspension
        $child2->update(['status' => 'paid', 'paid_at' => Carbon::now()]);
        $parent->update(['status' => 'paid', 'access_suspended_at' => null]);

        $this->assertTrue($parent->isFullyPaid());
        $this->assertNull($parent->nextUnpaidTerm());
        $this->assertCount(1, Invoice::accessibleForUser($this->buyer->id)->get());
    }

    /**
     * Test 2: Revenue calculation query correctly excludes parent installment to prevent double counting
     */
    public function test_revenue_calculation_is_accurate_and_not_double_counted()
    {
        // 1. Regular direct purchase: Rp 500.000
        Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-REG-001',
            'amount' => 500000,
            'nett_amount' => 500000,
            'status' => 'paid',
            'is_installment' => false,
            'paid_at' => Carbon::now(),
        ]);

        // 2. Installment parent invoice: Rp 850.000 (status: paid when completed)
        $parent = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-002',
            'amount' => 850000,
            'nett_amount' => 850000,
            'status' => 'paid',
            'is_installment' => true,
            'paid_at' => Carbon::now(),
        ]);

        // 3. Term 1 (DP): Rp 250.000 (status: paid)
        Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-002-T1',
            'amount' => 250000,
            'nett_amount' => 250000,
            'status' => 'paid',
            'is_installment' => false,
            'parent_invoice_id' => $parent->id,
            'installment_number' => 1,
            'paid_at' => Carbon::now(),
        ]);

        // 4. Term 2: Rp 600.000 (status: paid)
        Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-002-T2',
            'amount' => 600000,
            'nett_amount' => 600000,
            'status' => 'paid',
            'is_installment' => false,
            'parent_invoice_id' => $parent->id,
            'installment_number' => 2,
            'paid_at' => Carbon::now(),
        ]);

        // The query rule: paid regular direct invoices (is_installment=false AND parent_invoice_id IS NULL)
        // PLUS paid child term invoices (parent_invoice_id IS NOT NULL)
        $revenueQuery = Invoice::where('status', 'paid')
            ->where(function ($q) {
                $q->where(function ($sq) {
                    $sq->whereNull('parent_invoice_id')->where('is_installment', false);
                })->orWhereNotNull('parent_invoice_id');
            });

        $totalRevenue = $revenueQuery->sum('nett_amount');

        // Expected: 500.000 (regular) + 250.000 (T1) + 600.000 (T2) = 1.350.000
        // NOT 2.200.000 (which would happen if parent 850k was also added)
        $this->assertEquals(1350000, $totalRevenue);
    }

    /**
     * Test 3: Overdue command automatically suspends access when term is past due
     */
    public function test_check_installment_overdue_command_suspends_access()
    {
        $parent = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-003',
            'amount' => 850000,
            'nett_amount' => 850000,
            'status' => 'installment_pending',
            'is_installment' => true,
        ]);

        // Term 1 (DP) paid
        Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-003-T1',
            'amount' => 250000,
            'nett_amount' => 250000,
            'status' => 'paid',
            'is_installment' => false,
            'parent_invoice_id' => $parent->id,
            'installment_number' => 1,
            'paid_at' => Carbon::now()->subDays(10),
        ]);

        // Term 2 is pending and overdue (due 2 days ago)
        Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-003-T2',
            'amount' => 600000,
            'nett_amount' => 600000,
            'status' => 'pending',
            'is_installment' => false,
            'parent_invoice_id' => $parent->id,
            'installment_number' => 2,
            'installment_due_date' => Carbon::now()->subDays(2),
        ]);

        $this->assertNull($parent->access_suspended_at);

        // Run artisan command
        Artisan::call('installment:check-overdue');

        $parent->refresh();
        $this->assertNotNull($parent->access_suspended_at);
        $this->assertTrue($parent->isAccessSuspended());
    }

    /**
     * Test 4: Cannot pay overdue term online via payTerm
     */
    public function test_cannot_pay_overdue_term_online()
    {
        $parent = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-004',
            'amount' => 850000,
            'nett_amount' => 850000,
            'status' => 'installment_pending',
            'is_installment' => true,
        ]);

        // Term 1 (DP) paid
        Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-004-T1',
            'amount' => 250000,
            'nett_amount' => 250000,
            'status' => 'paid',
            'is_installment' => false,
            'parent_invoice_id' => $parent->id,
            'installment_number' => 1,
            'paid_at' => Carbon::now()->subDays(10),
        ]);

        // Term 2 is overdue
        $overdueTerm = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-004-T2',
            'amount' => 600000,
            'nett_amount' => 600000,
            'status' => 'pending',
            'is_installment' => false,
            'parent_invoice_id' => $parent->id,
            'installment_number' => 2,
            'installment_due_date' => Carbon::now()->subDays(2),
        ]);

        $response = $this->actingAs($this->buyer)
            ->postJson("/installment/{$parent->id}/pay");

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Batas waktu pembayaran untuk termin ini telah melewati jatuh tempo. Pembayaran online ditutup, silakan hubungi admin untuk penyelesaian cicilan.',
            ]);
    }

    /**
     * Test 5: Affiliate commission recorded per term child invoice correctly links to parent product
     */
    public function test_affiliate_earning_product_name_resolution_for_installment_terms()
    {
        $parent = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-005',
            'amount' => 850000,
            'nett_amount' => 850000,
            'status' => 'installment_pending',
            'is_installment' => true,
        ]);

        // Attach enrollment to parent invoice
        EnrollmentCertificationProgram::create([
            'invoice_id' => $parent->id,
            'certification_program_id' => $this->program->id,
            'price' => 850000,
        ]);

        // Child Term 1
        $term1 = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-005-T1',
            'amount' => 250000,
            'nett_amount' => 250000,
            'status' => 'paid',
            'is_installment' => false,
            'parent_invoice_id' => $parent->id,
            'installment_number' => 1,
            'paid_at' => Carbon::now(),
        ]);

        // Create affiliate earning for term 1
        $earning = AffiliateEarning::create([
            'affiliate_user_id' => $this->affiliate->id,
            'invoice_id' => $term1->id,
            'amount' => 25000,
            'rate' => 10,
            'status' => 'approved',
        ]);

        // Query with eager loading as done in AffiliateController
        $loadedEarning = AffiliateEarning::with([
            'invoice.parentInvoice.certificationProgramItems.certificationProgram',
        ])->find($earning->id);

        $this->assertNotNull($loadedEarning->invoice->parentInvoice);
        $this->assertCount(1, $loadedEarning->invoice->parentInvoice->certificationProgramItems);
        $this->assertEquals(
            'Sertifikasi Keuangan Profesional',
            $loadedEarning->invoice->parentInvoice->certificationProgramItems->first()->certificationProgram->title
        );
    }

    /**
     * Test 6: PDF invoice generation for paid child terms and access control
     */
    public function test_pdf_invoice_generation_and_access_control()
    {
        $parent = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-006',
            'amount' => 850000,
            'nett_amount' => 850000,
            'status' => 'installment_pending',
            'is_installment' => true,
        ]);

        EnrollmentCertificationProgram::create([
            'invoice_id' => $parent->id,
            'certification_program_id' => $this->program->id,
            'price' => 850000,
        ]);

        // Child Term 1 (Paid)
        $term1 = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-006-T1',
            'amount' => 250000,
            'nett_amount' => 250000,
            'status' => 'paid',
            'is_installment' => false,
            'parent_invoice_id' => $parent->id,
            'installment_number' => 1,
            'paid_at' => Carbon::now(),
        ]);

        // Child Term 2 (Unpaid)
        $term2 = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-006-T2',
            'amount' => 600000,
            'nett_amount' => 600000,
            'status' => 'pending',
            'is_installment' => false,
            'parent_invoice_id' => $parent->id,
            'installment_number' => 2,
        ]);

        // 1. Paid term 1 PDF can be downloaded by the buyer
        $responsePaid = $this->actingAs($this->buyer)
            ->get("/invoice/{$term1->invoice_code}/pdf");
        $responsePaid->assertStatus(200);

        // 2. Unpaid parent invoice (still in installment_pending) cannot download full invoice PDF
        $responseUnpaidParent = $this->actingAs($this->buyer)
            ->get("/invoice/{$parent->invoice_code}/pdf");
        $responseUnpaidParent->assertStatus(403);

        // 3. Unpaid term 2 cannot download PDF
        $responseUnpaidTerm = $this->actingAs($this->buyer)
            ->get("/invoice/{$term2->invoice_code}/pdf");
        $responseUnpaidTerm->assertStatus(403);

        // 4. Other user cannot access buyer's PDF
        $otherUser = User::factory()->create();
        $otherUser->assignRole('user');
        $responseOther = $this->actingAs($otherUser)
            ->get("/invoice/{$term1->invoice_code}/pdf");
        $responseOther->assertStatus(403);
    }

    /**
     * Test 7: Admin dashboard recent_sales only includes parent invoices, not duplicate child terms
     */
    public function test_admin_dashboard_recent_sales_only_includes_parent_invoices()
    {
        $parent = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-007',
            'amount' => 850000,
            'nett_amount' => 850000,
            'status' => 'installment_pending',
            'is_installment' => true,
            'paid_at' => Carbon::now(),
        ]);

        EnrollmentCertificationProgram::create([
            'invoice_id' => $parent->id,
            'certification_program_id' => $this->program->id,
            'price' => 850000,
        ]);

        // Term 1 (Paid)
        Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-007-T1',
            'amount' => 250000,
            'nett_amount' => 250000,
            'status' => 'paid',
            'is_installment' => false,
            'parent_invoice_id' => $parent->id,
            'installment_number' => 1,
            'paid_at' => Carbon::now(),
        ]);

        // Term 2 (Paid)
        Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-007-T2',
            'amount' => 600000,
            'nett_amount' => 600000,
            'status' => 'paid',
            'is_installment' => false,
            'parent_invoice_id' => $parent->id,
            'installment_number' => 2,
            'paid_at' => Carbon::now(),
        ]);

        $recentSales = Invoice::with([
            'user',
            'certificationProgramItems.certificationProgram',
        ])
            ->whereNull('parent_invoice_id')
            ->where(function ($q) {
                $q->whereIn('status', ['paid', 'completed'])
                    ->orWhere(function ($iq) {
                        $iq->where('status', 'installment_pending')
                            ->whereHas('installmentTerms', fn ($tq) => $tq->where('installment_number', 1)->where('status', 'paid'));
                    });
            })
            ->get();

        // Exactly 1 entry for this transaction (the parent), child terms are NOT listed
        $this->assertCount(1, $recentSales);
        $this->assertEquals('AKS-INST-007', $recentSales->first()->invoice_code);
        $this->assertCount(1, $recentSales->first()->certificationProgramItems);
        $this->assertEquals('Sertifikasi Keuangan Profesional', $recentSales->first()->certificationProgramItems->first()->certificationProgram->title);
    }
}

