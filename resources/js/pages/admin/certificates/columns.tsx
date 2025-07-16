import DeleteConfirmDialog from '@/components/delete-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Link, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Folder, Trash } from 'lucide-react';

export interface Certificate {
    id: string;
    certificate_number: string;
    title: string;
    description: string;
    header_top: string;
    header_bottom: string;
    issued_date: string;
    period: string;
    design: {
        id: string;
        name: string;
    };
    sign: {
        id: string;
        name: string;
    };
    created_at: string;
    updated_at: string;
}

const CertificateActions = ({ certificate }: { certificate: Certificate }) => {
    const handleDelete = () => {
        router.delete(route('certificates.destroy', certificate.id));
    };

    return (
        <div className="flex items-center justify-center gap-2">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={route('certificates.show', certificate.id)}>
                            <Folder className="size-4" />
                        </Link>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Lihat Detail</p>
                </TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <div>
                        <DeleteConfirmDialog
                            trigger={
                                <Button variant="link" size="icon" className="size-8 text-red-500 hover:cursor-pointer">
                                    <Trash />
                                    <span className="sr-only">Hapus Sertifikat</span>
                                </Button>
                            }
                            title="Apakah Anda yakin ingin menghapus sertifikat ini?"
                            itemName={certificate.title}
                            onConfirm={handleDelete}
                        />
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Hapus Sertifikat</p>
                </TooltipContent>
            </Tooltip>
        </div>
    );
};

export const columns: ColumnDef<Certificate>[] = [
    {
        accessorKey: 'certificate_number',
        header: 'Nomor Sertifikat',
        cell: ({ row }) => {
            return <span className="font-mono text-sm">{row.getValue('certificate_number')}</span>;
        },
    },
    {
        accessorKey: 'title',
        header: 'Judul',
        cell: ({ row }) => {
            return (
                <Link href={route('certificates.show', row.original.id)} className="text-primary font-medium hover:underline">
                    {row.original.title}
                </Link>
            );
        },
    },
    {
        accessorKey: 'design',
        header: 'Desain',
        cell: ({ row }) => {
            const design = row.getValue('design') as Certificate['design'];
            return <Badge variant="secondary">{design?.name}</Badge>;
        },
    },
    {
        accessorKey: 'sign',
        header: 'Tanda Tangan',
        cell: ({ row }) => {
            const sign = row.getValue('sign') as Certificate['sign'];
            return <Badge variant="outline">{sign?.name}</Badge>;
        },
    },
    {
        accessorKey: 'issued_date',
        header: 'Tanggal Terbit',
        cell: ({ row }) => <p>{format(new Date(row.getValue('issued_date')), 'dd MMM yyyy', { locale: id })}</p>,
    },
    {
        id: 'actions',
        header: () => <div className="text-center">Aksi</div>,
        cell: ({ row }) => <CertificateActions certificate={row.original} />,
    },
];
