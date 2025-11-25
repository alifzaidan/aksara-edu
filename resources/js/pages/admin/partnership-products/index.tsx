import { Button } from '@/components/ui/button';
import AdminLayout from '@/layouts/admin-layout';
import { rupiahFormatter } from '@/lib/utils';
import { SharedData, type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Award, ChevronDown, ChevronUp, DollarSign, ExternalLink, FileText, MousePointerClick, Package, Plus, TrendingUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { columns, PartnershipProduct } from './columns';
import { DataTable } from './data-table';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Sertifikasi Kerjasama',
        href: 'admin/partnership-products',
    },
];

interface Statistics {
    overview: {
        total_products: number;
        published_products: number;
        draft_products: number;
        archived_products: number;
    };
    pricing: {
        free_products: number;
        paid_products: number;
    };
    engagement: {
        total_clicks: number;
        unique_users: number;
        average_clicks: number;
        clicks_today: number;
        clicks_this_week: number;
        clicks_this_month: number;
    };
    performance: {
        total_potential_savings: number;
        top_products: Array<{
            id: string;
            title: string;
            clicks_count: number;
        }>;
    };
}

interface PartnershipProductsProps {
    products: PartnershipProduct[];
    statistics: Statistics;
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function PartnershipProducts({ products, statistics, flash }: PartnershipProductsProps) {
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
            <Head title="Sertifikasi Kerjasama" />
            <div className="px-4 py-4 md:px-6">
                <div className="mb-6 flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold">Sertifikasi Kerjasama</h1>
                        <p className="text-muted-foreground text-sm">Ringkasan dan kelola produk kerjasama dari partner eksternal.</p>
                    </div>
                    {!isAffiliate && (
                        <Button asChild className="hover:cursor-pointer">
                            <Link href={route('partnership-products.create')}>
                                <Plus />
                                Tambah Produk
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
                                    <p className="text-muted-foreground text-xs font-medium">Total Produk</p>
                                    <h3 className="mt-1 text-xl font-bold">{statistics.overview.total_products}</h3>
                                    <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                                        ✓ {statistics.overview.published_products} published
                                    </p>
                                </div>
                                <Award className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>

                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-purple-50 to-white p-4 shadow-sm dark:from-purple-950/20">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-muted-foreground text-xs font-medium">Total Klik</p>
                                    <h3 className="mt-1 text-xl font-bold text-purple-600 dark:text-purple-400">
                                        {statistics.engagement.total_clicks}
                                    </h3>
                                    <p className="mt-1 text-xs text-teal-600 dark:text-teal-400">
                                        {statistics.engagement.unique_users} pengguna unik
                                    </p>
                                </div>
                                <MousePointerClick className="h-8 w-8 text-purple-600 dark:text-purple-400" />
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
                                    <h4 className="mb-2 font-semibold">Status Produk</h4>
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Draft</span>
                                            <span className="text-xs font-medium text-gray-600">{statistics.overview.draft_products}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Archived</span>
                                            <span className="text-xs font-medium text-gray-600">{statistics.overview.archived_products}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Click Statistics */}
                                <div className="rounded-lg border p-3 text-sm">
                                    <h4 className="mb-2 font-semibold">Statistik Klik</h4>
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Hari Ini</span>
                                            <span className="text-xs font-medium text-blue-600">{statistics.engagement.clicks_today}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Minggu Ini</span>
                                            <span className="text-xs font-medium text-purple-600">{statistics.engagement.clicks_this_week}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Bulan Ini</span>
                                            <span className="text-xs font-medium text-green-600">{statistics.engagement.clicks_this_month}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Rata-rata/Produk</span>
                                            <span className="text-xs font-medium text-orange-600">{statistics.engagement.average_clicks}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Pricing */}
                                <div className="rounded-lg border p-3 text-sm">
                                    <h4 className="mb-2 font-semibold">Tipe Harga</h4>
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Berbayar</span>
                                            <span className="text-xs font-medium text-green-600">{statistics.pricing.paid_products}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Gratis</span>
                                            <span className="text-xs font-medium text-blue-600">{statistics.pricing.free_products}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Top Products */}
                                {statistics.performance.top_products.length > 0 && (
                                    <div className="rounded-lg border p-3 text-sm">
                                        <h4 className="mb-2 font-semibold">Produk Terpopuler</h4>
                                        <div className="space-y-1">
                                            {statistics.performance.top_products.map((product, index) => (
                                                <div key={product.id} className="flex items-center justify-between">
                                                    <span className="text-muted-foreground truncate text-xs">
                                                        {index + 1}. {product.title}
                                                    </span>
                                                    <span className="text-xs font-medium text-blue-600">{product.clicks_count} klik</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Potential Savings */}
                                <div className="rounded-lg border p-3 text-sm">
                                    <h4 className="mb-2 font-semibold">Potensi Hemat Customer</h4>
                                    <div className="text-lg font-bold text-green-600">
                                        {rupiahFormatter.format(statistics.performance.total_potential_savings)}
                                    </div>
                                    <div className="text-muted-foreground mt-1 text-xs">Dari diskon yang ditawarkan</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ✅ DESKTOP: Overview Stats (4 cards) */}
                    <div className="hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-4">
                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm dark:from-blue-950/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Total Produk</p>
                                    <h3 className="mt-2 text-2xl font-bold">{statistics.overview.total_products}</h3>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                                    <Award className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                        </div>

                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-green-50 to-white p-4 shadow-sm dark:from-green-950/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Published</p>
                                    <h3 className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">
                                        {statistics.overview.published_products}
                                    </h3>
                                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{statistics.overview.draft_products} draft</p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                                    <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                        </div>

                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-purple-50 to-white p-4 shadow-sm dark:from-purple-950/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Total Klik</p>
                                    <h3 className="mt-2 text-2xl font-bold text-purple-600 dark:text-purple-400">
                                        {statistics.engagement.total_clicks}
                                    </h3>
                                    <p className="mt-1 text-xs text-purple-600 dark:text-purple-400">
                                        {statistics.engagement.unique_users} pengguna unik
                                    </p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                                    <MousePointerClick className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                            </div>
                        </div>

                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-orange-50 to-white p-4 shadow-sm dark:from-orange-950/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Klik Bulan Ini</p>
                                    <h3 className="mt-2 text-2xl font-bold text-orange-600 dark:text-orange-400">
                                        {statistics.engagement.clicks_this_month}
                                    </h3>
                                    <p className="mt-1 text-xs text-orange-600 dark:text-orange-400">
                                        ~{statistics.engagement.average_clicks} rata-rata
                                    </p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                                    <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ✅ DESKTOP: Additional Stats (3 cards) */}
                    <div className="hidden gap-4 md:grid md:grid-cols-3">
                        {/* Click Timeline */}
                        <div className="rounded-lg border p-4 shadow-sm">
                            <div className="mb-3 flex items-center gap-2">
                                <ExternalLink className="text-muted-foreground h-5 w-5" />
                                <h4 className="font-semibold">Timeline Klik</h4>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Hari Ini</span>
                                    <span className="font-medium text-blue-600">{statistics.engagement.clicks_today}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Minggu Ini</span>
                                    <span className="font-medium text-purple-600">{statistics.engagement.clicks_this_week}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Bulan Ini</span>
                                    <span className="font-medium text-green-600">{statistics.engagement.clicks_this_month}</span>
                                </div>
                            </div>
                        </div>

                        {/* Pricing Breakdown */}
                        <div className="rounded-lg border p-4 shadow-sm">
                            <div className="mb-3 flex items-center gap-2">
                                <DollarSign className="text-muted-foreground h-5 w-5" />
                                <h4 className="font-semibold">Tipe Harga</h4>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Berbayar</span>
                                    <span className="font-medium text-green-600">{statistics.pricing.paid_products}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Gratis</span>
                                    <span className="font-medium text-blue-600">{statistics.pricing.free_products}</span>
                                </div>
                            </div>
                        </div>

                        {/* Top Products or Savings */}
                        {statistics.performance.top_products.length > 0 ? (
                            <div className="rounded-lg border p-4 shadow-sm">
                                <div className="mb-3 flex items-center gap-2">
                                    <Package className="text-muted-foreground h-5 w-5" />
                                    <h4 className="font-semibold">Produk Terpopuler</h4>
                                </div>
                                <div className="space-y-2 text-sm">
                                    {statistics.performance.top_products.slice(0, 3).map((product, index) => (
                                        <div key={product.id} className="flex items-center justify-between">
                                            <span className="text-muted-foreground truncate">
                                                {index + 1}. {product.title.substring(0, 20)}...
                                            </span>
                                            <span className="font-medium text-blue-600">{product.clicks_count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-lg border p-4 shadow-sm">
                                <div className="mb-3 flex items-center gap-2">
                                    <Users className="text-muted-foreground h-5 w-5" />
                                    <h4 className="font-semibold">Potensi Hemat</h4>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-green-600">
                                        {rupiahFormatter.format(statistics.performance.total_potential_savings)}
                                    </h3>
                                    <p className="text-muted-foreground mt-1 text-xs">Total hemat customer</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Data Table */}
                <DataTable columns={columns} data={products} />
            </div>
        </AdminLayout>
    );
}
