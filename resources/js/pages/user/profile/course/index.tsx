import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spotlight } from '@/components/ui/spotlight';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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
    category: Category;
}

interface Category {
    id: string;
    name: string;
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
    course_items: EnrollmentItem[];
    created_at: string;
    payment_channel: string | null;
    payment_method: string | null;
}

interface CourseProps {
    myCourses: Invoice[];
}

export default function MyCourses({ myCourses }: CourseProps) {
    const [search, setSearch] = useState('');
    const [visibleCount, setVisibleCount] = useState(6);

    const allItems = myCourses.flatMap((invoice) =>
        invoice.course_items.map((item) => ({
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
            <Head title="Kelas Online Saya" />
            <ProfileLayout>
                <Heading title="Kelas Online Saya" description="Upgrade keterampilan Anda dengan kelas online kami" />
                <div className="mb-4 flex justify-between gap-2">
                    <Input type="search" placeholder="Cari kelas saya..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {visibleItems.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center gap-4 py-12">
                            <img src="/assets/images/not-found.svg" alt="Kelas Belum Tersedia" className="w-48" />
                            <div className="text-center text-gray-500">Belum ada kelas yang tersedia saat ini.</div>
                        </div>
                    ) : (
                        visibleItems.map((item) => (
                            <Link
                                key={item.id}
                                href={`/profile/my-courses/${item.course.slug}`}
                                className="relative overflow-hidden rounded-xl bg-zinc-300/30 p-[2px] dark:bg-zinc-700/30"
                            >
                                <Spotlight className="bg-primary blur-2xl" size={284} />
                                <div className="bg-sidebar relative flex w-full flex-col items-center justify-center rounded-lg dark:bg-zinc-800">
                                    <img
                                        src={item.course.thumbnail ? `/storage/${item.course.thumbnail}` : '/assets/images/placeholder.png'}
                                        alt={item.course.title}
                                        className="h-48 w-full rounded-t-lg object-cover"
                                    />
                                    <div className="w-full p-4 text-left">
                                        <h2 className="mb-1 text-lg font-semibold">{item.course.title}</h2>
                                        <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">{item.course.category.name}</p>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div
                                                    className={
                                                        item.course.level === 'beginner'
                                                            ? 'w-fit rounded-full border border-green-300 bg-green-100 px-3 py-1 text-sm font-medium text-green-700 dark:bg-zinc-800 dark:text-green-300'
                                                            : item.course.level === 'intermediate'
                                                              ? 'w-fit rounded-full border border-yellow-300 bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-700 dark:bg-zinc-800 dark:text-yellow-300'
                                                              : 'w-fit rounded-full border border-red-300 bg-red-100 px-3 py-1 text-sm font-medium text-red-700 dark:bg-zinc-800 dark:text-red-300'
                                                    }
                                                >
                                                    <p className="text-xs capitalize">{item.course.level}</p>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                {item.course.level === 'beginner' && <p>Level Beginner</p>}
                                                {item.course.level === 'intermediate' && <p>Level Intermediate</p>}
                                                {item.course.level === 'advanced' && <p>Level Advanced</p>}
                                            </TooltipContent>
                                        </Tooltip>
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
