<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\StaffPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class StaffPermissionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::firstOrCreate(['name' => 'admin']);
        Role::firstOrCreate(['name' => 'staff']);
        Role::firstOrCreate(['name' => 'mentor']);
        Role::firstOrCreate(['name' => 'affiliate']);
        Role::firstOrCreate(['name' => 'user']);
        $this->seed(StaffPermissionSeeder::class);
    }

    public function test_admin_can_access_staff_management()
    {
        $admin = User::factory()->create([
            'email_verified_at' => now(),
        ]);
        $admin->assignRole('admin');

        $response = $this->actingAs($admin)->get(route('staff.index'));
        $response->assertStatus(200);
    }

    public function test_staff_cannot_access_staff_management()
    {
        $staff = User::factory()->create([
            'email_verified_at' => now(),
        ]);
        $staff->assignRole('staff');

        $response = $this->actingAs($staff)->get(route('staff.index'));
        $response->assertStatus(403);
    }

    public function test_staff_with_view_permission_can_access_index_but_not_create()
    {
        $staff = User::factory()->create([
            'email_verified_at' => now(),
        ]);
        $staff->assignRole('staff');
        $staff->givePermissionTo('bootcamps.view');

        // Can access index
        $indexResponse = $this->actingAs($staff)->get(route('bootcamps.index'));
        $indexResponse->assertStatus(200);

        // Cannot access create
        $createResponse = $this->actingAs($staff)->get(route('bootcamps.create'));
        $createResponse->assertStatus(403);
    }

    public function test_staff_with_manage_permission_can_access_create()
    {
        $staff = User::factory()->create([
            'email_verified_at' => now(),
        ]);
        $staff->assignRole('staff');
        $staff->givePermissionTo(['bootcamps.view', 'bootcamps.manage']);

        $response = $this->actingAs($staff)->get(route('bootcamps.create'));
        $response->assertStatus(200);
    }

    public function test_staff_without_permission_cannot_access_module()
    {
        $staff = User::factory()->create([
            'email_verified_at' => now(),
        ]);
        $staff->assignRole('staff');

        $response = $this->actingAs($staff)->get(route('webinars.index'));
        $response->assertStatus(403);
    }

    public function test_admin_can_create_staff_with_permissions()
    {
        $admin = User::factory()->create([
            'email_verified_at' => now(),
        ]);
        $admin->assignRole('admin');

        $payload = [
            'name' => 'Staff Test',
            'email' => 'stafftest@example.com',
            'phone_number' => '08123456789',
            'password' => 'password123',
            'instance' => 'Aksademy',
            'city' => 'Malang',
            'permissions' => ['bootcamps.view', 'bootcamps.manage', 'webinars.view'],
        ];

        $response = $this->actingAs($admin)->post(route('staff.store'), $payload);
        $response->assertRedirect(route('staff.index'));

        $staffUser = User::where('email', 'stafftest@example.com')->first();
        $this->assertNotNull($staffUser);
        $this->assertTrue($staffUser->hasRole('staff'));
        $this->assertTrue($staffUser->hasPermissionTo('bootcamps.view'));
        $this->assertTrue($staffUser->hasPermissionTo('bootcamps.manage'));
        $this->assertTrue($staffUser->hasPermissionTo('webinars.view'));
        $this->assertFalse($staffUser->hasPermissionTo('webinars.manage'));
    }

    public function test_admin_can_update_staff_and_permissions()
    {
        $admin = User::factory()->create([
            'email_verified_at' => now(),
        ]);
        $admin->assignRole('admin');

        $staff = User::factory()->create([
            'email_verified_at' => now(),
        ]);
        $staff->assignRole('staff');
        $staff->syncPermissions(['bootcamps.view']);

        $payload = [
            'name' => 'Staff Updated',
            'email' => $staff->email,
            'phone_number' => '0899999999',
            'instance' => 'Updated Org',
            'city' => 'Surabaya',
            'permissions' => ['courses.view', 'courses.manage'],
        ];

        $response = $this->actingAs($admin)->put(route('staff.update', $staff->id), $payload);
        $response->assertRedirect(route('staff.index'));

        $staff->refresh();
        $this->assertEquals('Staff Updated', $staff->name);
        $this->assertFalse($staff->hasPermissionTo('bootcamps.view'));
        $this->assertTrue($staff->hasPermissionTo('courses.view'));
        $this->assertTrue($staff->hasPermissionTo('courses.manage'));
    }

    public function test_admin_can_delete_staff()
    {
        $admin = User::factory()->create([
            'email_verified_at' => now(),
        ]);
        $admin->assignRole('admin');

        $staff = User::factory()->create([
            'email_verified_at' => now(),
        ]);
        $staff->assignRole('staff');

        $response = $this->actingAs($admin)->delete(route('staff.destroy', $staff->id));
        $response->assertRedirect(route('staff.index'));

        $this->assertNull(User::find($staff->id));
    }

    public function test_staff_login_redirects_to_dashboard()
    {
        $staff = User::factory()->create([
            'email' => 'stafflogin@example.com',
            'password' => bcrypt('password123'),
            'email_verified_at' => now(),
        ]);
        $staff->assignRole('staff');

        $response = $this->post(route('login'), [
            'email' => 'stafflogin@example.com',
            'password' => 'password123',
        ]);

        $response->assertRedirect(route('dashboard'));
    }

    public function test_staff_can_view_dashboard_without_sensitive_data()
    {
        $staff = User::factory()->create([
            'email_verified_at' => now(),
        ]);
        $staff->assignRole('staff');
        $staff->givePermissionTo(['bootcamps.view', 'courses.manage']);

        $response = $this->actingAs($staff)->get(route('dashboard'));
        $response->assertStatus(200);

        $response->assertInertia(fn ($page) => $page
            ->component('admin/dashboard/index')
            ->has('stats.total_users')
            ->has('stats.accessible_modules')
            ->missing('stats.total_revenue')
            ->missing('stats.recent_sales')
            ->missing('stats.revenue_data')
        );
    }
}
