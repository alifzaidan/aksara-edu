import { Badge } from '@/components/ui/badge';
import { Spotlight } from '@/components/ui/spotlight';
import { Link } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Calendar, Clock } from 'lucide-react';

interface PartnershipProduct {
    id: string;
    title: string;
    slug: string;
    thumbnail?: string | null;
    price: number;
    strikethrough_price: number;
    registration_deadline: string;
    duration_days: number;
    schedule_days: string[];
    category?: {
        name: string;
    };
}

interface RelatedProductProps {
    relatedPartnershipProducts: PartnershipProduct[];
}

export default function RelatedProduct({ relatedPartnershipProducts }: RelatedProductProps) {
    if (!relatedPartnershipProducts || relatedPartnershipProducts.length === 0) {
        return null;
    }

    const formatRupiah = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <section className="mx-auto mt-16 w-full max-w-7xl px-4" id="related">
            <h2 className="dark:text-primary-foreground mb-4 text-center text-3xl font-bold text-gray-900 italic md:text-4xl">
                Program Sertifikasi Lainnya
            </h2>
            <p className="mb-8 text-center text-gray-600 dark:text-gray-400">Program sertifikasi lain yang mungkin menarik untuk Anda</p>

            <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {relatedPartnershipProducts.map((product) => {
                    const deadlineDate = new Date(product.registration_deadline);

                    return (
                        <Link
                            key={product.id}
                            href={`/partnership-product/${product.slug}`}
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

                                        {/* Schedule Days */}
                                        {product.schedule_days && product.schedule_days.length > 0 && (
                                            <div className="mb-2 flex flex-wrap gap-1">
                                                {product.schedule_days.slice(0, 3).map((day: string) => (
                                                    <Badge key={day} variant="secondary" className="bg-blue-100 text-xs text-blue-700">
                                                        {day}
                                                    </Badge>
                                                ))}
                                                {product.schedule_days.length > 3 && (
                                                    <Badge variant="secondary" className="bg-gray-100 text-xs text-gray-700">
                                                        +{product.schedule_days.length - 3}
                                                    </Badge>
                                                )}
                                            </div>
                                        )}

                                        {/* Duration */}
                                        {product.duration_days > 0 && (
                                            <div className="mb-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <Clock size="16" />
                                                <span>{product.duration_days} hari</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="w-full border-t p-4">
                                    {/* Price */}
                                    {product.price === 0 ? (
                                        <p className="mb-2 text-lg font-semibold text-green-600 dark:text-green-400">Gratis</p>
                                    ) : (
                                        <div className="mb-2">
                                            {product.strikethrough_price > 0 && (
                                                <p className="text-sm text-red-500 line-through">{formatRupiah(product.strikethrough_price)}</p>
                                            )}
                                            <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">{formatRupiah(product.price)}</p>
                                        </div>
                                    )}

                                    {/* Deadline */}
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar size="16" className="text-red-500" />
                                        <p className="text-gray-600 dark:text-gray-400">
                                            Daftar sebelum: <span className="font-medium">{format(deadlineDate, 'dd MMM yyyy', { locale: id })}</span>
                                        </p>
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
