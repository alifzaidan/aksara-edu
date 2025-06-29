import { Button } from '@/components/ui/button';
import { Magnetic } from '@/components/ui/magnetic';
import { Spotlight } from '@/components/ui/spotlight';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Link } from '@inertiajs/react';
import { GalleryVerticalEnd, Star } from 'lucide-react';

interface Course {
    id: string;
    title: string;
    thumbnail: string;
    slug: string;
    strikethrough_price: number;
    price: number;
    level: 'beginner' | 'intermediate' | 'advanced';
}

interface BestSellerProps {
    courses: Course[];
    myCourseIds: string[];
}

export default function BestSellerSection({ courses, myCourseIds }: BestSellerProps) {
    return (
        <section className="mx-auto w-full max-w-7xl px-4 py-8">
            <div className="mx-auto text-center">
                <p className="text-primary border-primary bg-background mx-auto mb-4 w-fit rounded-full border bg-gradient-to-t from-[#D9E5FF] to-white px-4 py-1 text-sm font-medium shadow-xs">
                    Paling Diminati
                </p>
                <h2 className="dark:text-primary-foreground mx-auto mb-8 max-w-2xl text-3xl font-bold italic md:text-4xl">
                    Kelas yang paling banyak diminati oleh para peserta
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {(() => {
                        const availableCourses = courses.filter((course) => !myCourseIds.includes(course.id));

                        if (courses.length === 0) {
                            return (
                                <div className="col-span-full flex flex-col items-center justify-center gap-4 py-12">
                                    <img src="/assets/images/not-found.svg" alt="Kelas Belum Tersedia" className="w-48" />
                                    <div className="text-center text-gray-500">Belum ada kelas yang tersedia saat ini.</div>
                                </div>
                            );
                        }

                        if (availableCourses.length === 0) {
                            return (
                                <div className="col-span-full flex flex-col items-center justify-center gap-4 py-12">
                                    <div className="text-center text-lg font-semibold">Anda sudah memiliki akses semua kelas kami. 😁🙏</div>
                                    <p className="text-center text-gray-500">Terima kasih telah menjadi bagian dari Aksademy!</p>
                                </div>
                            );
                        }

                        return availableCourses.map((course) => (
                            <Link
                                key={course.id}
                                href={`/course/${course.slug}`}
                                className="relative overflow-hidden rounded-xl bg-zinc-300/30 p-[2px] dark:bg-zinc-700/30"
                            >
                                <Spotlight className="bg-primary blur-2xl" size={284} />
                                <div className="bg-sidebar relative flex h-full w-full flex-col items-center justify-between rounded-lg dark:bg-zinc-800">
                                    <div className="w-full overflow-hidden rounded-t-lg">
                                        <img
                                            src={course.thumbnail ? `/storage/${course.thumbnail}` : '/assets/images/placeholder.png'}
                                            alt={course.title}
                                            className="h-48 w-full rounded-t-lg object-cover"
                                        />
                                        <h2 className="mx-4 mt-2 text-left text-lg font-semibold">{course.title}</h2>
                                    </div>
                                    <div className="w-full p-4 text-left">
                                        {course.price === 0 ? (
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
                        ));
                    })()}
                </div>
                <Magnetic>
                    <Button type="button" className="mt-8" asChild>
                        <Link href="/course">
                            Lihat Semua Kelas <GalleryVerticalEnd />
                        </Link>
                    </Button>
                </Magnetic>
            </div>
        </section>
    );
}
