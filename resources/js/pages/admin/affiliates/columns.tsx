'use client';

import { DataTableColumnHeader } from '@/components/data-table-column-header';
import DeleteConfirmDialog from '@/components/delete-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { rupiahFormatter } from '@/lib/utils';
import { Link, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { CirclePower, Folder, Trash } from 'lucide-react';

export default function AffiliateActions({ affiliate }: { affiliate: Affiliate }) {
    const handleDelete = () => {
        router.delete(route('affiliates.destroy', affiliate.id));
    };

    return (
        <div className="flex items-center justify-center gap-2">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="link"
                        size="icon"
                        className={`${affiliate.affiliate_status === 'Active' ? 'text-red-500' : 'text-green-500'} size-8 hover:cursor-pointer`}
                        asChild
                    >
                        <Link method="post" href={route('affiliates.toggleStatus', affiliate.id)}>
                            <CirclePower />
                            <span className="sr-only">{affiliate.affiliate_status === 'Active' ? 'Non Aktifkan Afiliasi' : 'Aktifkan Afiliasi'}</span>
                        </Link>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{affiliate.affiliate_status === 'Active' ? 'Non Aktifkan Afiliasi' : 'Aktifkan Afiliasi'}</p>
                </TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="link" size="icon" className="size-8" asChild>
                        <Link href={route('affiliates.show', affiliate.id)}>
                            <Folder />
                            <span className="sr-only">Detail Afiliasi</span>
                        </Link>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Lihat Afiliasi</p>
                </TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div>
                        <DeleteConfirmDialog
                            trigger={
                                <Button variant="link" size="icon" className="size-8 text-red-500 hover:cursor-pointer">
                                    <Trash />
                                    <span className="sr-only">Hapus Afiliasi</span>
                                </Button>
                            }
                            title="Apakah Anda yakin ingin menghapus afiliasi ini?"
                            itemName={affiliate.name}
                            onConfirm={handleDelete}
                        />
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Hapus Afiliasi</p>
                </TooltipContent>
            </Tooltip>
        </div>
    );
}

export type Affiliate = {
    id: string;
    name: string;
    email: string;
    phone_number: string;
    affiliate_code: string;
    affiliate_status: string;
    commission: number;
    created_at: string;
    total_earnings: number;
};

export const columns: ColumnDef<Affiliate>[] = [
    {
        id: 'select',
        header: ({ table }) => (
            <Checkbox
                checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Select row" />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: 'no',
        header: 'No',
        cell: ({ row }) => {
            const index = row.index + 1;

            return <div className="font-medium">{index}</div>;
        },
    },
    {
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nama Afiliasi" />,
        cell: ({ row }) => {
            return (
                <Link href={route('affiliates.show', row.original.id)} className="text-primary font-medium hover:underline">
                    {row.original.name}
                </Link>
            );
        },
    },
    {
        accessorKey: 'phone_number',
        header: ({ column }) => <DataTableColumnHeader column={column} title="No. Telepon" />,
    },
    {
        accessorKey: 'affiliate_code',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Kode Afiliasi" />,
    },
    {
        accessorKey: 'affiliate_status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status Afiliasi" />,
        cell: ({ row }) => <Badge>{row.original.affiliate_status}</Badge>,
    },
    {
        accessorKey: 'commission',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Komisi" />,
        cell: ({ row }) => <p>{row.original.commission ? `${row.original.commission} %` : '-'}</p>,
    },
    {
        accessorKey: 'total_earnings',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Total Pendapatan" />,
        cell: ({ row }) => {
            const totalEarnings = row.original.total_earnings || 0;
            return <div className="font-medium text-green-600">{rupiahFormatter.format(totalEarnings)}</div>;
        },
    },
    {
        accessorKey: 'created_at',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal Bergabung" />,
        cell: ({ row }) => <p>{row.original.created_at ? format(new Date(row.original.created_at), 'dd MMMM yyyy', { locale: id }) : '-'}</p>,
    },
    {
        id: 'actions',
        header: () => <div className="text-center">Aksi</div>,
        cell: ({ row }) => <AffiliateActions affiliate={row.original} />,
    },
];
