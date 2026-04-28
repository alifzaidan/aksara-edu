import { Spotlight } from '@/components/ui/spotlight';
import { Link } from '@inertiajs/react';
import { Calendar } from 'lucide-react';

interface PrivateClass {
    id: string;
    title: string;
    slug: string;
    thumbnail?: string | null;
    price: number;
    strikethrough_price: number;
    mode: 'online' | 'offline';
    category?: { name: string };
    schedules?: { start_time: string }[];
}

interface RelatedProductProps {
    relatedPrivateClasses: PrivateClass[];
    myPrivateClassIds: string[];
}

export default function RelatedProduct({ relatedPrivateClasses, myPrivateClassIds }: RelatedProductProps) {
    if (!relatedPrivateClasses || relatedPrivateClasses.length === 0) {
        return null;
    }

    return (
        <section className="mx-auto mt-16 w-full max-w-7xl px-4" id="related">
            <h2 className="dark:text-primary-foreground mb-4 text-center text-3xl font-bold text-gray-900 italic md:text-4xl">
                Private Class Serupa
            </h2>
            <p className="mb-8 text-center text-gray-600 dark:text-gray-400">
                Private class lain yang mungkin menarik untuk Anda
            </p>

            <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {relatedPrivateClasses.map((pc) => {
                    const hasAccess = myPrivateClassIds.includes(pc.id);
                    const firstSchedule = pc.schedules?.[0];

                    return (
                        <Link
                            key={pc.id}
                            href={hasAccess ? `/profile/my-privates/${pc.slug}` : `/private/${pc.slug}`}
                            className="relative overflow-hidden rounded-xl bg-zinc-300/30 p-[2px] dark:bg-zinc-700/30"
                        >
                            <Spotlight className="bg-primary blur-2xl" size={284} />
                            <div
                                className={`relative flex h-full w-full flex-col items-center justify-between rounded-lg transition-colors ${
                                    hasAccess ? 'bg-zinc-100 dark:bg-zinc-900' : 'bg-sidebar dark:bg-zinc-800'
                                }`}
                            >
                                <div className="w-full overflow-hidden rounded-t-lg">
                                    <div className="relative">
                                        <img
                                            src={pc.thumbnail ? `/storage/${pc.thumbnail}` : '/assets/images/placeholder.png'}
                                            alt={pc.title}
                                            className="h-48 w-full rounded-t-lg object-cover"
                                        />
                                        <span className="absolute top-2 left-2 rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                                            Private
                                        </span>
                                    </div>
                                    <h2 className="mx-4 mt-2 line-clamp-2 text-lg font-semibold">{pc.title}</h2>
                                </div>
                                <div className="w-full p-4 text-left">
                                    {hasAccess ? (
                                        <p className="text-primary text-sm font-medium">Anda sudah memiliki akses</p>
                                    ) : pc.price === 0 ? (
                                        <p className="text-lg font-semibold text-green-600 dark:text-green-400">Gratis</p>
                                    ) : (
                                        <div>
                                            {pc.strikethrough_price > 0 && pc.strikethrough_price > pc.price && (
                                                <p className="text-sm text-red-500 line-through">
                                                    Rp {pc.strikethrough_price.toLocaleString('id-ID')}
                                                </p>
                                            )}
                                            <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                                Rp {pc.price.toLocaleString('id-ID')}
                                            </p>
                                        </div>
                                    )}
                                    {firstSchedule && (
                                        <div className="mt-2 flex items-center gap-2">
                                            <Calendar size="18" />
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {new Date(firstSchedule.start_time).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                })}
                                            </p>
                                        </div>
                                    )}
                                    {pc.category && (
                                        <div className="mt-2">
                                            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                                {pc.category.name}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}
