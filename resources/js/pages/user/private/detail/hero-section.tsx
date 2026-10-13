import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface PrivateClass {
    title: string;
    thumbnail?: string | null;
    description?: string | null;
    mode: 'online' | 'offline';
    location?: string | null;
    schedules?: { start_time: string; end_time: string }[];
}

export default function HeroSection({ privateClass }: { privateClass: PrivateClass }) {
    const { t, i18n } = useTranslation('user');
    const dateLocale = i18n.language === 'en' ? 'en-US' : 'id-ID';
    const firstSchedule = privateClass.schedules?.[0];

    return (
        <section className="to-background from-background via-tertiary dark:via-background dark:to-background relative bg-gradient-to-b py-20 text-gray-900 dark:text-white">
            <div className="pointer-events-none absolute top-1/2 left-1/2 z-0 flex -translate-x-1/2 -translate-y-1/2 animate-spin items-center gap-8 duration-[10s]">
                <div className="bg-primary h-[300px] w-[300px] rounded-full blur-[200px]" />
                <div className="bg-secondary h-[300px] w-[300px] rounded-full blur-[200px]" />
            </div>
            <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 lg:grid-cols-3">
                <div className="col-span-2">
                    <div className="mb-4 flex flex-wrap gap-2">
                        <span className="text-secondary border-secondary bg-background inline-block rounded-full border bg-gradient-to-t from-[#FED6AD] to-white px-3 py-1 text-sm font-medium shadow-xs">
                            {privateClass.mode === 'offline' ? t('privateClass.detail.hero.badgeOffline') : t('privateClass.detail.hero.badgeOnline')}
                            {privateClass.mode === 'offline' && privateClass.location && ` — ${privateClass.location}`}
                        </span>
                        {firstSchedule && (
                            <span className="text-secondary border-secondary bg-background inline-block rounded-full border bg-gradient-to-t from-[#FED6AD] to-white px-3 py-1 text-sm font-medium shadow-xs">
                                {t('privateClass.detail.hero.timeRange', {
                                    date: new Date(firstSchedule.start_time).toLocaleDateString(dateLocale, {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                    }),
                                    startTime: new Date(firstSchedule.start_time).toLocaleTimeString(dateLocale, {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        timeZone: 'Asia/Jakarta',
                                    }),
                                    endTime: new Date(firstSchedule.end_time).toLocaleTimeString(dateLocale, {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        timeZone: 'Asia/Jakarta',
                                    }),
                                })}
                            </span>
                        )}
                    </div>

                    <h1 className="mb-6 text-4xl leading-tight font-bold italic sm:text-5xl">{privateClass.title}</h1>

                    <p className="mb-6 max-w-xl text-lg text-gray-600 dark:text-gray-400">
                        {privateClass.description || t('privateClass.detail.hero.defaultDescription')}
                    </p>

                    <div className="flex flex-wrap gap-4">
                        <a href="#register">
                            <Button>{t('privateClass.detail.hero.btnRegisterNow')}</Button>
                        </a>
                        <a href="https://wa.me/+6285142505794" target="_blank" rel="noopener noreferrer">
                            <Button variant="outline">{t('privateClass.detail.hero.btnContactUs')}</Button>
                        </a>
                    </div>
                </div>
                <div className="col-span-1 hidden lg:block">
                    <img
                        src={privateClass.thumbnail ? `/storage/${privateClass.thumbnail}` : '/assets/images/placeholder.png'}
                        alt={privateClass.title}
                        className="rounded-xl shadow-lg"
                    />
                </div>
            </div>
        </section>
    );
}
