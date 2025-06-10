<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Support\Str;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tools = [
            [
                'name' => 'Web Development',
                'slug' => Str::slug('Web Development'),
            ],
            [
                'name' => 'Mobile Development',
                'slug' => Str::slug('Mobile Development'),
            ],
            [
                'name' => 'Data Science',
                'slug' => Str::slug('Data Science'),
            ],
            [
                'name' => 'UI/UX Design',
                'slug' => Str::slug('UI/UX Design'),
            ],
            [
                'name' => 'Cloud Computing',
                'slug' => Str::slug('Cloud Computing'),
            ],
            [
                'name' => 'Digital Marketing',
                'slug' => Str::slug('Digital Marketing'),
            ],
            [
                'name' => 'Accounting & Finance',
                'slug' => Str::slug('Accounting & Finance'),
            ],
            [
                'name' => 'Design & Creative',
                'slug' => Str::slug('Design & Creative'),
            ],
        ];

        foreach ($tools as $tool) {
            Category::firstOrCreate(['name' => $tool['name']], $tool);
        }
    }
}
