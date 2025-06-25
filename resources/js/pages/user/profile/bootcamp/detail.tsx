import { Button } from '@/components/ui/button';
import UserLayout from '@/layouts/user-layout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, BadgeCheck } from 'lucide-react';

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

function parseList(items?: string | null): string[] {
    if (!items) return [];
    const matches = items.match(/<li>(.*?)<\/li>/g);
    if (!matches) return [];
    return matches.map((li) => li.replace(/<\/?li>/g, '').trim());
}

export default function DetailMyBootcamp({ bootcamp }: { bootcamp: BootcampProps }) {
    const bootcampItem = bootcamp.bootcamp_items?.[0];
    const bootcampData = bootcampItem?.bootcamp;
    const bootcampInvoiceStatus = bootcamp.status;
    const benefitList = parseList(bootcampData.benefits);
    const curriculumList = parseList(bootcampData.curriculum);

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
                                📌 Enrollled in{' '}
                                {new Date(bootcampItem.created_at).toLocaleDateString('id-ID', {
                                    month: 'long',
                                    year: 'numeric',
                                })}
                            </span>
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
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="col-span-2 flex h-full flex-col rounded-xl bg-white p-6 shadow dark:bg-zinc-800">
                        <h1 className="text-lg font-semibold">Jadwal Bootcamp</h1>
                        <ul className="mt-2 mb-8 space-y-2">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
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

                            {bootcampData.schedules && bootcampData.schedules.length > 0 ? (
                                bootcampData.schedules.map((schedule, idx) => (
                                    <li key={idx} className="flex items-center gap-2 text-sm">
                                        <p className="capitalize">
                                            {schedule.day} | {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)} WIB
                                        </p>
                                    </li>
                                ))
                            ) : (
                                <li className="flex items-center gap-2 text-sm">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Jadwal belum tersedia</p>
                                </li>
                            )}
                        </ul>
                        <h1 className="text-lg font-semibold">Fasilitas yang Tersedia</h1>
                        <ul className="mt-4 mb-8 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                            {benefitList.map((benefit, idx) => (
                                <li key={idx} className="flex items-center gap-2">
                                    <BadgeCheck size="18" className="text-green-600" />
                                    <p>{benefit}</p>
                                </li>
                            ))}
                        </ul>
                        <h1 className="text-lg font-semibold">Kurikulum</h1>
                        <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                            {curriculumList.map((item, idx) => (
                                <li key={idx} className="flex items-center gap-2">
                                    <BadgeCheck size="18" className="text-green-600" />
                                    <p>{item}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="col-span-1 flex h-full flex-col rounded-xl bg-white p-6 shadow dark:bg-zinc-800">
                        <h2 className="mb-4 text-center font-semibold">{bootcampData.title}</h2>
                        <img
                            src={bootcampData.thumbnail ? `/storage/${bootcampData.thumbnail}` : '/assets/images/placeholder.png'}
                            alt={bootcampData.title}
                            className="aspect-video rounded-xl object-cover shadow-lg"
                        />
                        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">{bootcampData.short_description}</p>

                        <Button
                            className="mt-2 w-full"
                            disabled={bootcampInvoiceStatus !== 'paid'}
                            onClick={() => window.open(bootcampData.group_url ?? undefined, '_blank')}
                        >
                            Gabung Grup WA
                        </Button>
                    </div>
                </div>
            </section>
        </UserLayout>
    );
}
