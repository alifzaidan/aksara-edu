<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class StorageFallbackController extends Controller
{
    /**
     * Handle requests to /storage/{path}.
     * If local file exists, serve it.
     * Otherwise redirect to S3 URL.
     *
     * @param string $path
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function show(string $path)
    {
        // 1. Check if the file exists on local public storage
        $localPath = storage_path('app/public/' . $path);
        if (file_exists($localPath) && is_file($localPath)) {
            return response()->file($localPath);
        }

        // 2. If S3 is configured, redirect to S3 URL
        if (config('filesystems.default') === 's3' || config('filesystems.disks.public.driver') === 's3' || !empty(env('AWS_BUCKET'))) {
            $s3Disk = Storage::disk('s3');
            $s3Url = $s3Disk->url($path);

            return redirect()->away($s3Url, 302);
        }

        abort(404);
    }
}
