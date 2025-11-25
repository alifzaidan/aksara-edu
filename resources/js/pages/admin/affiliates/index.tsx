import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import AdminLayout from '@/layouts/admin-layout';
import { rupiahFormatter } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { CheckCircle, ChevronDown, ChevronUp, DollarSign, Plus, UserCheck, Users as UsersIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Affiliate, columns } from './columns';
import CreateMentor from './create';
import { DataTable } from './data-table';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Affiliate',
        href: 'admin/affiliates',
    },
];

interface Statistics {
    overview: {
        total_affiliates: number;
        active_affiliates: number;
        inactive_affiliates: number;
    };
    earnings: {
        total_earnings: number;
        paid_commission: number;
        pending_commission: number;
        total_transactions: number;
    };
}

interface AffiliateProps {
    affiliates: Affiliate[];
    statistics: Statistics;
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function Affiliates({ affiliates, statistics, flash }: AffiliateProps) {
    const [open, setOpen] = useState(false);
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
            <Head title="Afiliasi" />
            <div className="px-4 py-4 md:px-6">
                <div className="mb-6 flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold">Afiliasi</h1>
                        <p className="text-muted-foreground text-sm">Ringkasan dan daftar semua afiliasi.</p>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="hover:cursor-pointer">
                                Tambah Afiliasi
                                <Plus />
                            </Button>
                        </DialogTrigger>
                        <CreateMentor setOpen={setOpen} />
                    </Dialog>
                </div>

                {/* Statistics Cards */}
                <div className="mb-6 space-y-4">
                    {/* ✅ MOBILE: Compact Overview (2 cards only) */}
                    <div className="grid gap-4 md:hidden">
                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm dark:from-blue-950/20">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-muted-foreground text-xs font-medium">Total Afiliasi</p>
                                    <h3 className="mt-1 text-xl font-bold">{statistics.overview.total_affiliates}</h3>
                                    <p className="mt-1 text-xs text-green-600 dark:text-green-400">✓ {statistics.overview.active_affiliates} aktif</p>
                                </div>
                                <UsersIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>

                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-purple-50 to-white p-4 shadow-sm dark:from-purple-950/20">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-muted-foreground text-xs font-medium">Total Komisi</p>
                                    <h3 className="mt-1 text-lg font-bold text-purple-600 dark:text-purple-400">
                                        {rupiahFormatter.format(statistics.earnings.total_earnings)}
                                    </h3>
                                    <p className="mt-1 text-xs text-teal-600 dark:text-teal-400">
                                        {statistics.earnings.total_transactions} transaksi
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
                                {/* Status */}
                                <div className="rounded-lg border p-3 text-sm">
                                    <h4 className="mb-2 font-semibold">Status Afiliasi</h4>
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground text-xs">Tidak Aktif</span>
                                            <span className="text-xs font-medium text-gray-600">{statistics.overview.inactive_affiliates}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Commission */}
                                <div className="rounded-lg border p-3 text-sm">
                                    <h4 className="mb-2 text-xs font-semibold">Detail Komisi</h4>
                                    <div className="space-y-1 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Sudah Dibayar</span>
                                            <span className="font-medium text-green-600">
                                                {rupiahFormatter.format(statistics.earnings.paid_commission)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Pending</span>
                                            <span className="font-medium text-yellow-600">
                                                {rupiahFormatter.format(statistics.earnings.pending_commission)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ✅ DESKTOP: Simple Stats (4 cards) */}
                    <div className="hidden gap-4 md:grid md:grid-cols-2 lg:grid-cols-4">
                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm dark:from-blue-950/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Total Afiliasi</p>
                                    <h3 className="mt-2 text-2xl font-bold">{statistics.overview.total_affiliates}</h3>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                                    <UsersIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                        </div>

                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-green-50 to-white p-4 shadow-sm dark:from-green-950/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Afiliasi Aktif</p>
                                    <h3 className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">
                                        {statistics.overview.active_affiliates}
                                    </h3>
                                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                        {statistics.overview.inactive_affiliates} tidak aktif
                                    </p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                                    <UserCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                        </div>

                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-purple-50 to-white p-4 shadow-sm dark:from-purple-950/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Total Komisi</p>
                                    <h3 className="mt-2 text-2xl font-bold text-purple-600 dark:text-purple-400">
                                        {rupiahFormatter.format(statistics.earnings.total_earnings)}
                                    </h3>
                                    <p className="mt-1 text-xs text-purple-600 dark:text-purple-400">
                                        {statistics.earnings.total_transactions} transaksi
                                    </p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                                    <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                            </div>
                        </div>

                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-yellow-50 to-white p-4 shadow-sm dark:from-yellow-950/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Komisi Pending</p>
                                    <h3 className="mt-2 text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                                        {rupiahFormatter.format(statistics.earnings.pending_commission)}
                                    </h3>
                                    <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                                        {rupiahFormatter.format(statistics.earnings.paid_commission)} sudah dibayar
                                    </p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                                    <CheckCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <DataTable columns={columns} data={affiliates} />
            </div>
        </AdminLayout>
    );
}
