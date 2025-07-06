import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import UserLayout from '@/layouts/user-layout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Award, BadgeCheck, Calendar, CheckCircle, Clock, Download, Eye, Users } from 'lucide-react';
import { useState } from 'react';

interface Category {
    id: string;
    name: string;
}

interface Bootcamp {
    id: string;
    title: string;
    slug: string;
    thumbnail: string;
    category_id: string;
    start_date: string;
    end_date: string;
    category: Category;
    bootcamp_url: string;
    registration_url: string;
    benefits: string;
    curriculum: string;
    description: string | null;
    short_description: string | null;
    group_url: string | null;
    status: string;
    schedules?: { day: string; start_time: string; end_time: string }[];
    user_id: string;
    created_at: string;
    updated_at: string;
}

interface EnrollmentBootcampItem {
    id: string;
    invoice_id: string;
    bootcamp_id: string;
    bootcamp: Bootcamp;
    progress: number;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
}

interface BootcampProps {
    id: string;
    invoice_code: string;
    invoice_url: string;
    amount: number;
    status: string;
    paid_at: string | null;
    user_id: string;
    bootcamp_items: EnrollmentBootcampItem[];
    created_at: string;
    updated_at: string;
}

interface Certificate {
    id: string;
    title: string;
    certificate_number: string;
    description?: string;
}

interface CertificateParticipant {
    id: string;
    certificate_code: string;
    certificate_number: number;
}

interface DetailBootcampProps {
    bootcamp: BootcampProps;
    certificate?: Certificate | null;
    certificateParticipant?: CertificateParticipant | null;
}

function parseList(items?: string | null): string[] {
    if (!items) return [];
    const matches = items.match(/<li>(.*?)<\/li>/g);
    if (!matches) return [];
    return matches.map((li) => li.replace(/<\/?li>/g, '').trim());
}

