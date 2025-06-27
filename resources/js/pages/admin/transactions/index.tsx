import AdminLayout from '@/layouts/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { columns, Invoice } from './columns';
import { DataTable } from './data-table';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Transaksi',
        href: 'admin/transactions',
    },
];

interface TransactionProps {
    invoices: Invoice[];
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function Transactions({ invoices, flash }: TransactionProps) {
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
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold">Transaksi</h1>
                        <p className="text-muted-foreground text-sm">Daftar semua transaksi.</p>
                    </div>
                </div>

                <DataTable columns={columns} data={invoices} />
            </div>
        </AdminLayout>
    );
}
