import { Spotlight } from '@/components/ui/spotlight';
import { Link } from '@inertiajs/react';
import { Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Webinar {
    id: string;
    title: string;
    slug: string;
    thumbnail?: string | null;
    price: number;
    strikethrough_price: number;
    start_time: string;
    category?: {
        name: string;
    };
}

interface RelatedProductProps {
    relatedWebinars: Webinar[];
    myWebinarIds: string[];
}

export default function RelatedProduct({ relatedWebinars, myWebinarIds }: RelatedProductProps) {
    const { t, i18n } = useTranslation('user');
    const dateLocale = i18n.language === 'en' ? 'en-US' : 'id-ID';

    if (!relatedWebinars || relatedWebinars.length === 0) {
        return null;
    }

    return (
        <section className="mx-auto mt-16 w-full max-w-7xl px-4" id="related">
            <h2 className="dark:text-primary-foreground mb-4 text-center text-3xl font-bold text-gray-900 italic md:text-4xl">
                {t('webinar.detail.similarTitle')}
            </h2>
            <p className="mb-8 text-center text-gray-600 dark:text-gray-400">
                {t('webinar.detail.similarSubtitle')}
            </p>

            <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {relatedWebinars.map((webinar) => {
                    const hasAccess = myWebinarIds.includes(webinar.id);

                    return (
                        <Link
                            key={webinar.id}
                            href={hasAccess ? `/profile/my-webinars/${webinar.slug}` : `/webinar/${webinar.slug}`}
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
                                        src={webinar.thumbnail ? `/storage/${webinar.thumbnail}` : '/assets/images/placeholder.png'}
                                        alt={webinar.title}
                                        className="h-48 w-full rounded-t-lg object-cover"
                                    />
                                    <h2 className="mx-4 mt-2 text-lg font-semibold">{webinar.title}</h2>
                                </div>
                                <div className="w-full p-4 text-left">
                                    {hasAccess ? (
                                        <p className="text-primary text-sm font-medium">{t('webinar.catalog.owned')}</p>
                                    ) : webinar.price === 0 ? (
                                        <p className="text-lg font-semibold text-green-600 dark:text-green-400">{t('webinar.catalog.free')}</p>
                                    ) : (
                                        <div className="">
                                            {webinar.strikethrough_price > 0 && (
                                                <p className="text-sm text-red-500 line-through">
                                                    Rp {webinar.strikethrough_price.toLocaleString(dateLocale)}
                                                </p>
                                            )}
                                            <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                                Rp {webinar.price.toLocaleString(dateLocale)}
                                            </p>
                                        </div>
                                    )}
                                    <div className="mt-2 flex justify-between">
                                        <div className="flex items-center gap-2">
                                            <Calendar size="18" />
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {new Date(webinar.start_time).toLocaleDateString(dateLocale, {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                })}
                                            </p>
                                        </div>
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
