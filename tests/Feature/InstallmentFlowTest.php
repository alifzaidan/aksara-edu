<?php

namespace Tests\Feature;

use App\Models\AffiliateEarning;
use App\Models\Category;
use App\Models\CertificationProgram;
use App\Models\EnrollmentCertificationProgram;
use App\Models\Invoice;
use App\Models\ProductInstallmentTerm;
use App\Models\User;
use App\Services\DokuService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Mockery;
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
            'name' => 'Buyer Test',
            'email' => 'buyer@test.com',
            'phone_number' => '081234567890',
            'referred_by_user_id' => $this->affiliate->id,
        ]);
        $this->buyer->assignRole('user');

        $category = Category::firstOrCreate(
            ['slug' => 'finance'],
            ['name' => 'Finance']
        );

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

        // Revenue query: paid direct invoices + paid child term invoices
        $revenueQuery = Invoice::where('status', 'paid')
            ->where(function ($q) {
                $q->where(function ($sq) {
                    $sq->whereNull('parent_invoice_id')->where('is_installment', false);
                })->orWhereNotNull('parent_invoice_id');
            });

        $totalRevenue = $revenueQuery->sum('nett_amount');

        // Expected: 500.000 (regular) + 250.000 (T1) + 600.000 (T2) = 1.350.000
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
        Invoice::create([
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
     * Test 5: Active installment guard prevents duplicate installment and check-email returns active installment
     */
    public function test_active_installment_guard_prevents_duplicate_installment_and_check_email_detects_it()
    {
        ProductInstallmentTerm::create([
            'termable_type' => CertificationProgram::class,
            'termable_id' => $this->program->id,
            'term_number' => 1,
            'amount' => 400000,
            'due_date' => Carbon::now()->addDays(5),
        ]);
        ProductInstallmentTerm::create([
            'termable_type' => CertificationProgram::class,
            'termable_id' => $this->program->id,
            'term_number' => 2,
            'amount' => 600000,
            'due_date' => Carbon::now()->addDays(20),
        ]);

        $parent = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-005',
            'amount' => 1010000,
            'nett_amount' => 1000000,
            'status' => 'installment_pending',
            'is_installment' => true,
        ]);

        EnrollmentCertificationProgram::create([
            'invoice_id' => $parent->id,
            'certification_program_id' => $this->program->id,
            'price' => 1000000,
        ]);

        Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-005-T1',
            'amount' => 405000,
            'nett_amount' => 400000,
            'status' => 'paid',
            'is_installment' => false,
            'parent_invoice_id' => $parent->id,
            'installment_number' => 1,
            'paid_at' => Carbon::now(),
        ]);

        Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-005-T2',
            'amount' => 605000,
            'nett_amount' => 600000,
            'status' => 'pending',
            'is_installment' => false,
            'parent_invoice_id' => $parent->id,
            'installment_number' => 2,
            'installment_due_date' => Carbon::now()->addDays(15),
        ]);

        // 1. Attempting duplicate installment returns 422
        $response = $this->actingAs($this->buyer)
            ->postJson('/invoice/installment', [
                'type' => 'certification_program',
                'id' => $this->program->id,
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Anda memiliki transaksi cicilan yang sedang aktif untuk program ini. Silakan lanjutkan pembayaran termin cicilan Anda.',
            ]);

        // 2. /api/check-email returns active_installment
        $checkEmailResponse = $this->postJson('/api/check-email', [
            'email' => $this->buyer->email,
            'program_id' => $this->program->id,
        ]);

        $checkEmailResponse->assertStatus(200)
            ->assertJson([
                'exists' => true,
                'active_installment' => [
                    'parent_invoice_id' => $parent->id,
                    'is_fully_paid' => false,
                    'paid_terms' => 1,
                    'total_terms' => 2,
                ],
            ]);
    }

    /**
     * Test 6: Store installment creates parent and terms with payment URL and admin fee
     */
    public function test_store_installment_creates_parent_and_terms_with_payment_url()
    {
        ProductInstallmentTerm::create([
            'termable_type' => CertificationProgram::class,
            'termable_id' => $this->program->id,
            'term_number' => 1,
            'amount' => 400000,
            'due_date' => Carbon::now()->addDays(5),
        ]);
        ProductInstallmentTerm::create([
            'termable_type' => CertificationProgram::class,
            'termable_id' => $this->program->id,
            'term_number' => 2,
            'amount' => 600000,
            'due_date' => Carbon::now()->addDays(20),
        ]);

        $mockDoku = Mockery::mock(DokuService::class);
        $mockDoku->shouldReceive('createCheckout')
            ->once()
            ->andReturn([
                'response' => [
                    'payment' => [
                        'url' => 'https://mock.payment.com/checkout/12345',
                    ],
                ],
            ]);
        $this->app->instance(DokuService::class, $mockDoku);

        $response = $this->actingAs($this->buyer)
            ->postJson('/invoice/installment', [
                'type' => 'certification_program',
                'id' => $this->program->id,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'payment_url' => 'https://mock.payment.com/checkout/12345',
                'dp_amount' => 405000,
                'total_terms' => 2,
            ]);

        $parent = Invoice::where('user_id', $this->buyer->id)
            ->where('is_installment', true)
            ->first();

        $this->assertNotNull($parent);
        $this->assertEquals('installment_pending', $parent->status);
        $this->assertEquals(1010000, $parent->amount);

        $terms = $parent->installmentTerms()->orderBy('installment_number')->get();
        $this->assertCount(2, $terms);
        $this->assertEquals(405000, $terms[0]->amount);
        $this->assertEquals('https://mock.payment.com/checkout/12345', $terms[0]->invoice_url);
        $this->assertEquals(605000, $terms[1]->amount);
    }

    /**
     * Test 7: PayTerm generates payment URL for next unpaid term with admin fee
     */
    public function test_pay_term_generates_payment_url_for_next_unpaid_term()
    {
        $parent = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-007',
            'amount' => 1010000,
            'nett_amount' => 1000000,
            'status' => 'installment_pending',
            'is_installment' => true,
        ]);

        EnrollmentCertificationProgram::create([
            'invoice_id' => $parent->id,
            'certification_program_id' => $this->program->id,
            'price' => 1000000,
        ]);

        // Term 1 paid
        Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-007-T1',
            'amount' => 405000,
            'nett_amount' => 400000,
            'status' => 'paid',
            'is_installment' => false,
            'parent_invoice_id' => $parent->id,
            'installment_number' => 1,
            'paid_at' => Carbon::now()->subDays(5),
        ]);

        // Term 2 pending and NOT overdue
        $term2 = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-007-T2',
            'amount' => 605000,
            'nett_amount' => 600000,
            'status' => 'pending',
            'is_installment' => false,
            'parent_invoice_id' => $parent->id,
            'installment_number' => 2,
            'installment_due_date' => Carbon::now()->addDays(10),
        ]);

        $mockDoku = Mockery::mock(DokuService::class);
        $mockDoku->shouldReceive('createCheckout')
            ->once()
            ->andReturn([
                'response' => [
                    'payment' => [
                        'url' => 'https://mock.payment.com/checkout/term2-67890',
                    ],
                ],
            ]);
        $this->app->instance(DokuService::class, $mockDoku);

        $response = $this->actingAs($this->buyer)
            ->postJson("/installment/{$parent->id}/pay");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'payment_url' => 'https://mock.payment.com/checkout/term2-67890',
                'term_number' => 2,
                'amount' => 605000,
            ]);

        $term2->refresh();
        $this->assertEquals('https://mock.payment.com/checkout/term2-67890', $term2->invoice_url);
    }

    /**
     * Test 8: Affiliate commission recorded per term child invoice correctly links to parent product
     */
    public function test_affiliate_earning_product_name_resolution_for_installment_terms()
    {
        $parent = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-008',
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

        // Child Term 1
        $term1 = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-008-T1',
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
     * Test 9: PDF invoice generation for paid child terms and access control
     */
    public function test_pdf_invoice_generation_and_access_control()
    {
        $parent = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-009',
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
            'invoice_code' => 'AKS-INST-009-T1',
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
            'invoice_code' => 'AKS-INST-009-T2',
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

        // 2. Unpaid parent invoice cannot download full invoice PDF
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
     * Test 10: Admin dashboard recent_sales only includes parent invoices, not duplicate child terms
     */
    public function test_admin_dashboard_recent_sales_only_includes_parent_invoices()
    {
        $parent = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-010',
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
            'invoice_code' => 'AKS-INST-010-T1',
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
            'invoice_code' => 'AKS-INST-010-T2',
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
        $this->assertEquals('AKS-INST-010', $recentSales->first()->invoice_code);
        $this->assertCount(1, $recentSales->first()->certificationProgramItems);
        $this->assertEquals('Sertifikasi Keuangan Profesional', $recentSales->first()->certificationProgramItems->first()->certificationProgram->title);
    }

    /**
     * Test 11: Installment terms include Rp 5.000 admin fee per transaction
     */
    public function test_installment_terms_include_admin_fee_per_transaction()
    {
        $adminFeePerTerm = 5000;
        $term1Nett = 250000;
        $term2Nett = 600000;
        $totalNett = $term1Nett + $term2Nett;
        $totalGross = $totalNett + (2 * $adminFeePerTerm);

        $parent = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-011',
            'amount' => $totalGross,
            'nett_amount' => $totalNett,
            'status' => 'installment_pending',
            'is_installment' => true,
        ]);

        EnrollmentCertificationProgram::create([
            'invoice_id' => $parent->id,
            'certification_program_id' => $this->program->id,
            'price' => $totalNett,
        ]);

        $child1 = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-011-T1',
            'amount' => $term1Nett + $adminFeePerTerm,
            'nett_amount' => $term1Nett,
            'status' => 'pending',
            'is_installment' => false,
            'parent_invoice_id' => $parent->id,
            'installment_number' => 1,
            'installment_due_date' => Carbon::now()->addDays(5),
        ]);

        $child2 = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-011-T2',
            'amount' => $term2Nett + $adminFeePerTerm,
            'nett_amount' => $term2Nett,
            'status' => 'pending',
            'is_installment' => false,
            'parent_invoice_id' => $parent->id,
            'installment_number' => 2,
            'installment_due_date' => Carbon::now()->addDays(35),
        ]);

        // 1. Verify parent amounts
        $this->assertEquals(860000, $parent->amount);
        $this->assertEquals(850000, $parent->nett_amount);

        // 2. Verify child amounts include 5.000 admin fee
        $this->assertEquals(255000, $child1->amount);
        $this->assertEquals(250000, $child1->nett_amount);
        $this->assertEquals(5000, $child1->transaction_fee);

        $this->assertEquals(605000, $child2->amount);
        $this->assertEquals(600000, $child2->nett_amount);
        $this->assertEquals(5000, $child2->transaction_fee);

        // 3. Verify getActiveInstallmentForUser returns amounts including admin fee
        $activeData = Invoice::getActiveInstallmentForUser($this->buyer->id, 'certification_program', $this->program->id);
        $this->assertNotNull($activeData);
        $this->assertEquals(860000, $activeData['amount']);
        $this->assertEquals(255000, $activeData['next_term']['amount']);
        $this->assertEquals(255000, $activeData['terms'][0]['amount']);
        $this->assertEquals(605000, $activeData['terms'][1]['amount']);
    }

    /**
     * Test 12: Installment WhatsApp message contains access steps, group link, and settlement link
     */
    public function test_installment_whatsapp_message_contains_comprehensive_details()
    {
        $this->program->update(['group_url' => 'https://chat.whatsapp.com/test-group']);

        $parent = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-012',
            'amount' => 860000,
            'nett_amount' => 850000,
            'status' => 'installment_pending',
            'is_installment' => true,
        ]);

        EnrollmentCertificationProgram::create([
            'invoice_id' => $parent->id,
            'certification_program_id' => $this->program->id,
            'price' => 850000,
        ]);

        $child1 = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-012-T1',
            'amount' => 255000,
            'nett_amount' => 250000,
            'status' => 'paid',
            'is_installment' => false,
            'parent_invoice_id' => $parent->id,
            'installment_number' => 1,
            'paid_at' => Carbon::now(),
        ]);

        $child2 = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-012-T2',
            'amount' => 605000,
            'nett_amount' => 600000,
            'status' => 'pending',
            'is_installment' => false,
            'parent_invoice_id' => $parent->id,
            'installment_number' => 2,
            'installment_due_date' => Carbon::now()->addDays(30),
        ]);

        $controller = app(\App\Http\Controllers\InvoiceController::class);
        $method = new \ReflectionMethod($controller, 'createWhatsAppInstallmentMessage');
        $method->setAccessible(true);

        // 1. Intermediate term message (Term 1 paid, Term 2 pending)
        $message = $method->invoke($controller, $child1, $parent, false);

        $this->assertStringContainsString('Pembayaran DP Cicilan', $message);
        $this->assertStringContainsString('Cara Mengakses Materi', $message);
        $this->assertStringContainsString('/profile/installments', $message);
        $this->assertStringContainsString('https://chat.whatsapp.com/test-group', $message);
        $this->assertStringContainsString('Informasi Tagihan Selanjutnya', $message);
        $this->assertStringContainsString('Penting untuk Peserta Cicilan', $message);

        // 2. Completed installment message
        $messageCompleted = $method->invoke($controller, $child2, $parent, true);

        $this->assertStringContainsString('Pelunasan Cicilan', $messageCompleted);
        $this->assertStringContainsString('LUNAS', $messageCompleted);
        $this->assertStringContainsString('Cara Mengakses Materi', $messageCompleted);
        $this->assertStringContainsString('https://chat.whatsapp.com/test-group', $messageCompleted);
    }
}
