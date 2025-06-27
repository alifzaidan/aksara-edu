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

interface AffiliateEarningProps {
    earnings: Earning[];
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function AffiliateEarnings({ earnings, flash }: AffiliateEarningProps) {
    const { auth } = usePage<SharedData>().props;
    const role = auth.role[0];
    const isAdmin = role === 'admin';
    const columns = getColumns(isAdmin);

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

                <DataTable columns={columns} data={earnings} />
            </div>
        </AdminLayout>
    );
}
