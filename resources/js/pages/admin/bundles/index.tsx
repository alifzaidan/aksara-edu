import { Button } from '@/components/ui/button';
import AdminLayout from '@/layouts/admin-layout';
import { rupiahFormatter } from '@/lib/utils';
import { SharedData, type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    ChevronDown,
    ChevronUp,
    DollarSign,
    FileText,
    Layers,
    MonitorPlay,
    Package,
    Percent,
    Plus,
    Presentation,
    ShoppingBag,
    TrendingUp,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Bundle, columns } from './columns';
import { DataTable } from './data-table';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Paket Bundling',
        href: route('bundles.index'),
    },
];

interface Statistics {
    overview: {
        total_bundles: number;
        published_bundles: number;
        draft_bundles: number;
        archived_bundles: number;
    };
    content: {
        with_courses: number;
        with_bootcamps: number;
        with_webinars: number;
        average_items: number;
    };
    performance: {
        total_sales: number;
        total_revenue: number;
        total_savings: number;
    };
}

interface BundlesProps {
    bundles: Bundle[];
    statistics: Statistics;
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function Bundles({ bundles, statistics, flash }: BundlesProps) {
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
            <Head title="Paket Bundling" />
            <div className="px-4 py-4 md:px-6">
                <div className="mb-6 flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold">Paket Bundling</h1>
                        <p className="text-muted-foreground text-sm">Ringkasan dan daftar semua paket bundling.</p>
                    </div>
                    {!isAffiliate && (
                        <Button asChild className="hover:cursor-pointer">
                            <Link href={route('bundles.create')}>
                                <Plus />
                                Tambah Paket Bundling
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
                                    <p className="text-muted-foreground text-xs font-medium">Total Paket</p>
                                    <h3 className="mt-1 text-xl font-bold">{statistics.overview.total_bundles}</h3>
                                    <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                                        ✓ {statistics.overview.published_bundles} published
                                    </p>
                                </div>
                                <Package className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>

                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-purple-50 to-white p-4 shadow-sm dark:from-purple-950/20">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-muted-foreground text-xs font-medium">Total Pendapatan</p>
                                    <h3 className="mt-1 text-lg font-bold text-purple-600 dark:text-purple-400">
                                        {rupiahFormatter.format(statistics.performance.total_revenue)}
                                    </h3>
                                    <p className="mt-1 text-xs text-teal-600 dark:text-teal-400">{statistics.performance.total_sales} terjual</p>
                                </div>
                                <DollarSign className="h-8 w-8 text-purple-600 dark:text-purple-400" />
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
                                    <h4 className="mb-2 font-semibold">Status Paket</h4>
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Draft</span>
                                            <span className="text-xs font-medium text-gray-600">{statistics.overview.draft_bundles}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Archived</span>
                                            <span className="text-xs font-medium text-gray-600">{statistics.overview.archived_bundles}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Content Types */}
                                <div className="rounded-lg border p-3 text-sm">
                                    <h4 className="mb-2 font-semibold">Tipe Konten</h4>
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Dengan Kelas</span>
                                            <span className="text-xs font-medium text-blue-600">{statistics.content.with_courses}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Dengan Bootcamp</span>
                                            <span className="text-xs font-medium text-purple-600">{statistics.content.with_bootcamps}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Dengan Webinar</span>
                                            <span className="text-xs font-medium text-green-600">{statistics.content.with_webinars}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Rata-rata Item</span>
                                            <span className="text-xs font-medium text-orange-600">{statistics.content.average_items}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Pricing & Savings */}

                                <div className="rounded-lg border p-3 text-sm">
                                    <h4 className="mb-2 text-xs font-semibold">Hemat</h4>
                                    <div className="text-xs font-medium text-green-600">
                                        {rupiahFormatter.format(statistics.performance.total_savings)}
                                    </div>
                                    <div className="text-muted-foreground mt-1 text-xs">Total penghematan</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ✅ DESKTOP: Overview Stats (4 cards) */}
                    <div className="hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-4">
                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm dark:from-blue-950/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Total Paket</p>
                                    <h3 className="mt-2 text-2xl font-bold">{statistics.overview.total_bundles}</h3>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                                    <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                        </div>

                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-green-50 to-white p-4 shadow-sm dark:from-green-950/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Published</p>
                                    <h3 className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">
                                        {statistics.overview.published_bundles}
                                    </h3>
                                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{statistics.overview.draft_bundles} draft</p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                                    <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                        </div>

                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-purple-50 to-white p-4 shadow-sm dark:from-purple-950/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Total Terjual</p>
                                    <h3 className="mt-2 text-2xl font-bold text-purple-600 dark:text-purple-400">
                                        {statistics.performance.total_sales}
                                    </h3>
                                    <p className="mt-1 text-xs text-purple-600 dark:text-purple-400">
                                        ~{statistics.content.average_items} item/paket
                                    </p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                                    <ShoppingBag className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                            </div>
                        </div>

                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-orange-50 to-white p-4 shadow-sm dark:from-orange-950/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Total Revenue</p>
                                    <h3 className="mt-2 text-2xl font-bold text-orange-600 dark:text-orange-400">
                                        {rupiahFormatter.format(statistics.performance.total_revenue)}
                                    </h3>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                                    <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ✅ DESKTOP: Additional Stats (3 cards) */}
                    <div className="hidden gap-4 md:grid md:grid-cols-2">
                        {/* Content Composition */}
                        <div className="rounded-lg border p-4 shadow-sm">
                            <div className="mb-3 flex items-center gap-2">
                                <Layers className="text-muted-foreground h-5 w-5" />
                                <h4 className="font-semibold">Komposisi Konten</h4>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="h-4 w-4 text-blue-600" />
                                        <span className="text-muted-foreground">Dengan Kelas</span>
                                    </div>
                                    <span className="font-medium text-blue-600">{statistics.content.with_courses}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Presentation className="h-4 w-4 text-purple-600" />
                                        <span className="text-muted-foreground">Dengan Bootcamp</span>
                                    </div>
                                    <span className="font-medium text-purple-600">{statistics.content.with_bootcamps}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <MonitorPlay className="h-4 w-4 text-green-600" />
                                        <span className="text-muted-foreground">Dengan Webinar</span>
                                    </div>
                                    <span className="font-medium text-green-600">{statistics.content.with_webinars}</span>
                                </div>
                            </div>
                        </div>

                        {/* Total Savings */}
                        <div className="rounded-lg border p-4 shadow-sm">
                            <div className="mb-3 flex items-center gap-2">
                                <Percent className="text-muted-foreground h-5 w-5" />
                                <h4 className="font-semibold">Total Penghematan</h4>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-green-600">{rupiahFormatter.format(statistics.performance.total_savings)}</h3>
                                <p className="text-muted-foreground mt-1 text-xs">Hemat customer dari bundling</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <DataTable columns={columns} data={bundles} />
            </div>
        </AdminLayout>
    );
}
