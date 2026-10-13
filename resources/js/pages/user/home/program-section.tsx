import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';
import { BadgeCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function ProgramSection() {
    const { t } = useTranslation('home');

    return (
        <section className="w-full px-4 py-8" id="program-kami">
            <div className="mx-auto max-w-5xl">
                <p className="text-primary border-primary bg-background mx-auto mb-8 w-fit rounded-full border bg-gradient-to-t from-[#D9E5FF] to-white px-4 py-1 text-sm font-medium shadow-xs">
                    {t('program.badge')}
                </p>
                <div className="space-y-8 md:space-y-4">
                    <div className="flex w-full flex-col items-center justify-end md:flex-row md:gap-14">
                        <img src="/assets/images/illustration-course.webp" alt="Kelas Online" className="w-[250px]" />
                        <div className="space-y-2">
                            <h2 className="dark:text-primary-foreground text-center text-2xl font-bold italic sm:text-left sm:text-3xl">
                                {t('program.course.title')}
                            </h2>
                            <p className="font-medium">{t('program.course.subtitle')}</p>
                            <ul>
                                <li className="flex items-center gap-2">
                                    <BadgeCheck size="18" className="text-green-600" />
                                    <p>{t('program.course.point1')}</p>
                                </li>
                                <li className="flex items-center gap-2">
                                    <BadgeCheck size="18" className="text-green-600" />
                                    <p>{t('program.course.point2')}</p>
                                </li>
                                <li className="flex items-center gap-2">
                                    <BadgeCheck size="18" className="text-green-600" />
                                    <p>{t('program.course.point3')}</p>
                                </li>
                            </ul>
                            <Button className="mt-2 w-full sm:w-auto" asChild>
                                <Link href="/course">{t('program.learnNow')}</Link>
                            </Button>
                        </div>
                    </div>
                    <div className="flex w-full flex-col-reverse items-center justify-start md:flex-row md:gap-14">
                        <div className="space-y-2">
                            <h2 className="dark:text-primary-foreground text-center text-2xl font-bold italic sm:text-left sm:text-3xl">
                                {t('program.bootcamp.title')}
                            </h2>
                            <p className="font-medium">{t('program.bootcamp.subtitle')}</p>
                            <ul>
                                <li className="flex items-center gap-2">
                                    <BadgeCheck size="18" className="text-green-600" />
                                    <p>{t('program.bootcamp.point1')}</p>
                                </li>
                                <li className="flex items-center gap-2">
                                    <BadgeCheck size="18" className="text-green-600" />
                                    <p>{t('program.bootcamp.point2')}</p>
                                </li>
                                <li className="flex items-center gap-2">
                                    <BadgeCheck size="18" className="text-green-600" />
                                    <p>{t('program.bootcamp.point3')}</p>
                                </li>
                            </ul>
                            <Button className="mt-2 w-full sm:w-auto" asChild>
                                <Link href="/bootcamp">{t('program.learnNow')}</Link>
                            </Button>
                        </div>
                        <img src="/assets/images/illustration-bootcamp.webp" alt="Bootcamp" className="w-[250px]" />
                    </div>
                    <div className="flex w-full flex-col items-center justify-end md:flex-row md:gap-14">
                        <img src="/assets/images/illustration-webinar.webp" alt="Webinar" className="w-[250px]" />
                        <div className="space-y-2">
                            <h2 className="dark:text-primary-foreground text-center text-2xl font-bold italic sm:text-left sm:text-3xl">
                                {t('program.webinar.title')}
                            </h2>
                            <p className="font-medium">{t('program.webinar.subtitle')}</p>
                            <ul className="">
                                <li className="flex items-center gap-2">
                                    <BadgeCheck size="18" className="text-green-600" />
                                    <p>{t('program.webinar.point1')}</p>
                                </li>
                                <li className="flex items-center gap-2">
                                    <BadgeCheck size="18" className="text-green-600" />
                                    <p>{t('program.webinar.point2')}</p>
                                </li>
                                <li className="flex items-center gap-2">
                                    <BadgeCheck size="18" className="text-green-600" />
                                    <p>{t('program.webinar.point3')}</p>
                                </li>
                            </ul>
                            <Button className="mt-2 w-full sm:w-auto" asChild>
                                <Link href="/webinar">{t('program.learnNow')}</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
