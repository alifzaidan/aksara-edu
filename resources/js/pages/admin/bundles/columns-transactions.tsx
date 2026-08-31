'use client';

import { DataTableColumnHeader } from '@/components/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import InstallmentMonitorModal, { InstallmentTermItem } from '@/components/admin/installment-monitor-modal';
import { Clock, FileText } from 'lucide-react';

interface User {
    id: string;
    name: string;
    phone_number: string | null;
    email?: string | null;
}

export interface BundleTransactionInvoice {
    id: string;
    user: User;
    referrer: { id: string; name: string } | null;
    invoice_code: string;
    invoice_url: string | null;
    amount: number;
    status: 'paid' | 'pending' | 'expired' | 'failed' | 'completed' | 'installment_pending';
    is_installment?: boolean;
    access_suspended_at?: string | null;
    paid_at: string | null;
    created_at: string;
    installment_terms?: InstallmentTermItem[];
    installmentTerms?: InstallmentTermItem[];
}

import { usePermission } from '@/hooks/use-permission';
import { Row } from '@tanstack/react-table';

function PriceCell({ row }: { row: Row<BundleTransactionInvoice> }) {
    const { roles, isAdmin } = usePermission();
    const isStaff = roles.includes('staff') && !isAdmin;

    if (isStaff) {
        return <div className="font-medium text-muted-foreground">Rp ***</div>;
    }

    const formatted = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(row.original.amount);
    return <div className="font-medium">{formatted}</div>;
}

function ActionCell({ row }: { row: Row<BundleTransactionInvoice> }) {
    const { roles, isAdmin } = usePermission();
    const isStaff = roles.includes('staff') && !isAdmin;
    const invoice = row.original;
    const terms = invoice.installment_terms || invoice.installmentTerms || [];
    const isInstallment = invoice.is_installment || invoice.status === 'installment_pending' || terms.length > 0;

    return (
        <div className="flex items-center justify-center gap-1">
            {invoice.status === 'paid' && !isStaff && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8" asChild>
                            <a href={route('invoice.pdf', { id: invoice.id })} target="_blank" rel="noopener noreferrer">
                                <FileText className="size-4" />
                            </a>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Lihat Invoice</p>
                    </TooltipContent>
                </Tooltip>
            )}

            {isInstallment && (
                <InstallmentMonitorModal
                    invoice={invoice as any}
                    trigger={
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8 text-primary hover:text-primary hover:bg-primary/10">
                                    <Clock className="size-4" />
                                    <span className="sr-only">Monitor Cicilan & Reminder WA</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Monitor Cicilan & Reminder WA</p>
                            </TooltipContent>
                        </Tooltip>
                    }
                />
            )}
        </div>
    );
}

export const columns: ColumnDef<BundleTransactionInvoice>[] = [
    {
        id: 'user_name',
        accessorFn: (row) => row.user?.name ?? '',
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
        cell: ({ row }) => <PriceCell row={row} />,
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
            const invoice = row.original;
            const terms = invoice.installment_terms || invoice.installmentTerms || [];
            const isInstallment = invoice.is_installment || invoice.status === 'installment_pending' || terms.length > 0;

            if (isInstallment) {
                const paidCount = terms.filter((t) => t.status === 'paid').length;
                const totalCount = terms.length;
                const isFullyPaid = totalCount > 0 && paidCount === totalCount;
                const isSuspended = !!invoice.access_suspended_at;

                return (
                    <div className="flex flex-col gap-1 items-start">
                        {isFullyPaid ? (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
                                Cicilan Lunas
                            </Badge>
                        ) : isSuspended ? (
                            <Badge variant="destructive">
                                Akses Dibekukan
                            </Badge>
                        ) : (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-300">
                                Cicilan ({paidCount}/{totalCount || '?'})
                            </Badge>
                        )}
                    </div>
                );
            }

            const status = invoice.status;
            const statusText = status.charAt(0).toUpperCase() + status.slice(1);
            const statusClasses = {
                paid: 'bg-green-100 text-green-800',
                completed: 'bg-green-100 text-green-800',
                pending: 'bg-yellow-100 text-yellow-800',
                failed: 'bg-red-100 text-red-800',
                expired: 'bg-gray-100 text-gray-800',
                installment_pending: 'bg-amber-100 text-amber-800',
            };
            return <Badge className={`${statusClasses[status] || statusClasses.expired}`}>{statusText}</Badge>;
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
        cell: ({ row }) => (
            <p>
                {row.original.paid_at
                    ? format(new Date(row.original.paid_at), 'dd MMM yyyy, HH:mm', { locale: id })
                    : '-'}
            </p>
        ),
    },
    {
        id: 'actions',
        header: () => <div className="text-center">Aksi</div>,
        cell: ({ row }) => <ActionCell row={row} />,
    },
];