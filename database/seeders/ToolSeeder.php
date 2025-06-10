<?php

namespace Database\Seeders;

use App\Models\Tool;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Support\Str;
use Illuminate\Database\Seeder;

class ToolSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tools = [
            [
                'name' => 'VS Code',
                'slug' => Str::slug('VS Code'),
                'description' => null,
                'icon' => null,
            ],
            [
                'name' => 'Git',
                'slug' => Str::slug('Git'),
                'description' => null,
                'icon' => null,
            ],
            [
                'name' => 'Figma',
                'slug' => Str::slug('Figma'),
                'description' => null,
                'icon' => null,
            ],
            [
                'name' => 'HTML',
                'slug' => Str::slug('HTML'),
                'description' => null,
                'icon' => null,
            ],
            [
                'name' => 'CSS',
                'slug' => Str::slug('CSS'),
                'description' => null,
                'icon' => null,
            ],
            [
                'name' => 'JavaScript',
                'slug' => Str::slug('JavaScript'),
                'description' => null,
                'icon' => null,
            ],
            [
                'name' => 'PHP',
                'slug' => Str::slug('PHP'),
                'description' => null,
                'icon' => null,
            ],
            [
                'name' => 'Laravel',
                'slug' => Str::slug('Laravel'),
                'description' => null,
                'icon' => null,
            ],
            [
                'name' => 'MySQL',
                'slug' => Str::slug('MySQL'),
                'description' => null,
                'icon' => null,
            ],
            [
                'name' => 'React JS',
                'slug' => Str::slug('React JS'),
                'description' => null,
                'icon' => null,
            ],
            [
                'name' => 'Node JS',
                'slug' => Str::slug('Node JS'),
                'description' => null,
                'icon' => null,
            ],
            [
                'name' => 'Express JS',
                'slug' => Str::slug('Express JS'),
                'description' => null,
                'icon' => null,
            ],
            [
                'name' => 'Zoom',
                'slug' => Str::slug('Zoom'),
                'description' => null,
                'icon' => null,
            ],
            [
                'name' => 'Google Meet',
                'slug' => Str::slug('Google Meet'),
                'description' => null,
                'icon' => null,
            ],
        ];

        foreach ($tools as $tool) {
            Tool::firstOrCreate(['name' => $tool['name']], $tool);
        }
    }
}
