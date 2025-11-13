import { Badge } from '@/components/ui/badge';
import { Spotlight } from '@/components/ui/spotlight';
import { rupiahFormatter } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Calendar, Package, Percent } from 'lucide-react';

interface Bundle {
    id: string;
    title: string;
    slug: string;
    thumbnail?: string | null;
    price: number;
    strikethrough_price: number;
    registration_deadline?: string | null;
    bundle_items_count: number;
}

interface RelatedBundlesProps {
    relatedBundles: Bundle[];
}

export default function RelatedBundles({ relatedBundles }: RelatedBundlesProps) {
    if (!relatedBundles || relatedBundles.length === 0) {
        return null;
    }

    const calculateDiscount = (original: number, discounted: number) => {
        if (original === 0) return 0;
        return Math.round(((original - discounted) / original) * 100);
    };

    return (
        <section className="mx-auto mt-16 w-full max-w-7xl px-4 pb-12" id="related">
            <h2 className="dark:text-primary-foreground mb-4 text-center text-3xl font-bold text-gray-900 italic md:text-4xl">
                Paket Bundling Lainnya
            </h2>
            <p className="mb-8 text-center text-gray-600 dark:text-gray-400">Paket bundling lain yang mungkin menarik untuk Anda</p>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {relatedBundles.map((bundle) => {
                    const discount = calculateDiscount(bundle.strikethrough_price, bundle.price);
                    const hasDeadline = bundle.registration_deadline;
                    const deadlineDate = hasDeadline ? new Date(bundle.registration_deadline!) : null;

                    return (
                        <Link
                            key={bundle.id}
                            href={route('bundle.detail', bundle.slug)}
                            className="group relative overflow-hidden rounded-xl bg-zinc-300/30 p-[2px] transition-all hover:bg-zinc-400/40 dark:bg-zinc-700/30 dark:hover:bg-zinc-600/40"
                        >
                            <Spotlight className="bg-primary blur-2xl" size={284} />
                            <div className="bg-background relative flex h-full w-full flex-col rounded-lg transition-all group-hover:shadow-lg dark:bg-zinc-800">
                                {/* Thumbnail */}
                                <div className="relative w-full overflow-hidden rounded-t-lg">
                                    <img
                                        src={bundle.thumbnail ? `/storage/${bundle.thumbnail}` : '/assets/images/placeholder.png'}
                                        alt={bundle.title}
                                        className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    />

                                    {/* Discount Badge */}
                                    {discount > 0 && (
                                        <div className="absolute top-3 right-3">
                                            <Badge className="bg-red-500 text-white shadow-lg">
                                                <Percent size={12} className="mr-1" />
                                                Hemat {discount}%
                                            </Badge>
                                        </div>
                                    )}

                                    {/* Items Count Badge */}
                                    <div className="absolute bottom-3 left-3">
                                        <Badge
                                            variant="secondary"
                                            className="bg-white/90 text-gray-900 backdrop-blur-sm dark:bg-gray-900/90 dark:text-white"
                                        >
                                            <Package size={12} className="mr-1" />
                                            {bundle.bundle_items_count} Program
                                        </Badge>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex flex-1 flex-col p-4">
                                    <h3 className="mb-3 line-clamp-2 text-lg font-semibold text-gray-900 dark:text-white">{bundle.title}</h3>

                                    {/* Price */}
                                    <div className="mt-auto">
                                        <div className="mb-3">
                                            {bundle.strikethrough_price > 0 && (
                                                <p className="text-sm text-gray-500 line-through dark:text-gray-400">
                                                    {rupiahFormatter.format(bundle.strikethrough_price)}
                                                </p>
                                            )}
                                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{rupiahFormatter.format(bundle.price)}</p>
                                        </div>

                                        {/* Deadline */}
                                        {deadlineDate && (
                                            <div className="border-t pt-3">
                                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                    <Calendar size={14} className="text-red-500" />
                                                    <span>
                                                        Daftar sebelum:{' '}
                                                        <span className="font-medium text-gray-900 dark:text-white">
                                                            {format(deadlineDate, 'dd MMM yyyy', { locale: id })}
                                                        </span>
                                                    </span>
                                                </div>
                                            </div>
                                        )}
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
