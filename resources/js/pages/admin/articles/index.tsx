import { Button } from '@/components/ui/button';
import AdminLayout from '@/layouts/admin-layout';
import { SharedData, type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { AlertCircle, BookOpen, ChevronDown, ChevronUp, Clock, Eye, FileText, Layers, Plus, Star, TrendingUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Article, columns } from './columns';
import { DataTable } from './data-table';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Artikel',
        href: route('articles.index'),
    },
];

interface Statistics {
    overview: {
        total_articles: number;
        draft_articles: number;
        published_articles: number;
        archived_articles: number;
        featured_articles: number;
        recent_articles: number;
    };
    engagement: {
        total_views: number;
        average_views: number;
        most_viewed: Array<{
            id: string;
            title: string;
            views: number;
            thumbnail: string | null;
        }>;
    };
    content: {
        total_read_time: number;
        average_read_time: number;
        without_thumbnail: number;
    };
    distribution: {
        categories: Array<{
            category_name: string;
            count: number;
        }>;
        authors: Array<{
            author_name: string;
            article_count: number;
            total_views: number;
        }>;
    };
    activity: {
        published_this_month: number;
    };
}

interface ArticlesProps {
    articles: Article[];
    statistics: Statistics;
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function Articles({ articles, statistics, flash }: ArticlesProps) {
    const { auth } = usePage<SharedData>().props;
    const isAffiliate = auth.role.includes('affiliate');
    const [showMoreStats, setShowMoreStats] = useState(false);

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Artikel" />
            <div className="px-4 py-4 md:px-6">
                <div className="mb-6 flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold">Artikel</h1>
                        <p className="text-muted-foreground text-sm">Kelola artikel blog dan konten edukatif untuk platform pembelajaran.</p>
                    </div>
                    {!isAffiliate && (
                        <Button asChild className="hover:cursor-pointer">
                            <Link href={route('articles.create')}>
                                <Plus />
                                Tambah Artikel
                            </Link>
                        </Button>
                    )}
                </div>

                {/* Statistics Cards */}
                <div className="mb-6 space-y-4">
                    {/* ✅ MOBILE: Compact Overview (2 cards only) */}
                    <div className="grid gap-4 md:hidden">
                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm dark:from-blue-950/20">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-muted-foreground text-xs font-medium">Total Artikel</p>
                                    <h3 className="mt-1 text-xl font-bold">{statistics.overview.total_articles}</h3>
                                    <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                                        {statistics.overview.published_articles} dipublikasi
                                    </p>
                                </div>
                                <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>

                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-purple-50 to-white p-4 shadow-sm dark:from-purple-950/20">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-muted-foreground text-xs font-medium">Total Views</p>
                                    <h3 className="mt-1 text-xl font-bold text-purple-600 dark:text-purple-400">
                                        {statistics.engagement.total_views.toLocaleString()}
                                    </h3>
                                    <p className="mt-1 text-xs text-teal-600 dark:text-teal-400">~{statistics.engagement.average_views} rata-rata</p>
                                </div>
                                <Eye className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                    </div>

                    {/* ✅ MOBILE: Expandable Details */}
                    <div className="md:hidden">
                        <Button variant="outline" className="w-full" onClick={() => setShowMoreStats(!showMoreStats)}>
                            {showMoreStats ? (
                                <>
                                    <ChevronUp className="mr-2 h-4 w-4" />
                                    Sembunyikan Detail
                                </>
                            ) : (
                                <>
                                    <ChevronDown className="mr-2 h-4 w-4" />
                                    Lihat Detail Statistik
                                </>
                            )}
                        </Button>

                        {showMoreStats && (
                            <div className="mt-4 space-y-3">
                                {/* Status Breakdown */}
                                <div className="rounded-lg border p-3 text-sm">
                                    <h4 className="mb-2 font-semibold">Status Artikel</h4>
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Draft</span>
                                            <span className="text-xs font-medium text-gray-600">{statistics.overview.draft_articles}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Dipublikasi</span>
                                            <span className="text-xs font-medium text-green-600">{statistics.overview.published_articles}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Diarsipkan</span>
                                            <span className="text-xs font-medium text-orange-600">{statistics.overview.archived_articles}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Featured</span>
                                            <span className="text-xs font-medium text-yellow-600">{statistics.overview.featured_articles}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Reading Time */}
                                <div className="rounded-lg border p-3 text-sm">
                                    <h4 className="mb-2 font-semibold">Waktu Baca</h4>
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Total</span>
                                            <span className="text-xs font-medium text-blue-600">{statistics.content.total_read_time} menit</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Rata-rata</span>
                                            <span className="text-xs font-medium text-green-600">{statistics.content.average_read_time} menit</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Categories */}
                                {statistics.distribution.categories.length > 0 && (
                                    <div className="rounded-lg border p-3 text-sm">
                                        <h4 className="mb-2 font-semibold">Kategori Populer</h4>
                                        <div className="space-y-1">
                                            {statistics.distribution.categories.slice(0, 3).map((cat, index) => (
                                                <div key={index} className="flex items-center justify-between">
                                                    <span className="text-muted-foreground truncate text-xs">{cat.category_name}</span>
                                                    <span className="text-xs font-medium text-blue-600">{cat.count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Alerts */}
                                {statistics.content.without_thumbnail > 0 && (
                                    <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm dark:border-orange-900 dark:bg-orange-950/20">
                                        <div className="flex items-center gap-1 text-orange-700 dark:text-orange-400">
                                            <AlertCircle className="h-4 w-4" />
                                            <span className="text-xs font-semibold">
                                                {statistics.content.without_thumbnail} artikel tanpa thumbnail
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ✅ DESKTOP: Overview Stats (4 cards) */}
                    <div className="hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-4">
                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm dark:from-blue-950/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Total Artikel</p>
                                    <h3 className="mt-2 text-2xl font-bold">{statistics.overview.total_articles}</h3>
                                    <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                                        +{statistics.overview.recent_articles} baru (30 hari)
                                    </p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                                    <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                        </div>

                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-green-50 to-white p-4 shadow-sm dark:from-green-950/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Dipublikasi</p>
                                    <h3 className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">
                                        {statistics.overview.published_articles}
                                    </h3>
                                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                        {statistics.activity.published_this_month} bulan ini
                                    </p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                                    <BookOpen className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                        </div>

                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-purple-50 to-white p-4 shadow-sm dark:from-purple-950/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Total Views</p>
                                    <h3 className="mt-2 text-2xl font-bold text-purple-600 dark:text-purple-400">
                                        {statistics.engagement.total_views.toLocaleString()}
                                    </h3>
                                    <p className="mt-1 text-xs text-purple-600 dark:text-purple-400">
                                        ~{statistics.engagement.average_views} rata-rata
                                    </p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                                    <Eye className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                            </div>
                        </div>

                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-orange-50 to-white p-4 shadow-sm dark:from-orange-950/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Waktu Baca Rata-rata</p>
                                    <h3 className="mt-2 text-2xl font-bold text-orange-600 dark:text-orange-400">
                                        {statistics.content.average_read_time}
                                    </h3>
                                    <p className="mt-1 text-xs text-orange-600 dark:text-orange-400">menit per artikel</p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                                    <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ✅ DESKTOP: Additional Stats (3 cards) */}
                    <div className="hidden gap-4 md:grid md:grid-cols-3">
                        {/* Status Distribution */}
                        <div className="rounded-lg border p-4 shadow-sm">
                            <div className="mb-3 flex items-center gap-2">
                                <Layers className="text-muted-foreground h-5 w-5" />
                                <h4 className="font-semibold">Status Artikel</h4>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Draft</span>
                                    <span className="font-medium text-gray-600">{statistics.overview.draft_articles}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Dipublikasi</span>
                                    <span className="font-medium text-green-600">{statistics.overview.published_articles}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Diarsipkan</span>
                                    <span className="font-medium text-orange-600">{statistics.overview.archived_articles}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1">
                                        <Star className="h-3 w-3 text-yellow-600" />
                                        <span className="text-muted-foreground">Featured</span>
                                    </div>
                                    <span className="font-medium text-yellow-600">{statistics.overview.featured_articles}</span>
                                </div>
                            </div>
                        </div>

                        {/* Category Distribution */}
                        {statistics.distribution.categories.length > 0 && (
                            <div className="rounded-lg border p-4 shadow-sm">
                                <div className="mb-3 flex items-center gap-2">
                                    <BookOpen className="text-muted-foreground h-5 w-5" />
                                    <h4 className="font-semibold">Kategori Populer</h4>
                                </div>
                                <div className="space-y-2 text-sm">
                                    {statistics.distribution.categories.slice(0, 4).map((cat, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <span className="text-muted-foreground truncate">{cat.category_name}</span>
                                            <span className="font-medium text-blue-600">{cat.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Top Authors or Alert */}
                        {statistics.distribution.authors.length > 0 ? (
                            <div className="rounded-lg border p-4 shadow-sm">
                                <div className="mb-3 flex items-center gap-2">
                                    <Users className="text-muted-foreground h-5 w-5" />
                                    <h4 className="font-semibold">Penulis Produktif</h4>
                                </div>
                                <div className="space-y-2 text-sm">
                                    {statistics.distribution.authors.slice(0, 3).map((author, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <span className="text-muted-foreground truncate">{author.author_name}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-purple-600">{author.article_count}</span>
                                                <span className="text-muted-foreground text-xs">|</span>
                                                <span className="text-xs text-gray-600">{author.total_views.toLocaleString()} views</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-lg border p-4 shadow-sm">
                                <div className="mb-3 flex items-center gap-2">
                                    <TrendingUp className="text-muted-foreground h-5 w-5" />
                                    <h4 className="font-semibold">Performa Konten</h4>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Total Waktu Baca</span>
                                        <span className="font-medium text-blue-600">{statistics.content.total_read_time} menit</span>
                                    </div>
                                    {statistics.content.without_thumbnail > 0 && (
                                        <div className="flex items-center justify-between border-t pt-2">
                                            <div className="flex items-center gap-1 text-orange-600">
                                                <AlertCircle className="h-3 w-3" />
                                                <span className="text-xs">Tanpa Thumbnail</span>
                                            </div>
                                            <span className="font-medium text-orange-600">{statistics.content.without_thumbnail}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ✅ Most Viewed Articles (Full Width - Optional) */}
                    {statistics.engagement.most_viewed.length > 0 && (
                        <div className="hidden rounded-lg border p-4 shadow-sm md:block">
                            <div className="mb-3 flex items-center gap-2">
                                <TrendingUp className="text-muted-foreground h-5 w-5" />
                                <h4 className="font-semibold">Artikel Terpopuler</h4>
                            </div>
                            <div className="grid gap-4 md:grid-cols-3">
                                {statistics.engagement.most_viewed.map((article, index) => (
                                    <Link
                                        key={article.id}
                                        href={route('articles.show', article.id)}
                                        className="group hover:bg-accent flex items-center gap-3 rounded-lg border p-3 transition-colors"
                                    >
                                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 font-bold text-purple-600">
                                            #{index + 1}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="group-hover:text-primary line-clamp-1 text-sm font-medium">{article.title}</div>
                                            <div className="mt-1 flex items-center gap-1 text-xs text-purple-600">
                                                <Eye className="h-3 w-3" />
                                                <span className="font-medium">{article.views.toLocaleString()} views</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Data Table */}
                <DataTable columns={columns} data={articles} />
            </div>
        </AdminLayout>
    );
}
