'use client';

import { DataTableColumnHeader } from '@/components/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { FileText } from 'lucide-react';

interface User {
    id: string;
    name: string;
    phone_number: string | null;
}

export interface Invoice {
    id: string;
    user: User;
    referrer: { id: string; name: string } | null;
    invoice_code: string;
    invoice_url: string | null;
    amount: number;
    status: 'paid' | 'pending' | 'failed';
    paid_at: string | null;
    created_at: string;
    certification_program_items?: {
        id: string;
        certification_program_id: string;
    }[];
}

export const transactionColumns: ColumnDef<Invoice>[] = [
    {
        accessorKey: 'user.name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nama Pembeli" />,
        cell: ({ row }) => <div className="font-medium">{row.original.user?.name || '-'}</div>,
    },
    {
        accessorKey: 'invoice_code',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Kode Invoice" />,
    },
    {
        accessorKey: 'amount',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Harga" />,
        cell: ({ row }) => {
            const formatted = new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
            }).format(row.original.amount);
            return <div className="font-medium">{formatted}</div>;
        },
    },
    {
        accessorKey: 'referrer.name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Afiliasi" />,
        cell: ({ row }) => <p>{row.original.referrer?.name || '-'}</p>,
    },
    {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => {
            const status = row.original.status;
            const statusText = status.charAt(0).toUpperCase() + status.slice(1);
            const statusClasses = {
                paid: 'bg-green-100 text-green-800',
                pending: 'bg-yellow-100 text-yellow-800',
                failed: 'bg-red-100 text-red-800',
            };
            return <Badge className={`${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>{statusText}</Badge>;
        },
    },
    {
        accessorKey: 'created_at',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tgl. Pembelian" />,
        cell: ({ row }) => <p>{format(new Date(row.original.created_at), 'dd MMM yyyy, HH:mm', { locale: id })}</p>,
    },
        {
        accessorKey: 'paid_at',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tgl. Pembayaran" />,
        cell: ({ row }) => <p>{format(new Date(row.original.paid_at ? row.original.paid_at : new Date()), 'dd MMM yyyy, HH:mm', { locale: id })}</p>,
    },
    {
        id: 'actions',
        header: () => <div className="text-center">Aksi</div>,
        cell: ({ row }) => {
            const invoice = row.original;

            return (
                <div className="flex items-center justify-center gap-1">
                    {invoice.status === 'paid' && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" asChild>
                                    <a href={route('invoice.pdf', { id: invoice.id })} target="_blank" rel="noopener noreferrer">
                                        <FileText className="h-4 w-4" />
                                    </a>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Lihat Invoice</p>
                            </TooltipContent>
                        </Tooltip>
                    )}
                </div>
            );
        },
    },
];
