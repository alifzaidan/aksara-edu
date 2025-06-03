import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import AdminLayout from '@/layouts/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { columns, Instructor } from './columns';
import CreateInstructor from './create';
import { DataTable } from './data-table';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Instruktur',
        href: 'admin/instructors',
    },
];

export default function Instructors({ instructors }: { instructors: Instructor[] }) {
    const [open, setOpen] = useState(false);

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Instruktur" />
            <div className="px-4 py-4 md:px-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold">Instruktur</h1>
                        <p className="text-muted-foreground text-sm">Daftar semua instruktur Aksara Edu.</p>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                Tambah Instruktur
                                <Plus />
                            </Button>
                        </DialogTrigger>
                        <CreateInstructor setOpen={setOpen} />
                    </Dialog>
                </div>
                <DataTable columns={columns} data={instructors} />
            </div>
        </AdminLayout>
    );
}
