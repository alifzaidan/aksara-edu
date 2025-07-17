import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spotlight } from '@/components/ui/spotlight';
import ProfileLayout from '@/layouts/profile/layout';
import UserLayout from '@/layouts/user-layout';
import { Head, Link } from '@inertiajs/react';
import { Award, Calendar, CheckCircle, Clock } from 'lucide-react';
import { useState } from 'react';

interface Bootcamp {
    id: string;
    title: string;
    slug: string;
    thumbnail: string;
    price: number;
    start_date: string;
    end_date: string;
    category: Category;
}

interface Category {
    id: string;
    name: string;
}

interface EnrollmentItem {
    id: string;
    bootcamp_id: string;
    bootcamp: Bootcamp;
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
    bootcamp_items: EnrollmentItem[];
    created_at: string;
    payment_channel: string | null;
    payment_method: string | null;
}

interface BootcampProps {
    myBootcamps: Invoice[];
}

export default function MyBootcamps({ myBootcamps }: BootcampProps) {
    const [search, setSearch] = useState('');
    const [visibleCount, setVisibleCount] = useState(6);

    const allItems = myBootcamps.flatMap((invoice) =>
        invoice.bootcamp_items.map((item) => ({
            ...item,
            invoice_status: invoice.status,
            invoice_code: invoice.invoice_code,
            paid_at: invoice.paid_at,
            payment_channel: invoice.payment_channel,
            payment_method: invoice.payment_method,
        })),
    );

    const filteredItems = allItems.filter((item) => item.bootcamp.title.toLowerCase().includes(search.toLowerCase()));

    const visibleItems = filteredItems.slice(0, visibleCount);

    const getBootcampStatus = (bootcamp: Bootcamp) => {
        const now = new Date();
        const startDate = new Date(bootcamp.start_date);
        const endDate = new Date(bootcamp.end_date);

        if (now > endDate) {
            return 'completed';
        } else if (now >= startDate && now <= endDate) {
            return 'ongoing';
        } else {
            return 'upcoming';
        }
    };

    const isCompleted = (bootcamp: Bootcamp) => getBootcampStatus(bootcamp) === 'completed';
    const isOngoing = (bootcamp: Bootcamp) => getBootcampStatus(bootcamp) === 'ongoing';
    const isUpcoming = (bootcamp: Bootcamp) => getBootcampStatus(bootcamp) === 'upcoming';

    return (
        <UserLayout>
            <Head title="Bootcamp Saya" />
            <ProfileLayout>
                <Heading title="Bootcamp Saya" description="Perbanyak portofolio Anda dengan bootcamp kami" />
                <div className="mb-4 flex justify-between gap-2">
                    <Input type="search" placeholder="Cari bootcamp saya..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {visibleItems.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center gap-4 py-12">
                            <img src="/assets/images/not-found.webp" alt="Bootcamp Belum Tersedia" className="w-48" />
                            <div className="text-center text-gray-500">Belum ada bootcamp yang tersedia saat ini.</div>
                        </div>
                    ) : (
                        visibleItems.map((item) => (
                            <Link
                                key={item.id}
                                href={`/profile/my-bootcamps/${item.bootcamp.slug}`}
                                className="relative overflow-hidden rounded-xl bg-zinc-300/30 p-[2px] dark:bg-zinc-700/30"
                            >
                                <Spotlight className="bg-primary blur-2xl" size={284} />
                                <div className="bg-sidebar relative flex h-full w-full flex-col items-center justify-center rounded-lg dark:bg-zinc-800">
                                    {isCompleted(item.bootcamp) && (
                                        <div className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 px-3 py-1 text-xs font-semibold text-white shadow-lg">
                                            <Award className="h-3 w-3" />
                                            Selesai
                                        </div>
                                    )}

                                    {isOngoing(item.bootcamp) && (
                                        <div className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-lg">
                                            <Clock className="h-3 w-3" />
                                            Berlangsung
                                        </div>
                                    )}

                                    {isUpcoming(item.bootcamp) && (
                                        <div className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-3 py-1 text-xs font-semibold text-white shadow-lg">
                                            <Calendar className="h-3 w-3" />
                                            Akan Datang
                                        </div>
                                    )}

                                    <img
                                        src={item.bootcamp.thumbnail ? `/storage/${item.bootcamp.thumbnail}` : '/assets/images/placeholder.png'}
                                        alt={item.bootcamp.title}
                                        className="h-48 w-full rounded-t-lg object-cover"
                                    />
                                    <div className="h-full w-full p-4 text-left">
                                        <h2 className="mb-1 text-lg font-semibold">{item.bootcamp.title}</h2>
                                        <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">{item.bootcamp.category.name}</p>

                                        {isCompleted(item.bootcamp) && (
                                            <div className="mb-3 flex items-center gap-2 rounded-lg bg-green-50 p-2 dark:bg-green-900/20">
                                                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                <span className="text-xs font-medium text-green-700 dark:text-green-300">Bootcamp telah selesai</span>
                                            </div>
                                        )}

                                        {isOngoing(item.bootcamp) && (
                                            <div className="mb-3 flex items-center gap-2 rounded-lg bg-blue-50 p-2 dark:bg-blue-900/20">
                                                <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Sedang berlangsung</span>
                                            </div>
                                        )}

                                        {isUpcoming(item.bootcamp) && (
                                            <div className="mb-3 flex items-center gap-2 rounded-lg bg-orange-50 p-2 dark:bg-orange-900/20">
                                                <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                                <span className="text-xs font-medium text-orange-700 dark:text-orange-300">Akan dimulai</span>
                                            </div>
                                        )}

                                        <div className="mt-2 flex justify-between">
                                            <div className="flex items-center gap-2">
                                                <Calendar size="18" />
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {new Date(item.bootcamp.start_date).toLocaleDateString('id-ID', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric',
                                                    })}{' '}
                                                    -{' '}
                                                    {new Date(item.bootcamp.end_date).toLocaleDateString('id-ID', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric',
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
