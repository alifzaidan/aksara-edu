import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Magnetic } from '@/components/ui/magnetic';
import { Spotlight } from '@/components/ui/spotlight';
import { Link } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Calendar, GalleryVerticalEnd, Package, Percent } from 'lucide-react';
import { useState } from 'react';

interface BundleItem {
    id: string;
    bundleable_type: string;
    bundleable: {
        id: string;
        title: string;
        slug: string;
    };
    price: number;
}

interface Bundle {
    id: string;
    title: string;
    slug: string;
    short_description: string | null;
    thumbnail: string | null;
    price: number;
    strikethrough_price: number;
    registration_deadline: string | null;
    status: 'draft' | 'published' | 'archived';
    bundle_items: BundleItem[];
    bundle_items_count: number;
}

interface BundlingSectionProps {
    bundles: Bundle[];
}

export default function BundlingSection({ bundles }: BundlingSectionProps) {
    const [search, setSearch] = useState('');
    const [visibleCount, setVisibleCount] = useState(6);

    const filteredBundles = bundles.filter((bundle) => {
        const matchSearch = bundle.title.toLowerCase().includes(search.toLowerCase());
        return matchSearch && bundle.status === 'published';
    });

    const visibleBundles = filteredBundles.slice(0, visibleCount);

    const formatRupiah = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const calculateDiscount = (original: number, discounted: number) => {
        if (original === 0) return 0;
        return Math.round(((original - discounted) / original) * 100);
    };

    return (
        <section className="mx-auto w-full max-w-7xl px-4 py-12" id="bundles">
            <div className="mb-8 text-center">
                <h2 className="dark:text-primary-foreground mx-auto mb-4 max-w-3xl text-3xl font-bold text-gray-900 italic md:text-4xl">
                    Pilih Paket Bundling Terbaik Untukmu
                </h2>
                <p className="mx-auto text-gray-600 dark:text-gray-400">Hemat lebih banyak dengan membeli paket bundling program pembelajaran.</p>
            </div>

            <div className="mb-6">
                <Input
                    type="search"
                    placeholder="Cari paket bundling..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="mx-auto max-w-md"
                />
            </div>

            <div className="mb-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {visibleBundles.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center gap-4 py-12">
                        <img src="/assets/images/not-found.webp" alt="Paket Bundling Belum Tersedia" className="w-48" />
                        <div className="text-center text-gray-500">
                            {search ? 'Tidak ada paket bundling yang sesuai dengan pencarian.' : 'Belum ada paket bundling yang tersedia saat ini.'}
                        </div>
                    </div>
                ) : (
                    visibleBundles.map((bundle) => {
                        const discount = calculateDiscount(bundle.strikethrough_price, bundle.price);
                        const hasDeadline = bundle.registration_deadline;

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
                                            className="h-48 w-full object-cover transition-transform duration-300"
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
                                        <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-gray-900 dark:text-white">{bundle.title}</h3>

                                        {bundle.short_description && (
                                            <p className="text-muted-foreground mb-4 line-clamp-2 text-sm">{bundle.short_description}</p>
                                        )}

                                        {/* Price */}
                                        <div className="mt-auto">
                                            {bundle.price === 0 ? (
                                                <p className="text-lg font-semibold text-green-600 dark:text-green-400">Gratis</p>
                                            ) : (
                                                <div className="mb-3">
                                                    {bundle.strikethrough_price > 0 && (
                                                        <p className="text-sm text-gray-500 line-through dark:text-gray-400">
                                                            {formatRupiah(bundle.strikethrough_price)}
                                                        </p>
                                                    )}
                                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatRupiah(bundle.price)}</p>
                                                </div>
                                            )}

                                            {/* Deadline */}
                                            {hasDeadline && (
                                                <div className="border-t pt-3">
                                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                        <Calendar size={14} className="text-red-500" />
                                                        <span>
                                                            Daftar sebelum:{' '}
                                                            <span className="font-medium text-gray-900 dark:text-white">
                                                                {format(new Date(bundle.registration_deadline!), 'dd MMM yyyy', { locale: id })}
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
                    })
                )}
            </div>

            {visibleCount < filteredBundles.length && (
                <div className="flex justify-center">
                    <Magnetic>
                        <Button type="button" className="mt-4 hover:cursor-pointer" onClick={() => setVisibleCount((prev) => prev + 6)}>
                            Lihat Lebih Banyak <GalleryVerticalEnd />
                        </Button>
                    </Magnetic>
                </div>
            )}
        </section>
    );
}
