import { Button } from '@/components/ui/button';
import AdminLayout from '@/layouts/admin-layout';
import { rupiahFormatter } from '@/lib/utils';
import { SharedData, type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ChevronDown,
    ChevronUp,
    DollarSign,
    FileText,
    MonitorPlay,
    Plus,
    TrendingUp,
    Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { columns, type PrivateClass } from './columns';
import { DataTable } from './data-table';
import { usePermission } from '@/hooks/use-permission';

interface Statistics {
    total: number;
    published: number;
    draft: number;
    archived: number;
    participants: number;
    revenue: number;
}

import { PaginatedData } from '@/types/pagination';

interface Props {
    privateClasses: PaginatedData<PrivateClass>;
    statistics: Statistics;
    flash?: {
        success?: string;
        error?: string;
    };
    filters?: {
        search?: string;
        per_page?: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Private Class',
        href: route('privates.index'),
    },
];

export default function PrivateIndex({ privateClasses, statistics, flash, filters }: Props) {
    const { auth } = usePage<SharedData>().props;
    const { canManage } = usePermission();
    const isAffiliate = auth.role.includes('affiliate');
    const canManagePrivate = canManage('privates') && !isAffiliate;
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
            <Head title="Private Class" />
            <div className="px-4 py-4 md:px-6">
                <div className="mb-6 flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold">Private Class</h1>
                        <p className="text-muted-foreground text-sm">Kelola layanan private class 1-on-1.</p>
                    </div>
                    {canManagePrivate && (
                        <Button asChild className="hover:cursor-pointer">
                            <Link href={route('privates.create')}>
                                Tambah Private Class
                                <Plus />
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
                                    <p className="text-muted-foreground text-xs font-medium">Total Private Class</p>
                                    <h3 className="mt-1 text-xl font-bold">{statistics.total}</h3>
                                    <p className="mt-1 text-xs text-green-600 dark:text-green-400">✓ {statistics.published} published</p>
                                </div>
                                <MonitorPlay className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>

                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-purple-50 to-white p-4 shadow-sm dark:from-purple-950/20">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-muted-foreground text-xs font-medium">Total Pendapatan</p>
                                    <h3 className="mt-1 text-lg font-bold text-purple-600 dark:text-purple-400">
                                        {rupiahFormatter.format(statistics.revenue)}
                                    </h3>
                                    <p className="mt-1 text-xs text-teal-600 dark:text-teal-400">
                                        {statistics.participants} peserta
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
                                    <h4 className="mb-2 font-semibold">Status Private Class</h4>
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Published</span>
                                            <span className="text-xs font-medium text-green-600">{statistics.published}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Draft</span>
                                            <span className="text-xs font-medium text-gray-600">{statistics.draft}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Archived</span>
                                            <span className="text-xs font-medium text-gray-600">{statistics.archived}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ✅ DESKTOP: Overview Stats (4 cards) */}
                    <div className="hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-4">
                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm dark:from-blue-950/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Total Private Class</p>
                                    <h3 className="mt-2 text-2xl font-bold">{statistics.total}</h3>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                                    <MonitorPlay className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                        </div>

                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-green-50 to-white p-4 shadow-sm dark:from-green-950/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Published</p>
                                    <h3 className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">
                                        {statistics.published}
                                    </h3>
                                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{statistics.draft} draft</p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                                    <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                        </div>

                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-purple-50 to-white p-4 shadow-sm dark:from-purple-950/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Total Peserta</p>
                                    <h3 className="mt-2 text-2xl font-bold text-purple-600 dark:text-purple-400">
                                        {statistics.participants}
                                    </h3>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                                    <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                            </div>
                        </div>

                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-orange-50 to-white p-4 shadow-sm dark:from-orange-950/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Total Revenue</p>
                                    <h3 className="mt-2 text-2xl font-bold text-orange-600 dark:text-orange-400">
                                        {rupiahFormatter.format(statistics.revenue)}
                                    </h3>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                                    <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ✅ DESKTOP: Additional Stats */}
                    <div className="hidden gap-4 md:grid md:grid-cols-3">
                        <div className="rounded-lg border p-4 shadow-sm">
                            <div className="mb-3 flex items-center gap-2">
                                <FileText className="text-muted-foreground h-5 w-5" />
                                <h4 className="font-semibold">Status Private Class</h4>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Published</span>
                                    <span className="font-medium text-green-600">{statistics.published}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Draft</span>
                                    <span className="font-medium text-gray-600">{statistics.draft}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Archived</span>
                                    <span className="font-medium text-gray-600">{statistics.archived}</span>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg border p-4 shadow-sm">
                            <div className="mb-3 flex items-center gap-2">
                                <Users className="text-muted-foreground h-5 w-5" />
                                <h4 className="font-semibold">Peserta</h4>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Total Peserta</span>
                                    <span className="font-medium text-purple-600">{statistics.participants}</span>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg border p-4 shadow-sm">
                            <div className="mb-3 flex items-center gap-2">
                                <DollarSign className="text-muted-foreground h-5 w-5" />
                                <h4 className="font-semibold">Revenue</h4>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Total Revenue</span>
                                    <span className="font-medium text-orange-600">{rupiahFormatter.format(statistics.revenue)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <DataTable columns={columns} pagination={privateClasses} filters={filters} />
            </div>
        </AdminLayout>
    );
}
