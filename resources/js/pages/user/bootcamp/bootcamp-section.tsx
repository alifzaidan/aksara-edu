import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Magnetic } from '@/components/ui/magnetic';
import { Spotlight } from '@/components/ui/spotlight';
import { Link } from '@inertiajs/react';
import { GalleryVerticalEnd, Star } from 'lucide-react';
import { useState } from 'react';

type Category = {
    id: string;
    name: string;
};

interface Bootcamp {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    slug: string;
    price: number;
    start_date: string;
    end_date: string;
    category: Category;
}

interface BootcampProps {
    categories: Category[];
    bootcamps: Bootcamp[];
}

export default function BootcampSection({ categories, bootcamps }: BootcampProps) {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [visibleCount, setVisibleCount] = useState(6);

    const filteredBootcamp = bootcamps.filter((bootcamp) => {
        const matchSearch = bootcamp.title.toLowerCase().includes(search.toLowerCase());
        const matchCategory = selectedCategory === null ? true : bootcamp.category.id === selectedCategory;
        return matchSearch && matchCategory;
    });

    const visibleCourses = filteredBootcamp.slice(0, visibleCount);

    return (
        <section className="mx-auto w-full max-w-7xl px-4">
            <h2 className="dark:text-primary-foreground mx-auto mb-4 max-w-3xl text-center text-3xl font-bold text-gray-900 italic md:text-4xl">
                Bersiaplah Menjadi Talenta Digital dalam Hitungan Minggu.
            </h2>
            <p className="mx-auto mb-8 text-center text-gray-600 dark:text-gray-400">
                Upgrade diri dengan mengikuti bootcamp intensif dalam beberapa pertemuan.
            </p>
            <div className="mb-4 flex">
                <Input type="search" placeholder="Cari bootcamp..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="mb-4 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                <div className="flex w-max flex-nowrap gap-2">
                    <button
                        type="button"
                        onClick={() => setSelectedCategory(null)}
                        className={`rounded-xl border px-4 py-2 text-sm transition hover:cursor-pointer ${
                            selectedCategory === null
                                ? 'to-primary text-primary-foreground border-primary bg-gradient-to-br from-black'
                                : 'hover:bg-accent dark:hover:bg-primary/10 bg-background border-gray-300 text-gray-800 dark:border-zinc-100/20 dark:bg-zinc-800 dark:text-zinc-100'
                        } `}
                    >
                        Semua Kategori
                    </button>
                    {categories.map((category) => (
                        <button
                            key={category.id}
                            type="button"
                            onClick={() => setSelectedCategory(category.id)}
                            className={`rounded-xl border px-4 py-2 text-sm transition hover:cursor-pointer ${
                                selectedCategory === category.id
                                    ? 'to-primary text-primary-foreground border-primary bg-gradient-to-br from-black'
                                    : 'hover:bg-accent dark:hover:bg-primary/10 bg-background border-gray-300 text-gray-800 dark:border-zinc-100/20 dark:bg-zinc-800 dark:text-zinc-100'
                            } `}
                        >
                            {category.name}
                        </button>
                    ))}
                </div>
            </div>
            <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {visibleCourses.map((course) => (
                    <Link
                        key={course.id}
                        href={`/course/${course.slug}`}
                        className="relative overflow-hidden rounded-xl bg-zinc-300/30 p-[2px] dark:bg-zinc-700/30"
                    >
                        <Spotlight className="bg-primary blur-2xl" size={284} />
                        <div className="bg-sidebar relative flex w-full flex-col items-center justify-center rounded-lg dark:bg-zinc-800">
                            <img
                                src={course.thumbnail ? `/storage/${course.thumbnail}` : '/assets/images/placeholder.png'}
                                alt={course.title}
                                className="h-48 w-full rounded-t-lg object-cover"
                            />
                            <div className="w-full p-4 text-left">
                                <h2 className="mb-1 text-lg font-semibold">{course.title}</h2>
                                <p className="text-sm text-gray-600">Rp. {course.price.toLocaleString('id-ID')}</p>
                                <div className="mt-4 flex justify-between">
                                    <div className="flex items-center gap-2">
                                        <Star size={18} className="text-yellow-500" fill="currentColor" />
                                        <Star size={18} className="text-yellow-500" fill="currentColor" />
                                        <Star size={18} className="text-yellow-500" fill="currentColor" />
                                        <Star size={18} className="text-yellow-500" fill="currentColor" />
                                        <Star size={18} className="text-yellow-500" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
            {visibleCount < filteredBootcamp.length && (
                <div className="mb-8 flex justify-center">
                    <Magnetic>
                        <Button type="button" className="mt-8 hover:cursor-pointer" onClick={() => setVisibleCount((prev) => prev + 6)}>
                            Lihat Lebih Banyak <GalleryVerticalEnd />
                        </Button>
                    </Magnetic>
                </div>
            )}
        </section>
    );
}
