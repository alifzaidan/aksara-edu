import { Button } from '@/components/ui/button';
import AdminLayout from '@/layouts/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { AlertCircle, Calendar, ChevronDown, ChevronUp, Clock, ExternalLink, Image as ImageIcon, Play, Plus, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getColumns, Promotion } from './columns';
import CreatePromotionModal from './create';
import { DataTable } from './data-table';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/admin/dashboard',
    },
    {
        title: 'Flyer Promosi',
        href: '/admin/promotions',
    },
];

interface Statistics {
    overview: {
        total_promotions: number;
        active_promotions: number;
        inactive_promotions: number;
        recent_promotions: number;
    };
    status: {
        running_now: number;
        upcoming: number;
        expired: number;
        upcoming_soon: number;
        expiring_soon: number;
    };
    duration: {
        average_duration: number;
        short_term: number;
        medium_term: number;
        long_term: number;
    };
    redirect: {
        with_redirect: number;
        without_redirect: number;
    };
}

interface PromotionsProps {
    promotions: Promotion[];
    statistics: Statistics;
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function Promotions({ promotions, statistics, flash }: PromotionsProps) {
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [showMoreStats, setShowMoreStats] = useState(false);

    // Generate columns with promotions data
    const columns = getColumns(promotions);

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
            <Head title="Flyer Promosi" />
            <div className="px-4 py-4 md:px-6">
                <div className="mb-6 flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold">Flyer Promosi</h1>
                        <p className="text-muted-foreground text-sm">Kelola dan monitor flyer promosi untuk produk Anda.</p>
                    </div>
                    <Button className="hover:cursor-pointer" onClick={() => setCreateModalOpen(true)}>
                        <Plus />
                        Tambah Flyer
                    </Button>
                </div>

                {/* Statistics Cards */}
                <div className="mb-6 space-y-4">
                    {/* ✅ MOBILE: Compact Overview (2 cards only) */}
                    <div className="grid gap-4 md:hidden">
                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm dark:from-blue-950/20">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-muted-foreground text-xs font-medium">Total Flyer</p>
                                    <h3 className="mt-1 text-xl font-bold">{statistics.overview.total_promotions}</h3>
                                    <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                                        +{statistics.overview.recent_promotions} baru (30 hari)
                                    </p>
                                </div>
                                <ImageIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>

                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-green-50 to-white p-4 shadow-sm dark:from-green-950/20">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-muted-foreground text-xs font-medium">Sedang Berjalan</p>
                                    <h3 className="mt-1 text-xl font-bold text-green-600 dark:text-green-400">{statistics.status.running_now}</h3>
                                    <p className="mt-1 text-xs text-teal-600 dark:text-teal-400">{statistics.status.upcoming} akan datang</p>
                                </div>
                                <Play className="h-8 w-8 text-green-600 dark:text-green-400" />
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
                                    <h4 className="mb-2 font-semibold">Status Flyer</h4>
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Aktif</span>
                                            <span className="text-xs font-medium text-green-600">{statistics.overview.active_promotions}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Nonaktif</span>
                                            <span className="text-xs font-medium text-gray-600">{statistics.overview.inactive_promotions}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Kedaluwarsa</span>
                                            <span className="text-xs font-medium text-orange-600">{statistics.status.expired}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Alerts */}
                                {(statistics.status.upcoming_soon > 0 || statistics.status.expiring_soon > 0) && (
                                    <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm dark:border-orange-900 dark:bg-orange-950/20">
                                        <h4 className="mb-2 flex items-center gap-1 font-semibold text-orange-700 dark:text-orange-400">
                                            <AlertCircle className="h-4 w-4" />
                                            Perhatian
                                        </h4>
                                        <div className="space-y-1">
                                            {statistics.status.upcoming_soon > 0 && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-orange-700 dark:text-orange-300">Mulai dalam 7 hari</span>
                                                    <span className="text-xs font-medium text-orange-700 dark:text-orange-300">
                                                        {statistics.status.upcoming_soon}
                                                    </span>
                                                </div>
                                            )}
                                            {statistics.status.expiring_soon > 0 && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-orange-700 dark:text-orange-300">Berakhir dalam 7 hari</span>
                                                    <span className="text-xs font-medium text-orange-700 dark:text-orange-300">
                                                        {statistics.status.expiring_soon}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Duration */}
                                <div className="rounded-lg border p-3 text-sm">
                                    <h4 className="mb-2 font-semibold">Durasi Kampanye</h4>
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Pendek (≤7 hari)</span>
                                            <span className="text-xs font-medium text-blue-600">{statistics.duration.short_term}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Menengah (8-30 hari)</span>
                                            <span className="text-xs font-medium text-purple-600">{statistics.duration.medium_term}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Panjang (&gt;30 hari)</span>
                                            <span className="text-xs font-medium text-green-600">{statistics.duration.long_term}</span>
                                        </div>
                                        <div className="flex items-center justify-between border-t pt-1">
                                            <span className="text-muted-foreground text-xs font-semibold">Rata-rata</span>
                                            <span className="text-xs font-bold text-orange-600">{statistics.duration.average_duration} hari</span>
                                        </div>
                                    </div>
                                </div>

                                {/* URL Redirect */}
                                <div className="rounded-lg border p-3 text-sm">
                                    <h4 className="mb-2 font-semibold">URL Redirect</h4>
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Dengan Link</span>
                                            <span className="text-xs font-medium text-blue-600">{statistics.redirect.with_redirect}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Tanpa Link</span>
                                            <span className="text-xs font-medium text-gray-600">{statistics.redirect.without_redirect}</span>
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
                                    <p className="text-muted-foreground text-sm font-medium">Total Flyer</p>
                                    <h3 className="mt-2 text-2xl font-bold">{statistics.overview.total_promotions}</h3>
                                    <p className="mt-1 text-xs text-green-600 dark:text-green-400">+{statistics.overview.recent_promotions} baru</p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                                    <ImageIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                        </div>

                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-green-50 to-white p-4 shadow-sm dark:from-green-950/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Sedang Berjalan</p>
                                    <h3 className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">{statistics.status.running_now}</h3>
                                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{statistics.status.upcoming} akan datang</p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                                    <Play className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                        </div>

                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-purple-50 to-white p-4 shadow-sm dark:from-purple-950/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Rata-rata Durasi</p>
                                    <h3 className="mt-2 text-2xl font-bold text-purple-600 dark:text-purple-400">
                                        {statistics.duration.average_duration}
                                    </h3>
                                    <p className="mt-1 text-xs text-purple-600 dark:text-purple-400">hari per kampanye</p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                                    <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                            </div>
                        </div>

                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-orange-50 to-white p-4 shadow-sm dark:from-orange-950/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Dengan Redirect</p>
                                    <h3 className="mt-2 text-2xl font-bold text-orange-600 dark:text-orange-400">
                                        {statistics.redirect.with_redirect}
                                    </h3>
                                    <p className="mt-1 text-xs text-orange-600 dark:text-orange-400">
                                        dari {statistics.overview.total_promotions} flyer
                                    </p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                                    <ExternalLink className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ✅ DESKTOP: Additional Stats (3 cards) */}
                    <div className="hidden gap-4 md:grid md:grid-cols-3">
                        {/* Status Distribution */}
                        <div className="rounded-lg border p-4 shadow-sm">
                            <div className="mb-3 flex items-center gap-2">
                                <TrendingUp className="text-muted-foreground h-5 w-5" />
                                <h4 className="font-semibold">Status Kampanye</h4>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Aktif</span>
                                    <span className="font-medium text-green-600">{statistics.overview.active_promotions}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Akan Datang</span>
                                    <span className="font-medium text-blue-600">{statistics.status.upcoming}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Kedaluwarsa</span>
                                    <span className="font-medium text-orange-600">{statistics.status.expired}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Nonaktif</span>
                                    <span className="font-medium text-gray-600">{statistics.overview.inactive_promotions}</span>
                                </div>
                            </div>
                        </div>

