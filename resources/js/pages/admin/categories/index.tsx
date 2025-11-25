import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import AdminLayout from '@/layouts/admin-layout';
import CreateCategory from '@/pages/admin/categories/create';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Layers, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Category, columns } from './columns';
import { DataTable } from './data-table';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Kategori',
        href: 'admin/categories',
    },
];

interface Statistics {
    total_categories: number;
}

interface CategoriesProps {
    categories: Category[];
    statistics: Statistics;
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function Categories({ categories, statistics, flash }: CategoriesProps) {
    const [open, setOpen] = useState(false);

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
            <Head title="Kategori" />
            <div className="px-4 py-4 md:px-6">
                <div className="mb-6 flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold">Kategori</h1>
                        <p className="text-muted-foreground text-sm">Daftar semua kategori yang tersedia.</p>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="hover:cursor-pointer">
                                Tambah Kategori
                                <Plus />
                            </Button>
                        </DialogTrigger>
                        <CreateCategory setOpen={setOpen} />
                    </Dialog>
                </div>

                <div className="mb-6">
                    <div className="dark:to-background rounded-lg border bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm dark:from-blue-950/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">Total Kategori</p>
                                <h3 className="mt-2 text-2xl font-bold">{statistics.total_categories}</h3>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                                <Layers className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </div>
                </div>

                <DataTable columns={columns} data={categories} />
            </div>
        </AdminLayout>
    );
}
