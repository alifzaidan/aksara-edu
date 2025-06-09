import { Button } from '@/components/ui/button';
import AdminLayout from '@/layouts/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Bootcamp, columns } from './columns';
import { DataTable } from './data-table';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Bootcamp',
        href: 'admin/bootcamps',
    },
];

interface BootcampProps {
    bootcamps: Bootcamp[];
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function Bootcamps({ bootcamps, flash }: BootcampProps) {
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
            <Head title="Webinar" />
            <div className="px-4 py-4 md:px-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold">Bootcamp</h1>
                        <p className="text-muted-foreground text-sm">Daftar semua bootcamp.</p>
                    </div>
                    <Button asChild className="hover:cursor-pointer">
                        <Link href={route('bootcamps.create')}>
                            Tambah Bootcamp
                            <Plus />
                        </Link>
                    </Button>
                </div>
                <DataTable columns={columns} data={bootcamps} />
            </div>
        </AdminLayout>
    );
}
