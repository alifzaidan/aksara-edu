import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Magnetic } from '@/components/ui/magnetic';
import { Spotlight } from '@/components/ui/spotlight';
import { Link } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Calendar, GalleryVerticalEnd } from 'lucide-react';
import { useRef, useState } from 'react';

type Category = {
    id: string;
    name: string;
};

interface PartnershipProduct {
    id: string;
    title: string;
    short_description: string | null;
    thumbnail: string | null;
    slug: string;
    strikethrough_price: number;
    price: number;
    registration_deadline: string;
    duration_days: number;
    schedule_days: string[];
    category: Category;
}

interface PartnershipProductProps {
    categories: Category[];
    partnershipProducts: PartnershipProduct[];
}

export default function PartnershipProductSection({ categories, partnershipProducts }: PartnershipProductProps) {
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
        const walk = (x - startX.current) * 1.5;
        categoryRef.current.scrollLeft = scrollLeft.current - walk;
    };

    const filteredProducts = partnershipProducts.filter((product) => {
        const matchSearch = product.title.toLowerCase().includes(search.toLowerCase());
        const matchCategory = selectedCategory === null ? true : product.category.id === selectedCategory;
        return matchSearch && matchCategory;
    });

    const visibleProducts = filteredProducts.slice(0, visibleCount);

    const formatRupiah = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <section className="mx-auto w-full max-w-7xl px-4 py-12" id="partnership-products">
            <h2 className="dark:text-primary-foreground mx-auto mb-4 max-w-3xl text-center text-3xl font-bold text-gray-900 italic md:text-4xl">
                Raih Sertifikasi Profesional dan Tingkatkan Karirmu
            </h2>
            <p className="mx-auto mb-8 text-center text-gray-600 dark:text-gray-400">Pilih program sertifikasi yang sesuai dengan tujuan karirmu.</p>
            <div className="mb-4 flex">
                <Input type="search" placeholder="Cari program sertifikasi..." value={search} onChange={(e) => setSearch(e.target.value)} />
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
                {visibleProducts.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center gap-4 py-12">
                        <img src="/assets/images/not-found.webp" alt="Program Belum Tersedia" className="w-48" />
                        <div className="text-center text-gray-500">Belum ada program sertifikasi yang tersedia saat ini.</div>
                    </div>
                ) : (
                    visibleProducts.map((product) => {
                        const deadlineDate = new Date(product.registration_deadline);

                        return (
                            <Link
                                key={product.id}
                                href={route('partnership-product.detail', product.slug)}
                                className="relative overflow-hidden rounded-xl bg-zinc-300/30 p-[2px] dark:bg-zinc-700/30"
                            >
                                <Spotlight className="bg-primary blur-2xl" size={284} />
                                <div className="bg-sidebar relative flex h-full w-full flex-col items-center justify-between rounded-lg transition-colors dark:bg-zinc-800">
                                    <div className="w-full overflow-hidden rounded-t-lg">
                                        <img
                                            src={product.thumbnail ? `/storage/${product.thumbnail}` : '/assets/images/placeholder.png'}
                                            alt={product.title}
                                            className="h-48 w-full rounded-t-lg object-cover"
                                        />
                                        <div className="p-4">
                                            <h2 className="mb-2 line-clamp-2 text-lg font-semibold">{product.title}</h2>

                                            {product.price === 0 ? (
                                                <p className="mb-2 text-lg font-semibold text-green-600 dark:text-green-400">Gratis</p>
                                            ) : (
                                                <div className="mb-2">
                                                    {product.strikethrough_price > 0 && (
                                                        <p className="text-sm text-red-500 line-through">
                                                            {formatRupiah(product.strikethrough_price)}
                                                        </p>
                                                    )}
                                                    <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                                        {formatRupiah(product.price)}
                                                    </p>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-2 text-sm">
                                                <Calendar size="16" className="text-red-500" />
                                                <p className="text-gray-600 dark:text-gray-400">
                                                    Daftar sebelum:{' '}
                                                    <span className="font-medium">{format(deadlineDate, 'dd MMM yyyy', { locale: id })}</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })
                )}
            </div>
            {visibleCount < filteredProducts.length && (
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
