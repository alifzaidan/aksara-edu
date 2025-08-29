import { Button } from '@/components/ui/button';
import AdminLayout from '@/layouts/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { columns, Promotion } from './columns';
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

interface PromotionsProps {
    promotions: Promotion[];
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function Promotions({ promotions, flash }: any) {
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
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold">Flyer Promosi</h1>
                        <p className="text-muted-foreground text-sm">Kelola flyer promosi untuk produk Anda.</p>
                    </div>
                    <Button className="hover:cursor-pointer" asChild>
                        <Link href={route('promotions.create')}>
                            Tambah Flyer
                            <Plus />
                        </Link>
                    </Button>
                </div>
                <DataTable columns={columns} data={promotions} />
            </div>
        </AdminLayout>
    );
}