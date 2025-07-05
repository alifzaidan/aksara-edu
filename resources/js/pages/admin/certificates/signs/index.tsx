import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import AdminLayout from '@/layouts/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CertificateSign, columns } from './columns';
import CreateSign from './create';
import { DataTable } from './data-table';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Sertifikat',
        href: 'certificates',
    },
    {
        title: 'Tanda Tangan',
        href: 'certificate-signs',
    },
];

interface CertificateSignProps {
    signs: CertificateSign[];
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function CertificateSigns({ signs, flash }: CertificateSignProps) {
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
            <Head title="Tanda Tangan Sertifikat" />
            <div className="px-4 py-4 md:px-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold">Tanda Tangan Sertifikat</h1>
                        <p className="text-muted-foreground text-sm">Daftar semua tanda tangan sertifikat.</p>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="hover:cursor-pointer">
                                Tambah Tanda Tangan
                                <Plus />
                            </Button>
                        </DialogTrigger>
                        <CreateSign setOpen={setOpen} />
                    </Dialog>
                </div>

                <DataTable columns={columns} data={signs} />
            </div>
        </AdminLayout>
    );
}
