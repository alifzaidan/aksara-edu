import { Button } from '@/components/ui/button';
import AdminLayout from '@/layouts/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { PaginatedData } from '@/types/pagination';
import { Head, Link } from '@inertiajs/react';
import {
    ChevronDown,
    ChevronUp,
    KeyRound,
    Plus,
    ShieldAlert,
    ShieldCheck,
    UserCheck,
    Users as UsersIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { columns, Staff } from './columns';
import { DataTable } from './data-table';
import { PermissionGroup } from './permission-selector';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Staff',
        href: 'admin/staff',
    },
];

interface Statistics {
    overview: {
        total_staff: number;
        verified_staff: number;
        unverified_staff: number;
    };
}

interface StaffIndexProps {
    staff: PaginatedData<Staff>;
    statistics: Statistics;
    permission_modules: PermissionGroup[];
    flash?: {
        success?: string;
        error?: string;
    };
    filters?: {
        search?: string;
        per_page?: number;
    };
}

export default function StaffIndex({ staff, statistics, flash, filters }: StaffIndexProps) {
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
            <Head title="Staff" />
            <div className="px-4 py-4 md:px-6">
                <div className="mb-6 flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold">Staff</h1>
                        <p className="text-muted-foreground text-sm">Ringkasan dan daftar semua staff.</p>
                    </div>
                    <Button asChild className="hover:cursor-pointer">
                        <Link href={route('staff.create')}>
                            Tambah Staff
                            <Plus />
                        </Link>
                    </Button>
                </div>

                {/* Statistics Cards */}
                <div className="mb-6 space-y-4">
                    {/* ✅ MOBILE: Compact Overview */}
                    <div className="grid gap-4 md:hidden">
                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm dark:from-blue-950/20">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-muted-foreground text-xs font-medium">Total Staff</p>
                                    <h3 className="mt-1 text-xl font-bold">{statistics.overview.total_staff}</h3>
                                    <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                                        ✓ {statistics.overview.verified_staff} terverifikasi
                                    </p>
                                </div>
                                <UsersIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>

                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-green-50 to-white p-4 shadow-sm dark:from-green-950/20">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-muted-foreground text-xs font-medium">Status Akun</p>
                                    <h3 className="mt-1 text-lg font-bold text-green-600 dark:text-green-400">
                                        {statistics.overview.verified_staff} Aktif
                                    </h3>
                                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                                        {statistics.overview.unverified_staff} belum verifikasi
                                    </p>
                                </div>
                                <ShieldCheck className="h-8 w-8 text-green-600 dark:text-green-400" />
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
                                <div className="rounded-lg border p-3 text-sm">
                                    <h4 className="mb-2 font-semibold">Status Verifikasi Email</h4>
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground">Terverifikasi</span>
                                            <span className="font-medium text-green-600">{statistics.overview.verified_staff}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground">Belum Verifikasi</span>
                                            <span className="font-medium text-amber-600">{statistics.overview.unverified_staff}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ✅ DESKTOP: Stats Cards (3 gradient cards) */}
                    <div className="hidden gap-4 md:grid md:grid-cols-3">
                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm dark:from-blue-950/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Total Staff</p>
                                    <h3 className="mt-2 text-2xl font-bold">{statistics.overview.total_staff}</h3>
                                    <p className="mt-1 text-xs text-muted-foreground">Seluruh akun staff terdaftar</p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                                    <UsersIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                        </div>

                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-green-50 to-white p-4 shadow-sm dark:from-green-950/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Staff Terverifikasi</p>
                                    <h3 className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">
                                        {statistics.overview.verified_staff}
                                    </h3>
                                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                        Email aktif & terverifikasi
                                    </p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                                    <UserCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                        </div>

                        <div className="dark:to-background rounded-lg border bg-gradient-to-br from-amber-50 to-white p-4 shadow-sm dark:from-amber-950/20">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted-foreground text-sm font-medium">Belum Verifikasi</p>
                                    <h3 className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
                                        {statistics.overview.unverified_staff}
                                    </h3>
                                    <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                                        Belum verifikasi email
                                    </p>
                                </div>
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                                    <ShieldAlert className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <DataTable columns={columns} pagination={staff} filters={filters} />
            </div>
        </AdminLayout>
    );
}
