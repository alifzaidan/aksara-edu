'use client';

import { DataTableColumnHeader } from '@/components/data-table-column-header';
import DeleteConfirmDialog from '@/components/delete-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { Edit, Trash } from 'lucide-react';
import { useState } from 'react';
import EditTool from './edit';

export default function ToolsActions({ tool }: { tool: Tool }) {
    const [open, setOpen] = useState(false);
    const handleDelete = () => {
        router.delete(route('tools.destroy', tool.id));
    };

    return (
        <div className="flex items-center justify-center gap-2">
            <Dialog open={open} onOpenChange={setOpen}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Edit className="size-4" />
                            </Button>
                        </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Edit Tool</p>
                    </TooltipContent>
                </Tooltip>
                <DialogContent>
                    <EditTool tool={tool} setOpen={setOpen} />
                </DialogContent>
            </Dialog>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div>
                        <DeleteConfirmDialog
                            trigger={
                                <Button variant="link" size="icon" className="size-8 text-red-500 hover:cursor-pointer">
                                    <Trash />
                                    <span className="sr-only">Hapus Tool</span>
                                </Button>
                            }
                            title="Apakah Anda yakin ingin menghapus tool ini?"
                            itemName={tool.name}
                            onConfirm={handleDelete}
                        />
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Hapus Tool</p>
                </TooltipContent>
            </Tooltip>
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
            const iconUrl = icon ? `/storage/${icon}` : '/assets/images/placeholder.png';
            return <img src={iconUrl} alt={title} className="h-16 rounded object-cover" />;
        },
    },
    {
        id: 'actions',
        header: () => <div className="text-center">Aksi</div>,
        cell: ({ row }) => <ToolsActions tool={row.original} />,
    },
];
