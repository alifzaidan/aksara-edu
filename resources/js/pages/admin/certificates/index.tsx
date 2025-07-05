import { Button } from '@/components/ui/button';
import AdminLayout from '@/layouts/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Palette, PencilLine, Plus } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Certificate, columns } from './columns';
import { DataTable } from './data-table';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Sertifikat',
        href: 'admin/certificates',
    },
];

interface CertificateProps {
    certificates: Certificate[];
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function Certificates({ certificates, flash }: CertificateProps) {
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
            <Head title="Sertifikat" />
            <div className="px-4 py-4 md:px-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold">Sertifikat</h1>
                        <p className="text-muted-foreground text-sm">Daftar semua sertifikat.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href={route('certificate-designs.index')}>
                                <Palette className="h-4 w-4" />
                                Kelola Desain
                            </Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href={route('certificate-signs.index')}>
                                <PencilLine className="h-4 w-4" />
                                Kelola Tanda Tangan
                            </Link>
                        </Button>
                        <Button asChild>
                            <Link href={route('certificates.create')}>
                                Tambah Sertifikat
                                <Plus className="h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </div>
                <DataTable columns={columns} data={certificates} />
            </div>
        </AdminLayout>
    );
}
