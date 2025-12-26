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
    course?: { id: string; title: string };
    bootcamp?: { id: string; title: string };
    webinar?: { id: string; title: string };
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
        id: 'program',
        header: 'Program',
        cell: ({ row }) => {
            const certificate = row.original as Certificate;
            if (certificate.course) {
                return (
                    <Link
                        href={route('courses.show', certificate.course.id)}
                        className="text-blue-600 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {certificate.course.title} <span className="text-xs text-gray-500">(Kelas Online)</span>
                    </Link>
                );
            }
            if (certificate.bootcamp) {
                return (
                    <Link
                        href={route('bootcamps.show', certificate.bootcamp.id)}
                        className="text-green-600 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {certificate.bootcamp.title} <span className="text-xs text-gray-500">(Bootcamp)</span>
                    </Link>
                );
            }
            if (certificate.webinar) {
                return (
                    <Link
                        href={route('webinars.show', certificate.webinar.id)}
                        className="text-purple-600 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {certificate.webinar.title} <span className="text-xs text-gray-500">(Webinar)</span>
                    </Link>
                );
            }
            return <span className="text-gray-400 italic">-</span>;
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
