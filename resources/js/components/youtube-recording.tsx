import { Clock, Youtube } from 'lucide-react';

interface YouTubeRecordingProps {
    recordingUrl: string | null;
    title: string;
    className?: string;
}

function getYoutubeEmbedUrl(url: string): string | null {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = match && match[2].length === 11 ? match[2] : null;
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
}

export default function YouTubeRecording({ recordingUrl, title, className = '' }: YouTubeRecordingProps) {
    const embedUrl = recordingUrl ? getYoutubeEmbedUrl(recordingUrl) : null;

    if (!recordingUrl || !embedUrl) {
        return (
            <div
                className={`rounded-xl border border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50 p-6 dark:border-yellow-800 dark:from-yellow-900/20 dark:to-orange-900/20 ${className}`}
            >
                <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-full bg-yellow-100 p-2 dark:bg-yellow-800">
                        <Clock className="text-yellow-600 dark:text-yellow-400" size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-yellow-800 dark:text-yellow-200">⏳ Recording Sedang Diproses</h2>
                        <p className="text-sm text-yellow-600 dark:text-yellow-400">Mohon tunggu, recording akan tersedia dalam 1-2 hari</p>
                    </div>
                </div>
                <div className="rounded-lg bg-yellow-100 p-4 dark:bg-yellow-800/50">
                    <p className="text-center text-yellow-800 dark:text-yellow-200">
                        📹 Tim kami sedang memproses recording {title.toLowerCase()}. Anda akan mendapat notifikasi ketika sudah siap ditonton.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-pink-50 p-6 dark:border-red-800 dark:from-red-900/20 dark:to-pink-900/20 ${className}`}
        >
            <div className="mb-4 flex items-center gap-3">
                <div className="rounded-full bg-red-100 p-2 dark:bg-red-800">
                    <Youtube className="text-red-600 dark:text-red-400" size={20} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-red-800 dark:text-red-200">🎥 Recording {title} Tersedia</h2>
                    <p className="text-sm text-red-600 dark:text-red-400">Tonton kembali materi kapan saja</p>
                </div>
            </div>

            <div className="group relative">
                <div className="aspect-video w-full overflow-hidden rounded-lg shadow-lg">
                    <iframe
                        className="h-full w-full"
                        src={embedUrl}
                        title={`Recording ${title}`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
                <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 opacity-20 blur transition duration-300 group-hover:opacity-30"></div>
            </div>

            <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-red-700 dark:text-red-300">✨ Akses selamanya untuk materi {title.toLowerCase()} ini</p>
                <a
                    href={recordingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
                >
                    <Youtube size={16} />
                    Buka di YouTube
                </a>
            </div>
        </div>
    );
}
