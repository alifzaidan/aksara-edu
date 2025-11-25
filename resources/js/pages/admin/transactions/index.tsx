import { Button } from '@/components/ui/button';
import AdminLayout from '@/layouts/admin-layout';
import { rupiahFormatter } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import {
    Calendar,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    Clock,
    DollarSign,
    Package,
    ShoppingCart,
    Tag,
    TrendingUp,
    Users,
    XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { columns, Invoice } from './columns';
import { DataTable } from './data-table';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Transaksi',
        href: 'admin/transactions',
    },
];

interface Statistics {
    overview: {
        total_transactions: number;
        paid_transactions: number;
        pending_transactions: number;
        failed_transactions: number;
        success_rate: number;
    };
    revenue: {
        total_revenue: number;
        total_gross: number;
        total_discount: number;
        average_transaction: number;
    };
    enrollment_type: {
        free_enrollments: number;
        paid_enrollments: number;
    };
    product_breakdown: {
        course: number;
        bootcamp: number;
        webinar: number;
        bundle: number;
    };
    period: {
        today_transactions: number;
        today_revenue: number;
        month_transactions: number;
        month_revenue: number;
    };
}

interface TransactionProps {
    invoices: Invoice[];
    statistics: Statistics;
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function Transactions({ invoices, statistics, flash }: TransactionProps) {
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
            <Head title="Transaksi" />
            <div className="px-4 py-4 md:px-6">
                <div className="mb-6 flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold">Transaksi</h1>
                        <p className="text-muted-foreground text-sm">Ringkasan dan daftar semua transaksi.</p>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="mb-6 space-y-4">
                    {/* ✅ MOBILE: Compact Overview (2 cards only) */}
                    <div className="grid gap-4 md:hidden">
                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm dark:from-blue-950/20">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-muted-foreground text-xs font-medium">Total Transaksi</p>
                                    <h3 className="mt-1 text-xl font-bold">{statistics.overview.total_transactions}</h3>
                                    <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                                        ✓ {statistics.overview.paid_transactions} berhasil ({statistics.overview.success_rate}%)
                                    </p>
                                </div>
                                <ShoppingCart className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>

                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-purple-50 to-white p-4 shadow-sm dark:from-purple-950/20">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-muted-foreground text-xs font-medium">Total Pendapatan</p>
                                    <h3 className="mt-1 text-lg font-bold text-purple-600 dark:text-purple-400">
                                        {rupiahFormatter.format(statistics.revenue.total_revenue)}
                                    </h3>
                                    <p className="mt-1 text-xs text-teal-600 dark:text-teal-400">
                                        Bulan ini: {rupiahFormatter.format(statistics.period.month_revenue)}
                                    </p>
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
                                    <h4 className="mb-2 font-semibold">Status Transaksi</h4>
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Pending</span>
                                            <span className="text-xs font-medium text-yellow-600">{statistics.overview.pending_transactions}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Gagal/Expired</span>
                                            <span className="text-xs font-medium text-red-600">{statistics.overview.failed_transactions}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Product & Type */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-lg border p-3 text-sm">
                                        <h4 className="mb-2 text-xs font-semibold">Produk</h4>
                                        <div className="space-y-1 text-xs">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Kelas</span>
                                                <span className="font-medium">{statistics.product_breakdown.course}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Bootcamp</span>
                                                <span className="font-medium">{statistics.product_breakdown.bootcamp}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Webinar</span>
                                                <span className="font-medium">{statistics.product_breakdown.webinar}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-lg border p-3 text-sm">
                                        <h4 className="mb-2 text-xs font-semibold">Tipe</h4>
                                        <div className="space-y-1 text-xs">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Berbayar</span>
                                                <span className="font-medium text-green-600">{statistics.enrollment_type.paid_enrollments}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Gratis</span>
                                                <span className="font-medium text-blue-600">{statistics.enrollment_type.free_enrollments}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ✅ DESKTOP: Full Overview Stats (4 cards) */}
                    <div className="hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-4">
                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm dark:from-blue-950/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Total Transaksi</p>
                                    <h3 className="mt-2 text-2xl font-bold">{statistics.overview.total_transactions}</h3>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                                    <ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                        </div>

                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-green-50 to-white p-4 shadow-sm dark:from-green-950/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Transaksi Berhasil</p>
                                    <h3 className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">
                                        {statistics.overview.paid_transactions}
                                    </h3>
                                    <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                                        {statistics.overview.success_rate}% Success Rate
                                    </p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                        </div>

                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-yellow-50 to-white p-4 shadow-sm dark:from-yellow-950/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Pending</p>
                                    <h3 className="mt-2 text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                                        {statistics.overview.pending_transactions}
                                    </h3>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                                    <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                                </div>
                            </div>
                        </div>

                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-red-50 to-white p-4 shadow-sm dark:from-red-950/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Gagal/Expired</p>
                                    <h3 className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">
                                        {statistics.overview.failed_transactions}
                                    </h3>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                                    <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ✅ DESKTOP: Revenue Stats (4 cards) */}
                    <div className="hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-4">
                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-purple-50 to-white p-4 shadow-sm dark:from-purple-950/20">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-muted-foreground text-sm font-medium">Total Pendapatan</p>
                                    <h3 className="mt-2 text-xl font-bold text-purple-600 dark:text-purple-400">
                                        {rupiahFormatter.format(statistics.revenue.total_revenue)}
                                    </h3>
                                </div>
                                <DollarSign className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>

                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-indigo-50 to-white p-4 shadow-sm dark:from-indigo-950/20">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-muted-foreground text-sm font-medium">Rata-rata Transaksi</p>
                                    <h3 className="mt-2 text-xl font-bold text-indigo-600 dark:text-indigo-400">
                                        {rupiahFormatter.format(statistics.revenue.average_transaction)}
                                    </h3>
                                </div>
                                <TrendingUp className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                            </div>
                        </div>

                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-orange-50 to-white p-4 shadow-sm dark:from-orange-950/20">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-muted-foreground text-sm font-medium">Total Diskon</p>
                                    <h3 className="mt-2 text-xl font-bold text-orange-600 dark:text-orange-400">
                                        {rupiahFormatter.format(statistics.revenue.total_discount)}
                                    </h3>
                                </div>
                                <Tag className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                            </div>
                        </div>

                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-teal-50 to-white p-4 shadow-sm dark:from-teal-950/20">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-muted-foreground text-sm font-medium">Pendapatan Bulan Ini</p>
                                    <h3 className="mt-2 text-xl font-bold text-teal-600 dark:text-teal-400">
                                        {rupiahFormatter.format(statistics.period.month_revenue)}
                                    </h3>
                                    <p className="mt-1 text-xs text-teal-600 dark:text-teal-400">{statistics.period.month_transactions} transaksi</p>
                                </div>
                                <Calendar className="h-8 w-8 text-teal-600 dark:text-teal-400" />
                            </div>
                        </div>
                    </div>

                    {/* ✅ DESKTOP: Additional Stats (2 cards) */}
                    <div className="hidden gap-4 md:grid md:grid-cols-2">
                        {/* Product Breakdown */}
                        <div className="rounded-lg border p-4 shadow-sm">
                            <div className="mb-3 flex items-center gap-2">
                                <Package className="text-muted-foreground h-5 w-5" />
                                <h4 className="font-semibold">Breakdown Produk</h4>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Kelas Online</span>
                                    <span className="font-medium">{statistics.product_breakdown.course}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Bootcamp</span>
                                    <span className="font-medium">{statistics.product_breakdown.bootcamp}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Webinar</span>
                                    <span className="font-medium">{statistics.product_breakdown.webinar}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Bundle</span>
                                    <span className="font-medium">{statistics.product_breakdown.bundle}</span>
                                </div>
                            </div>
                        </div>

                        {/* Enrollment Type */}
                        <div className="rounded-lg border p-4 shadow-sm">
                            <div className="mb-3 flex items-center gap-2">
                                <Users className="text-muted-foreground h-5 w-5" />
                                <h4 className="font-semibold">Tipe Pendaftaran</h4>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Berbayar</span>
                                    <span className="font-medium text-green-600">{statistics.enrollment_type.paid_enrollments}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Gratis</span>
                                    <span className="font-medium text-blue-600">{statistics.enrollment_type.free_enrollments}</span>
                                </div>
                                <div className="mt-3 border-t pt-2">
                                    <div className="flex items-center justify-between font-medium">
                                        <span>Total Pendaftaran</span>
                                        <span>{statistics.enrollment_type.paid_enrollments + statistics.enrollment_type.free_enrollments}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <DataTable columns={columns} data={invoices} />
            </div>
        </AdminLayout>
    );
}
