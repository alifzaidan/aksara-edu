import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ProfileLayout from '@/layouts/profile/layout';
import UserLayout from '@/layouts/user-layout';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

interface Course {
    id: string;
    title: string;
    slug: string;
    thumbnail: string;
    price: number;
    level: 'beginner' | 'intermediate' | 'advanced';
    category_id: string;
}

interface EnrollmentItem {
    id: string;
    course_id: string;
    course: Course;
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
    items: EnrollmentItem[];
    created_at: string;
    payment_channel: string | null;
    payment_method: string | null;
}

interface CourseProps {
    myCourses: Invoice[];
}

export default function Transactions({ myCourses }: CourseProps) {
    const [search, setSearch] = useState('');
    const [visibleCount, setVisibleCount] = useState(6);

    const allItems = myCourses.flatMap((invoice) =>
        invoice.items.map((item) => ({
            ...item,
            invoice_status: invoice.status,
            invoice_code: invoice.invoice_code,
            paid_at: invoice.paid_at,
            payment_channel: invoice.payment_channel,
            payment_method: invoice.payment_method,
        })),
    );

    const filteredItems = allItems.filter((item) => item.course.title.toLowerCase().includes(search.toLowerCase()));

    const visibleItems = filteredItems.slice(0, visibleCount);

    return (
        <UserLayout>
            <Head title="Transaksi Saya" />
            <ProfileLayout>
                <Heading title="Transaksi Saya" description="Lihat riwayat transaksi Anda di sini" />
                <div className="mb-4 flex justify-between gap-2">
                    <Input type="search" placeholder="Cari transaksi..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {visibleItems.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-gray-500">Belum ada transaksi yang tersedia saat ini.</div>
                    ) : (
                        visibleItems.map((item) => (
                            <Link
                                key={item.id}
                                href={`/course/${item.course.slug}`}
                                className="relative overflow-hidden rounded-xl bg-zinc-300/30 p-[2px] dark:bg-zinc-700/30"
                            >
                                <div className="bg-sidebar relative flex w-full flex-col items-center justify-center rounded-lg dark:bg-zinc-800">
                                    <img
                                        src={item.course.thumbnail ? `/storage/${item.course.thumbnail}` : '/assets/images/placeholder.png'}
                                        alt={item.course.title}
                                        className="h-48 w-full rounded-t-lg object-cover"
                                    />
                                    <div className="w-full p-4 text-left">
                                        <h2 className="mb-1 text-lg font-semibold">{item.course.title}</h2>
                                        <p className="text-gray-600 dark:text-gray-400">Rp. {item.course.price.toLocaleString('id-ID')}</p>
                                        <div className="mt-2 flex flex-col gap-1 text-sm text-gray-500">
                                            {item.invoice_status === 'paid' && <span className="text-green-600">Sudah Dibayar</span>}
                                            {item.invoice_status !== 'paid' && <span className="text-red-600">Belum Dibayar</span>}
                                            <span>Metode Pembayaran: {item.payment_channel || '-'}</span>
                                            <span>Dibayar pada: {item.paid_at || '-'}</span>
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
