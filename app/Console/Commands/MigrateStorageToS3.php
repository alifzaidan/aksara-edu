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
    protected $signature = 'storage:migrate-s3 {--dry-run : Only check and list files that would be uploaded without uploading} {--overwrite : Overwrite files that already exist on S3}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migrate all local storage files (storage/app/public) to IDCloudHost Object Storage (S3)';

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
        $files = array_values(array_filter($allFiles, function ($file) {
            return $file->getFilename() !== '.gitignore' && $file->getFilename() !== '.DS_Store';
        }));

        $total = count($files);

        if ($total === 0) {
            $this->info("No files found in storage/app/public to migrate.");
            return 0;
        }

        $dryRun = $this->option('dry-run');
        $overwrite = $this->option('overwrite');

        $this->info("Found {$total} files in storage/app/public.");
        if ($dryRun) {
            $this->warn("RUNNING IN DRY-RUN MODE: No files will be uploaded.");
        }

        $s3 = Storage::disk('s3');
        $uploaded = 0;
        $skipped = 0;
        $failed = 0;

        $bar = $this->output->createProgressBar($total);
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
            ['Total Files', 'Uploaded', 'Skipped (Already Exists)', 'Failed'],
            [[$total, $uploaded, $skipped, $failed]]
        );

        if ($dryRun) {
            $this->info("Dry-run complete. Run without --dry-run to actually upload the files.");
        } else {
            $this->info("Migration completed successfully!");
        }

        return 0;
    }
}
