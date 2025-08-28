import { Button } from '@/components/ui/button';
import AdminLayout from '@/layouts/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useEffect } from 'react';
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

interface DiscountCodesProps {
    discountCodes: DiscountCode[];
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function DiscountCodes({ discountCodes, flash }: DiscountCodesProps) {
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
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold">Kode Diskon</h1>
                        <p className="text-muted-foreground text-sm">Kelola kode diskon untuk produk Anda.</p>
                    </div>
                    <Button className="hover:cursor-pointer" asChild>
                        <Link href={route('discount-codes.create')}>
                            Tambah Kode Diskon
                            <Plus />
                        </Link>
                    </Button>
                </div>
                <DataTable columns={columns} data={discountCodes} />
            </div>
        </AdminLayout>
    );
}
