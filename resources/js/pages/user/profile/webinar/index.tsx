import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spotlight } from '@/components/ui/spotlight';
import ProfileLayout from '@/layouts/profile/layout';
import UserLayout from '@/layouts/user-layout';
import { Head, Link } from '@inertiajs/react';
import { Award, Calendar, CheckCircle, Clock, Play } from 'lucide-react';
import { useState } from 'react';

interface Webinar {
    id: string;
    title: string;
    slug: string;
    thumbnail: string;
    price: number;
    start_time: string;
    end_time: string;
    category: Category;
}

interface Category {
    id: string;
    name: string;
}

interface EnrollmentItem {
    id: string;
    webinar_id: string;
    webinar: Webinar;
    price: number;
    progress: number;
    completed_at: string | null;
}

interface Invoice {
    id: string;
    invoice_code: string;
    amount: number;
    status: string;
    paid_at: string | null;
    webinar_items: EnrollmentItem[];
    created_at: string;
    payment_channel: string | null;
    payment_method: string | null;
}

interface WebinarProps {
    myWebinars: Invoice[];
}

export default function MyWebinars({ myWebinars }: WebinarProps) {
    const [search, setSearch] = useState('');
    const [visibleCount, setVisibleCount] = useState(6);

    const allItems = myWebinars.flatMap((invoice) =>
        invoice.webinar_items.map((item) => ({
            ...item,
            invoice_status: invoice.status,
            invoice_code: invoice.invoice_code,
            paid_at: invoice.paid_at,
            payment_channel: invoice.payment_channel,
            payment_method: invoice.payment_method,
        })),
    );

    const filteredItems = allItems.filter((item) => item.webinar.title.toLowerCase().includes(search.toLowerCase()));

    const visibleItems = filteredItems.slice(0, visibleCount);

    const getWebinarStatus = (webinar: Webinar) => {
        const now = new Date();
        const startTime = new Date(webinar.start_time);
        const endTime = new Date(webinar.end_time);

        if (now > endTime) {
            return 'completed';
        } else if (now >= startTime && now <= endTime) {
            return 'live';
        } else {
            return 'upcoming';
        }
    };

    const isCompleted = (webinar: Webinar) => getWebinarStatus(webinar) === 'completed';
    const isLive = (webinar: Webinar) => getWebinarStatus(webinar) === 'live';
    const isUpcoming = (webinar: Webinar) => getWebinarStatus(webinar) === 'upcoming';

    return (
        <UserLayout>
            <Head title="Webinar Saya" />
            <ProfileLayout>
                <Heading title="Webinar Saya" description="Jalin relasi dan tingkatkan pengetahuan Anda dengan webinar kami" />
                <div className="mb-4 flex justify-between gap-2">
                    <Input type="search" placeholder="Cari webinar saya..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {visibleItems.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center gap-4 py-12">
                            <img src="/assets/images/not-found.webp" alt="Webinar Belum Tersedia" className="w-48" />
                            <div className="text-center text-gray-500">Belum ada webinar yang tersedia saat ini.</div>
                        </div>
                    ) : (
                        visibleItems.map((item) => (
                            <Link
                                key={item.id}
                                href={`/profile/my-webinars/${item.webinar.slug}`}
                                className="relative overflow-hidden rounded-xl bg-zinc-300/30 p-[2px] dark:bg-zinc-700/30"
                            >
                                <Spotlight className="bg-primary blur-2xl" size={284} />
                                <div className="bg-sidebar relative flex h-full w-full flex-col items-center justify-center rounded-lg dark:bg-zinc-800">
                                    {isCompleted(item.webinar) && (
                                        <div className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 px-3 py-1 text-xs font-semibold text-white shadow-lg">
                                            <Award className="h-3 w-3" />
                                            Selesai
                                        </div>
                                    )}

                                    {isLive(item.webinar) && (
                                        <div className="absolute top-2 right-2 z-10 flex animate-pulse items-center gap-1 rounded-full bg-gradient-to-r from-red-500 to-red-600 px-3 py-1 text-xs font-semibold text-white shadow-lg">
                                            <div className="h-2 w-2 rounded-full bg-white"></div>
                                            LIVE
                                        </div>
                                    )}

                                    {isUpcoming(item.webinar) && (
                                        <div className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-lg">
                                            <Clock className="h-3 w-3" />
                                            Akan Datang
                                        </div>
                                    )}

                                    <img
                                        src={item.webinar.thumbnail ? `/storage/${item.webinar.thumbnail}` : '/assets/images/placeholder.png'}
                                        alt={item.webinar.title}
                                        className="h-48 w-full rounded-t-lg object-cover"
                                    />
                                    <div className="h-full w-full p-4 text-left">
                                        <div className="mb-2 flex items-start justify-between">
                                            <h2 className="text-lg font-semibold">{item.webinar.title}</h2>
                                            {isCompleted(item.webinar) && <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />}
                                        </div>

                                        <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">{item.webinar.category.name}</p>

                                        {/* Status Card */}
                                        {isCompleted(item.webinar) && (
                                            <div className="mb-3 flex items-center gap-2 rounded-lg bg-green-50 p-2 dark:bg-green-900/20">
                                                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                <span className="text-xs font-medium text-green-700 dark:text-green-300">Webinar telah selesai</span>
                                            </div>
                                        )}

                                        {isLive(item.webinar) && (
                                            <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-50 p-2 dark:bg-red-900/20">
                                                <div className="flex items-center gap-1">
                                                    <div className="h-2 w-2 animate-pulse rounded-full bg-red-500"></div>
                                                    <Play className="h-4 w-4 text-red-600 dark:text-red-400" />
                                                </div>
                                                <span className="text-xs font-medium text-red-700 dark:text-red-300">Sedang berlangsung</span>
                                            </div>
                                        )}

                                        {isUpcoming(item.webinar) && (
                                            <div className="mb-3 flex items-center gap-2 rounded-lg bg-blue-50 p-2 dark:bg-blue-900/20">
                                                <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Belum dimulai</span>
                                            </div>
                                        )}

                                        <div className="mt-2 space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Calendar size="16" className="text-gray-500" />
                                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                                    {new Date(item.webinar.start_time).toLocaleDateString('id-ID', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    })}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock size="16" className="text-gray-500" />
                                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                                    {new Date(item.webinar.start_time).toLocaleTimeString('id-ID', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}{' '}
                                                    -{' '}
                                                    {new Date(item.webinar.end_time).toLocaleTimeString('id-ID', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
                {visibleCount < filteredItems.length && (
                    <div className="mb-8 flex justify-center">
                        <Button type="button" className="mt-8 hover:cursor-pointer" onClick={() => setVisibleCount((prev) => prev + 6)}>
                            Lihat Lebih Banyak
                        </Button>
                    </div>
                )}
            </ProfileLayout>
        </UserLayout>
    );
}
