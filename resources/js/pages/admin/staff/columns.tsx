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
import { Edit, Folder, KeyRound, Trash } from 'lucide-react';

export default function StaffActions({ staff }: { staff: Staff }) {
    const handleDelete = () => {
        router.delete(route('staff.destroy', staff.id));
    };

    return (
        <div className="flex items-center justify-center gap-2">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="link" size="icon" className="size-8" asChild>
                        <Link href={route('staff.show', staff.id)}>
                            <Folder />
                            <span className="sr-only">Detail Staff</span>
                        </Link>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Lihat Staff</p>
                </TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="link" size="icon" className="size-8 text-blue-500 hover:cursor-pointer" asChild>
                        <Link href={route('staff.edit', staff.id)}>
                            <Edit />
                            <span className="sr-only">Edit Staff</span>
                        </Link>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Edit Staff</p>
                </TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <div>
                        <DeleteConfirmDialog
                            trigger={
                                <Button variant="link" size="icon" className="size-8 text-red-500 hover:cursor-pointer">
                                    <Trash />
                                    <span className="sr-only">Hapus Staff</span>
                                </Button>
                            }
                            title="Apakah Anda yakin ingin menghapus staff ini?"
                            itemName={staff.name}
                            onConfirm={handleDelete}
                        />
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Hapus Staff</p>
                </TooltipContent>
            </Tooltip>
        </div>
    );
}

export type Staff = {
    id: string;
    name: string;
    email: string;
    phone_number: string;
    instance?: string;
    city?: string;
    avatar?: string;
    email_verified_at?: string;
    created_at: string;
    permissions: string[];
    permissions_count: number;
};

export const columns: ColumnDef<Staff>[] = [
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
        accessorKey: 'avatar',
        header: 'Avatar',
        cell: ({ row }) => {
            const getInitials = (name: string) => {
                return name
                    .split(' ')
                    .map((word) => word.charAt(0).toUpperCase())
                    .slice(0, 2)
                    .join('');
            };

            const avatarSrc = row.original.avatar
                ? row.original.avatar.startsWith('http') || row.original.avatar.startsWith('/')
                    ? row.original.avatar
                    : `/storage/${row.original.avatar}`
                : null;

            return avatarSrc ? (
                <img src={avatarSrc} alt={row.original.name} className="h-10 w-10 rounded-full object-cover" />
            ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-300 text-xs font-bold text-gray-700">
                    {getInitials(row.original.name)}
                </div>
            );
        },
        enableSorting: false,
    },
    {
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nama Staff" />,
        cell: ({ row }) => {
            return (
                <div>
                    <Link href={route('staff.show', row.original.id)} className="text-primary font-medium hover:underline">
                        {row.original.name}
                    </Link>
                    {row.original.instance && (
                        <p className="text-xs text-muted-foreground">{row.original.instance}</p>
                    )}
                </div>
            );
        },
    },
    {
        accessorKey: 'email',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    },
    {
        accessorKey: 'phone_number',
        header: ({ column }) => <DataTableColumnHeader column={column} title="No. Telepon" />,
    },
    {
        accessorKey: 'permissions_count',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Hak Akses Menu" />,
        cell: ({ row }) => {
            const count = row.original.permissions_count || 0;
            return (
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 rounded bg-gray-200 px-2 py-1 font-semibold text-xs text-gray-900 dark:bg-gray-800 dark:text-gray-100">
                        <KeyRound className="h-3 w-3 text-primary" />
                        <span>{count} Akses Menu</span>
                    </div>
                </div>
            );
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
        cell: ({ row }) => <StaffActions staff={row.original} />,
        enableSorting: false,
        enableHiding: false,
    },
];
