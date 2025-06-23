<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        Role::firstOrCreate(['name' => 'admin']);
        Role::firstOrCreate(['name' => 'affiliate']);
        Role::firstOrCreate(['name' => 'mentor']);
        Role::firstOrCreate(['name' => 'student']);

        $admin = User::factory()->create([
            'name' => 'Admin',
            'email' => 'admin@gmail.com',
            'phone_number' => '085142505797',
            'bio' => 'Admin Ganteng',
            'password' => bcrypt('admin123'),
        ]);

        $adminAffiliate = User::factory()->create([
            'name' => 'Aksara Teknologi Mandiri',
            'email' => 'aksarateknologimandiri@gmail.com',
            'phone_number' => '085142505797',
            'bio' => "Aksara Teknologi Mandiri's Affiliate",
            'password' => bcrypt('aksara123'),
            'affiliate_code' => 'ATM2025',
            'affiliate_status' => 'Active',
            'commission' => 15,
        ]);

        $admin->assignRole('admin');
        $adminAffiliate->assignRole('affiliate');

        $this->call([
            ToolSeeder::class,
            CategorySeeder::class,
        ]);
    }
}