                        {/* Duration Breakdown */}
                        <div className="rounded-lg border p-4 shadow-sm">
                            <div className="mb-3 flex items-center gap-2">
                                <Calendar className="text-muted-foreground h-5 w-5" />
                                <h4 className="font-semibold">Durasi Kampanye</h4>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Pendek (≤7 hari)</span>
                                    <span className="font-medium text-blue-600">{statistics.duration.short_term}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Menengah (8-30 hari)</span>
                                    <span className="font-medium text-purple-600">{statistics.duration.medium_term}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Panjang (&gt;30 hari)</span>
                                    <span className="font-medium text-green-600">{statistics.duration.long_term}</span>
                                </div>
                            </div>
                        </div>

                        {/* Alerts */}
                        {statistics.status.upcoming_soon > 0 || statistics.status.expiring_soon > 0 ? (
                            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 shadow-sm dark:border-orange-900 dark:bg-orange-950/20">
                                <div className="mb-3 flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                    <h4 className="font-semibold text-orange-700 dark:text-orange-400">Perhatian</h4>
                                </div>
                                <div className="space-y-2 text-sm">
                                    {statistics.status.upcoming_soon > 0 && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-orange-700 dark:text-orange-300">Mulai dalam 7 hari</span>
                                            <span className="font-medium text-orange-700 dark:text-orange-300">
                                                {statistics.status.upcoming_soon}
                                            </span>
                                        </div>
                                    )}
                                    {statistics.status.expiring_soon > 0 && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-orange-700 dark:text-orange-300">Berakhir dalam 7 hari</span>
                                            <span className="font-medium text-orange-700 dark:text-orange-300">
                                                {statistics.status.expiring_soon}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-lg border p-4 shadow-sm">
                                <div className="mb-3 flex items-center gap-2">
                                    <ExternalLink className="text-muted-foreground h-5 w-5" />
                                    <h4 className="font-semibold">URL Redirect</h4>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Dengan Link</span>
                                        <span className="font-medium text-blue-600">{statistics.redirect.with_redirect}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Tanpa Link</span>
                                        <span className="font-medium text-gray-600">{statistics.redirect.without_redirect}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Data Table */}
                <DataTable columns={columns} data={promotions} />

                <CreatePromotionModal open={createModalOpen} onOpenChange={setCreateModalOpen} promotions={promotions} />
            </div>
        </AdminLayout>
    );
}
