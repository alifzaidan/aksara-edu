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
        Role::firstOrCreate(['name' => 'mentor']);
        Role::firstOrCreate(['name' => 'student']);

        $admin = User::factory()->create([
            'name' => 'Admin',
            'email' => 'aksarateknologimandiri@gmail.com',
            'phone_number' => '085142505797',
            'bio' => 'Admin Ganteng',
            'password' => bcrypt('admin123'),
        ]);

        $admin->assignRole('admin');
    }
}
