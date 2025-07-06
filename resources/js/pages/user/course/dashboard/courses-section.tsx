import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Magnetic } from '@/components/ui/magnetic';
import { Spotlight } from '@/components/ui/spotlight';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Link } from '@inertiajs/react';
import { GalleryVerticalEnd, Star } from 'lucide-react';
import { useRef, useState } from 'react';

type Category = {
    id: string;
    name: string;
};

interface Course {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    slug: string;
    strikethrough_price: number;
    price: number;
    level: 'beginner' | 'intermediate' | 'advanced';
    category: Category;
}

interface CourseProps {
    categories: Category[];
    courses: Course[];
    myCourseIds: string[];
}

export default function CoursesSection({ categories, courses, myCourseIds }: CourseProps) {
    const [level, setLevel] = useState('all');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [visibleCount, setVisibleCount] = useState(6);
    const categoryRef = useRef<HTMLDivElement | null>(null);
    const isDragging = useRef(false);
    const startX = useRef(0);
    const scrollLeft = useRef(0);

    const handleMouseDown = (e: React.MouseEvent) => {
        isDragging.current = true;
        startX.current = e.pageX - (categoryRef.current?.offsetLeft ?? 0);
        scrollLeft.current = categoryRef.current?.scrollLeft ?? 0;
    };

    const handleMouseLeave = () => {
        isDragging.current = false;
    };

    const handleMouseUp = () => {
        isDragging.current = false;
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging.current || !categoryRef.current) return;
        e.preventDefault();
        const x = e.pageX - categoryRef.current.offsetLeft;
        const walk = (x - startX.current) * 1.5; // scroll speed
        categoryRef.current.scrollLeft = scrollLeft.current - walk;
    };

    const filteredCourses = courses.filter((course) => {
        const matchSearch = course.title.toLowerCase().includes(search.toLowerCase());
        const matchLevel = level === 'all' ? true : course.level === level;
        const matchCategory = selectedCategory === null ? true : course.category.id === selectedCategory;
        return matchSearch && matchLevel && matchCategory;
    });

    const visibleCourses = filteredCourses.slice(0, visibleCount);

    return (
        <section className="mx-auto w-full max-w-7xl px-4" id="course">
            <h2 className="dark:text-primary-foreground mx-auto mb-4 max-w-3xl text-center text-3xl font-bold text-gray-900 italic md:text-4xl">
                Ratusan Skill Impian Kini Dalam Genggamanmu
            </h2>
            <p className="mx-auto mb-8 text-center text-gray-600 dark:text-gray-400">
                Eksplorasi materi-materi unggulan dari rancangan experts yang akan selalu update setiap bulan.
            </p>
            <div className="mb-4 flex justify-between gap-2">
                <Input type="search" placeholder="Cari kelas..." value={search} onChange={(e) => setSearch(e.target.value)} />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline">Filter Tingkat Kesulitan</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                        <DropdownMenuLabel>Pilih Tingkat Kesulitan</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuRadioGroup value={level} onValueChange={setLevel}>
                            <DropdownMenuRadioItem value="all">Semua</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="beginner">Beginner</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="intermediate">Intermediate</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="advanced">Advanced</DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div
                className="mb-4 overflow-x-auto"
                ref={categoryRef}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                style={{ scrollbarWidth: 'none', cursor: isDragging.current ? 'grabbing' : 'grab' }}
            >
                <div className="flex w-max flex-nowrap gap-2 select-none">
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
                {visibleCourses.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center gap-4 py-12">
                        <img src="/assets/images/not-found.webp" alt="Kelas Belum Tersedia" className="w-48" />
                        <div className="text-center text-gray-500">Belum ada kelas yang tersedia saat ini.</div>
                    </div>
                ) : (
                    visibleCourses.map((course) => {
                        const hasAccess = myCourseIds.includes(course.id);

                        return (
                            <Link
                                key={course.id}
                                href={hasAccess ? `profile/my-courses/${course.slug}` : `/course/${course.slug}`}
                                className="relative overflow-hidden rounded-xl bg-zinc-300/30 p-[2px] dark:bg-zinc-700/30"
                            >
                                <Spotlight className="bg-primary blur-2xl" size={284} />
                                <div
                                    className={`relative flex h-full w-full flex-col items-center justify-between rounded-lg transition-colors ${
                                        hasAccess ? 'bg-zinc-100 dark:bg-zinc-900' : 'bg-sidebar dark:bg-zinc-800'
                                    }`}
                                >
                                    <div className="w-full overflow-hidden rounded-t-lg">
                                        <img
                                            src={course.thumbnail ? `/storage/${course.thumbnail}` : '/assets/images/placeholder.png'}
                                            alt={course.title}
                                            className="h-48 w-full rounded-t-lg object-cover"
                                        />
                                        <h2 className="mx-4 mt-2 text-lg font-semibold">{course.title}</h2>
                                    </div>
                                    <div className="w-full p-4 text-left">
                                        {hasAccess ? (
                                            <p className="text-primary text-sm font-medium">Anda sudah memiliki akses</p>
                                        ) : course.price === 0 ? (
                                            <p className="text-lg font-semibold text-green-600 dark:text-green-400">Gratis</p>
                                        ) : (
                                            <div className="">
                                                {course.strikethrough_price > 0 && (
                                                    <p className="text-sm text-red-500 line-through">
                                                        Rp {course.strikethrough_price.toLocaleString('id-ID')}
                                                    </p>
                                                )}
                                                <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                                    Rp {course.price.toLocaleString('id-ID')}
                                                </p>
                                            </div>
                                        )}
                                        <div className="mt-4 flex justify-between">
                                            <div className="flex items-center gap-2">
                                                <Star size={18} className="text-yellow-500" fill="currentColor" />
                                                <Star size={18} className="text-yellow-500" fill="currentColor" />
                                                <Star size={18} className="text-yellow-500" fill="currentColor" />
                                                <Star size={18} className="text-yellow-500" fill="currentColor" />
                                                <Star size={18} className="text-yellow-500" fill="currentColor" />
                                            </div>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div
                                                        className={
                                                            course.level === 'beginner'
                                                                ? 'rounded-full border border-green-300 bg-green-100 px-3 py-1 text-sm font-medium text-green-700 dark:bg-zinc-800 dark:text-green-300'
                                                                : course.level === 'intermediate'
                                                                  ? 'rounded-full border border-yellow-300 bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-700 dark:bg-zinc-800 dark:text-yellow-300'
                                                                  : 'rounded-full border border-red-300 bg-red-100 px-3 py-1 text-sm font-medium text-red-700 dark:bg-zinc-800 dark:text-red-300'
                                                        }
                                                    >
                                                        <p>{course.level === 'beginner' ? '1' : course.level === 'intermediate' ? '2' : '3'}</p>
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    {course.level === 'beginner' && <p>Level Beginner</p>}
                                                    {course.level === 'intermediate' && <p>Level Intermediate</p>}
                                                    {course.level === 'advanced' && <p>Level Advanced</p>}
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })
                )}
            </div>
            {visibleCount < filteredCourses.length && (
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
