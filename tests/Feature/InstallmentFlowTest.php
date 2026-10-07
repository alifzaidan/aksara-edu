<?php

namespace Tests\Feature;

use App\Models\AffiliateEarning;
use App\Models\Bootcamp;
use App\Models\Category;
use App\Models\CertificationProgram;
use App\Models\Course;
use App\Events\TransactionPaid;
use App\Models\EnrollmentBootcamp;
use App\Models\EnrollmentCertificationProgram;
use App\Models\EnrollmentCourse;
use App\Models\EnrollmentPrivate;
use App\Models\EnrollmentWebinar;
use App\Models\Invoice;
use App\Models\PrivateClass;
use App\Models\PrivateClassSchedule;
use App\Models\ProductInstallmentTerm;
use App\Models\User;
use App\Models\Webinar;
use App\Services\DokuService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
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

        // 2. Parent invoice where DP (term 1) has been paid CAN download PDF (Bug #3 fix)
        $responsePaidParent = $this->actingAs($this->buyer)
            ->get("/invoice/{$parent->invoice_code}/pdf");
        $responsePaidParent->assertStatus(200);

        // 3. Parent invoice where NO term has been paid yet CANNOT download PDF (returns 403)
        $parentNoDp = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-009-NODP',
            'amount' => 850000,
            'nett_amount' => 850000,
            'status' => 'installment_pending',
            'is_installment' => true,
        ]);
        Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-009-NODP-T1',
            'amount' => 250000,
            'nett_amount' => 250000,
            'status' => 'pending',
            'is_installment' => false,
            'parent_invoice_id' => $parentNoDp->id,
            'installment_number' => 1,
        ]);
        $responseNoDpParent = $this->actingAs($this->buyer)
            ->get("/invoice/{$parentNoDp->invoice_code}/pdf");
        $responseNoDpParent->assertStatus(403);

        // 4. Unpaid term 2 cannot download PDF
        $responseUnpaidTerm = $this->actingAs($this->buyer)
            ->get("/invoice/{$term2->invoice_code}/pdf");
        $responseUnpaidTerm->assertStatus(403);

        // 5. Other user cannot access buyer's PDF
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

    /**
     * Test 13: Unverified email user can access installment checkout and pay term (Bug #2)
     */
    public function test_unverified_email_user_can_access_installment_checkout()
    {
        $unverifiedBuyer = User::factory()->create([
            'name' => 'Unverified User',
            'email' => 'unverified@test.com',
            'email_verified_at' => null,
        ]);
        $unverifiedBuyer->assignRole('user');

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
                        'url' => 'https://mock.payment.com/checkout/unverified-123',
                    ],
                ],
            ]);
        $this->app->instance(DokuService::class, $mockDoku);

        // Harus berhasil 200, tidak dialihkan ke notice verifikasi email (302)
        $response = $this->actingAs($unverifiedBuyer)
            ->postJson('/invoice/installment', [
                'type' => 'certification_program',
                'id' => $this->program->id,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'payment_url' => 'https://mock.payment.com/checkout/unverified-123',
            ]);
    }

    /**
     * Test 14: Guest user cannot access installment store and pay routes without authentication (Bug #1)
     */
    public function test_guest_user_cannot_access_installment_checkout_without_auth()
    {
        // 1. Post installment tanpa login
        $response = $this->postJson('/invoice/installment', [
            'type' => 'certification_program',
            'id' => $this->program->id,
        ]);
        $response->assertStatus(401);

        // 2. Post pay term tanpa login
        $responsePay = $this->postJson('/installment/non-existent-id/pay');
        $responsePay->assertStatus(401);
    }

    /**
     * Test 15: Admin participant queries and statistics include installment users who paid DP (Bug #7 & Bug #8)
     */
    public function test_admin_queries_include_installment_participants_with_paid_dp()
    {
        $category = Category::first();

        // 1. Bootcamp
        $bootcamp = Bootcamp::create([
            'title' => 'Fullstack Laravel Bootcamp',
            'slug' => 'fullstack-laravel-bootcamp',
            'price' => 1500000,
            'category_id' => $category->id,
            'start_date' => Carbon::now()->addDays(5),
        ]);

        // 2. Webinar
        $webinar = Webinar::create([
            'title' => 'Webinar AI Engineering',
            'slug' => 'webinar-ai-engineering',
            'price' => 100000,
            'category_id' => $category->id,
            'start_time' => Carbon::now()->addDays(5),
            'end_time' => Carbon::now()->addDays(5)->addHours(2),
            'webinar_url' => 'https://zoom.us/test',
            'registration_url' => 'https://aksademy.com/webinar',
            'benefits' => 'Ilmu',
            'status' => 'published',
            'user_id' => $this->admin->id,
        ]);

        // 3. Course
        $course = Course::create([
            'title' => 'Mastering NextJS',
            'slug' => 'mastering-nextjs',
            'price' => 300000,
            'category_id' => $category->id,
            'course_url' => 'https://aksademy.com/course',
            'registration_url' => 'https://aksademy.com/course/reg',
            'key_points' => 'NextJS',
            'status' => 'published',
            'user_id' => $this->admin->id,
        ]);

        // Bootcamp installment with DP paid
        $bcParent = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-BC-INST',
            'amount' => 1510000,
            'nett_amount' => 1500000,
            'status' => 'installment_pending',
            'is_installment' => true,
        ]);
        EnrollmentBootcamp::create([
            'invoice_id' => $bcParent->id,
            'bootcamp_id' => $bootcamp->id,
            'price' => 1500000,
        ]);
        Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-BC-INST-T1',
            'amount' => 755000,
            'nett_amount' => 750000,
            'status' => 'paid',
            'is_installment' => false,
            'parent_invoice_id' => $bcParent->id,
            'installment_number' => 1,
            'paid_at' => Carbon::now(),
        ]);

        // Webinar installment with DP paid
        $webParent = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-WEB-INST',
            'amount' => 110000,
            'nett_amount' => 100000,
            'status' => 'installment_pending',
            'is_installment' => true,
        ]);
        EnrollmentWebinar::create([
            'invoice_id' => $webParent->id,
            'webinar_id' => $webinar->id,
            'price' => 100000,
        ]);
        Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-WEB-INST-T1',
            'amount' => 55000,
            'nett_amount' => 50000,
            'status' => 'paid',
            'is_installment' => false,
            'parent_invoice_id' => $webParent->id,
            'installment_number' => 1,
            'paid_at' => Carbon::now(),
        ]);

        // Course installment with DP paid
        $crsParent = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-CRS-INST',
            'amount' => 310000,
            'nett_amount' => 300000,
            'status' => 'installment_pending',
            'is_installment' => true,
        ]);
        EnrollmentCourse::create([
            'invoice_id' => $crsParent->id,
            'course_id' => $course->id,
            'price' => 300000,
        ]);
        Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-CRS-INST-T1',
            'amount' => 155000,
            'nett_amount' => 150000,
            'status' => 'paid',
            'is_installment' => false,
            'parent_invoice_id' => $crsParent->id,
            'installment_number' => 1,
            'paid_at' => Carbon::now(),
        ]);

        // Query Bootcamp participants matching BootcampController logic
        $bootcampParticipants = Invoice::where(function ($q) {
                $q->whereIn('status', ['paid', 'completed'])
                    ->orWhere(function ($sq) {
                        $sq->where('status', 'installment_pending')
                            ->whereHas('installmentTerms', function ($tq) {
                                $tq->where('installment_number', 1)->where('status', 'paid');
                            });
                    });
            })
            ->whereNull('parent_invoice_id')
            ->whereHas('bootcampItems', fn ($q) => $q->where('bootcamp_id', $bootcamp->id))
            ->count();
        $this->assertEquals(1, $bootcampParticipants);

        // Query Webinar participants matching WebinarController logic
        $webinarParticipants = Invoice::where(function ($q) {
                $q->whereIn('status', ['paid', 'completed'])
                    ->orWhere(function ($sq) {
                        $sq->where('status', 'installment_pending')
                            ->whereHas('installmentTerms', function ($tq) {
                                $tq->where('installment_number', 1)->where('status', 'paid');
                            });
                    });
            })
            ->whereNull('parent_invoice_id')
            ->whereHas('webinarItems', fn ($q) => $q->where('webinar_id', $webinar->id))
            ->count();
        $this->assertEquals(1, $webinarParticipants);

        // Query Course enrollments matching CourseController logic
        $courseEnrollments = Invoice::where(function ($q) {
                $q->whereIn('status', ['paid', 'completed'])
                    ->orWhere(function ($sq) {
                        $sq->where('status', 'installment_pending')
                            ->whereHas('installmentTerms', function ($tq) {
                                $tq->where('installment_number', 1)->where('status', 'paid');
                            });
                    });
            })
            ->whereNull('parent_invoice_id')
            ->whereHas('courseItems', fn ($q) => $q->where('course_id', $course->id))
            ->count();
        $this->assertEquals(1, $courseEnrollments);
    }

    /**
     * Test 16: Profile detail controllers pass active_installment data for all product types (Bug #4)
     */
    public function test_user_profile_detail_controllers_pass_active_installment_data()
    {
        $category = Category::first();

        // 1. Bootcamp
        $bootcamp = Bootcamp::create([
            'title' => 'Profile Bootcamp Test',
            'slug' => 'profile-bootcamp-test',
            'price' => 1000000,
            'category_id' => $category->id,
            'start_date' => Carbon::now()->addDays(5),
        ]);
        $bcParent = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-PRF-BC',
            'amount' => 1010000,
            'nett_amount' => 1000000,
            'status' => 'installment_pending',
            'is_installment' => true,
        ]);
        EnrollmentBootcamp::create([
            'invoice_id' => $bcParent->id,
            'bootcamp_id' => $bootcamp->id,
            'price' => 1000000,
        ]);
        Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-PRF-BC-T1',
            'amount' => 505000,
            'nett_amount' => 500000,
            'status' => 'paid',
            'is_installment' => false,
            'parent_invoice_id' => $bcParent->id,
            'installment_number' => 1,
            'paid_at' => Carbon::now(),
        ]);
        Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-PRF-BC-T2',
            'amount' => 505000,
            'nett_amount' => 500000,
            'status' => 'pending',
            'is_installment' => false,
            'parent_invoice_id' => $bcParent->id,
            'installment_number' => 2,
            'installment_due_date' => Carbon::now()->addDays(14),
        ]);

        $bcResponse = $this->actingAs($this->buyer)
            ->get(route('profile.bootcamp.detail', ['bootcamp' => $bootcamp->slug]));
        $bcResponse->assertStatus(200);
        $bcResponse->assertInertia(fn ($page) => $page
            ->component('user/profile/bootcamp/detail')
            ->has('active_installment')
            ->where('active_installment.parent_invoice_id', $bcParent->id)
            ->where('active_installment.paid_terms', 1)
            ->where('active_installment.total_terms', 2)
            ->where('active_installment.is_fully_paid', false)
        );

        // 2. Webinar
        $webinar = Webinar::create([
            'title' => 'Profile Webinar Test',
            'slug' => 'profile-webinar-test',
            'price' => 200000,
            'category_id' => $category->id,
            'start_time' => Carbon::now()->addDays(3),
            'end_time' => Carbon::now()->addDays(3)->addHours(2),
            'webinar_url' => 'https://zoom.us/test',
            'registration_url' => 'https://aksademy.com/reg',
            'benefits' => 'Materi',
            'status' => 'published',
            'user_id' => $this->admin->id,
        ]);
        $webParent = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-PRF-WEB',
            'amount' => 210000,
            'nett_amount' => 200000,
            'status' => 'installment_pending',
            'is_installment' => true,
        ]);
        EnrollmentWebinar::create([
            'invoice_id' => $webParent->id,
            'webinar_id' => $webinar->id,
            'price' => 200000,
        ]);
        Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-PRF-WEB-T1',
            'amount' => 105000,
            'nett_amount' => 100000,
            'status' => 'paid',
            'is_installment' => false,
            'parent_invoice_id' => $webParent->id,
            'installment_number' => 1,
            'paid_at' => Carbon::now(),
        ]);
        Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-PRF-WEB-T2',
            'amount' => 105000,
            'nett_amount' => 100000,
            'status' => 'pending',
            'is_installment' => false,
            'parent_invoice_id' => $webParent->id,
            'installment_number' => 2,
            'installment_due_date' => Carbon::now()->addDays(7),
        ]);

        $webResponse = $this->actingAs($this->buyer)
            ->get(route('profile.webinar.detail', ['webinar' => $webinar->slug]));
        $webResponse->assertStatus(200);
        $webResponse->assertInertia(fn ($page) => $page
            ->component('user/profile/webinar/detail')
            ->has('active_installment')
            ->where('active_installment.parent_invoice_id', $webParent->id)
            ->where('active_installment.paid_terms', 1)
            ->where('active_installment.total_terms', 2)
        );

        // 3. Course
        $course = Course::create([
            'title' => 'Profile Course Test',
            'slug' => 'profile-course-test',
            'price' => 400000,
            'category_id' => $category->id,
            'course_url' => 'https://aksademy.com/test-course',
            'registration_url' => 'https://aksademy.com/test-course/reg',
            'key_points' => 'Test',
            'status' => 'published',
            'user_id' => $this->admin->id,
        ]);
        $crsParent = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-PRF-CRS',
            'amount' => 410000,
            'nett_amount' => 400000,
            'status' => 'installment_pending',
            'is_installment' => true,
        ]);
        EnrollmentCourse::create([
            'invoice_id' => $crsParent->id,
            'course_id' => $course->id,
            'price' => 400000,
        ]);
        Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-PRF-CRS-T1',
            'amount' => 205000,
            'nett_amount' => 200000,
            'status' => 'paid',
            'is_installment' => false,
            'parent_invoice_id' => $crsParent->id,
            'installment_number' => 1,
            'paid_at' => Carbon::now(),
        ]);
        Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-PRF-CRS-T2',
            'amount' => 205000,
            'nett_amount' => 200000,
            'status' => 'pending',
            'is_installment' => false,
            'parent_invoice_id' => $crsParent->id,
            'installment_number' => 2,
            'installment_due_date' => Carbon::now()->addDays(7),
        ]);

        $crsResponse = $this->actingAs($this->buyer)
            ->get(route('profile.course.detail', ['course' => $course->slug]));
        $crsResponse->assertStatus(200);
        $crsResponse->assertInertia(fn ($page) => $page
            ->component('user/profile/course/detail')
            ->has('active_installment')
            ->where('active_installment.parent_invoice_id', $crsParent->id)
            ->where('active_installment.paid_terms', 1)
            ->where('active_installment.total_terms', 2)
        );

        // 4. Certification Program
        $certParent = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-PRF-CERT',
            'amount' => 810000,
            'nett_amount' => 800000,
            'status' => 'installment_pending',
            'is_installment' => true,
        ]);
        EnrollmentCertificationProgram::create([
            'invoice_id' => $certParent->id,
            'certification_program_id' => $this->program->id,
            'price' => 800000,
        ]);
        Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-PRF-CERT-T1',
            'amount' => 405000,
            'nett_amount' => 400000,
            'status' => 'paid',
            'is_installment' => false,
            'parent_invoice_id' => $certParent->id,
            'installment_number' => 1,
            'paid_at' => Carbon::now(),
        ]);
        Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-PRF-CERT-T2',
            'amount' => 405000,
            'nett_amount' => 400000,
            'status' => 'pending',
            'is_installment' => false,
            'parent_invoice_id' => $certParent->id,
            'installment_number' => 2,
            'installment_due_date' => Carbon::now()->addDays(14),
        ]);

        $certResponse = $this->actingAs($this->buyer)
            ->get(route('profile.certification-program.detail', ['program' => $this->program->slug]));
        $certResponse->assertStatus(200);
        $certResponse->assertInertia(fn ($page) => $page
            ->component('user/profile/certification-program/detail')
            ->has('active_installment')
            ->where('active_installment.parent_invoice_id', $certParent->id)
            ->where('active_installment.paid_terms', 1)
        );
    }

    /**
     * Test 17: Security - User cannot pay another user's installment (IDOR Protection)
     */
    public function test_cannot_pay_another_users_installment_idor_protection()
    {
        $otherUser = User::factory()->create(['email' => 'other@test.com']);
        $otherUser->assignRole('user');

        $parent = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-017',
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

        Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-017-T1',
            'amount' => 255000,
            'nett_amount' => 250000,
            'status' => 'paid',
            'is_installment' => false,
            'parent_invoice_id' => $parent->id,
            'installment_number' => 1,
            'paid_at' => Carbon::now(),
        ]);

        Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-017-T2',
            'amount' => 605000,
            'nett_amount' => 600000,
            'status' => 'pending',
            'is_installment' => false,
            'parent_invoice_id' => $parent->id,
            'installment_number' => 2,
            'installment_due_date' => Carbon::now()->addDays(15),
        ]);

        // otherUser attempts to initiate payTerm for buyer's parent invoice
        $response = $this->actingAs($otherUser)
            ->postJson("/installment/{$parent->id}/pay");

        // Must be rejected with 404 (Not Found) because user_id does not match
        $response->assertStatus(404);
    }

    /**
     * Test 18: Security - Passing child invoice ID instead of parent invoice ID to payTerm returns 404
     */
    public function test_cannot_pay_using_child_invoice_id_instead_of_parent()
    {
        $parent = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-018',
            'amount' => 850000,
            'nett_amount' => 850000,
            'status' => 'installment_pending',
            'is_installment' => true,
        ]);

        $child1 = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-018-T1',
            'amount' => 255000,
            'nett_amount' => 250000,
            'status' => 'paid',
            'is_installment' => false,
            'parent_invoice_id' => $parent->id,
            'installment_number' => 1,
            'paid_at' => Carbon::now(),
        ]);

        // Attempt payTerm with child invoice ID instead of parent
        $response = $this->actingAs($this->buyer)
            ->postJson("/installment/{$child1->id}/pay");

        $response->assertStatus(404);
    }

    /**
     * Test 19: Edge Case - Cannot pay when all terms are already fully paid
     */
    public function test_cannot_pay_already_fully_paid_installment()
    {
        $parent = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-019',
            'amount' => 860000,
            'nett_amount' => 850000,
            'status' => 'paid', // <-- already paid!
            'is_installment' => true,
        ]);

        EnrollmentCertificationProgram::create([
            'invoice_id' => $parent->id,
            'certification_program_id' => $this->program->id,
            'price' => 850000,
        ]);

        Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-019-T1',
            'amount' => 255000,
            'nett_amount' => 250000,
            'status' => 'paid',
            'is_installment' => false,
            'parent_invoice_id' => $parent->id,
            'installment_number' => 1,
            'paid_at' => Carbon::now(),
        ]);

        Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-019-T2',
            'amount' => 605000,
            'nett_amount' => 600000,
            'status' => 'paid',
            'is_installment' => false,
            'parent_invoice_id' => $parent->id,
            'installment_number' => 2,
            'paid_at' => Carbon::now(),
        ]);

        $response = $this->actingAs($this->buyer)
            ->postJson("/installment/{$parent->id}/pay");

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Semua cicilan sudah lunas.',
            ]);
    }

    /**
     * Test 20: Edge Case - Admin manual WhatsApp reminder validation (no phone or all paid)
     */
    public function test_admin_send_reminder_edge_cases()
    {
        $noPhoneBuyer = User::factory()->create([
            'name' => 'No Phone Buyer',
            'email' => 'nophone@test.com',
            'phone_number' => null,
        ]);
        $noPhoneBuyer->assignRole('user');

        $parent = Invoice::create([
            'user_id' => $noPhoneBuyer->id,
            'invoice_code' => 'AKS-INST-020',
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

        $term1 = Invoice::create([
            'user_id' => $noPhoneBuyer->id,
            'invoice_code' => 'AKS-INST-020-T1',
            'amount' => 255000,
            'nett_amount' => 250000,
            'status' => 'pending',
            'is_installment' => false,
            'parent_invoice_id' => $parent->id,
            'installment_number' => 1,
            'installment_due_date' => Carbon::now()->addDays(5),
        ]);

        // 1. Sending reminder when user has no phone number returns 422
        $responseNoPhone = $this->actingAs($this->admin)
            ->postJson("/admin/installments/{$term1->id}/send-reminder");

        $responseNoPhone->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Nomor WhatsApp peserta tidak ditemukan atau belum diisi.',
            ]);

        // 2. Sending reminder when all terms are paid returns 422
        $term1->update(['status' => 'paid', 'paid_at' => Carbon::now()]);
        $parent->update(['status' => 'paid']);
        $noPhoneBuyer->update(['phone_number' => '081234567899']);

        $responseAllPaid = $this->actingAs($this->admin)
            ->postJson("/admin/installments/{$parent->id}/send-reminder");

        $responseAllPaid->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Semua termin cicilan untuk invoice ini sudah lunas.',
            ]);
    }

    /**
     * Test 21: Doku Webhook Callback - DP payment activates enrollment, lifts access suspension, and records affiliate commission
     */
    public function test_doku_callback_dp_payment_activates_enrollment_and_clears_suspension()
    {
        $parent = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-021',
            'amount' => 860000,
            'nett_amount' => 850000,
            'status' => 'installment_pending',
            'is_installment' => true,
            'access_suspended_at' => Carbon::now()->subDays(2),
        ]);

        EnrollmentCertificationProgram::create([
            'invoice_id' => $parent->id,
            'certification_program_id' => $this->program->id,
            'price' => 850000,
            'completed_at' => null,
            'progress' => 0,
        ]);

        $term1 = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-021-T1',
            'amount' => 255000,
            'nett_amount' => 250000,
            'status' => 'pending',
            'is_installment' => false,
            'parent_invoice_id' => $parent->id,
            'installment_number' => 1,
            'installment_due_date' => Carbon::now()->addDays(5),
        ]);

        Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-021-T2',
            'amount' => 605000,
            'nett_amount' => 600000,
            'status' => 'pending',
            'is_installment' => false,
            'parent_invoice_id' => $parent->id,
            'installment_number' => 2,
            'installment_due_date' => Carbon::now()->addDays(20),
        ]);

        $callbackPayload = [
            'order' => [
                'invoice_number' => $term1->invoice_code,
            ],
            'transaction' => [
                'status' => 'SUCCESS',
            ],
            'payment' => [
                'payment_method' => 'DOKU',
                'payment_channel' => 'BCA_VA',
            ],
        ];

        $response = $this->postJson('/api/doku/callback', $callbackPayload);
        $response->assertStatus(200)
            ->assertJson(['message' => 'Success']);

        $term1->refresh();
        $this->assertEquals('paid', $term1->status);
        $this->assertNotNull($term1->paid_at);
        $this->assertEquals('BCA_VA', $term1->payment_channel);

        $parent->refresh();
        $this->assertEquals('installment_pending', $parent->status);
        $this->assertNull($parent->access_suspended_at);

        // Verify affiliate commission recorded for term 1
        $earning = AffiliateEarning::where('invoice_id', $term1->id)->first();
        $this->assertNotNull($earning);
        $this->assertEquals($this->affiliate->id, $earning->affiliate_user_id);
    }

    /**
     * Test 22: Doku Webhook Callback - Final term payment transitions parent invoice status to paid and fires TransactionPaid event
     */
    public function test_doku_callback_final_term_marks_parent_paid_and_triggers_event()
    {
        Event::fake([TransactionPaid::class]);

        $parent = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-022',
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

        // Term 1 already paid
        Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-022-T1',
            'amount' => 255000,
            'nett_amount' => 250000,
            'status' => 'paid',
            'is_installment' => false,
            'parent_invoice_id' => $parent->id,
            'installment_number' => 1,
            'paid_at' => Carbon::now()->subDays(10),
        ]);

        // Term 2 is pending and now receiving callback
        $term2 = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-022-T2',
            'amount' => 605000,
            'nett_amount' => 600000,
            'status' => 'pending',
            'is_installment' => false,
            'parent_invoice_id' => $parent->id,
            'installment_number' => 2,
            'installment_due_date' => Carbon::now()->addDays(5),
        ]);

        $callbackPayload = [
            'order' => [
                'invoice_number' => $term2->invoice_code,
            ],
            'transaction' => [
                'status' => 'SUCCESS',
            ],
            'payment' => [
                'payment_method' => 'DOKU',
                'payment_channel' => 'MANDIRI_VA',
            ],
        ];

        $response = $this->postJson('/api/doku/callback', $callbackPayload);
        $response->assertStatus(200);

        $term2->refresh();
        $this->assertEquals('paid', $term2->status);

        $parent->refresh();
        $this->assertEquals('paid', $parent->status);
        $this->assertNotNull($parent->paid_at);

        Event::assertDispatched(TransactionPaid::class, function ($event) use ($parent) {
            return $event->invoice->id === $parent->id;
        });
    }

    /**
     * Test 23: Doku Webhook Idempotency & Replay Attack - Duplicate callback returns 200 without creating duplicate affiliate earnings
     */
    public function test_doku_callback_idempotency_prevents_duplicate_affiliate_earning()
    {
        $parent = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-023',
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

        // Term 1 is ALREADY paid
        $term1 = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-023-T1',
            'amount' => 255000,
            'nett_amount' => 250000,
            'status' => 'paid',
            'is_installment' => false,
            'parent_invoice_id' => $parent->id,
            'installment_number' => 1,
            'paid_at' => Carbon::now()->subMinutes(10),
        ]);

        AffiliateEarning::create([
            'affiliate_user_id' => $this->affiliate->id,
            'invoice_id' => $term1->id,
            'amount' => 25000,
            'rate' => 10,
            'status' => 'approved',
        ]);

        $this->assertEquals(1, AffiliateEarning::where('invoice_id', $term1->id)->count());

        // Replay callback attack / duplicate webhook delivery
        $callbackPayload = [
            'order' => [
                'invoice_number' => $term1->invoice_code,
            ],
            'transaction' => [
                'status' => 'SUCCESS',
            ],
            'payment' => [
                'payment_method' => 'DOKU',
                'payment_channel' => 'BCA_VA',
            ],
        ];

        $response = $this->postJson('/api/doku/callback', $callbackPayload);
        $response->assertStatus(200)
            ->assertJson(['message' => 'Invoice already processed or not pending']);

        // Assert no duplicate affiliate earning was created
        $this->assertEquals(1, AffiliateEarning::where('invoice_id', $term1->id)->count());
    }

    /**
     * Test 24: Security & Validation - Combining installment with discount coupon or redeemed points is blocked
     */
    public function test_cannot_combine_installment_with_voucher_or_points()
    {
        // 1. With discount voucher
        $responseDiscount = $this->actingAs($this->buyer)
            ->postJson('/invoice/installment', [
                'type' => 'certification_program',
                'id' => $this->program->id,
                'discount_code_id' => 'promo-voucher-uuid',
            ]);

        $responseDiscount->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Cicilan tidak dapat dikombinasikan dengan poin atau voucher.',
            ]);

        // 2. With redeemed points
        $responsePoints = $this->actingAs($this->buyer)
            ->postJson('/invoice/installment', [
                'type' => 'certification_program',
                'id' => $this->program->id,
                'points_redeemed' => 1000,
            ]);

        $responsePoints->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Cicilan tidak dapat dikombinasikan dengan poin atau voucher.',
            ]);
    }

    /**
     * Test 25: Security & Validation - Attempting installment on disabled product or unconfigured terms is rejected
     */
    public function test_cannot_create_installment_when_disabled_or_terms_unconfigured()
    {
        // 1. Installment disabled on program
        $disabledProgram = CertificationProgram::create([
            'title' => 'Disabled Program',
            'slug' => 'disabled-program',
            'price' => 500000,
            'category_id' => Category::first()->id,
            'installment_enabled' => false,
        ]);

        $responseDisabled = $this->actingAs($this->buyer)
            ->postJson('/invoice/installment', [
                'type' => 'certification_program',
                'id' => $disabledProgram->id,
            ]);

        $responseDisabled->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Gagal membuat cicilan: Produk ini tidak tersedia untuk pembayaran cicilan.',
            ]);

        // 2. Installment enabled but no terms configured in DB
        $noTermsProgram = CertificationProgram::create([
            'title' => 'No Terms Program',
            'slug' => 'no-terms-program',
            'price' => 500000,
            'category_id' => Category::first()->id,
            'installment_enabled' => true,
        ]);

        $responseNoTerms = $this->actingAs($this->buyer)
            ->postJson('/invoice/installment', [
                'type' => 'certification_program',
                'id' => $noTermsProgram->id,
            ]);

        $responseNoTerms->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Gagal membuat cicilan: Konfigurasi termin cicilan belum diatur oleh admin.',
            ]);
    }

    /**
     * Test 26: Sequential Payment Enforcement - User cannot skip terms in a 3-term installment
     */
    public function test_sequential_payment_enforcement_cannot_skip_terms()
    {
        $parent = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-026',
            'amount' => 1215000,
            'nett_amount' => 1200000,
            'status' => 'installment_pending',
            'is_installment' => true,
        ]);

        EnrollmentCertificationProgram::create([
            'invoice_id' => $parent->id,
            'certification_program_id' => $this->program->id,
            'price' => 1200000,
        ]);

        // Term 1 (DP) - Paid
        Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-026-T1',
            'amount' => 405000,
            'nett_amount' => 400000,
            'status' => 'paid',
            'is_installment' => false,
            'parent_invoice_id' => $parent->id,
            'installment_number' => 1,
            'paid_at' => Carbon::now()->subDays(5),
        ]);

        // Term 2 - Pending
        Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-026-T2',
            'amount' => 405000,
            'nett_amount' => 400000,
            'status' => 'pending',
            'is_installment' => false,
            'parent_invoice_id' => $parent->id,
            'installment_number' => 2,
            'installment_due_date' => Carbon::now()->addDays(10),
        ]);

        // Term 3 - Pending
        $term3 = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-026-T3',
            'amount' => 405000,
            'nett_amount' => 400000,
            'status' => 'pending',
            'is_installment' => false,
            'parent_invoice_id' => $parent->id,
            'installment_number' => 3,
            'installment_due_date' => Carbon::now()->addDays(25),
        ]);

        $mockDoku = Mockery::mock(DokuService::class);
        $mockDoku->shouldReceive('createCheckout')
            ->once()
            ->andReturn([
                'response' => [
                    'payment' => [
                        'url' => 'https://mock.payment.com/checkout/term2',
                    ],
                ],
            ]);
        $this->app->instance(DokuService::class, $mockDoku);

        // When requesting payment, the system must strictly choose Term 2 (the next unpaid term)
        $response = $this->actingAs($this->buyer)
            ->postJson("/installment/{$parent->id}/pay");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'term_number' => 2,
            ]);

        // And Term 3 should not have any invoice_url set yet
        $term3->refresh();
        $this->assertNull($term3->invoice_url);
    }

    /**
     * Test 27: Overdue Protection & Access Restoral - Paying overdue installment via callback clears suspension
     */
    public function test_restoring_access_after_admin_approves_overdue_installment()
    {
        $parent = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-027',
            'amount' => 860000,
            'nett_amount' => 850000,
            'status' => 'installment_pending',
            'is_installment' => true,
            'access_suspended_at' => Carbon::now()->subDays(3),
        ]);

        EnrollmentCertificationProgram::create([
            'invoice_id' => $parent->id,
            'certification_program_id' => $this->program->id,
            'price' => 850000,
        ]);

        // Term 1 paid
        Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-027-T1',
            'amount' => 255000,
            'nett_amount' => 250000,
            'status' => 'paid',
            'is_installment' => false,
            'parent_invoice_id' => $parent->id,
            'installment_number' => 1,
            'paid_at' => Carbon::now()->subDays(15),
        ]);

        // Term 2 is overdue
        $term2 = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-027-T2',
            'amount' => 605000,
            'nett_amount' => 600000,
            'status' => 'pending',
            'is_installment' => false,
            'parent_invoice_id' => $parent->id,
            'installment_number' => 2,
            'installment_due_date' => Carbon::now()->subDays(2),
        ]);

        $this->assertTrue($parent->isAccessSuspended());

        // When Term 2 is settled (e.g. via payment callback)
        $callbackPayload = [
            'order' => [
                'invoice_number' => $term2->invoice_code,
            ],
            'transaction' => [
                'status' => 'SUCCESS',
            ],
            'payment' => [
                'payment_method' => 'DOKU',
                'payment_channel' => 'MANUAL_SETTLEMENT',
            ],
        ];

        $response = $this->postJson('/api/doku/callback', $callbackPayload);
        $response->assertStatus(200);

        $parent->refresh();
        $this->assertNull($parent->access_suspended_at);
        $this->assertFalse($parent->isAccessSuspended());
        $this->assertEquals('paid', $parent->status);
    }

    /**
     * Test 28: Multi-Batch / Re-enrollment - User with a previous fully paid installment can purchase again
     */
    public function test_user_can_purchase_again_after_previous_installment_is_fully_paid()
    {
        // 1. Fully paid previous installment
        $oldParent = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-OLD',
            'amount' => 860000,
            'nett_amount' => 850000,
            'status' => 'paid',
            'is_installment' => true,
            'paid_at' => Carbon::now()->subMonth(),
        ]);

        EnrollmentCertificationProgram::create([
            'invoice_id' => $oldParent->id,
            'certification_program_id' => $this->program->id,
            'price' => 850000,
            'completed_at' => Carbon::now()->subMonth(),
        ]);

        Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-OLD-T1',
            'amount' => 255000,
            'nett_amount' => 250000,
            'status' => 'paid',
            'is_installment' => false,
            'parent_invoice_id' => $oldParent->id,
            'installment_number' => 1,
            'paid_at' => Carbon::now()->subMonth(),
        ]);

        Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'AKS-INST-OLD-T2',
            'amount' => 605000,
            'nett_amount' => 600000,
            'status' => 'paid',
            'is_installment' => false,
            'parent_invoice_id' => $oldParent->id,
            'installment_number' => 2,
            'paid_at' => Carbon::now()->subMonth(),
        ]);

        // Verify getActiveInstallmentForUser returns is_fully_paid = true
        $activeData = Invoice::getActiveInstallmentForUser($this->buyer->id, 'certification_program', $this->program->id);
        $this->assertNotNull($activeData);
        $this->assertTrue($activeData['is_fully_paid']);

        // 2. Creating another installment for another program should succeed
        $newProgram = CertificationProgram::create([
            'title' => 'Advanced Financial Analytics',
            'slug' => 'advanced-financial-analytics',
            'price' => 1000000,
            'category_id' => Category::first()->id,
            'installment_enabled' => true,
        ]);

        ProductInstallmentTerm::create([
            'termable_type' => CertificationProgram::class,
            'termable_id' => $newProgram->id,
            'term_number' => 1,
            'amount' => 500000,
            'due_date' => Carbon::now()->addDays(5),
        ]);
        ProductInstallmentTerm::create([
            'termable_type' => CertificationProgram::class,
            'termable_id' => $newProgram->id,
            'term_number' => 2,
            'amount' => 500000,
            'due_date' => Carbon::now()->addDays(20),
        ]);

        $mockDoku = Mockery::mock(DokuService::class);
        $mockDoku->shouldReceive('createCheckout')
            ->once()
            ->andReturn([
                'response' => [
                    'payment' => [
                        'url' => 'https://mock.payment.com/checkout/new-program',
                    ],
                ],
            ]);
        $this->app->instance(DokuService::class, $mockDoku);

        $response = $this->actingAs($this->buyer)
            ->postJson('/invoice/installment', [
                'type' => 'certification_program',
                'id' => $newProgram->id,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'payment_url' => 'https://mock.payment.com/checkout/new-program',
            ]);
    }

    /**
     * Test 29: Private Class Installment - Requires valid schedule and creates proper enrollment
     */
    public function test_private_class_installment_requires_valid_schedule_and_creates_proper_enrollment()
    {
        $category = Category::first();

        $privateClass = PrivateClass::create([
            'title' => '1-on-1 Python Coaching',
            'slug' => '1-on-1-python-coaching',
            'price' => 1000000,
            'category_id' => $category->id,
            'installment_enabled' => true,
        ]);

        $schedule = PrivateClassSchedule::create([
            'private_class_id' => $privateClass->id,
            'start_time' => Carbon::now()->addDays(7),
            'end_time' => Carbon::now()->addDays(7)->addHours(2),
        ]);

        ProductInstallmentTerm::create([
            'termable_type' => PrivateClass::class,
            'termable_id' => $privateClass->id,
            'term_number' => 1,
            'amount' => 500000,
            'due_date' => Carbon::now()->addDays(3),
        ]);
        ProductInstallmentTerm::create([
            'termable_type' => PrivateClass::class,
            'termable_id' => $privateClass->id,
            'term_number' => 2,
            'amount' => 500000,
            'due_date' => Carbon::now()->addDays(14),
        ]);

        // 1. Without schedule or with invalid schedule returns 404
        $responseInvalidSchedule = $this->actingAs($this->buyer)
            ->postJson('/invoice/installment', [
                'type' => 'private',
                'id' => $privateClass->id,
                'private_class_schedule_id' => '00000000-0000-0000-0000-000000000000',
            ]);
        $responseInvalidSchedule->assertStatus(404);

        // 2. With valid schedule succeeds
        $mockDoku = Mockery::mock(DokuService::class);
        $mockDoku->shouldReceive('createCheckout')
            ->once()
            ->andReturn([
                'response' => [
                    'payment' => [
                        'url' => 'https://mock.payment.com/checkout/private-class',
                    ],
                ],
            ]);
        $this->app->instance(DokuService::class, $mockDoku);

        $responseValid = $this->actingAs($this->buyer)
            ->postJson('/invoice/installment', [
                'type' => 'private',
                'id' => $privateClass->id,
                'private_class_schedule_id' => $schedule->id,
            ]);

        $responseValid->assertStatus(200)
            ->assertJson([
                'success' => true,
                'payment_url' => 'https://mock.payment.com/checkout/private-class',
            ]);

        // Assert EnrollmentPrivate was created with private_class_schedule_id
        $enrollment = EnrollmentPrivate::where('private_class_id', $privateClass->id)->first();
        $this->assertNotNull($enrollment);
        $this->assertEquals($schedule->id, $enrollment->private_class_schedule_id);
    }
}

