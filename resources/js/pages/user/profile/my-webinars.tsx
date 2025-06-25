import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ProfileLayout from '@/layouts/profile/layout';
import UserLayout from '@/layouts/user-layout';
import { Head, Link } from '@inertiajs/react';
import { Calendar } from 'lucide-react';
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
    console.log(myWebinars);
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
                            <img src="/assets/images/not-found.svg" alt="Webinar Belum Tersedia" className="w-48" />
                            <div className="text-center text-gray-500">Belum ada webinar yang tersedia saat ini.</div>
                        </div>
                    ) : (
                        visibleItems.map((item) => (
                            <Link
                                key={item.id}
                                href={`/webinar/${item.webinar.slug}`}
                                className="relative overflow-hidden rounded-xl bg-zinc-300/30 p-[2px] dark:bg-zinc-700/30"
                            >
                                <div className="bg-sidebar relative flex w-full flex-col items-center justify-center rounded-lg dark:bg-zinc-800">
                                    <img
                                        src={item.webinar.thumbnail ? `/storage/${item.webinar.thumbnail}` : '/assets/images/placeholder.png'}
                                        alt={item.webinar.title}
                                        className="h-48 w-full rounded-t-lg object-cover"
                                    />
                                    <div className="w-full p-4 text-left">
                                        <h2 className="mb-1 text-lg font-semibold">{item.webinar.title}</h2>
                                        <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">{item.webinar.category.name}</p>
                                        <div className="mt-2 flex justify-between">
                                            <div className="flex items-center gap-2">
                                                <Calendar size="18" />
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {new Date(item.webinar.start_time).toLocaleDateString('id-ID', {
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
