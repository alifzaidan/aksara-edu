import { Button } from '@/components/ui/button';
import AdminLayout from '@/layouts/admin-layout';
import { SharedData, type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Bundle, columns } from './columns';
import { DataTable } from './data-table';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Paket Bundling',
        href: route('bundles.index'),
    },
];

interface BundlesProps {
    bundles: Bundle[];
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function Bundles({ bundles, flash }: BundlesProps) {
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
            <Head title="Paket Bundling" />
            <div className="px-4 py-4 md:px-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold">Paket Bundling</h1>
                        <p className="text-muted-foreground text-sm">
                            Kelola paket bundling yang berisi kombinasi kelas online, bootcamp, dan webinar.
                        </p>
                    </div>
                    {!isAffiliate && (
                        <Button asChild className="hover:cursor-pointer">
                            <Link href={route('bundles.create')}>
                                <Plus />
                                Tambah Paket Bundling
                            </Link>
                        </Button>
                    )}
                </div>
                <DataTable columns={columns} data={bundles} />
            </div>
        </AdminLayout>
    );
}
