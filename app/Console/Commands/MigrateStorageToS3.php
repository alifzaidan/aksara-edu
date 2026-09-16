<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

class MigrateStorageToS3 extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'storage:migrate-s3
        {--months=3 : Number of recent months of data to migrate (default: 3)}
        {--days= : Number of recent days of data to migrate (overrides --months)}
        {--all : Migrate all files without date filtering}
        {--dry-run : Only check and list files that would be uploaded without uploading}
        {--overwrite : Overwrite files that already exist on S3}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migrate recent local storage files (storage/app/public) to IDCloudHost Object Storage (S3) (default: last 3 months)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $baseDir = storage_path('app/public');

        if (!File::isDirectory($baseDir)) {
            $this->error("Directory storage/app/public does not exist!");
            return 1;
        }

        $allFiles = File::allFiles($baseDir);

        // Filter out .gitignore or hidden system files
        $allValidFiles = array_values(array_filter($allFiles, function ($file) {
            return $file->getFilename() !== '.gitignore' && $file->getFilename() !== '.DS_Store';
        }));

        $totalScanned = count($allValidFiles);

        if ($totalScanned === 0) {
            $this->info("No files found in storage/app/public.");
            return 0;
        }

        $isAll = $this->option('all');
        $days = $this->option('days');
        $months = $this->option('months');

        $cutoff = null;
        $filterDescription = 'All files';

        if (!$isAll) {
            if ($days !== null && is_numeric($days) && (int) $days > 0) {
                $days = (int) $days;
                $cutoff = now()->subDays($days)->startOfDay();
                $filterDescription = "Last {$days} days (modified on or after {$cutoff->format('Y-m-d H:i:s')})";
            } else {
                $months = is_numeric($months) && (int) $months > 0 ? (int) $months : 3;
                $cutoff = now()->subMonths($months)->startOfDay();
                $filterDescription = "Last {$months} months (modified on or after {$cutoff->format('Y-m-d H:i:s')})";
            }
        } else {
            $filterDescription = 'All files (--all flag)';
        }

        $files = array_values(array_filter($allValidFiles, function ($file) use ($cutoff) {
            if ($cutoff !== null) {
                return $file->getMTime() >= $cutoff->timestamp;
            }
            return true;
        }));

        // Sort files by modification date (oldest to newest)
        usort($files, fn($a, $b) => $a->getMTime() <=> $b->getMTime());

        $totalToMigrate = count($files);
        $totalExcluded = $totalScanned - $totalToMigrate;

        $this->info("Total files in storage/app/public : {$totalScanned}");
        $this->info("Filter criteria                   : {$filterDescription}");
        $this->info("Files matching filter (to migrate): {$totalToMigrate}");
        if ($totalExcluded > 0) {
            $this->comment("Files excluded (older than filter): {$totalExcluded}");
        }

        if ($totalToMigrate === 0) {
            $this->warn("No files found matching the filter criteria to migrate.");
            return 0;
        }

        $dryRun = $this->option('dry-run');
        $overwrite = $this->option('overwrite');

        if ($dryRun) {
            $this->newLine();
            $this->warn("RUNNING IN DRY-RUN MODE: No files will be uploaded.");
            $this->newLine();

            $rows = [];
            $previewLimit = 50;
            $previewFiles = array_slice($files, 0, $previewLimit);

            foreach ($previewFiles as $index => $file) {
                $relativePath = str_replace($baseDir . DIRECTORY_SEPARATOR, '', $file->getPathname());
                $relativePath = str_replace('\\', '/', $relativePath);
                $size = number_format($file->getSize() / 1024, 2) . ' KB';
                $modified = date('Y-m-d H:i:s', $file->getMTime());

                $rows[] = [$index + 1, $relativePath, $size, $modified];
            }

            $this->table(['#', 'Relative Path', 'Size', 'Last Modified'], $rows);

            if ($totalToMigrate > $previewLimit) {
                $remaining = $totalToMigrate - $previewLimit;
                $this->comment("... and {$remaining} more files.");
            }
            $this->newLine();
        }

        $s3 = Storage::disk('s3');
        $uploaded = 0;
        $skipped = 0;
        $failed = 0;

        $bar = $this->output->createProgressBar($totalToMigrate);
        $bar->start();

        foreach ($files as $file) {
            $relativePath = str_replace($baseDir . DIRECTORY_SEPARATOR, '', $file->getPathname());
            // Normalize directory separators for S3
            $relativePath = str_replace('\\', '/', $relativePath);

            try {
                if (!$overwrite && $s3->exists($relativePath)) {
                    $skipped++;
                    $bar->advance();
                    continue;
                }

                if (!$dryRun) {
                    $stream = fopen($file->getPathname(), 'r');
                    $s3->put($relativePath, $stream, [
                        'visibility' => 'public',
                    ]);
                    if (is_resource($stream)) {
                        fclose($stream);
                    }
                }

                $uploaded++;
            } catch (\Throwable $e) {
                $failed++;
                $this->newLine();
                $this->error("Failed to migrate {$relativePath}: " . $e->getMessage());
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        $this->table(
            ['Total Scanned', 'Older (Skipped)', 'To Migrate', $dryRun ? 'Would Upload' : 'Uploaded', 'Already on S3', 'Failed'],
            [[$totalScanned, $totalExcluded, $totalToMigrate, $uploaded, $skipped, $failed]]
        );

        if ($dryRun) {
            $this->info("Dry-run complete. Run without --dry-run to actually upload the files.");
        } else {
            $this->info("Migration completed successfully!");
        }

        return 0;
    }
}
