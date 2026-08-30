import AdminLayout from '@/layouts/admin-layout';
import { SharedData, type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Earning, getColumns } from './columns';
import { DataTable } from './data-table';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Pendapatan',
        href: 'admin/affiliate-earnings',
    },
];

import { PaginatedData } from '@/types/pagination';

interface AffiliateEarningProps {
    earnings: PaginatedData<Earning>;
    flash?: {
        success?: string;
        error?: string;
    };
    filters?: {
        search?: string;
        start_date?: string;
        end_date?: string;
        per_page?: number;
    };
}

import { usePermission } from '@/hooks/use-permission';

export default function AffiliateEarnings({ earnings, flash, filters }: AffiliateEarningProps) {
    const { auth } = usePage<SharedData>().props;
    const { canManage, roles, isAdmin } = usePermission();
    const isStaff = (roles?.includes('staff') || auth?.role?.includes('staff')) && !isAdmin && !auth?.role?.includes('admin');
    const canManageEarnings = canManage('earnings');
    const columns = getColumns(canManageEarnings, isStaff);

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
            <Head title="Pendapatan" />
            <div className="px-4 py-4 md:px-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold">Pendapatan</h1>
                        <p className="text-muted-foreground text-sm">Daftar semua pendapatan.</p>
                    </div>
                </div>

                <DataTable columns={columns} pagination={earnings} filters={filters} />
            </div>
        </AdminLayout>
    );
}
