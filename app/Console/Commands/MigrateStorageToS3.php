<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

class MigrateStorageToS3 extends Command
{
    /**
     * Default directories to exclude from migration.
     *
     * @var array
     */
    protected array $defaultExcludedDirs = [
        'attendance-proofs',
        'free-requirements',
    ];

    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'storage:migrate-s3
        {--dry-run : Only check and list files that would be uploaded without uploading}
        {--overwrite : Overwrite files that already exist on S3}
        {--delete-local : Delete local files after successfully uploading or verifying they exist on S3}
        {--exclude=* : Additional directories to exclude}
        {--all-folders : Include all folders without excluding default folders}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migrate local storage files (storage/app/public) to IDCloudHost Object Storage (S3) (excluding attendance-proofs and free-requirements)';

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

        $excludedDirs = $this->option('all-folders')
            ? []
            : array_unique(array_merge($this->defaultExcludedDirs, (array) $this->option('exclude')));

        $scannedCount = 0;
        $excludedCount = 0;

        // Filter out .gitignore, .DS_Store, and excluded directories
        $files = array_values(array_filter($allFiles, function ($file) use ($baseDir, $excludedDirs, &$scannedCount, &$excludedCount) {
            $filename = $file->getFilename();
            if ($filename === '.gitignore' || $filename === '.DS_Store') {
                return false;
            }

            $scannedCount++;

            $relativePath = str_replace($baseDir . DIRECTORY_SEPARATOR, '', $file->getPathname());
            $relativePath = str_replace('\\', '/', $relativePath);

            foreach ($excludedDirs as $dir) {
                $dir = trim($dir, '/');
                if ($dir !== '' && (str_starts_with($relativePath, $dir . '/') || $relativePath === $dir)) {
                    $excludedCount++;
                    return false;
                }
            }

            return true;
        }));

        $total = count($files);

        $this->info("Found {$scannedCount} files in storage/app/public.");
        if (!empty($excludedDirs)) {
            $this->comment("Excluded {$excludedCount} files from: " . implode(', ', $excludedDirs));
        }
        $this->info("Total files to migrate: {$total}.");

        if ($total === 0) {
            $this->info("No files found in storage/app/public to migrate.");
            return 0;
        }

        $dryRun = $this->option('dry-run');
        $overwrite = $this->option('overwrite');
        $deleteLocal = $this->option('delete-local');

        if ($dryRun) {
            $this->warn("RUNNING IN DRY-RUN MODE: No files will be uploaded.");
        }
        if ($deleteLocal && !$dryRun) {
            $this->warn("WARNING: --delete-local is active. Local files will be deleted after S3 verification/upload.");
        }

        $s3 = Storage::disk('s3');
        $uploaded = 0;
        $skipped = 0;
        $failed = 0;
        $deletedLocally = 0;

        $bar = $this->output->createProgressBar($total);
        $bar->start();

        foreach ($files as $file) {
            $relativePath = str_replace($baseDir . DIRECTORY_SEPARATOR, '', $file->getPathname());
            // Normalize directory separators for S3
            $relativePath = str_replace('\\', '/', $relativePath);

            try {
                if (!$overwrite && $s3->exists($relativePath)) {
                    $skipped++;
                    if ($deleteLocal && !$dryRun) {
                        if (@unlink($file->getPathname())) {
                            $deletedLocally++;
                        }
                    }
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

                    if ($deleteLocal) {
                        if (@unlink($file->getPathname())) {
                            $deletedLocally++;
                        }
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

        $tableHeaders = ['Total Scanned', 'Excluded Folders', 'To Migrate', $dryRun ? 'Would Upload' : 'Uploaded', 'Skipped (Already on S3)', 'Failed'];
        $tableValues = [$scannedCount, $excludedCount, $total, $uploaded, $skipped, $failed];

        if ($deleteLocal && !$dryRun) {
            $tableHeaders[] = 'Deleted Locally';
            $tableValues[] = $deletedLocally;
        }

        $this->table($tableHeaders, [$tableValues]);

        if ($dryRun) {
            $this->info("Dry-run complete. Run without --dry-run to actually upload the files.");
        } else {
            $this->info("Migration completed successfully!");
            if ($deleteLocal) {
                $this->cleanEmptyDirectories($baseDir);
                $this->info("Deleted {$deletedLocally} local files to free up disk space.");
            }
        }

        return 0;
    }

    /**
     * Remove empty subdirectories recursively.
     */
    protected function cleanEmptyDirectories(string $dir): void
    {
        if (!is_dir($dir)) {
            return;
        }

        $items = array_diff(scandir($dir) ?: [], ['.', '..', '.gitignore']);

        foreach ($items as $item) {
            $path = $dir . DIRECTORY_SEPARATOR . $item;
            if (is_dir($path)) {
                $this->cleanEmptyDirectories($path);
                $remaining = array_diff(scandir($path) ?: [], ['.', '..', '.gitignore']);
                if (empty($remaining)) {
                    @rmdir($path);
                }
            }
        }
    }
}
