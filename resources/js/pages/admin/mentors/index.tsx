import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import AdminLayout from '@/layouts/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { columns, Mentor } from './columns';
import CreateMentor from './create';
import { DataTable } from './data-table';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Mentor',
        href: 'admin/mentors',
    },
];

interface MentorProps {
    mentors: Mentor[];
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function Mentors({ mentors, flash }: MentorProps) {
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
            <Head title="Mentor" />
            <div className="px-4 py-4 md:px-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold">Mentor</h1>
                        <p className="text-muted-foreground text-sm">Daftar semua mentor.</p>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="hover:cursor-pointer">
                                Tambah Mentor
                                <Plus />
                            </Button>
                        </DialogTrigger>
                        <CreateMentor setOpen={setOpen} />
                    </Dialog>
                </div>
                <DataTable columns={columns} data={mentors} />
            </div>
        </AdminLayout>
    );
}
