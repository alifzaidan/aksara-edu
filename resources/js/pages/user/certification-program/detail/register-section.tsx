import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { enUS, id } from 'date-fns/locale';
import { BadgeCheck, Calendar, CalendarDays, GraduationCap, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Mentor {
    id: string;
    name: string;
}

interface Schedule {
    id: string;
    schedule_date?: string;
    start_date?: string;
}

interface CertificationProgram {
    id: string;
    title: string;
    slug: string;
    type: 'regular' | 'scholarship';
    price: number;
    scholarship_price?: number;
    strikethrough_price?: number;
    registration_deadline?: string;
    socialization_registration_deadline?: string;
    thumbnail?: string | null;
    mentors: Mentor[];
    schedules: Schedule[];
    document_required?: boolean;
    document_description?: string | null;
}

interface RegisterSectionProps {
    program: CertificationProgram;
    isEnrolled: boolean;
    scholarshipApplication?: { status: string } | null;
}

export default function RegisterSection({ program, isEnrolled, scholarshipApplication }: RegisterSectionProps) {
    const { t, i18n } = useTranslation('user');
    const { auth } = usePage<SharedData>().props;
    const dateLocale = i18n.language === 'en' ? enUS : id;

    // Regular program deadline
    const regularDeadline = program.registration_deadline ? new Date(program.registration_deadline) : null;
    const isRegularRegistrationOpen = regularDeadline ? new Date() < regularDeadline : true;

    // Check if scholarship is approved (only matters for scholarship programs)
    const isScholarshipApproved = program.type === 'scholarship' ? scholarshipApplication?.status === 'approved' : true;
    const isScholarshipNotApproved = program.type === 'scholarship' && !isScholarshipApproved;
    const canRegisterRegular = isRegularRegistrationOpen && !isEnrolled && isScholarshipApproved;

    // Scholarship program deadline
    const scholarshipDeadline = program.socialization_registration_deadline ? new Date(program.socialization_registration_deadline) : null;
    const isScholarshipRegistrationOpen = scholarshipDeadline ? new Date() < scholarshipDeadline : true;
    const canRegisterScholarship = isScholarshipRegistrationOpen && !isEnrolled;

    const displayPrice = isScholarshipNotApproved ? 0 : (program.type === 'scholarship' ? (program.scholarship_price ?? program.price) : program.price);

    const formatRupiah = (amount: number) => {
        return new Intl.NumberFormat(i18n.language === 'en' ? 'en-US' : 'id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDeadline = (date: Date) => {
        const timePattern = i18n.language === 'en' ? 'EEEE, dd MMMM yyyy, HH:mm' : "EEEE, dd MMMM yyyy 'pukul' HH:mm";
        return t('certificationProgram.detail.register.deadlineAt', { date: format(date, timePattern, { locale: dateLocale }) });
    };

    const getDate = (s: Schedule) => s.schedule_date || s.start_date || '';
    const firstSchedule = program.schedules.length > 0 ? getDate(program.schedules[0]) : null;
    const lastSchedule = program.schedules.length > 0 ? getDate(program.schedules[program.schedules.length - 1]) : null;

    return (
        <section className="mx-auto my-8 w-full max-w-5xl px-4" id="register">
            <h2 className="dark:text-primary-foreground mb-4 text-center text-3xl font-bold text-gray-900 italic md:text-4xl">
                {t('certificationProgram.detail.register.title')}
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-400">
                {t('certificationProgram.detail.register.subtitle')}
            </p>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Left Column - Image & Benefits */}
                <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-md dark:border-zinc-700 dark:bg-zinc-800">
                    <img
                        src={program.thumbnail ? `/storage/${program.thumbnail}` : '/assets/images/placeholder.png'}
                        alt={program.title}
                        className="rounded-lg border border-gray-200 shadow-md"
                    />
                    <ul className="space-y-2">
                        <li className="flex items-center gap-2 text-sm">
                            <BadgeCheck size="16" className="text-green-600" />
                            <p>{t('certificationProgram.detail.register.benefit1')}</p>
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                            <BadgeCheck size="16" className="text-green-600" />
                            <p>{t('certificationProgram.detail.register.benefit2')}</p>
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                            <BadgeCheck size="16" className="text-green-600" />
                            <p>{t('certificationProgram.detail.register.benefit3')}</p>
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                            <BadgeCheck size="16" className="text-green-600" />
                            <p>{t('certificationProgram.detail.register.benefit4')}</p>
                        </li>
                    </ul>
                </div>

                {/* Right Column - Registration Info */}
                <div className="flex flex-col rounded-lg border border-gray-200 bg-white p-4 shadow-md dark:border-zinc-700 dark:bg-zinc-800">
                    <h5 className="mb-4 text-sm">{t('certificationProgram.detail.register.cardSubtitle')}</h5>

                    {/* Price */}
                    {!isScholarshipNotApproved && (program.strikethrough_price ?? 0) > 0 && (
                        <span className="text-right text-sm text-red-500 line-through">{formatRupiah(program.strikethrough_price!)}</span>
                    )}
                    {displayPrice > 0 ? (
                        <span className="text-right text-3xl font-bold text-gray-900 italic dark:text-gray-100">{formatRupiah(displayPrice)}</span>
                    ) : (
                        <span className="text-left text-3xl font-bold text-gray-900 italic dark:text-gray-100">{t('certificationProgram.detail.register.free')}</span>
                    )}

                    {!isScholarshipNotApproved && program.type === 'scholarship' && program.scholarship_price !== undefined && program.scholarship_price > 0 && (
                        <p className="mt-1 text-sm text-purple-600 dark:text-purple-400">{t('certificationProgram.detail.register.scholarshipPriceLabel')}</p>
                    )}

                    <Separator className="my-4" />

                    {/* Program Info */}
                    <ul className="mb-4 space-y-3">
                        {firstSchedule && lastSchedule && (
                            <li className="flex items-start gap-2 text-sm">
                                <CalendarDays size="16" className="text-primary dark:text-secondary mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="mb-1 font-medium">{t('certificationProgram.detail.register.scheduleLabel')}</p>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        {format(new Date(firstSchedule), 'dd MMM yyyy', { locale: dateLocale })} —{' '}
                                        {format(new Date(lastSchedule), 'dd MMM yyyy', { locale: dateLocale })}
                                    </p>
                                </div>
                            </li>
                        )}

                        <li className="flex items-center gap-2 text-sm">
                            <GraduationCap size="16" className="text-primary dark:text-secondary" />
                            <p>
                                {t('certificationProgram.detail.register.totalSessions')}{' '}
                                <span className="font-medium">{t('certificationProgram.detail.register.sessionsCount', { count: program.schedules.length })}</span>
                            </p>
                        </li>

                        {program.type === 'scholarship'
                            ? scholarshipDeadline && (
                                  <li className="flex items-start gap-2 text-sm">
                                      <Calendar size="16" className="text-primary dark:text-secondary mt-0.5" />
                                      <div>
                                          <p className="font-medium">{t('certificationProgram.detail.register.scholarshipDeadline')}</p>
                                          <p className="text-gray-600 dark:text-gray-400">
                                              {formatDeadline(scholarshipDeadline)}
                                          </p>
                                      </div>
                                  </li>
                              )
                            : regularDeadline && (
                                  <li className="flex items-start gap-2 text-sm">
                                      <Calendar size="16" className="text-primary dark:text-secondary mt-0.5" />
                                      <div>
                                          <p className="font-medium">{t('certificationProgram.detail.register.regularDeadline')}</p>
                                          <p className="text-gray-600 dark:text-gray-400">
                                              {formatDeadline(regularDeadline)}
                                          </p>
                                      </div>
                                  </li>
                              )}
                    </ul>

                    {program.document_required && (
                        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
                            <p className="font-semibold">{t('certificationProgram.detail.register.docRequiredTitle')}</p>
                            <p className="mt-1 whitespace-pre-line text-amber-800 dark:text-amber-200">
                                {program.document_description ?? t('certificationProgram.detail.register.docRequiredDefault')}
                            </p>
                        </div>
                    )}

                    {/* Registration Buttons */}
                    <div className="mt-auto space-y-2">
                        {/* Status Messages */}
                        {isEnrolled && (
                            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center dark:border-green-800 dark:bg-green-900/20">
                                <p className="text-sm font-medium text-green-600 dark:text-green-400">{t('certificationProgram.detail.register.alreadyEnrolled')}</p>
                            </div>
                        )}

                        {auth ? (
                            <>
                                {!isEnrolled && program.type === 'scholarship' && !isScholarshipApproved ? null : (
                                    <Button asChild className="w-full" disabled={!canRegisterRegular}>
                                        <Link href={route('certification-programs.register', program.slug)}>
                                            {isEnrolled
                                                ? t('certificationProgram.detail.register.btnEnrolled')
                                                : canRegisterRegular
                                                  ? t('certificationProgram.detail.register.btnRegisterRegular')
                                                  : t('certificationProgram.detail.register.btnRegularClosed')}
                                        </Link>
                                    </Button>
                                )}
                                {program.type === 'scholarship' && !isScholarshipApproved && (
                                    <Button
                                        asChild
                                        disabled={!canRegisterScholarship}
                                        className={`w-full ${!canRegisterScholarship ? 'cursor-not-allowed opacity-50' : ''}`}
                                    >
                                        <Link href={canRegisterScholarship ? route('certification-programs.register', { program: program.slug, scholarship: 1 }) : '#'}>
                                            <GraduationCap className="mr-1 h-4 w-4" />
                                            {canRegisterScholarship ? t('certificationProgram.detail.register.btnApplyScholarship') : t('certificationProgram.detail.register.btnScholarshipClosed')}
                                        </Link>
                                    </Button>
                                )}
                            </>
                        ) : (
                            <Button asChild className="w-full">
                                <Link href={route('certification-programs.register', program.slug)}>{t('certificationProgram.detail.register.btnRegisterNow')}</Link>
                            </Button>
                        )}

                        <p className="text-center text-xs text-gray-500 dark:text-gray-400">{t('certificationProgram.detail.register.redirectNotice')}</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
