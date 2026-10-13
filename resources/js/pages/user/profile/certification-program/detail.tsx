import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProfileLayout from '@/layouts/profile/layout';
import UserLayout from '@/layouts/user-layout';
import { Head, Link } from '@inertiajs/react';
import { formatExternalUrl } from '@/lib/utils';
import {
    ArrowLeft,
    BellRing,
    BookOpen,
    Calendar,
    CalendarDays,
    CheckCircle2,
    Clock,
    CreditCard,
    ExternalLink,
    FileText,
    Home,
    LinkIcon,
    Lock,
    ReceiptText,
    Users,
} from 'lucide-react';
import ProfileInstallmentAction from '@/components/profile-installment-action';
import { useTranslation } from 'react-i18next';

interface Schedule {
    id: string;
    title: string | null;
    schedule_date: string;
    day: string;
    start_time: string;
    end_time: string;
    recording_url: string | null;
}

interface CertificationProgram {
    id: string;
    title: string;
    slug: string;
    thumbnail?: string | null;
    category?: {
        id: string;
        name: string;
    } | null;
    price?: number;
    scholarship_price?: number;
    description?: string | null;
    benefits?: string | null;
    group_url?: string | null;
    socialization_group_url?: string | null;
    program_url?: string | null;
    schedules?: Schedule[];
    socializationSchedules?: Schedule[];
}

interface CertificationProgramItem {
    id: string;
    price: number;
    is_scholarship: boolean;
    certificationProgram: CertificationProgram;
    created_at: string;
}

interface Invoice {
    id: string;
    invoice_code: string;
    invoice_url: string;
    amount: number;
    nett_amount: number;
    discount_amount: number;
    status: 'paid' | 'pending' | 'failed' | 'completed' | 'installment_pending';
    is_installment?: boolean;
    is_access_suspended?: boolean;
    is_fully_paid?: boolean;
    paid_terms?: number;
    total_terms?: number;
    paid_at: string | null;
    created_at: string;
    payment_method: string | null;
    payment_channel: string | null;
    certificationProgramItems?: CertificationProgramItem[];
}

interface Props {
    invoice: Invoice;
    programItem: CertificationProgramItem;
    active_installment?: any | null;
}

function parseList(items?: string | null): string[] {
    if (!items) return [];
    const matches = items.match(/<li>(.*?)<\/li>/g);
    if (!matches) return [];
    return matches.map((li) => li.replace(/<\/?li>/g, '').trim());
}

function getYoutubeId(url: string) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : '';
}

