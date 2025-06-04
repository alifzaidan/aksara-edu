import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import AdminLayout from '@/layouts/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { columns, Tool } from './columns';
import CreateTool from './create';
import { DataTable } from './data-table';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Tools',
        href: 'admin/tools',
    },
];

export default function Tools({ tools }: { tools: Tool[] }) {
    const [open, setOpen] = useState(false);

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Tools" />
            <div className="px-4 py-4 md:px-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold">Tools</h1>
                        <p className="text-muted-foreground text-sm">Daftar semua tools yang tersedia.</p>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="hover:cursor-pointer">
                                Tambah Tool
                                <Plus />
                            </Button>
                        </DialogTrigger>
                        <CreateTool setOpen={setOpen} />
                    </Dialog>
                </div>
                <DataTable columns={columns} data={tools} />
            </div>
        </AdminLayout>
    );
}
