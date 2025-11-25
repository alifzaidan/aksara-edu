import { Button } from '@/components/ui/button';
import AdminLayout from '@/layouts/admin-layout';
import { rupiahFormatter } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { AlertCircle, Calendar, ChevronDown, ChevronUp, Clock, Percent, Plus, Receipt, Tag, TrendingUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { DiscountCode, columns } from './columns';
import { DataTable } from './data-table';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/admin/dashboard',
    },
    {
        title: 'Kode Diskon',
        href: '/admin/discount-codes',
    },
];

interface Statistics {
    overview: {
        total_codes: number;
        active_codes: number;
        inactive_codes: number;
        expired_codes: number;
        upcoming_codes: number;
    };
    type: {
        percentage_codes: number;
        fixed_codes: number;
    };
    usage: {
        total_usages: number;
        average_usage: number;
        used_codes: number;
        unused_codes: number;
        usages_today: number;
        usages_this_month: number;
        codes_nearing_limit: number;
    };
    performance: {
        total_discount_given: number;
        top_codes: Array<{
            id: string;
            code: string;
            name: string;
            used_count: number;
        }>;
    };
}

interface DiscountCodesProps {
    discountCodes: DiscountCode[];
    statistics: Statistics;
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function DiscountCodes({ discountCodes, statistics, flash }: DiscountCodesProps) {
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
            <Head title="Kode Diskon" />
            <div className="px-4 py-4 md:px-6">
                <div className="mb-6 flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold">Kode Diskon</h1>
                        <p className="text-muted-foreground text-sm">Kelola dan monitor kode diskon untuk produk Anda.</p>
                    </div>
                    <Button className="hover:cursor-pointer" asChild>
                        <Link href={route('discount-codes.create')}>
                            <Plus />
                            Tambah Kode Diskon
                        </Link>
                    </Button>
                </div>

                {/* Statistics Cards */}
                <div className="mb-6 space-y-4">
                    {/* ✅ MOBILE: Compact Overview (2 cards only) */}
                    <div className="grid gap-4 md:hidden">
                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm dark:from-blue-950/20">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-muted-foreground text-xs font-medium">Total Kode Diskon</p>
                                    <h3 className="mt-1 text-xl font-bold">{statistics.overview.total_codes}</h3>
                                    <p className="mt-1 text-xs text-green-600 dark:text-green-400">✓ {statistics.overview.active_codes} aktif</p>
                                </div>
                                <Tag className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>

                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-purple-50 to-white p-4 shadow-sm dark:from-purple-950/20">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-muted-foreground text-xs font-medium">Total Penggunaan</p>
                                    <h3 className="mt-1 text-xl font-bold text-purple-600 dark:text-purple-400">{statistics.usage.total_usages}</h3>
                                    <p className="mt-1 text-xs text-teal-600 dark:text-teal-400">~{statistics.usage.average_usage} rata-rata/kode</p>
                                </div>
                                <Users className="h-8 w-8 text-purple-600 dark:text-purple-400" />
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
                                    <h4 className="mb-2 font-semibold">Status Kode</h4>
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Akan Datang</span>
                                            <span className="text-xs font-medium text-blue-600">{statistics.overview.upcoming_codes}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Kedaluwarsa</span>
                                            <span className="text-xs font-medium text-orange-600">{statistics.overview.expired_codes}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Nonaktif</span>
                                            <span className="text-xs font-medium text-gray-600">{statistics.overview.inactive_codes}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Type Breakdown */}
                                <div className="rounded-lg border p-3 text-sm">
                                    <h4 className="mb-2 font-semibold">Jenis Diskon</h4>
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Persentase</span>
                                            <span className="text-xs font-medium text-blue-600">{statistics.type.percentage_codes}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Nominal Tetap</span>
                                            <span className="text-xs font-medium text-green-600">{statistics.type.fixed_codes}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Usage Stats */}
                                <div className="rounded-lg border p-3 text-sm">
                                    <h4 className="mb-2 font-semibold">Statistik Penggunaan</h4>
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Hari Ini</span>
                                            <span className="text-xs font-medium text-blue-600">{statistics.usage.usages_today}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Bulan Ini</span>
                                            <span className="text-xs font-medium text-green-600">{statistics.usage.usages_this_month}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Belum Digunakan</span>
                                            <span className="text-xs font-medium text-gray-600">{statistics.usage.unused_codes}</span>
                                        </div>
                                        {statistics.usage.codes_nearing_limit > 0 && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-orange-600">Mendekati Batas</span>
                                                <span className="text-xs font-medium text-orange-600">{statistics.usage.codes_nearing_limit}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Total Discount Given */}
                                <div className="rounded-lg border p-3 text-sm">
                                    <h4 className="mb-2 font-semibold">Total Diskon Diberikan</h4>
                                    <div className="text-lg font-bold text-orange-600">
                                        {rupiahFormatter.format(statistics.performance.total_discount_given)}
                                    </div>
                                    <div className="text-muted-foreground mt-1 text-xs">Total potongan harga</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ✅ DESKTOP: Overview Stats (4 cards) */}
                    <div className="hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-4">
                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm dark:from-blue-950/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Total Kode</p>
                                    <h3 className="mt-2 text-2xl font-bold">{statistics.overview.total_codes}</h3>
                                    <p className="mt-1 text-xs text-green-600 dark:text-green-400">{statistics.overview.active_codes} aktif</p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                                    <Tag className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                        </div>

                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-green-50 to-white p-4 shadow-sm dark:from-green-950/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Total Penggunaan</p>
                                    <h3 className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">{statistics.usage.total_usages}</h3>
                                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{statistics.usage.usages_this_month} bulan ini</p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                                    <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                        </div>

                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-purple-50 to-white p-4 shadow-sm dark:from-purple-950/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Rata-rata Penggunaan</p>
                                    <h3 className="mt-2 text-2xl font-bold text-purple-600 dark:text-purple-400">{statistics.usage.average_usage}</h3>
                                    <p className="mt-1 text-xs text-purple-600 dark:text-purple-400">per kode diskon</p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                                    <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                            </div>
                        </div>

                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-orange-50 to-white p-4 shadow-sm dark:from-orange-950/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Total Diskon</p>
                                    <h3 className="mt-2 text-2xl font-bold text-orange-600 dark:text-orange-400">
                                        {rupiahFormatter.format(statistics.performance.total_discount_given)}
                                    </h3>
                                    <p className="mt-1 text-xs text-orange-600 dark:text-orange-400">diberikan</p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                                    <Receipt className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ✅ DESKTOP: Additional Stats (3 cards) */}
                    <div className="hidden gap-4 md:grid md:grid-cols-3">
                        {/* Status Distribution */}
                        <div className="rounded-lg border p-4 shadow-sm">
                            <div className="mb-3 flex items-center gap-2">
                                <Clock className="text-muted-foreground h-5 w-5" />
                                <h4 className="font-semibold">Status Kode</h4>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Aktif</span>
                                    <span className="font-medium text-green-600">{statistics.overview.active_codes}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Akan Datang</span>
                                    <span className="font-medium text-blue-600">{statistics.overview.upcoming_codes}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Kedaluwarsa</span>
                                    <span className="font-medium text-orange-600">{statistics.overview.expired_codes}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Nonaktif</span>
                                    <span className="font-medium text-gray-600">{statistics.overview.inactive_codes}</span>
                                </div>
                            </div>
                        </div>

                        {/* Type & Usage */}
                        <div className="rounded-lg border p-4 shadow-sm">
                            <div className="mb-3 flex items-center gap-2">
                                <Percent className="text-muted-foreground h-5 w-5" />
                                <h4 className="font-semibold">Jenis & Penggunaan</h4>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Persentase</span>
                                    <span className="font-medium text-blue-600">{statistics.type.percentage_codes}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Nominal</span>
                                    <span className="font-medium text-green-600">{statistics.type.fixed_codes}</span>
                                </div>
                                <div className="my-2 border-t" />
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Sudah Digunakan</span>
                                    <span className="font-medium text-purple-600">{statistics.usage.used_codes}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Belum Digunakan</span>
                                    <span className="font-medium text-gray-600">{statistics.usage.unused_codes}</span>
                                </div>
                            </div>
                        </div>

                        {/* Performance Metrics */}
                        <div className="rounded-lg border p-4 shadow-sm">
                            <div className="mb-3 flex items-center gap-2">
                                <Calendar className="text-muted-foreground h-5 w-5" />
                                <h4 className="font-semibold">Performa</h4>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Penggunaan Hari Ini</span>
                                    <span className="font-medium text-blue-600">{statistics.usage.usages_today}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Penggunaan Bulan Ini</span>
                                    <span className="font-medium text-green-600">{statistics.usage.usages_this_month}</span>
                                </div>
                                {statistics.usage.codes_nearing_limit > 0 && (
                                    <>
                                        <div className="my-2 border-t" />
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3 text-orange-600" />
                                                <span className="text-orange-600">Mendekati Batas</span>
                                            </div>
                                            <span className="font-medium text-orange-600">{statistics.usage.codes_nearing_limit}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <DataTable columns={columns} data={discountCodes} />
            </div>
        </AdminLayout>
    );
}
