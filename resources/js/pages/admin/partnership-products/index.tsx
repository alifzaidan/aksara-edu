import { Button } from '@/components/ui/button';
import AdminLayout from '@/layouts/admin-layout';
import { SharedData, type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { columns, PartnershipProduct } from './columns';
import { DataTable } from './data-table';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Sertifikasi Kerjasama',
        href: 'admin/partnership-products',
    },
];

interface PartnershipProductsProps {
    products: PartnershipProduct[];
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function PartnershipProducts({ products, flash }: PartnershipProductsProps) {
    const { auth } = usePage<SharedData>().props;
    const isAffiliate = auth.role.includes('affiliate');

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
            <Head title="Sertifikasi Kerjasama" />
            <div className="px-4 py-4 md:px-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold">Sertifikasi Kerjasama</h1>
                        <p className="text-muted-foreground text-sm">Kelola produk kerjasama dari partner eksternal.</p>
                    </div>
                    {!isAffiliate && (
                        <Button asChild className="hover:cursor-pointer">
                            <Link href={route('partnership-products.create')}>
                                <Plus />
                                Tambah Produk
                            </Link>
                        </Button>
                    )}
                </div>
                <DataTable columns={columns} data={products} />
            </div>
        </AdminLayout>
    );
}
