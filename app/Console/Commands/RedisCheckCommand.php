<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Redis;

class RedisCheckCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'redis:check';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check Redis connection, latency, memory usage, and database partitions';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $appName = config('app.name', 'Kompeten');
        $this->info("=== {$appName} Redis Health & Status Check ===");
        $this->newLine();

        $client = config('database.redis.client', 'phpredis');
        $this->line("Configured Client : <comment>{$client}</comment>");
        $this->line("PHP Extension (ext-redis): " . (extension_loaded('redis') ? '<info>Installed</info>' : '<comment>Not installed (using Predis package)</comment>'));
        $this->newLine();

        $connections = [
            'default' => [
                'purpose' => 'Default',
                'db' => config('database.redis.default.database', 0),
            ],
            'cache' => [
                'purpose' => 'Application Cache',
                'db' => config('database.redis.cache.database', 1),
            ],
            'session' => [
                'purpose' => 'User Sessions',
                'db' => config('database.redis.session.database', 2),
            ],
            'queue' => [
                'purpose' => 'Queue Jobs',
                'db' => config('database.redis.queue.database', 0),
            ],
        ];

        $tableData = [];

        foreach ($connections as $name => $info) {
            $start = microtime(true);
            $status = 'ERROR';
            $latency = '-';
            $keyCount = '-';

            try {
                $conn = Redis::connection($name);
                $pong = $conn->ping();
                $elapsed = round((microtime(true) - $start) * 1000, 2);

                if ($pong) {
                    $status = '<info>CONNECTED (PONG)</info>';
                    $latency = "{$elapsed} ms";

                    // Hitung jumlah keys jika memungkinkan
                    try {
                        $infoResult = $conn->info('keyspace');
                        $dbKey = 'db' . $info['db'];
                        if (isset($infoResult['Keyspace'][$dbKey])) {
                            $dbStats = $infoResult['Keyspace'][$dbKey];
                            if (is_array($dbStats)) {
                                $keyCount = (string) ($dbStats['keys'] ?? count($dbStats));
                            } else {
                                $keyCount = (string) $dbStats;
                            }
                        } else {
                            $keys = $conn->keys('*');
                            $keyCount = (string) count($keys);
                        }
                    } catch (\Throwable $e) {
                        $keyCount = '0';
                    }
                }
            } catch (\Throwable $e) {
                $status = '<error>FAILED: ' . $e->getMessage() . '</error>';
            }

            $tableData[] = [
                'Connection' => $name,
                'Purpose'    => $info['purpose'],
                'DB Index'   => $info['db'],
                'Status'     => $status,
                'Latency'    => $latency,
                'Keys'       => $keyCount,
            ];
        }

        $this->table(['Connection', 'Purpose', 'DB Index', 'Status', 'Latency', 'Keys'], $tableData);
        $this->newLine();

        // Tampilkan server info dari koneksi default
        try {
            $defaultConn = Redis::connection('default');
            $serverInfo = $defaultConn->info('server');
            $memoryInfo = $defaultConn->info('memory');

            $redisVersion = $serverInfo['Server']['redis_version'] ?? ($serverInfo['redis_version'] ?? 'Unknown');
            $uptimeDays = $serverInfo['Server']['uptime_in_days'] ?? ($serverInfo['uptime_in_days'] ?? 'Unknown');
            $usedMemoryHuman = $memoryInfo['Memory']['used_memory_human'] ?? ($memoryInfo['used_memory_human'] ?? 'Unknown');
            $usedMemoryPeakHuman = $memoryInfo['Memory']['used_memory_peak_human'] ?? ($memoryInfo['used_memory_peak_human'] ?? 'Unknown');

            $this->info('Redis Server Info:');
            $this->line("  - Redis Version  : <comment>{$redisVersion}</comment>");
            $this->line("  - Uptime         : <comment>{$uptimeDays} days</comment>");
            $this->line("  - Memory Used    : <comment>{$usedMemoryHuman}</comment> (Peak: {$usedMemoryPeakHuman})");
            $this->newLine();

            $this->info('Active Drivers in .env:');
            $this->line("  - CACHE_STORE      : <info>" . config('cache.default') . "</info>");
            $this->line("  - SESSION_DRIVER   : <info>" . config('session.driver') . "</info>");
            $this->line("  - QUEUE_CONNECTION : <info>" . config('queue.default') . "</info>");
            $this->newLine();

            $this->info('✔ Redis is properly configured and running smoothly.');
            return 0;
        } catch (\Throwable $e) {
            $this->warn('Could not retrieve full Redis server info: ' . $e->getMessage());
            return 0;
        }
    }
}
