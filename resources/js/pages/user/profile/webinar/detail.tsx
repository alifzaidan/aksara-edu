import { Button } from '@/components/ui/button';
import UserLayout from '@/layouts/user-layout';
import { Head } from '@inertiajs/react';
import { BadgeCheck } from 'lucide-react';

interface Category {
    id: string;
    name: string;
}

interface Webinar {
    id: string;
    title: string;
    slug: string;
    thumbnail: string;
    category_id: string;
    category: Category;
    start_time: string;
    end_time: string;
    webinar_url: string;
    registration_url: string;
    benefits: string;
    description: string | null;
    short_description: string | null;
    status: string;
    user_id: string;
    created_at: string;
    updated_at: string;
}

interface EnrollmentWebinarItem {
    id: string;
    invoice_id: string;
    webinar_id: string;
    webinar: Webinar;
    progress: number;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
}

interface WebinarProps {
    id: string;
    invoice_code: string;
    invoice_url: string;
    amount: number;
    status: string;
    paid_at: string | null;
    user_id: string;
    webinar_items: EnrollmentWebinarItem[];
    created_at: string;
    updated_at: string;
}

function parseList(items?: string | null): string[] {
    if (!items) return [];
    const matches = items.match(/<li>(.*?)<\/li>/g);
    if (!matches) return [];
    return matches.map((li) => li.replace(/<\/?li>/g, '').trim());
}

export default function DetailMyWebinar({ webinar }: { webinar: WebinarProps }) {
    const webinarItem = webinar.webinar_items?.[0];
    const webinarData = webinarItem?.webinar;
    const webinarInvoiceStatus = webinar.status;
    const benefitList = parseList(webinarData.benefits);

    return (
        <UserLayout>
            <Head title={webinarData.title} />
            <section className="to-background from-background via-tertiary dark:via-background dark:to-background relative bg-gradient-to-b py-12 text-gray-900 dark:text-white">
                <div className="pointer-events-none absolute top-1/2 left-1/2 z-0 flex -translate-x-1/2 -translate-y-1/2 animate-spin items-center gap-8 duration-[10s]">
                    <div className="bg-primary h-[300px] w-[300px] rounded-full blur-[200px]" />
                    <div className="bg-secondary h-[300px] w-[300px] rounded-full blur-[200px]" />
                </div>
                <div className="relative mx-auto max-w-7xl px-4 text-center">
                    <div className="col-span-2">
                        <div className="flex justify-center gap-4">
                            <span className="text-primary border-primary bg-background mb-4 w-fit rounded-full border bg-gradient-to-t from-[#D9E5FF] to-white px-4 py-1 text-sm font-medium shadow-xs">
                                📌 Enrollled in{' '}
                                {new Date(webinarItem.created_at).toLocaleDateString('id-ID', {
                                    month: 'long',
                                    year: 'numeric',
                                })}
                            </span>
                        </div>

                        <h1 className="mx-auto mb-4 max-w-2xl text-4xl leading-tight font-bold italic sm:text-5xl">{webinarData.title}</h1>

                        <p className="mb-6 text-lg text-gray-600 dark:text-gray-400">{webinarData.description}</p>

                        <div className="flex items-center justify-center gap-4">
                            <span className={`font-semibold ${webinarInvoiceStatus === 'paid' ? 'text-green-600' : 'text-red-600'}`}>
                                {webinarInvoiceStatus !== 'paid' ? 'Selesaikan Pembayaran Untuk Bergabung Webinar!!' : ''}
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
                                {new Date(webinarData.start_time).toLocaleDateString('id-ID', {
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                })}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {new Date(webinarData.start_time).toLocaleTimeString('id-ID', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                                -
                                {new Date(webinarData.end_time).toLocaleTimeString('id-ID', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </p>
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
                    </div>
                    <div className="col-span-1 flex h-full flex-col rounded-xl bg-white p-6 shadow dark:bg-zinc-800">
                        <h2 className="mb-4 text-center font-semibold">{webinarData.title}</h2>
                        <img
                            src={webinarData.thumbnail ? `/storage/${webinarData.thumbnail}` : '/assets/images/placeholder.png'}
                            alt={webinarData.title}
                            className="aspect-video rounded-xl object-cover shadow-lg"
                        />
                        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">{webinarData.short_description}</p>

                        <Button
                            className="mt-2 w-full"
                            disabled={webinarInvoiceStatus !== 'paid'}
                            onClick={() => window.open(webinarData.webinar_url, '_blank')}
                        >
                            Gabung Grup WA
                        </Button>
                    </div>
                </div>
            </section>
        </UserLayout>
    );
}
