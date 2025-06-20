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
                'description' => 'IDE Code Editor',
                'icon' => null,
            ],
            [
                'name' => 'Git',
                'slug' => Str::slug('Git'),
                'description' => 'Version Control System',
                'icon' => null,
            ],
            [
                'name' => 'Figma',
                'slug' => Str::slug('Figma'),
                'description' => 'Design Tool',
                'icon' => null,
            ],
            [
                'name' => 'PHP',
                'slug' => Str::slug('PHP'),
                'description' => 'Programming Language',
                'icon' => null,
            ],
            [
                'name' => 'Laravel',
                'slug' => Str::slug('Laravel'),
                'description' => 'Web Application Framework',
                'icon' => null,
            ],
            [
                'name' => 'MySQL',
                'slug' => Str::slug('MySQL'),
                'description' => 'Database Management System',
                'icon' => null,
            ],
            [
                'name' => 'React JS',
                'slug' => Str::slug('React JS'),
                'description' => 'Frontend Development',
                'icon' => null,
            ],
            [
                'name' => 'Excel',
                'slug' => Str::slug('Excel'),
                'description' => 'Spreadsheet Software',
                'icon' => null,
            ],
        ];

        foreach ($tools as $tool) {
            Tool::firstOrCreate(['name' => $tool['name']], $tool);
        }
    }
}
