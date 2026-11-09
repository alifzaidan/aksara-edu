import { Button } from '@/components/ui/button';
import { Video } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface JoinZoomButtonProps {
    /** Link Zoom; hanya dikirim server untuk peserta dengan akses aktif. */
    meetingUrl?: string | null;
    /** Waktu mulai & selesai sesi (WIB). Selesai kosong → dianggap 3 jam setelah mulai. */
    start: Date;
    end?: Date | null;
    className?: string;
}

const GRACE_MINUTES = 30;

/** Parse "YYYY-MM-DD" + "HH:mm[:ss]" sebagai waktu WIB (UTC+7). */
export function wibDate(date: string, time: string): Date {
    const day = date.slice(0, 10);
    const hm = time.length === 5 ? `${time}:00` : time.slice(0, 8);
    return new Date(`${day}T${hm}+07:00`);
}

/** Tombol "Masuk Zoom" — tampil sampai 30 menit setelah sesi selesai. */
export default function JoinZoomButton({ meetingUrl, start, end, className }: JoinZoomButtonProps) {
    const { t } = useTranslation('profile');

    if (!meetingUrl) {
        return null;
    }

    const now = Date.now();
    const endAt = (end ?? new Date(start.getTime() + 3 * 60 * 60 * 1000)).getTime() + GRACE_MINUTES * 60 * 1000;
    if (now > endAt) {
        return null;
    }

    const isLive = now >= start.getTime();

    return (
        <div className={`flex items-center gap-3 ${className ?? ''}`}>
            <Button asChild size="sm" className="bg-blue-600 text-white hover:bg-blue-700">
                <a href={meetingUrl} target="_blank" rel="noopener noreferrer">
                    <Video size={14} className="mr-1" />
                    {t('zoom.join')}
                </a>
            </Button>
            {isLive && (
                <span className="flex items-center gap-1 text-xs font-medium text-red-600">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-red-600" />
                    {t('zoom.live')}
                </span>
            )}
        </div>
    );
}
