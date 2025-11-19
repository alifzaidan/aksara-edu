import { Link } from '@inertiajs/react';
import { BadgeCheck, Star, User } from 'lucide-react';

interface Course {
    title: string;
    description?: string | null;
    key_points?: string | null;
    user?: { id: string; name: string; bio: string | null };
    images?: { image_url: string }[];
}

function parseList(items?: string | null): string[] {
    if (!items) return [];
    const matches = items.match(/<li>(.*?)<\/li>/g);
    if (!matches) return [];
    return matches.map((li) => li.replace(/<\/?li>/g, '').trim());
}

export default function AboutSection({ course }: { course: Course }) {
    const keyPoints = parseList(course.key_points);

    return (
        <>
            <section className="mx-auto w-full max-w-5xl px-4" id="about">
                <h2 className="dark:text-primary-foreground mb-4 text-center text-3xl font-bold text-gray-900 italic md:text-5xl">
                    Kembangkan Skillmu
                </h2>
                <p className="text-center text-gray-600 dark:text-gray-400">{course.description}</p>
            </section>
            {course.images!.length > 0 && (
                <section className="mx-auto mt-4 w-full max-w-5xl px-4">
                    <p className="text-primary border-primary bg-background mb-4 w-fit rounded-full border bg-gradient-to-t from-[#D9E5FF] to-white px-4 py-1 text-sm font-medium shadow-xs">
                        Highlight Kelas
                    </p>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {course.images?.map((image, index) => (
                            <img
                                key={index}
                                src={image.image_url ? `/storage/${image.image_url}` : '/assets/images/placeholder.png'}
                                alt={course.title}
                                className="aspect-video rounded-lg border border-gray-200 object-cover shadow-md"
                            />
                        ))}
                    </div>
                </section>
            )}
            <section className="mx-auto mt-4 w-full max-w-5xl px-4">
                <p className="text-primary border-primary bg-background mb-4 w-fit rounded-full border bg-gradient-to-t from-[#D9E5FF] to-white px-4 py-1 text-sm font-medium shadow-xs">
                    Poin Utama
                </p>
                <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {keyPoints.map((req, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                            <BadgeCheck className="mt-1 min-w-12 text-green-600" />
                            <p>{req}</p>
                        </li>
                    ))}
                </ul>
            </section>
            <section className="mx-auto mt-4 w-full max-w-5xl px-4">
                <p className="text-primary border-primary bg-background mb-4 w-fit rounded-full border bg-gradient-to-t from-[#D9E5FF] to-white px-4 py-1 text-sm font-medium shadow-xs">
                    Belajar dengan Ahlinya
                </p>
                {course.user?.name === 'Admin' ? (
                    <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-md dark:border-zinc-700 dark:bg-zinc-800">
                        <div className="flex w-full items-center gap-4">
                            <div className="rounded-full bg-gray-200 p-2">
                                <User className="h-10 w-10 text-gray-500" />
                            </div>
                            <div className="w-full">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{course.user?.name}</h3>
                                </div>
                                <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">{course.user?.bio}</p>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Star size={18} className="text-yellow-500" fill="currentColor" />
                                        <Star size={18} className="text-yellow-500" fill="currentColor" />
                                        <Star size={18} className="text-yellow-500" fill="currentColor" />
                                        <Star size={18} className="text-yellow-500" fill="currentColor" />
                                        <Star size={18} className="text-yellow-500" fill="currentColor" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <Link
                        href={`/mentor/${course.user?.id}`}
                        className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-md transition hover:shadow-lg dark:border-zinc-700 dark:bg-zinc-800"
                    >
                        <div className="flex w-full items-center gap-4">
                            <div className="rounded-full bg-gray-200 p-2">
                                <User className="h-10 w-10 text-gray-500" />
                            </div>
                            <div className="w-full">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{course.user?.name}</h3>
                                </div>
                                <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">{course.user?.bio}</p>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Star size={18} className="text-yellow-500" fill="currentColor" />
                                        <Star size={18} className="text-yellow-500" fill="currentColor" />
                                        <Star size={18} className="text-yellow-500" fill="currentColor" />
                                        <Star size={18} className="text-yellow-500" fill="currentColor" />
                                        <Star size={18} className="text-yellow-500" fill="currentColor" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Link>
                )}
            </section>
        </>
    );
}
