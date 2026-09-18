<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

class CleanLocalStorage extends Command
{
    /**
     * Default unmigrated folders that can be optionally cleaned.
     *
     * @var array
     */
    protected array $unmigratedFolders = [
        'attendance-proofs',
        'free-requirements',
    ];

    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'storage:clean-local
        {--dry-run : Only check and show which files would be deleted and total space freed without deleting}
        {--include-unmigrated : Also delete local files in attendance-proofs and free-requirements even if not on S3}
        {--force : Force deletion without confirmation prompt}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean local storage files (storage/app/public) that already exist on S3 to free up server disk space';

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

        $totalFiles = count($files);

        if ($totalFiles === 0) {
            $this->info("No files found in storage/app/public to clean.");
            return 0;
        }

        $dryRun = $this->option('dry-run');
        $includeUnmigrated = $this->option('include-unmigrated');
        $force = $this->option('force');

        $this->info("Scanning {$totalFiles} files in storage/app/public against S3...");
        if ($dryRun) {
            $this->warn("RUNNING IN DRY-RUN MODE: No files will be deleted.");
        }

        $s3 = Storage::disk('s3');

        $toDelete = [];
        $toKeep = [];
        $bytesToFree = 0;
        $folderStats = [];

        $bar = $this->output->createProgressBar($totalFiles);
        $bar->start();

        foreach ($files as $file) {
            $relativePath = str_replace($baseDir . DIRECTORY_SEPARATOR, '', $file->getPathname());
            $relativePath = str_replace('\\', '/', $relativePath);

            $fileSize = $file->getSize();
            $folderName = explode('/', $relativePath)[0] ?? 'root';

            if (!isset($folderStats[$folderName])) {
                $folderStats[$folderName] = ['delete_count' => 0, 'delete_bytes' => 0, 'keep_count' => 0];
            }

            // Check if file is in unmigrated folders (attendance-proofs, free-requirements)
            $isUnmigratedFolder = false;
            foreach ($this->unmigratedFolders as $unmigrated) {
                if (str_starts_with($relativePath, $unmigrated . '/') || $relativePath === $unmigrated) {
                    $isUnmigratedFolder = true;
                    break;
                }
            }

            $shouldDelete = false;
            $reason = '';

            if ($isUnmigratedFolder && $includeUnmigrated) {
                $shouldDelete = true;
                $reason = 'Unmigrated folder cleanup (--include-unmigrated)';
            } else {
                try {
                    if ($s3->exists($relativePath)) {
                        $shouldDelete = true;
                        $reason = 'Verified on S3';
                    } else {
                        $reason = 'Not found on S3 (kept locally)';
                    }
                } catch (\Throwable $e) {
                    $reason = 'S3 check failed: ' . $e->getMessage();
                }
            }

            if ($shouldDelete) {
                $toDelete[] = [
                    'file' => $file,
                    'relativePath' => $relativePath,
                    'size' => $fileSize,
                    'reason' => $reason,
                ];
                $bytesToFree += $fileSize;
                $folderStats[$folderName]['delete_count']++;
                $folderStats[$folderName]['delete_bytes'] += $fileSize;
            } else {
                $toKeep[] = [
                    'file' => $file,
                    'relativePath' => $relativePath,
                    'reason' => $reason,
                ];
                $folderStats[$folderName]['keep_count']++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        // Display breakdown table per folder
        $tableRows = [];
        foreach ($folderStats as $folder => $stat) {
            $tableRows[] = [
                $folder,
                $stat['delete_count'],
                $this->formatBytes($stat['delete_bytes']),
                $stat['keep_count'],
            ];
        }

        $this->table(
            ['Folder', 'Files to Delete', 'Space to Free', 'Files to Keep'],
            $tableRows
        );

        $readableFreed = $this->formatBytes($bytesToFree);
        $totalDeleteCount = count($toDelete);
        $totalKeepCount = count($toKeep);

        $this->newLine();
        $this->info("Summary:");
        $this->line(" - Files to delete : <comment>{$totalDeleteCount}</comment>");
        $this->line(" - Files to keep   : <comment>{$totalKeepCount}</comment>");
        $this->line(" - Space to free   : <info>{$readableFreed}</info>");
        $this->newLine();

        if ($totalDeleteCount === 0) {
            $this->info("Nothing to clean. No local files matched S3 or deletion criteria.");
            return 0;
        }

        if ($dryRun) {
            $this->info("Dry-run complete. Run without --dry-run to actually delete local files.");
            return 0;
        }

        if (!$force) {
            if (!$this->confirm("Are you sure you want to permanently delete {$totalDeleteCount} local files ({$readableFreed})? This cannot be undone.", false)) {
                $this->warn("Operation cancelled by user.");
                return 0;
            }
        }

        $deletedCount = 0;
        $failedCount = 0;
        $actualFreedBytes = 0;
        $lastFailureReason = '';

        foreach ($toDelete as $item) {
            $pathname = $item['file']->getPathname();
            try {
                if (file_exists($pathname)) {
                    if (@unlink($pathname)) {
                        $deletedCount++;
                        $actualFreedBytes += $item['size'];
                    } else {
                        $failedCount++;
                        $lastError = error_get_last();
                        $lastFailureReason = $lastError['message'] ?? 'Permission denied';
                        if ($failedCount <= 3) {
                            $this->error("Failed to delete {$item['relativePath']}: {$lastFailureReason}");
                        }
                    }
                }
            } catch (\Throwable $e) {
                $failedCount++;
                $lastFailureReason = $e->getMessage();
                if ($failedCount <= 3) {
                    $this->error("Failed to delete {$item['relativePath']}: {$lastFailureReason}");
                }
            }
        }

        // Clean up empty directories
        $this->cleanEmptyDirectories($baseDir);

        $this->newLine();
        $freedDisplay = $this->formatBytes($actualFreedBytes);
        $this->info("Successfully deleted {$deletedCount} local files, freeing {$freedDisplay} of disk space!");

        if ($failedCount > 0) {
            $this->error("{$failedCount} files failed to delete.");
            $this->warn("Last failure reason: {$lastFailureReason}");
            $this->warn("Tip: Check file/directory permissions or run the command with sudo / as the web server user:");
            $this->line("     sudo php artisan storage:clean-local --include-unmigrated");
            $this->line("  or: sudo -u www-data php artisan storage:clean-local --include-unmigrated");
        }

        return $failedCount > 0 ? 1 : 0;
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
                // Check if directory became empty after recursive cleanup
                $remaining = array_diff(scandir($path) ?: [], ['.', '..', '.gitignore']);
                if (empty($remaining)) {
                    @rmdir($path);
                }
            }
        }
    }

    /**
     * Format bytes into human readable string.
     */
    protected function formatBytes(int $bytes, int $precision = 2): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);

        $bytes /= pow(1024, $pow);

        return round($bytes, $precision) . ' ' . $units[$pow];
    }
}
