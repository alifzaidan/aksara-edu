import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProfileLayout from '@/layouts/profile/layout';
import UserLayout from '@/layouts/user-layout';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    BellRing,
    BookOpen,
    Calendar,
    CalendarDays,
    CheckCircle2,
    Clock,
    ExternalLink,
    FileText,
    Home,
    LinkIcon,
    ReceiptText,
    Users,
} from 'lucide-react';

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
    status: 'paid' | 'pending' | 'failed' | 'completed';
    paid_at: string | null;
    created_at: string;
    payment_method: string | null;
    payment_channel: string | null;
    certificationProgramItems: CertificationProgramItem[];
}

interface Props {
    invoice: Invoice;
    programItem: CertificationProgramItem;
}

function parseList(items?: string | null): string[] {
    if (!items) return [];
    const matches = items.match(/<li>(.*?)<\/li>/g);
    if (!matches) return [];
    return matches.map((li) => li.replace(/<\/?li>/g, '').trim());
}

export default function CertificationProgramDetail({ invoice, programItem }: Props) {
    const program = programItem?.certificationProgram;
    const isScholarship = programItem?.is_scholarship;

    if (!program || !programItem) {
        return (
            <UserLayout>
                <Head title="Program Sertifikasi Tidak Ditemukan" />
                <ProfileLayout>
                    <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
                        <p className="text-red-700">Program sertifikasi tidak ditemukan atau Anda belum memiliki akses.</p>
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
            <Head title={`${program.title} - Sertifikasi Saya`} />
            <section className="to-background from-background via-tertiary dark:via-background dark:to-background relative bg-gradient-to-b py-12 text-gray-900 dark:text-white">
                <div className="pointer-events-none absolute top-1/2 left-1/2 z-0 flex -translate-x-1/2 -translate-y-1/2 animate-spin items-center gap-8 duration-[10s]">
                    <div className="bg-primary h-[300px] w-[300px] rounded-full blur-[200px]" />
                    <div className="bg-secondary h-[300px] w-[300px] rounded-full blur-[200px]" />
                </div>
                <div className="relative mx-auto max-w-7xl px-4 text-center">
                    <Button className="top-0 left-4 mb-4 rounded-full md:absolute md:mb-0" variant="secondary" asChild>
                        <Link href="/profile/my-certification-programs">
                            <ArrowLeft /> Kembali Ke Sertifikasi Saya
                        </Link>
                    </Button>
                    <div className="col-span-2">
                        <div className="flex flex-col items-center justify-center md:flex-row md:gap-4">
                            <span className="text-primary border-primary bg-background mb-4 w-fit rounded-full border bg-gradient-to-t from-[#D9E5FF] to-white px-4 py-1 text-sm font-medium shadow-xs">
                                📌 {isScholarship ? 'Beasiswa' : 'Reguler'}
                            </span>
                        </div>

                        <h1 className="mx-auto mb-4 max-w-2xl text-4xl leading-tight font-bold italic sm:text-5xl">{program.title}</h1>

                        <div className="flex flex-col items-center justify-center gap-2 sm:flex-row sm:justify-center sm:gap-4">
                            <Badge
                                className={
                                    isScholarship ? 'border-emerald-300 bg-emerald-500 text-white' : 'border-amber-300 bg-amber-500 text-white'
                                }
                            >
                                {isScholarship ? 'Jalur Beasiswa' : 'Jalur Reguler'}
                            </Badge>
                            <Button asChild size="sm" variant="secondary">
                                <Link href={route('certification-programs.detail', { program: program.slug })}>
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Lihat Detail Publik
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto mb-12 w-full max-w-7xl px-4">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="col-span-1 space-y-6 md:col-span-2">
                        {/* Highlight Section for Today's Schedule */}
                        {hasActivityToday && (
                            <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-900/20">
                                <BellRing className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                <AlertTitle className="text-lg font-bold text-blue-800 dark:text-blue-300">Ada Jadwal Hari Ini!</AlertTitle>
                                <AlertDescription className="mt-2 space-y-2 text-blue-700 dark:text-blue-400">
                                    <p>Jangan lewatkan jadwal Anda hari ini. Persiapkan diri Anda dengan baik.</p>
                                    <div className="mt-3 flex flex-col gap-2">
                                        {todaySchedules.map((schedule) => (
                                            <div key={schedule.id} className="flex items-center gap-2 rounded-md bg-white/60 p-2 dark:bg-black/20">
                                                <Badge className="bg-blue-600 text-white hover:bg-blue-700">Kelas</Badge>
                                                <span className="font-medium">{schedule.title || 'Sesi Kelas'}</span>
                                                <span className="ml-auto text-sm opacity-80">
                                                    {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)} WIB
                                                </span>
                                            </div>
                                        ))}
                                        {todaySocializations.map((schedule) => (
                                            <div key={schedule.id} className="flex items-center gap-2 rounded-md bg-white/60 p-2 dark:bg-black/20">
                                                <Badge className="bg-emerald-600 text-white hover:bg-emerald-700">Sosialisasi</Badge>
                                                <span className="font-medium">{schedule.title || 'Sesi Sosialisasi'}</span>
                                                <span className="ml-auto text-sm opacity-80">
                                                    {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)} WIB
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
                                    Akses Penting
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="flex flex-col items-start gap-2 rounded-xl border bg-gray-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                                    <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                        <Users className="h-4 w-4" /> Grup Kelas
                                    </div>
                                    <p className="flex-1 text-sm text-gray-600 dark:text-gray-400">
                                        Bergabunglah ke dalam grup untuk berkomunikasi dengan peserta dan mentor.
                                    </p>
                                    {program.group_url ? (
                                        <Button asChild size="sm" className="mt-2 w-full sm:w-auto">
                                            <a href={program.group_url} target="_blank" rel="noopener noreferrer">
                                                Gabung Grup Kelas
                                            </a>
                                        </Button>
                                    ) : (
                                        <Button size="sm" variant="secondary" className="mt-2 w-full sm:w-auto" disabled>
                                            Belum Tersedia
                                        </Button>
                                    )}
                                </div>

                                <div className="flex flex-col items-start gap-2 rounded-xl border bg-gray-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
                                    <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                        <BookOpen className="h-4 w-4" /> Link Program
                                    </div>
                                    <p className="flex-1 text-sm text-gray-600 dark:text-gray-400">
                                        Akses materi, tugas, dan modul program utama melalui tautan ini.
                                    </p>
                                    {program.program_url ? (
                                        <Button
                                            asChild
                                            size="sm"
                                            variant="outline"
                                            className="border-primary text-primary hover:bg-primary/10 mt-2 w-full sm:w-auto"
                                        >
                                            <a href={program.program_url} target="_blank" rel="noopener noreferrer">
                                                Buka Program
                                            </a>
                                        </Button>
                                    ) : (
                                        <Button size="sm" variant="secondary" className="mt-2 w-full sm:w-auto" disabled>
                                            Belum Tersedia
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
                                    Jadwal Program
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Tabs defaultValue="class" className="w-full">
                                    <TabsList className={`mb-6 grid w-full ${isScholarship ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                        <TabsTrigger value="class">Jadwal Kelas</TabsTrigger>
                                        {isScholarship && <TabsTrigger value="socialization">Jadwal Sosialisasi</TabsTrigger>}
                                    </TabsList>
                                    <TabsContent value="class" className="space-y-4">
                                        {program.schedules && program.schedules.length > 0 ? (
                                            <div className="space-y-3">
                                                {program.schedules.map((schedule, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="flex flex-col items-start justify-between gap-4 rounded-xl border bg-white p-4 sm:flex-row sm:items-center dark:bg-zinc-900"
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                                                <span className="text-xs font-medium uppercase">
                                                                    {new Date(schedule.schedule_date).toLocaleDateString('id-ID', { month: 'short' })}
                                                                </span>
                                                                <span className="text-lg leading-none font-bold">
                                                                    {new Date(schedule.schedule_date).getDate()}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                                                    {schedule.title || `Sesi Kelas ${idx + 1}`}
                                                                </h4>
                                                                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                                                                    <span className="flex items-center gap-1 capitalize">
                                                                        <Calendar className="h-3.5 w-3.5" />
                                                                        {schedule.day},{' '}
                                                                        {new Date(schedule.schedule_date).toLocaleDateString('id-ID', {
                                                                            year: 'numeric',
                                                                        })}
                                                                    </span>
                                                                    <span className="flex items-center gap-1">
                                                                        <Clock className="h-3.5 w-3.5" />
                                                                        {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)} WIB
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {schedule.recording_url && (
                                                            <Button asChild size="sm" variant="outline" className="mt-2 w-full sm:mt-0 sm:w-auto">
                                                                <a href={schedule.recording_url} target="_blank" rel="noopener noreferrer">
                                                                    Lihat Rekaman
                                                                </a>
                                                            </Button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="rounded-xl border border-dashed bg-gray-50 py-8 text-center dark:bg-zinc-900/50">
                                                <p className="text-gray-500">Belum ada jadwal kelas yang ditambahkan.</p>
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
                                                            className="flex flex-col items-start justify-between gap-4 rounded-xl border bg-white p-4 sm:flex-row sm:items-center dark:bg-zinc-900"
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                                                    <span className="text-xs font-medium uppercase">
                                                                        {new Date(schedule.schedule_date).toLocaleDateString('id-ID', {
                                                                            month: 'short',
                                                                        })}
                                                                    </span>
                                                                    <span className="text-lg leading-none font-bold">
                                                                        {new Date(schedule.schedule_date).getDate()}
                                                                    </span>
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                                                        {schedule.title || `Sesi Sosialisasi ${idx + 1}`}
                                                                    </h4>
                                                                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                                                                        <span className="flex items-center gap-1 capitalize">
                                                                            <Calendar className="h-3.5 w-3.5" />
                                                                            {schedule.day},{' '}
                                                                            {new Date(schedule.schedule_date).toLocaleDateString('id-ID', {
                                                                                year: 'numeric',
                                                                            })}
                                                                        </span>
                                                                        <span className="flex items-center gap-1">
                                                                            <Clock className="h-3.5 w-3.5" />
                                                                            {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)} WIB
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {schedule.recording_url && (
                                                                <Button asChild size="sm" variant="outline" className="mt-2 w-full sm:mt-0 sm:w-auto">
                                                                    <a href={schedule.recording_url} target="_blank" rel="noopener noreferrer">
                                                                        Lihat Rekaman
                                                                    </a>
                                                                </Button>
                                                            )}
                                                        </div>
                                                    ))}
                                                    {program.socialization_group_url && (
                                                        <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/20">
                                                            <div>
                                                                <h5 className="font-medium text-emerald-800 dark:text-emerald-300">
                                                                    Grup Sosialisasi
                                                                </h5>
                                                                <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-400">
                                                                    Gabung grup sosialisasi untuk informasi lebih lanjut
                                                                </p>
                                                            </div>
                                                            <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                                                                <a href={program.socialization_group_url} target="_blank" rel="noopener noreferrer">
                                                                    Gabung Grup
                                                                </a>
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="rounded-xl border border-dashed bg-gray-50 py-8 text-center dark:bg-zinc-900/50">
                                                    <p className="text-gray-500">Belum ada jadwal sosialisasi yang ditambahkan.</p>
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
                                        Informasi & Materi Program
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {program.description && (
                                        <div className="space-y-2">
                                            <h3 className="text-lg font-semibold">Deskripsi Program</h3>
                                            <div
                                                className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-300"
                                                dangerouslySetInnerHTML={{ __html: program.description }}
                                            />
                                        </div>
                                    )}

                                    {benefitsList.length > 0 && (
                                        <div className="space-y-3">
                                            <h3 className="text-lg font-semibold">Materi & Benefit yang Didapatkan</h3>
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
                                    <CardTitle className="text-lg">Ringkasan Pembelian</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 text-sm">
                                    <div className="flex flex-col gap-3">
                                        <div className="rounded-lg border bg-gray-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
                                            <p className="text-xs text-gray-500">Kategori</p>
                                            <p className="mt-1 font-medium">{program.category?.name || '-'}</p>
                                        </div>
                                        <div className="rounded-lg border bg-gray-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
                                            <p className="text-xs text-gray-500">Tanggal Pembelian</p>
                                            <p className="mt-1 font-medium">
                                                {invoice.paid_at ? new Date(invoice.paid_at).toLocaleString('id-ID') : '-'}
                                            </p>
                                        </div>
                                        <div className="rounded-lg border bg-gray-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
                                            <p className="text-xs text-gray-500">Harga Program</p>
                                            <p className="mt-1 font-medium text-emerald-600">
                                                Rp {(isScholarship ? program.scholarship_price : program.price || 0)?.toLocaleString('id-ID')}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Detail Invoice</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-gray-500">Kode Invoice</span>
                                        <span className="font-medium">{invoice.invoice_code}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-gray-500">Status</span>
                                        <span className="font-medium text-green-600 capitalize">{invoice.status}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-gray-500">Total</span>
                                        <span className="font-medium">Rp {invoice.amount.toLocaleString('id-ID')}</span>
                                    </div>
                                    {invoice.payment_method && (
                                        <div className="flex items-center justify-between gap-4">
                                            <span className="text-gray-500">Metode</span>
                                            <span className="font-medium">{invoice.payment_method}</span>
                                        </div>
                                    )}
                                    <Button asChild variant="outline" className="mt-4 w-full" size="sm">
                                        <a href={route('invoice.pdf', { id: invoice.id })} target="_blank" rel="noopener noreferrer">
                                            <FileText className="mr-2 h-4 w-4" />
                                            Unduh Invoice
                                        </a>
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">Tautan Lainnya</CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-2">
                                    <Button asChild size="sm" variant="outline" className="w-full justify-start">
                                        <Link href={route('profile.transactions')}>
                                            <ReceiptText className="mr-2 h-4 w-4" />
                                            Riwayat Transaksi
                                        </Link>
                                    </Button>
                                    <Button asChild size="sm" variant="outline" className="w-full justify-start">
                                        <Link href={route('profile.certification-programs')}>
                                            <Home className="mr-2 h-4 w-4" />
                                            Sertifikasi Saya
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