export default function CertificationProgramDetail({ invoice, programItem, active_installment }: Props) {
    const { t, i18n } = useTranslation('profile');
    const program = programItem?.certificationProgram;
    const isScholarship = programItem?.is_scholarship;

    if (!program || !programItem) {
        return (
            <UserLayout>
                <Head title={t('certifications.detail.notFoundTitle')} />
                <ProfileLayout>
                    <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
                        <p className="text-red-700">{t('certifications.detail.notFoundDesc')}</p>
                    </div>
                </ProfileLayout>
            </UserLayout>
        );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isToday = (dateString: string) => {
        const d = new Date(dateString);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
    };

    const todaySchedules = program.schedules?.filter((s) => isToday(s.schedule_date)) || [];
    const todaySocializations = isScholarship ? program.socializationSchedules?.filter((s) => isToday(s.schedule_date)) || [] : [];

    const hasActivityToday = todaySchedules.length > 0 || todaySocializations.length > 0;
    const benefitsList = parseList(program.benefits);

    return (
        <UserLayout>
            <Head title={`${program.title} - ${t('certifications.title')}`} />
            <section className="to-background from-background via-tertiary dark:via-background dark:to-background relative bg-gradient-to-b py-12 text-gray-900 dark:text-white">
                <div className="pointer-events-none absolute top-1/2 left-1/2 z-0 flex -translate-x-1/2 -translate-y-1/2 animate-spin items-center gap-8 duration-[10s]">
                    <div className="bg-primary h-[300px] w-[300px] rounded-full blur-[200px]" />
                    <div className="bg-secondary h-[300px] w-[300px] rounded-full blur-[200px]" />
                </div>
                <div className="relative mx-auto max-w-7xl px-4 text-center">
                    <Button className="top-0 left-4 mb-4 rounded-full md:absolute md:mb-0" variant="secondary" asChild>
                        <Link href="/profile/my-certification-programs">
                            <ArrowLeft /> {t('certifications.detail.backToCertifications')}
                        </Link>
                    </Button>
                    <div className="col-span-2">
                        <div className="flex flex-col items-center justify-center md:flex-row md:gap-4">
                            <span className="text-primary border-primary bg-background mb-4 w-fit rounded-full border bg-gradient-to-t from-[#D9E5FF] to-white px-4 py-1 text-sm font-medium shadow-xs">
                                📌 {isScholarship ? t('certifications.scholarship') : t('certifications.regular')}
                            </span>
                        </div>

                        <h1 className="mx-auto mb-4 max-w-2xl text-4xl leading-tight font-bold italic sm:text-5xl">{program.title}</h1>

                        <div className="flex flex-col items-center justify-center gap-2 sm:flex-row sm:justify-center sm:gap-4">
                            <Badge
                                className={
                                    isScholarship ? 'border-emerald-300 bg-emerald-500 text-white' : 'border-amber-300 bg-amber-500 text-white'
                                }
                            >
                                {isScholarship ? t('certifications.detail.scholarshipTrack') : t('certifications.detail.regularTrack')}
                            </Badge>
                            <Button asChild size="sm" variant="secondary">
                                <Link href={route('certification-programs.detail', { program: program.slug })}>
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    {t('certifications.detail.viewPublicDetail')}
                                </Link>
                            </Button>
                        </div>

                        {invoice.is_access_suspended ? (
                            <div className="mt-4 flex justify-center">
                                <span className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300">
                                    {t('certifications.detail.suspendedNotice')}
                                </span>
                            </div>
                        ) : invoice.is_installment && !invoice.is_fully_paid ? (
                            <div className="mt-4 flex justify-center w-full">
                                <ProfileInstallmentAction
                                    variant="banner"
                                    activeInstallment={active_installment}
                                    invoiceId={invoice.id}
                                    isInstallment={invoice.is_installment}
                                    isFullyPaid={invoice.is_fully_paid}
                                    isSuspended={invoice.is_access_suspended}
                                    paidTerms={invoice.paid_terms}
                                    totalTerms={invoice.total_terms}
                                />
                            </div>
                        ) : null}
                    </div>
                </div>
            </section>

            <section className="mx-auto mb-12 w-full max-w-7xl px-4">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="col-span-1 space-y-6 md:col-span-2">
                        {/* Alert: Akses Dibekukan jika cicilan overdue */}
                        {invoice.is_access_suspended && (
                            <Alert variant="destructive" className="border-red-300 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20">
                                <Lock className="h-5 w-5 text-red-600 dark:text-red-400" />
                                <AlertTitle className="text-lg font-bold text-red-800 dark:text-red-300">
                                    {t('certifications.detail.suspendedAlertTitle')}
                                </AlertTitle>
                                <AlertDescription className="mt-2 space-y-3 text-red-700 dark:text-red-400">
                                    <p>
                                        {t('certifications.detail.suspendedAlertDesc')}
                                    </p>
                                    <Button asChild size="sm" variant="destructive">
                                        <Link href={route('profile.installments')}>
                                            {t('certifications.detail.btnOpenInstallments')}
                                        </Link>
                                    </Button>
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Alert: Notifikasi Cicilan Sedang Berjalan & Akses Sertifikat */}
                        {invoice.is_installment && !invoice.is_fully_paid && !invoice.is_access_suspended && (
                            <Alert className="border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-900/20">
                                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                <AlertTitle className="font-semibold text-amber-800 dark:text-amber-300">
                                    {t('certifications.detail.installmentNoticeTitle', { paid: invoice.paid_terms, total: invoice.total_terms })}
                                </AlertTitle>
                                <AlertDescription className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                                    {t('certifications.detail.installmentNoticeDesc')}
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Highlight Section for Today's Schedule */}
                        {hasActivityToday && !invoice.is_access_suspended && (
                            <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-900/20">
                                <BellRing className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                <AlertTitle className="text-lg font-bold text-blue-800 dark:text-blue-300">{t('certifications.detail.todayScheduleTitle')}</AlertTitle>
                                <AlertDescription className="mt-2 space-y-2 text-blue-700 dark:text-blue-400">
                                    <p>{t('certifications.detail.todayScheduleDesc')}</p>
                                    <div className="mt-3 flex flex-col gap-2">
                                        {todaySchedules.map((schedule) => (
                                            <div key={schedule.id} className="flex items-center gap-2 rounded-md bg-white/60 p-2 dark:bg-black/20">
                                                <Badge className="bg-blue-600 text-white hover:bg-blue-700">{t('certifications.detail.badgeClass')}</Badge>
                                                <span className="font-medium">{schedule.title || t('certifications.detail.classSession', { number: 1 })}</span>
                                                <span className="ml-auto text-sm opacity-80">
                                                    {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)} {i18n.language === 'en' ? 'UTC+7' : 'WIB'}
                                                </span>
                                            </div>
                                        ))}
                                        {todaySocializations.map((schedule) => (
                                            <div key={schedule.id} className="flex items-center gap-2 rounded-md bg-white/60 p-2 dark:bg-black/20">
                                                <Badge className="bg-emerald-600 text-white hover:bg-emerald-700">{t('certifications.detail.badgeSocialization')}</Badge>
                                                <span className="font-medium">{schedule.title || t('certifications.detail.socializationSession', { number: 1 })}</span>
                                                <span className="ml-auto text-sm opacity-80">
                                                    {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)} {i18n.language === 'en' ? 'UTC+7' : 'WIB'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Akses Grup & Program */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <LinkIcon className="h-5 w-5" />
                                    {t('certifications.detail.importantAccess')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="flex flex-col items-start gap-2 rounded-xl border bg-gray-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                                    <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                        <Users className="h-4 w-4" /> {t('certifications.detail.classGroup')}
                                    </div>
                                    <p className="flex-1 text-sm text-gray-600 dark:text-gray-400">
                                        {t('certifications.detail.classGroupDesc')}
                                    </p>
                                    {invoice.is_access_suspended ? (
                                        <Button size="sm" variant="destructive" className="mt-2 w-full sm:w-auto" disabled>
                                            <Lock className="mr-1.5 h-3.5 w-3.5" /> {t('certifications.detail.btnAccessSuspended')}
                                        </Button>
                                    ) : program.group_url ? (
                                        <Button asChild size="sm" className="mt-2 w-full sm:w-auto">
                                            <a href={formatExternalUrl(program.group_url)} target="_blank" rel="noopener noreferrer">
                                                {t('certifications.detail.btnJoinClassGroup')}
                                            </a>
                                        </Button>
                                    ) : (
                                        <Button size="sm" variant="secondary" className="mt-2 w-full sm:w-auto" disabled>
                                            {t('certifications.detail.btnNotAvailable')}
                                        </Button>
                                    )}
                                </div>

                                <div className="flex flex-col items-start gap-2 rounded-xl border bg-gray-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                                    <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                        <BookOpen className="h-4 w-4" /> {t('certifications.detail.programLink')}
                                    </div>
                                    <p className="flex-1 text-sm text-gray-600 dark:text-gray-400">
                                        {t('certifications.detail.programLinkDesc')}
                                    </p>
                                    {invoice.is_access_suspended ? (
                                        <Button size="sm" variant="destructive" className="mt-2 w-full sm:w-auto" disabled>
                                            <Lock className="mr-1.5 h-3.5 w-3.5" /> {t('certifications.detail.btnAccessSuspended')}
                                        </Button>
                                    ) : program.program_url ? (
                                        <Button
                                            asChild
                                            size="sm"
                                            variant="outline"
                                            className="border-primary text-primary hover:bg-primary/10 mt-2 w-full sm:w-auto"
                                        >
                                            <a href={formatExternalUrl(program.program_url)} target="_blank" rel="noopener noreferrer">
                                                {t('certifications.detail.btnOpenProgram')}
                                            </a>
                                        </Button>
                                    ) : (
                                        <Button size="sm" variant="secondary" className="mt-2 w-full sm:w-auto" disabled>
                                            {t('certifications.detail.btnNotAvailable')}
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Jadwal Program */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CalendarDays className="h-5 w-5" />
                                    {t('certifications.detail.programSchedule')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Tabs defaultValue="class" className="w-full">
                                    <TabsList className={`mb-6 grid w-full ${isScholarship ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                        <TabsTrigger value="class">{t('certifications.detail.tabClass')}</TabsTrigger>
                                        {isScholarship && <TabsTrigger value="socialization">{t('certifications.detail.tabSocialization')}</TabsTrigger>}
                                    </TabsList>
                                    <TabsContent value="class" className="space-y-4">
                                        {program.schedules && program.schedules.length > 0 ? (
                                            <div className="space-y-3">
                                                {program.schedules.map((schedule, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="rounded-xl border bg-white p-4 dark:bg-zinc-900"
                                                    >
                                                        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                                                            <div className="flex items-center gap-4">
                                                                <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                                                    <span className="text-xs font-medium uppercase">
                                                                        {new Date(schedule.schedule_date).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'id-ID', { month: 'short' })}
                                                                    </span>
                                                                    <span className="text-lg leading-none font-bold">
                                                                        {new Date(schedule.schedule_date).getDate()}
                                                                    </span>
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                                                        {schedule.title || t('certifications.detail.classSession', { number: idx + 1 })}
                                                                    </h4>
                                                                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                                                                        <span className="flex items-center gap-1 capitalize">
                                                                            <Calendar className="h-3.5 w-3.5" />
                                                                            {new Date(schedule.schedule_date).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'id-ID', {
                                                                                weekday: 'long',
                                                                                day: 'numeric',
                                                                                month: 'long',
                                                                                year: 'numeric',
                                                                            })}
                                                                        </span>
                                                                        <span className="flex items-center gap-1">
                                                                            <Clock className="h-3.5 w-3.5" />
                                                                            {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)} {i18n.language === 'en' ? 'UTC+7' : 'WIB'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {schedule.recording_url && (
                                                                invoice.is_access_suspended ? (
                                                                    <Button size="sm" variant="destructive" className="mt-2 w-full sm:mt-0 sm:w-auto" disabled>
                                                                        <Lock className="mr-1 h-3.5 w-3.5" /> {t('certifications.detail.btnAccessSuspended')}
                                                                    </Button>
                                                                ) : (
                                                                    <Button asChild size="sm" variant="outline" className="mt-2 w-full sm:mt-0 sm:w-auto">
                                                                        <a href={schedule.recording_url} target="_blank" rel="noopener noreferrer">
                                                                            <ExternalLink className="mr-1 h-3.5 w-3.5" />
                                                                            {t('certifications.detail.openYoutube')}
                                                                        </a>
                                                                    </Button>
                                                                )
                                                            )}
                                                        </div>
                                                        {schedule.recording_url && !invoice.is_access_suspended && (() => {
                                                            const videoId = getYoutubeId(schedule.recording_url!);
                                                            const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : '';
                                                            return embedUrl ? (
                                                                <div className="mt-3">
                                                                    <iframe
                                                                        className="aspect-video w-full rounded-lg border"
                                                                        src={embedUrl}
                                                                        title={`Rekaman ${schedule.title || t('certifications.detail.classSession', { number: idx + 1 })}`}
                                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                                        allowFullScreen
                                                                    />
                                                                </div>
                                                            ) : null;
                                                        })()}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="rounded-xl border border-dashed bg-gray-50 py-8 text-center dark:bg-zinc-900/50">
                                                <p className="text-gray-500">{t('certifications.detail.emptyClassSchedule')}</p>
                                            </div>
                                        )}
                                    </TabsContent>
                                    {isScholarship && (
                                        <TabsContent value="socialization" className="space-y-4">
                                            {program.socializationSchedules && program.socializationSchedules.length > 0 ? (
                                                <div className="space-y-3">
                                                    {program.socializationSchedules.map((schedule, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="rounded-xl border bg-white p-4 dark:bg-zinc-900"
                                                        >
                                                            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                                                        <span className="text-xs font-medium uppercase">
                                                                            {new Date(schedule.schedule_date).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'id-ID', {
                                                                                month: 'short',
                                                                            })}
                                                                        </span>
                                                                        <span className="text-lg leading-none font-bold">
                                                                            {new Date(schedule.schedule_date).getDate()}
                                                                        </span>
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                                                            {schedule.title || t('certifications.detail.socializationSession', { number: idx + 1 })}
                                                                        </h4>
                                                                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                                                                            <span className="flex items-center gap-1 capitalize">
                                                                                <Calendar className="h-3.5 w-3.5" />
                                                                                {new Date(schedule.schedule_date).toLocaleDateString(i18n.language === 'en' ? 'en-US' : 'id-ID', {
                                                                                    weekday: 'long',
                                                                                    day: 'numeric',
                                                                                    month: 'long',
                                                                                    year: 'numeric',
                                                                                })}
                                                                            </span>
                                                                            <span className="flex items-center gap-1">
                                                                                <Clock className="h-3.5 w-3.5" />
                                                                                {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)} {i18n.language === 'en' ? 'UTC+7' : 'WIB'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                {schedule.recording_url && (
                                                                    invoice.is_access_suspended ? (
                                                                        <Button size="sm" variant="destructive" className="mt-2 w-full sm:mt-0 sm:w-auto" disabled>
                                                                            <Lock className="mr-1 h-3.5 w-3.5" /> {t('certifications.detail.btnAccessSuspended')}
                                                                        </Button>
                                                                    ) : (
                                                                        <Button asChild size="sm" variant="outline" className="mt-2 w-full sm:mt-0 sm:w-auto">
                                                                            <a href={schedule.recording_url} target="_blank" rel="noopener noreferrer">
                                                                                <ExternalLink className="mr-1 h-3.5 w-3.5" />
                                                                                {t('certifications.detail.openYoutube')}
                                                                            </a>
                                                                        </Button>
                                                                    )
                                                                )}
                                                            </div>
                                                            {schedule.recording_url && !invoice.is_access_suspended && (() => {
                                                                const videoId = getYoutubeId(schedule.recording_url!);
                                                                const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : '';
                                                                return embedUrl ? (
                                                                    <div className="mt-3">
                                                                        <iframe
                                                                            className="aspect-video w-full rounded-lg border"
                                                                            src={embedUrl}
                                                                            title={`Rekaman ${schedule.title || t('certifications.detail.socializationSession', { number: idx + 1 })}`}
                                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                                            allowFullScreen
                                                                        />
                                                                    </div>
                                                                ) : null;
                                                            })()}
                                                        </div>
                                                    ))}
                                                    {program.socialization_group_url && (
                                                        <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
                                                            <div>
                                                                <h5 className="font-medium text-emerald-800 dark:text-emerald-300">
                                                                    {t('certifications.detail.socializationGroup')}
                                                                </h5>
                                                                <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-400">
                                                                    {t('certifications.detail.socializationGroupDesc')}
                                                                </p>
                                                            </div>
                                                            {invoice.is_access_suspended ? (
                                                                <Button size="sm" variant="destructive" disabled>
                                                                    <Lock className="mr-1.5 h-3.5 w-3.5" /> {t('certifications.detail.btnAccessSuspended')}
                                                                </Button>
                                                            ) : (
                                                                <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                                                                    <a href={formatExternalUrl(program.socialization_group_url)} target="_blank" rel="noopener noreferrer">
                                                                        {t('certifications.detail.btnJoinGroup')}
                                                                    </a>
                                                                </Button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="rounded-xl border border-dashed bg-gray-50 py-8 text-center dark:bg-zinc-900/50">
                                                    <p className="text-gray-500">{t('certifications.detail.emptySocializationSchedule')}</p>
                                                </div>
                                            )}
                                        </TabsContent>
                                    )}
                                </Tabs>
                            </CardContent>
                        </Card>

                        {/* Detail dan Materi */}
                        {(program.description || benefitsList.length > 0) && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        {t('certifications.detail.programInfoAndMaterials')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {program.description && (
                                        <div className="space-y-2">
                                            <h3 className="text-lg font-semibold">{t('certifications.detail.programDescription')}</h3>
                                            <div
                                                className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-300"
                                                dangerouslySetInnerHTML={{ __html: program.description }}
                                            />
                                        </div>
                                    )}

                                    {benefitsList.length > 0 && (
                                        <div className="space-y-3">
                                            <h3 className="text-lg font-semibold">{t('certifications.detail.materialsAndBenefits')}</h3>
                                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                                {benefitsList.map((benefit, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="flex items-start gap-3 rounded-lg border bg-gray-50 p-3 dark:border-zinc-800 dark:bg-zinc-900"
                                                    >
                                                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
                                                        <span
                                                            className="text-sm text-gray-700 dark:text-gray-300"
                                                            dangerouslySetInnerHTML={{ __html: benefit }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    <div className="col-span-1">
                        <div className="sticky top-6 space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">{t('certifications.detail.purchaseSummary')}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 text-sm">
                                    <div className="flex flex-col gap-3">
                                        <div className="rounded-lg border bg-gray-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
                                            <p className="text-xs text-gray-500">{t('certifications.detail.category')}</p>
                                            <p className="mt-1 font-medium">{program.category?.name || '-'}</p>
                                        </div>
                                        <div className="rounded-lg border bg-gray-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
                                            <p className="text-xs text-gray-500">{t('certifications.detail.purchaseDate')}</p>
                                            <p className="mt-1 font-medium">
                                                {invoice.paid_at ? new Date(invoice.paid_at).toLocaleString(i18n.language === 'en' ? 'en-US' : 'id-ID') : '-'}
                                            </p>
                                        </div>
                                        <div className="rounded-lg border bg-gray-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
                                            <p className="text-xs text-gray-500">{t('certifications.detail.programPrice')}</p>
                                            <p className="mt-1 font-medium text-emerald-600">
                                                Rp {(isScholarship ? program.scholarship_price : program.price || 0)?.toLocaleString(i18n.language === 'en' ? 'en-US' : 'id-ID')}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">{invoice.is_installment ? t('certifications.detail.installmentDetail') : t('certifications.detail.invoiceDetail')}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-gray-500">{t('certifications.detail.invoiceCode')}</span>
                                        <span className="font-medium">{invoice.invoice_code}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-gray-500">{t('certifications.detail.status')}</span>
                                        <span
                                            className={`font-medium ${
                                                invoice.is_access_suspended
                                                    ? 'text-red-600'
                                                    : invoice.is_installment && !invoice.is_fully_paid
                                                      ? 'text-amber-600'
                                                      : 'text-green-600'
                                            }`}
                                        >
                                            {invoice.is_access_suspended
                                                ? t('certifications.detail.statusSuspended')
                                                : invoice.is_installment && !invoice.is_fully_paid
                                                  ? t('certifications.detail.statusInstallment', { paid: invoice.paid_terms, total: invoice.total_terms })
                                                  : t('certifications.detail.statusPaid')}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-gray-500">{t('certifications.detail.total')}</span>
                                        <span className="font-medium">Rp {invoice.amount.toLocaleString(i18n.language === 'en' ? 'en-US' : 'id-ID')}</span>
                                    </div>
                                    {invoice.payment_method && (
                                        <div className="flex items-center justify-between gap-4">
                                            <span className="text-gray-500">{t('certifications.detail.method')}</span>
                                            <span className="font-medium">{invoice.payment_method}</span>
                                        </div>
                                    )}
                                    {/* Hanya tampilkan tombol unduh invoice jika bukan cicilan atau cicilan sudah lunas */}
                                    {(!invoice.is_installment || invoice.is_fully_paid) && (
                                        <Button asChild variant="outline" className="mt-4 w-full" size="sm">
                                            <a href={route('invoice.pdf', { id: invoice.id })} target="_blank" rel="noopener noreferrer">
                                                <FileText className="mr-2 h-4 w-4" />
                                                {t('certifications.detail.downloadInvoice')}
                                            </a>
                                        </Button>
                                    )}
                                    {invoice.is_installment && (
                                        <div className="mt-4">
                                            <ProfileInstallmentAction
                                                variant="card"
                                                activeInstallment={active_installment}
                                                invoiceId={invoice.id}
                                                isInstallment={invoice.is_installment}
                                                isFullyPaid={invoice.is_fully_paid}
                                                isSuspended={invoice.is_access_suspended}
                                                paidTerms={invoice.paid_terms}
                                                totalTerms={invoice.total_terms}
                                            />
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">{t('certifications.detail.otherLinks')}</CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-2">
                                    <Button asChild size="sm" variant="outline" className="w-full justify-start">
                                        <Link href={route('profile.transactions')}>
                                            <ReceiptText className="mr-2 h-4 w-4" />
                                            {t('certifications.detail.transactionHistory')}
                                        </Link>
                                    </Button>
                                    <Button asChild size="sm" variant="outline" className="w-full justify-start">
                                        <Link href={route('profile.certification-programs')}>
                                            <Home className="mr-2 h-4 w-4" />
                                            {t('certifications.detail.myCertifications')}
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </section>
        </UserLayout>
    );
}
