import { CalendarDays, Clock, MapPin, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Schedule {
    id: string;
    start_time: string;
    end_time: string;
    registration_deadline?: string | null;
    max_participants?: number;
}

interface PrivateClass {
    mode: 'online' | 'offline';
    location?: string | null;
    schedules?: Schedule[];
}

export default function ScheduleSection({ privateClass }: { privateClass: PrivateClass }) {
    const { t, i18n } = useTranslation('user');
    const dateLocale = i18n.language === 'en' ? 'en-US' : 'id-ID';

    const schedules = privateClass.schedules
        ?.slice()
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()) || [];

    if (schedules.length === 0) return null;

    const formatDate = (value: string) =>
        new Date(value).toLocaleDateString(dateLocale, {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });

    const formatTime = (value: string) =>
        new Date(value).toLocaleTimeString(dateLocale, {
            hour: '2-digit',
            minute: '2-digit',
        });

    const isExpired = (deadline?: string | null) => {
        if (!deadline) return false;
        return new Date() > new Date(deadline);
    };

    return (
        <section className="mx-auto mt-8 w-full max-w-5xl px-4">
            <p className="text-primary border-primary bg-background mb-4 w-fit rounded-full border bg-gradient-to-t from-[#D9E5FF] to-white px-4 py-1 text-sm font-medium shadow-xs">
                {t('privateClass.detail.schedule.badge')}
            </p>
            <h2 className="dark:text-primary-foreground mb-6 text-2xl font-bold text-gray-900 italic md:text-3xl">
                {t('privateClass.detail.schedule.title')}
            </h2>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {schedules.map((schedule) => {
                    const expired = isExpired(schedule.registration_deadline);

                    return (
                        <div
                            key={schedule.id}
                            className={`group relative overflow-hidden rounded-xl border p-4 transition-all duration-200 ${
                                expired
                                    ? 'border-gray-200 bg-gray-50 opacity-60 dark:border-zinc-700 dark:bg-zinc-900'
                                    : 'border-gray-200 bg-white shadow-md hover:shadow-lg dark:border-zinc-700 dark:bg-zinc-800'
                            }`}
                        >
                            {/* Status indicator */}
                            <div className="mb-3 flex items-center justify-between">
                                <span
                                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                        expired
                                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300'
                                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                                    }`}
                                >
                                    {expired ? t('privateClass.detail.schedule.statusClosed') : t('privateClass.detail.schedule.statusAvailable')}
                                </span>
                                {schedule.max_participants && (
                                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                        <Users size={12} />
                                        <span>{t('privateClass.detail.schedule.maxParticipants', { count: schedule.max_participants })}</span>
                                    </div>
                                )}
                            </div>

                            {/* Date */}
                            <div className="mb-2 flex items-center gap-2">
                                <CalendarDays size={16} className="text-primary dark:text-secondary flex-shrink-0" />
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    {formatDate(schedule.start_time)}
                                </p>
                            </div>

                            {/* Time */}
                            <div className="mb-2 flex items-center gap-2">
                                <Clock size={16} className="text-primary dark:text-secondary flex-shrink-0" />
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                                </p>
                            </div>

                            {/* Mode */}
                            <div className="flex items-center gap-2">
                                <MapPin size={16} className="text-primary dark:text-secondary flex-shrink-0" />
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {privateClass.mode === 'offline'
                                        ? privateClass.location || t('privateClass.detail.schedule.locationTba')
                                        : t('privateClass.detail.schedule.online')}
                                </p>
                            </div>

                            {/* Deadline info */}
                            {schedule.registration_deadline && !expired && (
                                <p className="mt-3 border-t border-gray-100 pt-2 text-xs text-gray-500 dark:border-zinc-700 dark:text-gray-400">
                                    {t('privateClass.detail.schedule.registrationDeadline', {
                                        date: new Date(schedule.registration_deadline).toLocaleDateString(dateLocale, {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                        }),
                                    })}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
