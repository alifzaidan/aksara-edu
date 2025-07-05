import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import AdminLayout from '@/layouts/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CertificateDesign, columns } from './columns';
import CreateDesign from './create';
import { DataTable } from './data-table';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Sertifikat',
        href: 'certificates',
    },
    {
        title: 'Desain Sertifikat',
        href: 'certificate-designs',
    },
];

interface CertificateDesignProps {
    designs: CertificateDesign[];
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function CertificateDesigns({ designs, flash }: CertificateDesignProps) {
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
            <Head title="Desain Sertifikat" />
            <div className="px-4 py-4 md:px-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold">Desain Sertifikat</h1>
                        <p className="text-muted-foreground text-sm">Daftar semua desain sertifikat.</p>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="hover:cursor-pointer">
                                Tambah Desain
                                <Plus />
                            </Button>
                        </DialogTrigger>
                        <CreateDesign setOpen={setOpen} />
                    </Dialog>
                </div>

                <DataTable columns={columns} data={designs} />
            </div>
        </AdminLayout>
    );
}
