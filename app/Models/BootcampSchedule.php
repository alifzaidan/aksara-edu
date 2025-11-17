<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class BootcampSchedule extends Model
{
    use HasUuids;

    protected $guarded = ['created_at', 'updated_at'];

    public function bootcamp()
    {
        return $this->belongsTo(Bootcamp::class, 'bootcamp_id');
    }

    public function attendances()
    {
        return $this->hasMany(BootcampAttendance::class);
    }

    /**
     * Check if schedule has recording
     */
    public function hasRecording(): bool
    {
        return !empty($this->recording_url);
    }

    /**
     * Check if schedule is past
     */
    public function isPast(): bool
    {
        return $this->schedule_date < now()->toDateString();
    }

    /**
     * Get embed URL for YouTube
     */
    public function getEmbedUrl(): ?string
    {
        if (!$this->recording_url) {
            return null;
        }

        $videoId = $this->extractYoutubeId($this->recording_url);
        return $videoId ? "https://www.youtube.com/embed/{$videoId}" : null;
    }

    /**
     * Extract YouTube video ID from URL
     */
    private function extractYoutubeId(string $url): ?string
    {
        preg_match('/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/', $url, $matches);
        return isset($matches[2]) && strlen($matches[2]) === 11 ? $matches[2] : null;
    }
}
