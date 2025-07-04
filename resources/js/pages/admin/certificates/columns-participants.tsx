'use client';

import { DataTableColumnHeader } from '@/components/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Download } from 'lucide-react';

interface User {
    id: string;
    name: string;
    email: string;
    phone_number?: string;
}

export interface CertificateParticipant {
    id: string;
    certificate_id: string;
    user_id: string;
    certificate_number: number;
    certificate_code: string;
    created_at: string;
    updated_at: string;
    user: User;
}

export const columns: ColumnDef<CertificateParticipant>[] = [
    {
        accessorKey: 'certificate_number',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nomor" />,
        cell: ({ row }) => {
            const formattedNumber = String(row.original.certificate_number).padStart(4, '0');
            return <div className="font-mono text-sm font-medium">{formattedNumber}</div>;
        },
    },
    {
        accessorKey: 'user.name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nama Peserta" />,
        cell: ({ row }) => <div className="font-medium">{row.original.user?.name || '-'}</div>,
    },
    {
        accessorKey: 'user.phone_number',
        header: ({ column }) => <DataTableColumnHeader column={column} title="No. Telepon" />,
        cell: ({ row }) => <div className="text-sm">{row.original.user?.phone_number || '-'}</div>,
    },
    {
        accessorKey: 'certificate_code',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Kode Sertifikat" />,
        cell: ({ row }) => (
            <Badge variant="outline" className="font-mono text-xs">
                {row.original.certificate_code}
            </Badge>
        ),
    },
    {
        accessorKey: 'created_at',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal Diterbitkan" />,
        cell: ({ row }) => <p>{format(new Date(row.original.created_at), 'dd MMM yyyy, HH:mm', { locale: id })}</p>,
    },
    {
        id: 'actions',
        header: () => <div className="text-center">Aksi</div>,
        cell: ({ row }) => {
            const participant = row.original;
            return (
                <div className="flex items-center justify-center gap-1">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm">
                                <Download className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Download Sertifikat</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            );
        },
    },
];