export default function DetailMyBootcamp({ bootcamp, certificate, certificateParticipant }: DetailBootcampProps) {
    const bootcampItem = bootcamp.bootcamp_items?.[0];
    const bootcampData = bootcampItem?.bootcamp;
    const bootcampInvoiceStatus = bootcamp.status;
    const benefitList = parseList(bootcampData.benefits);
    const curriculumList = parseList(bootcampData.curriculum);
    const [isLoading, setIsLoading] = useState(true);

    const handleIframeLoad = () => {
        setIsLoading(false);
    };

    if (!bootcampData || !bootcampItem) {
        return (
            <UserLayout>
                <Head title="Bootcamp Tidak Ditemukan" />
                <div className="flex h-screen items-center justify-center">
                    <p>Detail bootcamp tidak dapat ditemukan.</p>
                </div>
            </UserLayout>
        );
    }

    const bootcampEndDate = new Date(bootcampData.end_date);
    bootcampEndDate.setHours(23, 59, 59, 999);
    const isCompleted = bootcampEndDate < new Date();

    const hasCertificate = certificate && isCompleted && bootcampInvoiceStatus === 'paid';

    return (
        <UserLayout>
            <Head title={bootcampData.title} />
            <section className="to-background from-background via-tertiary dark:via-background dark:to-background relative bg-gradient-to-b py-12 text-gray-900 dark:text-white">
                <div className="pointer-events-none absolute top-1/2 left-1/2 z-0 flex -translate-x-1/2 -translate-y-1/2 animate-spin items-center gap-8 duration-[10s]">
                    <div className="bg-primary h-[300px] w-[300px] rounded-full blur-[200px]" />
                    <div className="bg-secondary h-[300px] w-[300px] rounded-full blur-[200px]" />
                </div>
                <div className="relative mx-auto max-w-7xl px-4 text-center">
                    <Button className="top-0 left-4 mb-4 rounded-full md:absolute md:mb-0" variant="secondary" asChild>
                        <Link href="/profile/my-bootcamps">
                            <ArrowLeft /> Kembali Ke Bootcamp Saya
                        </Link>
                    </Button>
                    <div className="col-span-2">
                        <div className="flex justify-center gap-4">
                            <span className="text-primary border-primary bg-background mb-4 w-fit rounded-full border bg-gradient-to-t from-[#D9E5FF] to-white px-4 py-1 text-sm font-medium shadow-xs">
                                📌 Enrolled in{' '}
                                {new Date(bootcampItem.created_at).toLocaleDateString('id-ID', {
                                    month: 'long',
                                    year: 'numeric',
                                })}
                            </span>
                            {hasCertificate && (
                                <span className="mb-4 flex w-fit items-center gap-2 rounded-full border border-green-800 bg-green-100 px-4 py-1 text-sm font-medium text-green-800 shadow-xs">
                                    <Award size={16} />
                                    Sertifikat Tersedia
                                </span>
                            )}
                        </div>

                        <h1 className="mx-auto mb-4 max-w-2xl text-4xl leading-tight font-bold italic sm:text-5xl">{bootcampData.title}</h1>

                        <p className="mb-6 text-lg text-gray-600 dark:text-gray-400">{bootcampData.description}</p>

                        <div className="flex items-center justify-center gap-4">
                            <span className={`font-semibold ${bootcampInvoiceStatus === 'paid' ? 'text-green-600' : 'text-red-600'}`}>
                                {bootcampInvoiceStatus !== 'paid' ? 'Selesaikan Pembayaran Untuk Bergabung Bootcamp!!' : ''}
                            </span>
                        </div>
                    </div>
                </div>
            </section>
            <section className="mx-auto mb-12 w-full max-w-7xl px-4">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {isCompleted ? (
                        <>
                            <div className="col-span-2 space-y-6">
                                <div className="rounded-xl border border-green-200 bg-gradient-to-r from-green-50 to-blue-50 p-6 dark:border-green-800 dark:from-green-900/20 dark:to-blue-900/20">
                                    <div className="mb-4 flex items-center gap-3">
                                        <Award className="text-green-600" size={24} />
                                        <h2 className="text-xl font-bold text-green-800 dark:text-green-200">Selamat! Bootcamp Telah Selesai</h2>
                                    </div>
                                    <p className="mb-4 text-green-700 dark:text-green-300">
                                        Terima kasih atas dedikasi dan kerja keras Anda selama program berlangsung. Kami harap ilmu yang Anda peroleh
                                        menjadi bekal berharga untuk karir Anda di masa depan.
                                    </p>
                                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                                        <CheckCircle size={16} />
                                        <span>
                                            Selesai pada:{' '}
                                            {new Date(bootcampData.end_date!).toLocaleDateString('id-ID', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                            })}
                                        </span>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
                                    <div className="mb-4 flex items-center gap-3">
                                        <Calendar className="text-blue-600" size={20} />
                                        <h3 className="text-lg font-semibold">Periode Bootcamp</h3>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3 dark:bg-zinc-700">
                                            <div className="text-blue-600">
                                                <Calendar size={16} />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {new Date(bootcampData.start_date).toLocaleDateString('id-ID', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric',
                                                    })}{' '}
                                                    -{' '}
                                                    {new Date(bootcampData.end_date).toLocaleDateString('id-ID', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric',
                                                    })}
                                                </p>
                                            </div>
                                        </div>

                                        {bootcampData.schedules && bootcampData.schedules.length > 0 && (
                                            <div className="space-y-2">
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Jadwal Sesi:</p>
                                                {bootcampData.schedules.map((schedule, idx) => (
                                                    <div key={idx} className="flex items-center gap-3 rounded bg-gray-50 p-2 dark:bg-zinc-700">
                                                        <Clock size={14} className="text-gray-500" />
                                                        <span className="text-sm text-gray-600 capitalize dark:text-gray-400">
                                                            {schedule.day} | {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)} WIB
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="col-span-2 space-y-6">
                                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
                                    <div className="mb-4 flex items-center gap-3">
                                        <Calendar className="text-blue-600" size={20} />
                                        <h3 className="text-lg font-semibold">Jadwal Bootcamp</h3>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
                                            <div className="text-blue-600">
                                                <Calendar size={16} />
                                            </div>
                                            <div>
                                                <p className="font-medium text-blue-900 dark:text-blue-100">
                                                    {new Date(bootcampData.start_date).toLocaleDateString('id-ID', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric',
                                                    })}{' '}
                                                    -{' '}
                                                    {new Date(bootcampData.end_date).toLocaleDateString('id-ID', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric',
                                                    })}
                                                </p>
                                                <p className="text-sm text-blue-700 dark:text-blue-300">Durasi Program</p>
                                            </div>
                                        </div>

                                        {bootcampData.schedules && bootcampData.schedules.length > 0 ? (
                                            <div className="space-y-2">
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Jadwal Sesi:</p>
                                                {bootcampData.schedules.map((schedule, idx) => (
                                                    <div key={idx} className="flex items-center gap-3 rounded-lg bg-gray-50 p-3 dark:bg-zinc-700">
                                                        <Clock size={16} className="text-green-600" />
                                                        <span className="font-medium text-gray-900 capitalize dark:text-white">{schedule.day}</span>
                                                        <span className="text-gray-600 dark:text-gray-400">
                                                            {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)} WIB
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/20">
                                                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                                    Jadwal detail akan diinformasikan melalui grup WhatsApp
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
                                    <div className="mb-4 flex items-center gap-3">
                                        <BadgeCheck className="text-green-600" size={20} />
                                        <h3 className="text-lg font-semibold">Fasilitas yang Tersedia</h3>
                                    </div>
                                    <div className="space-y-3">
                                        {benefitList.map((benefit, idx) => (
                                            <div key={idx} className="flex items-start gap-3 rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                                                <BadgeCheck size={18} className="mt-0.5 flex-shrink-0 text-green-600" />
                                                <p className="text-gray-700 dark:text-gray-300">{benefit}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
                                    <div className="mb-4 flex items-center gap-3">
                                        <Users className="text-purple-600" size={20} />
                                        <h3 className="text-lg font-semibold">Kurikulum</h3>
                                    </div>
                                    <div className="space-y-3">
                                        {curriculumList.map((item, idx) => (
                                            <div key={idx} className="flex items-start gap-3 rounded-lg bg-purple-50 p-3 dark:bg-purple-900/20">
                                                <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-semibold text-purple-600 dark:bg-purple-800 dark:text-purple-300">
                                                    {idx + 1}
                                                </div>
                                                <p className="text-gray-700 dark:text-gray-300">{item}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="col-span-1">
                        {isCompleted ? (
                            <div className="sticky top-6 space-y-4">
                                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
                                    <div className="mb-4 flex items-center gap-2">
                                        <Award className="text-yellow-500" size={20} />
                                        <h3 className="font-semibold">Sertifikat Kelulusan</h3>
                                    </div>

                                    {isLoading && hasCertificate && <Skeleton className="h-[236px] w-full rounded-lg" />}

                                    <div className="relative">
                                        {hasCertificate ? (
                                            <div className={`group ${isLoading ? 'absolute opacity-0' : 'relative opacity-100'}`}>
                                                <iframe
                                                    src={`${route('profile.bootcamp.certificate.preview', { bootcamp: bootcampData.slug })}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                                                    className="h-[238px] w-full rounded-lg border shadow-lg dark:border-zinc-700"
                                                    title="Preview Sertifikat"
                                                    onLoad={handleIframeLoad}
                                                />
                                                <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                                            </div>
                                        ) : (
                                            <div className="group relative">
                                                <img
                                                    src={'/assets/images/placeholder.png'}
                                                    alt="Sertifikat"
                                                    className="aspect-video rounded-lg border object-cover shadow-lg transition-transform group-hover:scale-105 dark:border-zinc-700"
                                                />
                                                <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                                            </div>
                                        )}
                                    </div>

                                    {hasCertificate ? (
                                        <>
                                            <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
                                                Unduh sertifikat sebagai bukti kelulusan dari bootcamp ini.
                                            </p>
                                            {certificateParticipant && (
                                                <p className="mt-2 text-center text-xs text-blue-600 dark:text-blue-400">
                                                    No. Sertifikat: {String(certificateParticipant.certificate_number).padStart(4, '0')}/
                                                    {certificate.certificate_number}
                                                </p>
                                            )}
                                            <div className="mt-3 space-y-2">
                                                <Button className="w-full" asChild>
                                                    <a href={route('profile.bootcamp.certificate', { bootcamp: bootcampData.slug })} target="_blank">
                                                        <Download size={16} className="mr-2" />
                                                        Unduh Sertifikat
                                                    </a>
                                                </Button>

                                                <Button variant="outline" className="w-full" asChild>
                                                    <a
                                                        href={route('profile.bootcamp.certificate.preview', { bootcamp: bootcampData.slug })}
                                                        target="_blank"
                                                    >
                                                        <Eye size={16} className="mr-2" />
                                                        Lihat Preview
                                                    </a>
                                                </Button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
                                                {!certificate
                                                    ? 'Sertifikat belum dibuat untuk bootcamp ini.'
                                                    : bootcampInvoiceStatus !== 'paid'
                                                      ? 'Selesaikan pembayaran untuk mendapatkan sertifikat.'
                                                      : 'Sertifikat akan tersedia setelah bootcamp selesai.'}
                                            </p>
                                            <Button className="mt-3 w-full" disabled>
                                                <Download size={16} className="mr-2" />
                                                {!certificate
                                                    ? 'Sertifikat Belum Tersedia'
                                                    : bootcampInvoiceStatus !== 'paid'
                                                      ? 'Selesaikan Pembayaran'
                                                      : 'Menunggu Bootcamp Selesai'}
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="sticky top-6">
                                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
                                    <h3 className="mb-4 text-center font-semibold">{bootcampData.title}</h3>
                                    <div className="group relative">
                                        <img
                                            src={bootcampData.thumbnail ? `/storage/${bootcampData.thumbnail}` : '/assets/images/placeholder.png'}
                                            alt={bootcampData.title}
                                            className="aspect-video rounded-lg object-cover shadow-lg transition-transform group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                                    </div>
                                    <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">{bootcampData.short_description}</p>
                                    <Button
                                        className="mt-4 w-full"
                                        disabled={bootcampInvoiceStatus !== 'paid'}
                                        onClick={() => window.open(bootcampData.group_url ?? undefined, '_blank')}
                                    >
                                        <Users size={16} className="mr-2" />
                                        Gabung Grup WA
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </UserLayout>
    );
}
