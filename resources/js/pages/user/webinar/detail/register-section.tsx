import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Link } from '@inertiajs/react';
import { BadgeCheck, CalendarDays, Clock, Hourglass, MapPin, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Webinar {
    title: string;
    batch?: string | null;
    strikethrough_price: number;
    price: number;
    quota: number;
    start_time: string;
    end_time: string;
    registration_deadline: string;
    registration_url: string;
    thumbnail?: string | null;
}

export default function RegisterSection({ webinar }: { webinar: Webinar }) {
    const { t, i18n } = useTranslation('user');
    const dateLocale = i18n.language === 'en' ? 'en-US' : 'id-ID';

    const registrationUrl = webinar.registration_url;
    const buttonText = t('webinar.detail.btnRegisterNow');
    const warningMessage = null;

    const deadline = new Date(webinar.registration_deadline);
    const isRegistrationOpen = new Date() < deadline;

    return (
        <section className="mx-auto my-8 w-full max-w-5xl px-4" id="register">
            <h2 className="dark:text-primary-foreground mb-4 text-center text-3xl font-bold text-gray-900 italic md:text-4xl">
                {t('webinar.detail.scheduleAndCost')}
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-400">
                {t('webinar.detail.scheduleAndCostSubtitle')}
            </p>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-md dark:border-zinc-700 dark:bg-zinc-800">
                    <img
                        src={webinar.thumbnail ? `/storage/${webinar.thumbnail}` : '/assets/images/placeholder.png'}
                        alt={webinar.title}
                        className="rounded-lg border border-gray-200 shadow-md"
                    />
                    <ul className="space-y-2">
                        <li className="flex items-center gap-2 text-sm">
                            <BadgeCheck size="16" className="text-green-600" />
                            <p>{t('webinar.detail.relevantMaterial')}</p>
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                            <BadgeCheck size="16" className="text-green-600" />
                            <p>{t('webinar.detail.professionalSpeaker')}</p>
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                            <BadgeCheck size="16" className="text-green-600" />
                            <p>{t('webinar.detail.recordingAvailable')}</p>
                        </li>
                    </ul>
                </div>
                <div className="flex flex-col rounded-lg border border-gray-200 bg-white p-4 shadow-md dark:border-zinc-700 dark:bg-zinc-800">
                    <h5 className="mb-4 text-sm">{t('webinar.detail.pitchSpeaker')}</h5>

                    {webinar.strikethrough_price > 0 && (
                        <span className="text-right text-sm text-red-500 line-through">Rp {webinar.strikethrough_price.toLocaleString(dateLocale)}</span>
                    )}
                    {webinar.price > 0 ? (
                        <span className="text-right text-3xl font-bold text-gray-900 italic dark:text-gray-100">
                            Rp {webinar.price.toLocaleString(dateLocale)}
                        </span>
                    ) : (
                        <span className="text-left text-3xl font-bold text-gray-900 italic dark:text-gray-100">{t('webinar.catalog.free').toUpperCase()}</span>
                    )}

                    <Separator className="my-4" />
                    <ul className="mb-4 space-y-2">
                        <li className="flex items-center gap-2 text-sm">
                            <MapPin size="16" className="text-primary dark:text-secondary" />
                            <p>{t('webinar.detail.onlinePlatform')}</p>
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                            <Hourglass size="16" className="text-primary dark:text-secondary" />
                            <p>{t('webinar.detail.batch', { batch: webinar.batch })}</p>
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                            <Users size="16" className="text-primary dark:text-secondary" />
                            <p>{webinar.quota ? t('webinar.detail.quotaParticipants', { quota: webinar.quota }) : t('webinar.detail.unlimitedQuota')}</p>
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                            <CalendarDays size="16" className="text-primary dark:text-secondary" />
                            <p>
                                {new Date(webinar.start_time).toLocaleDateString(dateLocale, {
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                })}
                            </p>
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                            <Clock size="16" className="text-primary dark:text-secondary" />
                            <p>
                                {new Date(webinar.start_time).toLocaleTimeString(dateLocale, {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                                -
                                {new Date(webinar.end_time).toLocaleTimeString(dateLocale, {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </p>
                        </li>
                    </ul>
                    <div className="mt-auto space-y-1">
                        <p className="text-sm text-gray-500 dark:text-gray-300">
                            {t('webinar.detail.lastRegistration', {
                                date: new Date(webinar.registration_deadline).toLocaleDateString(dateLocale, {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                }),
                            })}
                        </p>
                        {isRegistrationOpen ? (
                            <>
                                <div className="mt-auto">
                                    {warningMessage && <p className="mb-2 text-sm text-red-500">{warningMessage}</p>}
                                    <Button className="w-full" asChild>
                                        <Link href={registrationUrl}>{buttonText}</Link>
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <Button className="w-full" disabled>
                                {t('webinar.detail.registrationClosed')}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
