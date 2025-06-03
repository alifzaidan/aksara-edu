import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import AdminLayout from '@/layouts/admin-layout';
import CreateCategory from '@/pages/admin/categories/create';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Category, columns } from './columns';
import { DataTable } from './data-table';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Kategori',
        href: 'admin/categories',
    },
];

export default function Categories({ categories }: { categories: Category[] }) {
    const [open, setOpen] = useState(false);

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Kategori" />
            <div className="px-4 py-4 md:px-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold">Kategori</h1>
                        <p className="text-muted-foreground text-sm">Daftar semua kategori yang tersedia.</p>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                Tambah Kategori
                                <Plus />
                            </Button>
                        </DialogTrigger>
                        <CreateCategory setOpen={setOpen} />
                    </Dialog>
                </div>
                <DataTable columns={columns} data={categories} />
            </div>
        </AdminLayout>
    );
}
