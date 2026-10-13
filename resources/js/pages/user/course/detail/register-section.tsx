import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Link } from '@inertiajs/react';
import { BadgeCheck, InfinityIcon, Presentation, Smartphone, TvMinimalPlay } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Course {
    title: string;
    thumbnail?: string | null;
    strikethrough_price: number;
    price: number;
    registration_url: string;
    modules?: {
        title: string;
        description?: string | null;
        lessons?: {
            title: string;
            description?: string | null;
            type: 'text' | 'video' | 'file' | 'quiz' | 'assignment';
            video_url?: string | null;
        }[];
    }[];
}

export default function RegisterSection({ course }: { course: Course }) {
    const { t, i18n } = useTranslation('user');
    const totalLessons = course.modules?.reduce((total, module) => total + (module.lessons?.length || 0), 0) || 0;

    const registrationUrl = course.registration_url;
    const buttonText = t('course.detail.joinNow');
    const warningMessage = null;

    return (
        <section className="mx-auto mt-8 w-full max-w-5xl px-4" id="register">
            <h2 className="dark:text-primary-foreground mb-4 text-center text-3xl font-bold text-gray-900 italic md:text-4xl">
                {t('course.detail.registerTitle')}
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-400">{t('course.detail.registerSubtitle')}</p>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-md dark:border-zinc-700 dark:bg-zinc-800">
                    <img
                        src={course.thumbnail ? `/storage/${course.thumbnail}` : '/assets/images/placeholder.png'}
                        alt={course.title}
                        className="rounded-lg border border-gray-200 shadow-md"
                    />
                    <ul className="space-y-2">
                        <li className="flex items-center gap-2 text-sm">
                            <BadgeCheck size="16" className="text-green-600" />
                            <p>{t('course.detail.lifetimeAccess')}</p>
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                            <BadgeCheck size="16" className="text-green-600" />
                            <p>{t('course.detail.updatedMaterial')}</p>
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                            <BadgeCheck size="16" className="text-green-600" />
                            <p>{t('course.detail.flexibleTime')}</p>
                        </li>
                    </ul>
                </div>
                <div className="flex flex-col rounded-lg border border-gray-200 bg-white p-4 shadow-md dark:border-zinc-700 dark:bg-zinc-800">
                    <h5 className="mb-4 text-sm">{t('course.detail.premiumPitch')}</h5>

                    {course.strikethrough_price > 0 && (
                        <span className="text-right text-sm text-red-500 line-through">
                            Rp {course.strikethrough_price.toLocaleString(i18n.language === 'en' ? 'en-US' : 'id-ID')}
                        </span>
                    )}
                    {course.price > 0 ? (
                        <span className="text-right text-3xl font-bold text-gray-900 italic dark:text-gray-100">
                            Rp {course.price.toLocaleString(i18n.language === 'en' ? 'en-US' : 'id-ID')}
                        </span>
                    ) : (
                        <span className="text-left text-3xl font-bold text-gray-900 italic dark:text-gray-100">{t('course.detail.freeBadge')}</span>
                    )}

                    <Separator className="my-4" />
                    <ul className="space-y-2">
                        <li className="flex items-center gap-2 text-sm">
                            <TvMinimalPlay size="16" className="text-primary dark:text-secondary" />
                            <p>{t('course.detail.lessonsCount', { count: totalLessons })}</p>
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                            <Presentation size="16" className="text-primary dark:text-secondary" />
                            <p>{t('course.detail.freeConsultation')}</p>
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                            <InfinityIcon size="16" className="text-primary dark:text-secondary" />
                            <p>{t('course.detail.lifetimeAccess')}</p>
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                            <Smartphone size="16" className="text-primary dark:text-secondary" />
                            <p>{t('course.detail.onDemandMaterial')}</p>
                        </li>
                    </ul>
                    <div className="mt-auto">
                        {warningMessage && <p className="mb-2 text-center text-sm text-red-500">{warningMessage}</p>}
                        <Button className="w-full" asChild>
                            <Link href={registrationUrl}>{buttonText}</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}
