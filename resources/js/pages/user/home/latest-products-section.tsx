import { Spotlight } from '@/components/ui/spotlight';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Link } from '@inertiajs/react';
import { Calendar, Star } from 'lucide-react';

interface Category {
    id: string;
    name: string;
}

interface Product {
    id: string;
    title: string;
    thumbnail: string;
    slug: string;
    strikethrough_price: number;
    price: number;
    level?: 'beginner' | 'intermediate' | 'advanced';
    start_date?: string;
    end_date?: string;
    start_time?: string;
    category: Category;
    type: 'course' | 'bootcamp' | 'webinar';
    created_at: string;
}

interface MyProductIds {
    courses: string[];
    bootcamps: string[];
    webinars: string[];
}

interface LatestProductsProps {
    latestProducts: Product[];
    myProductIds: MyProductIds;
}

export default function LatestProductsSection({ latestProducts, myProductIds }: LatestProductsProps) {
    // Pastikan myProductIds memiliki struktur yang benar
    const safeMyProductIds = {
        courses: myProductIds?.courses || [],
        bootcamps: myProductIds?.bootcamps || [],
        webinars: myProductIds?.webinars || [],
    };

    const getProductBadge = (type: string) => {
        switch (type) {
            case 'course':
                return (
                    <span className="absolute top-2 left-2 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                        Kelas
                    </span>
                );
            case 'bootcamp':
                return (
                    <span className="absolute top-2 left-2 rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                        Bootcamp
                    </span>
                );
            case 'webinar':
                return (
                    <span className="absolute top-2 left-2 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
                        Webinar
                    </span>
                );
            default:
                return null;
        }
    };

    const hasAccess = (product: Product) => {
        switch (product.type) {
            case 'course':
                return safeMyProductIds.courses.includes(product.id);
            case 'bootcamp':
                return safeMyProductIds.bootcamps.includes(product.id);
            case 'webinar':
                return safeMyProductIds.webinars.includes(product.id);
            default:
                return false;
        }
    };

    const getProductUrl = (product: Product) => {
        const hasProductAccess = hasAccess(product);
        switch (product.type) {
            case 'course':
                return hasProductAccess ? `profile/my-courses/${product.slug}` : `/course/${product.slug}`;
            case 'bootcamp':
                return hasProductAccess ? `profile/my-bootcamps/${product.slug}` : `/bootcamp/${product.slug}`;
            case 'webinar':
                return hasProductAccess ? `profile/my-webinars/${product.slug}` : `/webinar/${product.slug}`;
            default:
                return '#';
        }
    };

    const getDateDisplay = (product: Product) => {
        if (product.type === 'bootcamp') {
            return (
                <div className="mt-2 flex items-center gap-2">
                    <Calendar size="18" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(product.start_date!).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                        })}{' '}
                        -{' '}
                        {new Date(product.end_date!).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                        })}
                    </p>
                </div>
            );
        }

        if (product.type === 'webinar') {
            return (
                <div className="mt-2 flex items-center gap-2">
                    <Calendar size="18" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(product.start_time!).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                        })}
                    </p>
                </div>
            );
        }

        return null;
    };

    // Pastikan latestProducts adalah array sebelum filter
    const safeLatestProducts = Array.isArray(latestProducts) ? latestProducts : [];
    const availableProducts = safeLatestProducts.filter((product) => !hasAccess(product));

    return (
        <section className="mx-auto w-full max-w-7xl px-4 py-8">
            <div className="mx-auto text-center">
                <p className="text-primary border-primary bg-background mx-auto mb-4 w-fit rounded-full border bg-gradient-to-t from-[#D9E5FF] to-white px-4 py-1 text-sm font-medium shadow-xs">
                    Produk Terbaru
                </p>
                <h2 className="dark:text-primary-foreground mx-auto mb-8 max-w-2xl text-3xl font-bold italic md:text-4xl">
                    Kelas, Bootcamp & Webinar Terbaru dari Aksademy
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {(() => {
                        if (safeLatestProducts.length === 0) {
                            return (
                                <div className="col-span-full flex flex-col items-center justify-center gap-4 py-12">
                                    <img src="/assets/images/not-found.webp" alt="Produk Belum Tersedia" className="w-48" />
                                    <div className="text-center text-gray-500">Belum ada produk yang tersedia saat ini.</div>
                                </div>
                            );
                        }

                        if (availableProducts.length === 0) {
                            return (
                                <div className="col-span-full flex flex-col items-center justify-center gap-4 py-12">
                                    <div className="text-center text-lg font-semibold">Anda sudah memiliki akses semua produk terbaru kami. 😁🙏</div>
                                    <p className="text-center text-gray-500">Terima kasih telah menjadi bagian dari Aksademy!</p>
                                </div>
                            );
                        }

                        return availableProducts.map((product) => (
                            <Link
                                key={product.id}
                                href={getProductUrl(product)}
                                className="relative overflow-hidden rounded-xl bg-zinc-300/30 p-[2px] dark:bg-zinc-700/30"
                            >
                                <Spotlight className="bg-primary blur-2xl" size={284} />
                                <div className="bg-sidebar relative flex h-full w-full flex-col items-center justify-between rounded-lg dark:bg-zinc-800">
                                    <div className="w-full overflow-hidden rounded-t-lg">
                                        <div className="relative">
                                            <img
                                                src={product.thumbnail ? `/storage/${product.thumbnail}` : '/assets/images/placeholder.png'}
                                                alt={product.title}
                                                className="h-48 w-full rounded-t-lg object-cover"
                                            />
                                            {getProductBadge(product.type)}
                                        </div>
                                        <h2 className="mx-4 mt-2 text-left text-lg font-semibold">{product.title}</h2>
                                    </div>
                                    <div className="w-full p-4 text-left">
                                        {product.price === 0 ? (
                                            <p className="text-lg font-semibold text-green-600 dark:text-green-400">Gratis</p>
                                        ) : (
                                            <div className="">
                                                {product.strikethrough_price > 0 && (
                                                    <p className="text-sm text-red-500 line-through">
                                                        Rp {product.strikethrough_price.toLocaleString('id-ID')}
                                                    </p>
                                                )}
                                                <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                                    Rp {product.price.toLocaleString('id-ID')}
                                                </p>
                                            </div>
                                        )}

                                        {getDateDisplay(product)}

                                        <div className="mt-4 flex justify-between">
                                            {product.type === 'course' && (
                                                <div className="flex items-center gap-2">
                                                    <Star size={18} className="text-yellow-500" fill="currentColor" />
                                                    <Star size={18} className="text-yellow-500" fill="currentColor" />
                                                    <Star size={18} className="text-yellow-500" fill="currentColor" />
                                                    <Star size={18} className="text-yellow-500" fill="currentColor" />
                                                    <Star size={18} className="text-yellow-500" fill="currentColor" />
                                                </div>
                                            )}

                                            {product.level && (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div
                                                            className={
                                                                product.level === 'beginner'
                                                                    ? 'rounded-full border border-green-300 bg-green-100 px-3 py-1 text-sm font-medium text-green-700 dark:bg-zinc-800 dark:text-green-300'
                                                                    : product.level === 'intermediate'
                                                                      ? 'rounded-full border border-yellow-300 bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-700 dark:bg-zinc-800 dark:text-yellow-300'
                                                                      : 'rounded-full border border-red-300 bg-red-100 px-3 py-1 text-sm font-medium text-red-700 dark:bg-zinc-800 dark:text-red-300'
                                                            }
                                                        >
                                                            <p>{product.level === 'beginner' ? '1' : product.level === 'intermediate' ? '2' : '3'}</p>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        {product.level === 'beginner' && <p>Level Beginner</p>}
                                                        {product.level === 'intermediate' && <p>Level Intermediate</p>}
                                                        {product.level === 'advanced' && <p>Level Advanced</p>}
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ));
                    })()}
                </div>
            </div>
        </section>
    );
}
