<?php

namespace Tests\Feature;

use App\Exports\EarningsExport;
use App\Exports\TransactionsExport;
use App\Models\AffiliateEarning;
use App\Models\Bootcamp;
use App\Models\Bundle;
use App\Models\Category;
use App\Models\CertificationProgram;
use App\Models\Course;
use App\Models\EnrollmentBootcamp;
use App\Models\EnrollmentBundle;
use App\Models\EnrollmentCertificationProgram;
use App\Models\EnrollmentCourse;
use App\Models\EnrollmentPrivate;
use App\Models\EnrollmentWebinar;
use App\Models\Invoice;
use App\Models\PrivateClass;
use App\Models\User;
use App\Models\Webinar;
use Database\Seeders\StaffPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class StaffTransactionNominalTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        Role::firstOrCreate(['name' => 'admin']);
        Role::firstOrCreate(['name' => 'staff']);
        Role::firstOrCreate(['name' => 'mentor']);
        Role::firstOrCreate(['name' => 'affiliate']);
        Role::firstOrCreate(['name' => 'user']);
        $this->seed(StaffPermissionSeeder::class);
    }

    public function test_staff_sees_zeroed_revenue_stats_on_transactions_page()
    {
        $staff = User::factory()->create(['email_verified_at' => now()]);
        $staff->assignRole('staff');
        $staff->givePermissionTo('transactions.view');

        $buyer = User::factory()->create();
        Invoice::create([
            'user_id' => $buyer->id,
            'invoice_code' => 'INV-TEST-001',
            'amount' => 500000,
            'discount_amount' => 50000,
            'transaction_fee' => 5000,
            'nett_amount' => 455000,
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        $response = $this->actingAs($staff)->get(route('transactions.index'));
        $response->assertStatus(200);

        $response->assertInertia(fn ($page) => $page
            ->component('admin/transactions/index')
            ->where('statistics.revenue.total_revenue', 0)
            ->where('statistics.revenue.total_gross', 0)
            ->where('statistics.revenue.total_discount', 0)
            ->where('statistics.revenue.average_transaction', 0)
            ->where('statistics.period.today_revenue', 0)
            ->where('statistics.period.month_revenue', 0)
            ->where('statistics.overview.total_transactions', 1)
            ->where('statistics.overview.paid_transactions', 1)
        );
    }

    public function test_admin_sees_actual_revenue_stats_on_transactions_page()
    {
        $admin = User::factory()->create(['email_verified_at' => now()]);
        $admin->assignRole('admin');

        $buyer = User::factory()->create();
        Invoice::create([
            'user_id' => $buyer->id,
            'invoice_code' => 'INV-TEST-002',
            'amount' => 500000,
            'discount_amount' => 50000,
            'transaction_fee' => 5000,
            'nett_amount' => 455000,
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        $response = $this->actingAs($admin)->get(route('transactions.index'));
        $response->assertStatus(200);

        $response->assertInertia(fn ($page) => $page
            ->component('admin/transactions/index')
            ->where('statistics.revenue.total_revenue', 455000)
            ->where('statistics.revenue.total_gross', 500000)
            ->where('statistics.revenue.total_discount', 50000)
            ->where('statistics.overview.total_transactions', 1)
        );
    }

    public function test_staff_export_omits_nominal_columns()
    {
        $staff = User::factory()->create(['email_verified_at' => now()]);
        $staff->assignRole('staff');
        $staff->givePermissionTo('transactions.view');

        $buyer = User::factory()->create(['name' => 'Budi Pembeli']);
        $invoice = Invoice::create([
            'user_id' => $buyer->id,
            'invoice_code' => 'INV-TEST-003',
            'amount' => 300000,
            'discount_amount' => 20000,
            'transaction_fee' => 4000,
            'nett_amount' => 284000,
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        $this->actingAs($staff);
        $export = new TransactionsExport([], true);

        $headings = $export->headings();
        $this->assertNotContains('Harga Asli', $headings);
        $this->assertNotContains('Diskon', $headings);
        $this->assertNotContains('Biaya Admin', $headings);
        $this->assertNotContains('Total Bayar', $headings);
        $this->assertContains('Kode Invoice', $headings);
        $this->assertContains('Nama Pembeli', $headings);

        $mapped = $export->map($invoice);
        $this->assertNotContains('Rp 300.000', $mapped);
        $this->assertNotContains('Rp 284.000', $mapped);
        $this->assertContains('INV-TEST-003', $mapped);
        $this->assertContains('Budi Pembeli', $mapped);

        // Also test HTTP export route responds with 200
        $response = $this->actingAs($staff)->get(route('transactions.export'));
        $response->assertStatus(200);
    }

    public function test_admin_export_includes_nominal_columns()
    {
        $admin = User::factory()->create(['email_verified_at' => now()]);
        $admin->assignRole('admin');

        $buyer = User::factory()->create(['name' => 'Admin Buyer']);
        $invoice = Invoice::create([
            'user_id' => $buyer->id,
            'invoice_code' => 'INV-TEST-004',
            'amount' => 500000,
            'discount_amount' => 50000,
            'transaction_fee' => 5000,
            'nett_amount' => 455000,
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        $this->actingAs($admin);
        $export = new TransactionsExport([], false);

        $headings = $export->headings();
        $this->assertContains('Harga Asli', $headings);
        $this->assertContains('Diskon', $headings);
        $this->assertContains('Biaya Admin', $headings);
        $this->assertContains('Total Bayar', $headings);

        $mapped = $export->map($invoice);
        $this->assertContains('Rp 500.000', $mapped);
        $this->assertContains('Rp 455.000', $mapped);
    }

    public function test_staff_cannot_generate_invoice_pdf()
    {
        $staff = User::factory()->create(['email_verified_at' => now()]);
        $staff->assignRole('staff');

        $buyer = User::factory()->create();
        $invoice = Invoice::create([
            'user_id' => $buyer->id,
            'invoice_code' => 'INV-TEST-005',
            'amount' => 200000,
            'nett_amount' => 200000,
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        $response = $this->actingAs($staff)->get(route('invoice.pdf', $invoice->id));
        $response->assertStatus(403);
    }

    public function test_staff_sees_sanitized_transactions_on_courses_detail()
    {
        $staff = User::factory()->create(['email_verified_at' => now()]);
        $staff->assignRole('staff');
        $staff->givePermissionTo('courses.view');

        $category = Category::create(['name' => 'Programming', 'slug' => 'programming']);
        $course = Course::create([
            'title' => 'Kursus Laravel',
            'slug' => 'kursus-laravel',
            'category_id' => $category->id,
            'user_id' => $staff->id,
            'price' => 250000,
            'strikethrough_price' => 500000,
            'level' => 'beginner',
            'status' => 'published',
        ]);

        $buyer = User::factory()->create();
        $invoice = Invoice::create([
            'user_id' => $buyer->id,
            'invoice_code' => 'INV-COURSE-001',
            'amount' => 250000,
            'nett_amount' => 250000,
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        EnrollmentCourse::create([
            'user_id' => $buyer->id,
            'course_id' => $course->id,
            'invoice_id' => $invoice->id,
            'price' => 250000,
        ]);

        $response = $this->actingAs($staff)->get(route('courses.show', $course->id));
        $response->assertStatus(200);

        $response->assertInertia(fn ($page) => $page
            ->component('admin/courses/show')
            ->where('transactions.0.amount', 0)
            ->where('transactions.0.nett_amount', 0)
        );
    }

    public function test_staff_sees_sanitized_transactions_on_webinars_detail()
    {
        $staff = User::factory()->create(['email_verified_at' => now()]);
        $staff->assignRole('staff');
        $staff->givePermissionTo('webinars.view');

        $category = Category::create(['name' => 'Webinar Cat', 'slug' => 'webinar-cat']);
        $webinar = Webinar::create([
            'title' => 'Webinar Tech',
            'slug' => 'webinar-tech',
            'category_id' => $category->id,
            'user_id' => $staff->id,
            'price' => 150000,
            'strikethrough_price' => 300000,
            'status' => 'published',
            'start_time' => now()->addDays(2),
            'end_time' => now()->addDays(2)->addHours(2),
        ]);

        $buyer = User::factory()->create();
        $invoice = Invoice::create([
            'user_id' => $buyer->id,
            'invoice_code' => 'INV-WEBINAR-001',
            'amount' => 150000,
            'nett_amount' => 150000,
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        EnrollmentWebinar::create([
            'user_id' => $buyer->id,
            'webinar_id' => $webinar->id,
            'invoice_id' => $invoice->id,
            'price' => 150000,
        ]);

        $response = $this->actingAs($staff)->get(route('webinars.show', $webinar->id));
        $response->assertStatus(200);

        $response->assertInertia(fn ($page) => $page
            ->component('admin/webinars/show')
            ->where('transactions.0.amount', 0)
            ->where('transactions.0.nett_amount', 0)
        );
    }

    public function test_staff_sees_sanitized_transactions_on_bootcamps_detail()
    {
        $staff = User::factory()->create(['email_verified_at' => now()]);
        $staff->assignRole('staff');
        $staff->givePermissionTo('bootcamps.view');

        $category = Category::create(['name' => 'Bootcamp Cat', 'slug' => 'bootcamp-cat']);
        $bootcamp = Bootcamp::create([
            'title' => 'Bootcamp Fullstack',
            'slug' => 'bootcamp-fullstack',
            'category_id' => $category->id,
            'price' => 750000,
            'strikethrough_price' => 1500000,
            'status' => 'published',
            'start_date' => now()->addDays(5),
            'end_date' => now()->addDays(30),
        ]);

        $buyer = User::factory()->create();
        $invoice = Invoice::create([
            'user_id' => $buyer->id,
            'invoice_code' => 'INV-BOOTCAMP-001',
            'amount' => 750000,
            'nett_amount' => 750000,
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        EnrollmentBootcamp::create([
            'user_id' => $buyer->id,
            'bootcamp_id' => $bootcamp->id,
            'invoice_id' => $invoice->id,
            'price' => 750000,
        ]);

        $response = $this->actingAs($staff)->get(route('bootcamps.show', $bootcamp->id));
        $response->assertStatus(200);

        $response->assertInertia(fn ($page) => $page
            ->component('admin/bootcamps/show')
            ->where('transactions.0.amount', 0)
            ->where('transactions.0.nett_amount', 0)
        );
    }

    public function test_staff_sees_sanitized_transactions_on_certification_programs_detail()
    {
        $staff = User::factory()->create(['email_verified_at' => now()]);
        $staff->assignRole('staff');
        $staff->givePermissionTo('certification-programs.view');

        $category = Category::create(['name' => 'Cert Cat', 'slug' => 'cert-cat']);
        $program = CertificationProgram::create([
            'title' => 'Sertifikasi Developer',
            'slug' => 'sertifikasi-developer',
            'category_id' => $category->id,
            'type' => 'regular',
            'price' => 1200000,
            'strikethrough_price' => 2000000,
            'status' => 'published',
            'start_date' => now()->addDays(10),
            'end_date' => now()->addDays(40),
        ]);

        $buyer = User::factory()->create();
        $invoice = Invoice::create([
            'user_id' => $buyer->id,
            'invoice_code' => 'INV-CERT-001',
            'amount' => 1200000,
            'nett_amount' => 1200000,
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        EnrollmentCertificationProgram::create([
            'user_id' => $buyer->id,
            'certification_program_id' => $program->id,
            'invoice_id' => $invoice->id,
            'price' => 1200000,
        ]);

        $response = $this->actingAs($staff)->get(route('certification-programs.show', $program->id));
        $response->assertStatus(200);

        $response->assertInertia(fn ($page) => $page
            ->component('admin/certification-programs/show')
            ->where('transactions.0.amount', 0)
            ->where('transactions.0.nett_amount', 0)
        );
    }

    public function test_staff_sees_sanitized_transactions_on_bundles_detail()
    {
        $staff = User::factory()->create(['email_verified_at' => now()]);
        $staff->assignRole('staff');
        $staff->givePermissionTo('bundles.view');

        $bundle = Bundle::create([
            'user_id' => $staff->id,
            'title' => 'Bundle Super Tech',
            'slug' => 'bundle-super-tech',
            'description' => 'Semua program tech',
            'price' => 1500000,
            'status' => 'published',
        ]);

        $buyer = User::factory()->create();
        $invoice = Invoice::create([
            'user_id' => $buyer->id,
            'invoice_code' => 'INV-BUNDLE-001',
            'amount' => 1500000,
            'nett_amount' => 1500000,
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        EnrollmentBundle::create([
            'bundle_id' => $bundle->id,
            'invoice_id' => $invoice->id,
            'price' => 1500000,
        ]);

        $response = $this->actingAs($staff)->get(route('bundles.show', $bundle->id));
        $response->assertStatus(200);

        $response->assertInertia(fn ($page) => $page
            ->component('admin/bundles/show')
            ->where('bundle.enrollments.0.invoice.amount', 0)
            ->where('bundle.enrollments.0.invoice.nett_amount', 0)
        );
    }

    public function test_staff_sees_zero_total_revenue_on_bootcamps_index()
    {
        $staff = User::factory()->create(['email_verified_at' => now()]);
        $staff->assignRole('staff');
        $staff->givePermissionTo('bootcamps.view');

        $response = $this->actingAs($staff)->get(route('bootcamps.index'));
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('admin/bootcamps/index')
            ->where('statistics.performance.total_revenue', 0)
        );
    }

    public function test_staff_sees_zero_total_revenue_on_courses_index()
    {
        $staff = User::factory()->create(['email_verified_at' => now()]);
        $staff->assignRole('staff');
        $staff->givePermissionTo('courses.view');

        $response = $this->actingAs($staff)->get(route('courses.index'));
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('admin/courses/index')
            ->where('statistics.performance.total_revenue', 0)
        );
    }

    public function test_staff_sees_zero_total_revenue_on_webinars_index()
    {
        $staff = User::factory()->create(['email_verified_at' => now()]);
        $staff->assignRole('staff');
        $staff->givePermissionTo('webinars.view');

        $response = $this->actingAs($staff)->get(route('webinars.index'));
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('admin/webinars/index')
            ->where('statistics.performance.total_revenue', 0)
        );
    }

    public function test_staff_sees_zero_total_revenue_on_bundles_index()
    {
        $staff = User::factory()->create(['email_verified_at' => now()]);
        $staff->assignRole('staff');
        $staff->givePermissionTo('bundles.view');

        $response = $this->actingAs($staff)->get(route('bundles.index'));
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('admin/bundles/index')
            ->where('statistics.performance.total_revenue', 0)
        );
    }

    public function test_staff_sees_zeroed_earnings_on_affiliates_index()
    {
        $staff = User::factory()->create(['email_verified_at' => now()]);
        $staff->assignRole('staff');
        $staff->givePermissionTo('affiliates.view');

        $affiliate = User::factory()->create();
        $affiliate->assignRole('affiliate');

        $buyer = User::factory()->create();
        $invoice = Invoice::create([
            'user_id' => $buyer->id,
            'invoice_code' => 'INV-AFF-001',
            'amount' => 500000,
            'nett_amount' => 500000,
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        AffiliateEarning::create([
            'affiliate_user_id' => $affiliate->id,
            'invoice_id' => $invoice->id,
            'amount' => 50000,
            'rate' => 10,
            'status' => 'approved',
        ]);

        $response = $this->actingAs($staff)->get(route('affiliates.index'));
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('admin/affiliates/index')
            ->where('statistics.earnings.total_earnings', 0)
            ->where('statistics.earnings.paid_commission', 0)
            ->where('statistics.earnings.pending_commission', 0)
            ->where('affiliates.data.0.total_earnings', 0)
        );
    }

    public function test_staff_sees_zeroed_stats_on_affiliates_show()
    {
        $staff = User::factory()->create(['email_verified_at' => now()]);
        $staff->assignRole('staff');
        $staff->givePermissionTo('affiliates.view');

        $affiliate = User::factory()->create();
        $affiliate->assignRole('affiliate');

        $buyer = User::factory()->create();
        $invoice = Invoice::create([
            'user_id' => $buyer->id,
            'invoice_code' => 'INV-AFF-002',
            'amount' => 500000,
            'nett_amount' => 500000,
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        AffiliateEarning::create([
            'affiliate_user_id' => $affiliate->id,
            'invoice_id' => $invoice->id,
            'amount' => 50000,
            'rate' => 10,
            'status' => 'approved',
        ]);

        $response = $this->actingAs($staff)->get(route('affiliates.show', $affiliate->id));
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('admin/affiliates/show')
            ->where('stats.total_commission', 0)
            ->where('stats.paid_commission', 0)
            ->where('stats.available_commission', 0)
            ->where('earnings.0.amount', 0)
            ->where('earnings.0.invoice.nett_amount', 0)
        );
    }

    public function test_staff_sees_zeroed_earnings_on_mentors_index()
    {
        $staff = User::factory()->create(['email_verified_at' => now()]);
        $staff->assignRole('staff');
        $staff->givePermissionTo('mentors.view');

        $mentor = User::factory()->create();
        $mentor->assignRole('mentor');

        $buyer = User::factory()->create();
        $invoice = Invoice::create([
            'user_id' => $buyer->id,
            'invoice_code' => 'INV-MEN-001',
            'amount' => 500000,
            'nett_amount' => 500000,
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        AffiliateEarning::create([
            'affiliate_user_id' => $mentor->id,
            'invoice_id' => $invoice->id,
            'amount' => 50000,
            'rate' => 10,
            'status' => 'approved',
        ]);

        $response = $this->actingAs($staff)->get(route('mentors.index'));
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('admin/mentors/index')
            ->where('statistics.earnings.total_earnings', 0)
            ->where('statistics.earnings.paid_commission', 0)
            ->where('statistics.earnings.pending_commission', 0)
            ->where('mentors.data.0.total_earnings', 0)
        );
    }

    public function test_staff_sees_zeroed_stats_on_mentors_show()
    {
        $staff = User::factory()->create(['email_verified_at' => now()]);
        $staff->assignRole('staff');
        $staff->givePermissionTo('mentors.view');

        $mentor = User::factory()->create();
        $mentor->assignRole('mentor');

        $buyer = User::factory()->create();
        $invoice = Invoice::create([
            'user_id' => $buyer->id,
            'invoice_code' => 'INV-MEN-002',
            'amount' => 500000,
            'nett_amount' => 500000,
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        AffiliateEarning::create([
            'affiliate_user_id' => $mentor->id,
            'invoice_id' => $invoice->id,
            'amount' => 50000,
            'rate' => 10,
            'status' => 'approved',
        ]);

        $response = $this->actingAs($staff)->get(route('mentors.show', $mentor->id));
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('admin/mentors/show')
            ->where('stats.total_commission', 0)
            ->where('stats.paid_commission', 0)
            ->where('stats.available_commission', 0)
            ->where('earnings.0.amount', 0)
            ->where('earnings.0.invoice.nett_amount', 0)
        );
    }

    public function test_staff_sees_zeroed_amounts_on_affiliate_earnings_index()
    {
        $staff = User::factory()->create(['email_verified_at' => now()]);
        $staff->assignRole('staff');

        $affiliate = User::factory()->create();
        $affiliate->assignRole('affiliate');

        $buyer = User::factory()->create();
        $invoice = Invoice::create([
            'user_id' => $buyer->id,
            'invoice_code' => 'INV-EARN-001',
            'amount' => 500000,
            'nett_amount' => 500000,
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        AffiliateEarning::create([
            'affiliate_user_id' => $affiliate->id,
            'invoice_id' => $invoice->id,
            'amount' => 50000,
            'rate' => 10,
            'status' => 'approved',
        ]);

        $response = $this->actingAs($staff)->get(route('earnings.index'));
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('admin/earnings/index')
            ->where('earnings.data.0.amount', 0)
            ->where('earnings.data.0.invoice.nett_amount', 0)
        );
    }

    public function test_staff_earnings_export_omits_nominal_columns()
    {
        $staff = User::factory()->create(['email_verified_at' => now()]);
        $staff->assignRole('staff');

        $buyer = User::factory()->create(['name' => 'John Earning']);
        $invoice = Invoice::create([
            'user_id' => $buyer->id,
            'invoice_code' => 'INV-EARN-EXP-001',
            'amount' => 500000,
            'nett_amount' => 500000,
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        $earning = AffiliateEarning::create([
            'affiliate_user_id' => $buyer->id,
            'invoice_id' => $invoice->id,
            'amount' => 50000,
            'rate' => 10,
            'status' => 'approved',
        ]);

        $export = new EarningsExport([], $staff->id, false, true);

        $headings = $export->headings();
        $this->assertNotContains('Harga (IDR)', $headings);
        $this->assertNotContains('Komisi (IDR)', $headings);
        $this->assertContains('Kode Invoice', $headings);
        $this->assertContains('Rate (%)', $headings);

        $mapped = $export->map($earning);
        $this->assertNotContains(500000.0, $mapped);
        $this->assertNotContains(50000.0, $mapped);
    }

    public function test_staff_sees_zeroed_revenue_and_sanitized_transactions_on_privates()
    {
        $staff = User::factory()->create(['email_verified_at' => now()]);
        $staff->assignRole('staff');
        $staff->givePermissionTo('privates.view');

        $category = Category::create(['name' => 'Private Cat', 'slug' => 'private-cat']);
        $privateClass = PrivateClass::create([
            'user_id' => $staff->id,
            'category_id' => $category->id,
            'title' => 'Private 1 on 1 Tech',
            'slug' => 'private-1-on-1-tech',
            'mode' => 'online',
            'price' => 500000,
            'strikethrough_price' => 1000000,
            'status' => 'published',
            'start_time' => now()->addDays(2),
            'end_time' => now()->addDays(2)->addHours(1),
        ]);

        $buyer = User::factory()->create();
        $invoice = Invoice::create([
            'user_id' => $buyer->id,
            'invoice_code' => 'INV-PRIV-001',
            'amount' => 500000,
            'nett_amount' => 500000,
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        EnrollmentPrivate::create([
            'user_id' => $buyer->id,
            'private_class_id' => $privateClass->id,
            'invoice_id' => $invoice->id,
            'price' => 500000,
        ]);

        // Index test
        $indexResponse = $this->actingAs($staff)->get(route('privates.index'));
        $indexResponse->assertStatus(200);
        $indexResponse->assertInertia(fn ($page) => $page
            ->component('admin/privates/index')
            ->where('statistics.revenue', 0)
        );

        // Show test
        $showResponse = $this->actingAs($staff)->get(route('privates.show', $privateClass->id));
        $showResponse->assertStatus(200);
        $showResponse->assertInertia(fn ($page) => $page
            ->component('admin/privates/show')
            ->where('transactions.0.amount', 0)
            ->where('transactions.0.nett_amount', 0)
        );
    }
}
