import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { rupiahFormatter } from '@/lib/utils';
import { BookText, ExternalLink, MonitorPlay, Presentation } from 'lucide-react';

interface Product {
    id: string;
    title: string;
    slug: string;
    price: number;
    thumbnail?: string | null;
}

interface BundleItem {
    id: string;
    bundleable_type: string;
    bundleable_id: string;
    bundleable: Product;
    price: number;
}

interface GroupedItems {
    courses: BundleItem[];
    bootcamps: BundleItem[];
    webinars: BundleItem[];
}

interface Bundle {
    bundle_items_count: number;
    price: number;
}

interface BundleItemsSectionProps {
    bundle: Bundle;
    groupedItems: GroupedItems;
    totalOriginalPrice: number;
}

export default function BundleItemsSection({ bundle, groupedItems, totalOriginalPrice }: BundleItemsSectionProps) {
    const getProductUrl = (type: string, slug: string) => {
        switch (type) {
            case 'course':
                return route('course.detail', slug);
            case 'bootcamp':
                return route('bootcamp.detail', slug);
            case 'webinar':
                return route('webinar.detail', slug);
            default:
                return '#';
        }
    };

    const renderItems = (items: BundleItem[], type: 'course' | 'bootcamp' | 'webinar') => {
        if (items.length === 0) return null;

        const config = {
            course: {
                icon: BookText,
                label: 'KELAS ONLINE',
                badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400',
                iconColor: 'text-blue-600 dark:text-blue-400',
                cardBorder: 'border-blue-200 dark:border-blue-800',
            },
            bootcamp: {
                icon: Presentation,
                label: 'BOOTCAMP',
                badgeClass: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-400',
                iconColor: 'text-purple-600 dark:text-purple-400',
                cardBorder: 'border-purple-200 dark:border-purple-800',
            },
            webinar: {
                icon: MonitorPlay,
                label: 'WEBINAR',
                badgeClass: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400',
                iconColor: 'text-green-600 dark:text-green-400',
                cardBorder: 'border-green-200 dark:border-green-800',
            },
        };

        const { icon: Icon, label, badgeClass, iconColor, cardBorder } = config[type];

        return (
            <div className="mb-6">
                <div className="mb-4 flex items-center gap-3">
                    <div className={`rounded-lg bg-gray-100 p-2 dark:bg-gray-800`}>
                        <Icon className={`h-5 w-5 ${iconColor}`} />
                    </div>
                    <h3 className="text-sm font-semibold tracking-wide text-gray-700 uppercase dark:text-gray-300">
                        {label} <span className="text-gray-500">({items.length})</span>
                    </h3>
                </div>
                <div className="space-y-4">
                    {items.map((item) => {
                        const productUrl = getProductUrl(type, item.bundleable.slug);

                        return (
                            <div
                                key={item.id}
                                className={`group relative overflow-hidden rounded-lg border ${cardBorder} bg-white transition-all hover:shadow-lg dark:bg-gray-800`}
                            >
                                <div className="flex gap-4 p-4">
                                    {/* Thumbnail */}
                                    <div className="relative w-32 flex-shrink-0 overflow-hidden rounded-md">
                                        <img
                                            src={
                                                item.bundleable.thumbnail ? `/storage/${item.bundleable.thumbnail}` : '/assets/images/placeholder.png'
                                            }
                                            alt={item.bundleable.title}
                                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                                        />
                                    </div>

                                    {/* Content */}
                                    <div className="flex flex-1 flex-col">
                                        <div className="mb-2 flex items-start justify-between gap-2">
                                            <h4 className="line-clamp-2 font-semibold text-gray-900 dark:text-white">{item.bundleable.title}</h4>
                                            <a href={productUrl} target="_blank" rel="noopener noreferrer">
                                                <Button size="sm" variant="ghost" className="h-8 w-8 flex-shrink-0 p-0">
                                                    <ExternalLink size={16} />
                                                </Button>
                                            </a>
                                        </div>

                                        <Badge variant="outline" className={`mb-auto w-fit text-xs ${badgeClass}`}>
                                            {type === 'course' ? 'Course' : type.charAt(0).toUpperCase() + type.slice(1)}
                                        </Badge>

                                        {/* Price Comparison */}
                                        <div className="mt-3 flex items-end justify-between">
                                            <div>
                                                <p className="text-lg font-semibold text-gray-500 dark:text-gray-400">
                                                    {rupiahFormatter.format(item.price)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <section className="mx-auto w-full max-w-5xl px-4 py-12">
            <div className="mb-8 text-center">
                <p className="text-primary border-primary bg-background mb-4 inline-block rounded-full border bg-gradient-to-t from-[#D9E5FF] to-white px-4 py-1 text-sm font-medium shadow-xs dark:from-blue-900/40 dark:to-gray-900">
                    Isi Paket
                </p>
                <h2 className="mb-2 text-3xl font-bold text-gray-900 italic md:text-4xl dark:text-white">
                    {bundle.bundle_items_count} Program Pembelajaran
                </h2>
                <p className="text-gray-600 dark:text-gray-400">Dapatkan akses ke semua program ini dalam satu paket bundling</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 p-6 shadow-sm dark:border-gray-700 dark:from-gray-900 dark:to-gray-800">
                {renderItems(groupedItems.courses, 'course')}
                {renderItems(groupedItems.bootcamps, 'bootcamp')}
                {renderItems(groupedItems.webinars, 'webinar')}

                <div className="border-primary/50 mt-6 space-y-3 rounded-xl border-2 border-dashed bg-white p-6 dark:bg-gray-800">
                    {/* Normal Price */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Harga Normal:</span>
                        <span className="text-lg font-semibold text-gray-500 line-through dark:text-gray-400">
                            {rupiahFormatter.format(totalOriginalPrice)}
                        </span>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-base font-semibold text-gray-700 dark:text-gray-300">Harga Paket Bundling:</span>
                        <span className="text-primary text-3xl font-bold">{rupiahFormatter.format(bundle.price)}</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
