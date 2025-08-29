'use client';

import { DataTableColumnHeader } from '@/components/data-table-column-header';
import DeleteConfirmDialog from '@/components/delete-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Link, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Calendar, Edit, Folder, Trash, Users } from 'lucide-react';

export type DiscountCode = {
    id: string;
    code: string;
    name: string;
    description: string | null;
    type: 'percentage' | 'fixed';
    value: number;
    formatted_value: string;
    minimum_amount: number | null;
    maximum_discount: number | null;
    usage_limit: number | null;
    usage_limit_per_user: number | null;
    used_count: number;
    usages_count: number;
    starts_at: string;
    expires_at: string;
    is_active: boolean;
    is_valid: boolean;
    applicable_types: string[] | null;
    applicable_ids: string[] | null;
    created_at: string;
};

const formatCurrency = (amount: number | null) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
};

const getStatusBadge = (discountCode: DiscountCode) => {
    if (!discountCode.is_active) {
        return <Badge variant="destructive">Nonaktif</Badge>;
    }

    if (!discountCode.is_valid) {
        return <Badge variant="secondary">Kedaluwarsa</Badge>;
    }

    const now = new Date();
    const startsAt = new Date(discountCode.starts_at);

    if (startsAt > now) {
        return <Badge variant="outline">Belum Dimulai</Badge>;
    }

    return (
        <Badge variant="default" className="bg-green-600">
            Aktif
        </Badge>
    );
};

const getTypeBadge = (type: 'percentage' | 'fixed') => {
    return type === 'percentage' ? (
        <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
            Persentase
        </Badge>
    ) : (
        <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
            Nominal
        </Badge>
    );
};

function DiscountCodeActions({ discountCode }: { discountCode: DiscountCode }) {
    const handleDelete = () => {
        router.delete(route('discount-codes.destroy', discountCode.id));
    };

    return (
        <div className="flex items-center justify-center gap-1">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={route('discount-codes.show', discountCode.id)}>
                            <Folder className="size-4" />
                        </Link>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Detail Kode Diskon</p>
                </TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={route('discount-codes.edit', discountCode.id)}>
                            <Edit className="size-4" />
                        </Link>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Edit Kode Diskon</p>
                </TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <div>
                        <DeleteConfirmDialog
                            trigger={
                                <Button variant="link" size="icon" className="size-8 text-red-500 hover:cursor-pointer">
                                    <Trash />
                                    <span className="sr-only">Hapus Kode Diskon</span>
                                </Button>
                            }
                            title="Apakah Anda yakin ingin menghapus kode diskon ini?"
                            itemName={discountCode.code}
                            onConfirm={handleDelete}
                        />
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Hapus Kode Diskon</p>
                </TooltipContent>
            </Tooltip>
        </div>
    );
}

export const columns: ColumnDef<DiscountCode>[] = [
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
        accessorKey: 'code',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Kode" />,
        cell: ({ row }) => {
            return (
                <Link href={route('discount-codes.show', row.original.id)} className="text-primary font-medium hover:underline">
                    <Badge className="bg-blue-50 font-mono text-base font-bold text-blue-600">{row.original.code}</Badge>
                </Link>
            );
        },
    },
    {
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nama" />,
        cell: ({ row }) => {
            return (
                <div>
                    <div className="font-medium">{row.original.name}</div>
                    {row.original.description && <div className="text-muted-foreground text-sm">{row.original.description}</div>}
                </div>
            );
        },
    },
    {
        accessorKey: 'type',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Jenis" />,
        cell: ({ row }) => {
            return (
                <div className="flex flex-col gap-1">
                    {getTypeBadge(row.original.type)}
                    <div className="text-lg font-semibold">{row.original.formatted_value}</div>
                </div>
            );
        },
    },
    {
        accessorKey: 'usage',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Penggunaan" />,
        cell: ({ row }) => {
            const discountCode = row.original;
            return (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1 text-sm">
                        <Users className="h-3 w-3" />
                        <span className="font-medium">{discountCode.used_count}</span>
                        <span className="text-muted-foreground">/ {discountCode.usage_limit || '∞'}</span>
                    </div>
                    {discountCode.usage_limit_per_user && (
                        <div className="text-muted-foreground text-xs">Max {discountCode.usage_limit_per_user}/user</div>
                    )}
                </div>
            );
        },
    },
    {
        accessorKey: 'validity',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Periode" />,
        cell: ({ row }) => {
            const discountCode = row.original;
            return (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1 text-xs">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(discountCode.starts_at), 'dd MMM yyyy', { locale: id })}</span>
                    </div>
                    <div className="text-muted-foreground text-xs">
                        s/d {format(new Date(discountCode.expires_at), 'dd MMM yyyy', { locale: id })}
                    </div>
                    {discountCode.minimum_amount && <div className="text-xs text-orange-600">Min: {formatCurrency(discountCode.minimum_amount)}</div>}
                </div>
            );
        },
    },
    {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => {
            return getStatusBadge(row.original);
        },
    },
    {
        id: 'actions',
        header: () => <div className="text-center">Aksi</div>,
        cell: ({ row }) => <DiscountCodeActions discountCode={row.original} />,
    },
];
