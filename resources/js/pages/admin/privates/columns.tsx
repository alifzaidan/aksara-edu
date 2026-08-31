'use client';

import { DataTableColumnHeader } from '@/components/data-table-column-header';
import DeleteConfirmDialog from '@/components/delete-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { rupiahFormatter } from '@/lib/utils';
import { SharedData } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { Folder, Trash } from 'lucide-react';

export type PrivateClass = {
    id: string;
    title: string;
    status: 'draft' | 'published' | 'archived';
    mode: 'online' | 'offline';
    price: number;
    strikethrough_price: number;
    thumbnail: string | null;
    installment_enabled?: boolean;
    category?: { name: string };
    user?: { name: string };
};

import { usePermission } from '@/hooks/use-permission';

function PrivateActions({ privateClass }: { privateClass: PrivateClass }) {
    const { auth } = usePage<SharedData>().props;
    const { canManage } = usePermission();
    const isAffiliate = auth.role.includes('affiliate');
    const canManagePrivate = canManage('privates') && !isAffiliate;

    const handleDelete = () => {
        router.delete(route('privates.destroy', { private: privateClass.id }));
    };

    return (
        <div className="flex items-center justify-center gap-2">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="link" size="icon" className="size-8" asChild>
                        <Link href={route('privates.show', { private: privateClass.id })}>
                            <Folder />
                            <span className="sr-only">Detail Private Class</span>
                        </Link>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Lihat Private Class</p>
                </TooltipContent>
            </Tooltip>

            {canManagePrivate && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div>
                            <DeleteConfirmDialog
                                trigger={
                                    <Button variant="link" size="icon" className="size-8 text-red-500 hover:cursor-pointer">
                                        <Trash />
                                        <span className="sr-only">Hapus Private Class</span>
                                    </Button>
                                }
                                title="Apakah Anda yakin ingin menghapus private class ini?"
                                itemName={privateClass.title}
                                onConfirm={handleDelete}
                            />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Hapus Private Class</p>
                    </TooltipContent>
                </Tooltip>
            )}
        </div>
    );
}

function PrivatePriceCell({ privateClass }: { privateClass: PrivateClass }) {
    const { auth } = usePage<SharedData>().props;
    const { roles, isAdmin } = usePermission();
    const isStaff = (roles?.includes('staff') || auth?.role?.includes('staff')) && !isAdmin && !auth?.role?.includes('admin');

    const price = privateClass.price;
    if (price === 0) {
        return <div className="text-base font-semibold">Gratis</div>;
    }
    if (isStaff) {
        return <div className="text-base font-semibold text-muted-foreground">Rp ***</div>;
    }
    const strikethroughPrice = privateClass.strikethrough_price;
    return (
        <div>
            {strikethroughPrice > 0 && <div className="text-xs text-gray-500 line-through">{rupiahFormatter.format(strikethroughPrice)}</div>}
            <div className="text-base font-semibold">{rupiahFormatter.format(price)}</div>
            {privateClass.installment_enabled && (
                <Badge variant="outline" className="mt-1 border-primary/30 bg-primary/10 text-primary text-[10px] px-1.5 py-0 font-medium">
                    Bisa Dicicil
                </Badge>
            )}
        </div>
    );
}

export const columns: ColumnDef<PrivateClass>[] = [
    {
        accessorKey: 'no',
        header: 'No',
        cell: ({ row }) => {
            const index = row.index + 1;

            return <div className="font-medium">{index}</div>;
        },
    },
    {
        accessorKey: 'title',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Judul" />,
        cell: ({ row }) => {
            return (
                <Link href={route('privates.show', { private: row.original.id })} className="text-primary font-medium hover:underline">
                    {row.original.title}
                </Link>
            );
        },
    },
    {
        accessorKey: 'category.name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Kategori" />,
    },
    {
        accessorKey: 'thumbnail',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Thumbnail" />,
        cell: ({ row }) => {
            const title = row.original.title;
            const thumbnail = row.original.thumbnail;
            const thumbnailUrl = thumbnail ? `/storage/${thumbnail}` : '/assets/images/placeholder.png';
            return <img src={thumbnailUrl} alt={title} className="h-16 rounded object-cover" />;
        },
    },
    {
        accessorKey: 'user.name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Mentor" />,
        cell: ({ row }) => row.original.user?.name || '-',
    },
    {
        accessorKey: 'mode',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Mode" />,
        cell: ({ row }) => <Badge variant="outline">{row.original.mode === 'offline' ? 'Offline' : 'Online'}</Badge>,
    },
    {
        accessorKey: 'price',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Harga" />,
        cell: ({ row }) => <PrivatePriceCell privateClass={row.original} />,
    },
    {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => {
            const status = row.original.status;
            let color = 'bg-gray-200 text-gray-800';
            if (status === 'draft') color = 'bg-gray-200 text-gray-800';
            if (status === 'published') color = 'bg-blue-100 text-blue-800';
            if (status === 'archived') color = 'bg-zinc-300 text-zinc-700';
            return <Badge className={`capitalize ${color} border-0`}>{status}</Badge>;
        },
    },
    {
        id: 'actions',
        header: () => <div className="text-center">Aksi</div>,
        cell: ({ row }) => <PrivateActions privateClass={row.original} />,
    },
];
