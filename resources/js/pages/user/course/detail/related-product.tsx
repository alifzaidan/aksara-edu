import { Spotlight } from '@/components/ui/spotlight';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Link } from '@inertiajs/react';
import { Star } from 'lucide-react';

interface Course {
    id: string;
    title: string;
    slug: string;
    thumbnail?: string | null;
    price: number;
    strikethrough_price: number;
    level: 'beginner' | 'intermediate' | 'advanced';
    category?: {
        name: string;
    };
}

interface RelatedProductProps {
    relatedCourses: Course[];
    myCourseIds: string[];
}

export default function RelatedProduct({ relatedCourses, myCourseIds }: RelatedProductProps) {
    if (!relatedCourses || relatedCourses.length === 0) {
        return null;
    }

    return (
        <section className="mx-auto mt-16 w-full max-w-7xl px-4" id="related">
            <h2 className="dark:text-primary-foreground mb-4 text-center text-3xl font-bold text-gray-900 italic md:text-4xl">Kelas Serupa</h2>
            <p className="mb-8 text-center text-gray-600 dark:text-gray-400">Kelas lain yang mungkin menarik untuk Anda</p>

            <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {relatedCourses.map((course) => {
                    const hasAccess = myCourseIds.includes(course.id);

                    return (
                        <Link
                            key={course.id}
                            href={hasAccess ? `/profile/my-courses/${course.slug}` : `/course/${course.slug}`}
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
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                            <p className="text-primary text-sm font-medium">Anda sudah memiliki akses</p>
                                        </div>
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
                })}
            </div>
        </section>
    );
}
