'use client';

import { DataTableColumnHeader } from '@/components/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Link } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { Edit, Trash } from 'lucide-react';
import { useState } from 'react';
import EditTool from './edit';

export default function ToolsActions({ tool }: { tool: Tool }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="flex items-center justify-center gap-2">
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button variant={'link'} className="hover:cursor-pointer">
                        <Edit />
                        Edit
                    </Button>
                </DialogTrigger>
                <EditTool tool={tool} setOpen={setOpen} />
            </Dialog>
            <Button variant="link" asChild className="text-red-500 hover:cursor-pointer">
                <Link method="delete" href={route('tools.destroy', tool.id)}>
                    <Trash /> Hapus
                </Link>
            </Button>
        </div>
    );
}

export type Tool = {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
};

export const columns: ColumnDef<Tool>[] = [
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
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nama Tools" />,
        cell: ({ row }) => {
            return <div className="font-medium">{row.original.name}</div>;
        },
    },
    {
        accessorKey: 'slug',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Slug" />,
        cell: ({ row }) => {
            return <Badge>{row.original.slug}</Badge>;
        },
    },
    {
        accessorKey: 'description',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Deskripsi" />,
        cell: ({ row }) => {
            return <div className="font-medium">{row.original.description}</div>;
        },
    },
    {
        accessorKey: 'image',
        header: 'Icon',
        cell: ({ row }) => {
            const title = row.original.name;
            const icon = row.original.icon;
            const iconUrl = icon ? `/storage/${icon}` : '/placeholder.png';
            return <img src={iconUrl} alt={title} className="h-16 w-16 rounded object-cover" />;
        },
    },
    {
        id: 'actions',
        header: () => <div className="text-center">Aksi</div>,
        cell: ({ row }) => <ToolsActions tool={row.original} />,
    },
];
