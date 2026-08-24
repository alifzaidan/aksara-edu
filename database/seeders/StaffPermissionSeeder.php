<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class StaffPermissionSeeder extends Seeder
{
    /**
     * List of all menu modules and their permission keys.
     */
    public static function getPermissionModules(): array
    {
        return [
            [
                'group' => 'Manajemen Pengguna',
                'modules' => [
                    ['key' => 'users', 'label' => 'Pengguna'],
                    ['key' => 'affiliates', 'label' => 'Afiliasi'],
                    ['key' => 'mentors', 'label' => 'Mentor'],
                ],
            ],
            [
                'group' => 'Program Pelatihan',
                'modules' => [
                    ['key' => 'courses', 'label' => 'Kelas Online'],
                    ['key' => 'bootcamps', 'label' => 'Bootcamp'],
                    ['key' => 'webinars', 'label' => 'Webinar'],
                    ['key' => 'certification-programs', 'label' => 'Sertifikasi Program'],
                    ['key' => 'privates', 'label' => 'Private Class'],
                    ['key' => 'bundles', 'label' => 'Paket Bundling'],
                ],
            ],
            [
                'group' => 'Data Master',
                'modules' => [
                    ['key' => 'categories', 'label' => 'Kategori'],
                    ['key' => 'tools', 'label' => 'Tools'],
                    ['key' => 'certificates', 'label' => 'Sertifikat'],
                ],
            ],
            [
                'group' => 'Promosi & Marketing',
                'modules' => [
                    ['key' => 'discount-codes', 'label' => 'Kode Diskon'],
                    ['key' => 'promotions', 'label' => 'Flyer Promosi'],
                    ['key' => 'carousels', 'label' => 'Banner Carousel'],
                    ['key' => 'broadcasts', 'label' => 'Broadcast'],
                ],
            ],
            [
                'group' => 'Lainnya',
                'modules' => [
                    ['key' => 'transactions', 'label' => 'Transaksi'],
                    ['key' => 'articles', 'label' => 'Artikel'],
                    ['key' => 'referral', 'label' => 'Referral & Poin'],
                ],
            ],
        ];
    }

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Role::firstOrCreate(['name' => 'staff']);

        $modules = self::getPermissionModules();

        foreach ($modules as $group) {
            foreach ($group['modules'] as $module) {
                Permission::firstOrCreate(['name' => "{$module['key']}.view"]);
                Permission::firstOrCreate(['name' => "{$module['key']}.manage"]);
            }
        }
    }
}
