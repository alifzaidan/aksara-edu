'use client';

import { DataTableColumnHeader } from '@/components/data-table-column-header';
import DeleteConfirmDialog from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Edit, Trash } from 'lucide-react';
import { useState } from 'react';
import EditDesign from './edit';

export default function DesignActions({ design }: { design: CertificateDesign }) {
    const [editOpen, setEditOpen] = useState(false);

    const handleDelete = () => {
        router.delete(route('certificate-designs.destroy', design.id));
    };

    return (
        <div className="flex items-center justify-center gap-2">
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Edit className="size-4" />
                            </Button>
                        </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Edit Desain</p>
                    </TooltipContent>
                </Tooltip>
                <DialogContent>
                    <EditDesign design={design} setOpen={setEditOpen} />
                </DialogContent>
            </Dialog>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div>
                        <DeleteConfirmDialog
                            trigger={
                                <Button variant="link" size="icon" className="size-8 text-red-500 hover:cursor-pointer">
                                    <Trash />
                                    <span className="sr-only">Hapus Desain</span>
                                </Button>
                            }
                            title="Apakah Anda yakin ingin menghapus desain ini?"
                            itemName={design.name}
                            onConfirm={handleDelete}
                        />
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Hapus Desain</p>
                </TooltipContent>
            </Tooltip>
        </div>
    );
}

export interface CertificateDesign {
    id: string;
    name: string;
    image_1: string | null;
    image_2: string | null;
    created_at: string;
    updated_at: string;
}

export const columns: ColumnDef<CertificateDesign>[] = [
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
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nama Desain" />,
        cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
    },
    {
        accessorKey: 'image_1',
        header: 'Gambar 1',
        cell: ({ row }) => {
            const title = row.original.name;
            const image = row.original.image_1;
            const imageUrl = image ? `/storage/${image}` : '/assets/images/placeholder.png';
            return <img src={imageUrl} alt={title} className="h-16 rounded object-cover" />;
        },
    },
    {
        accessorKey: 'image_2',
        header: 'Gambar 2',
        cell: ({ row }) => {
            const title = row.original.name;
            const image = row.original.image_2;
            const imageUrl = image ? `/storage/${image}` : '/assets/images/placeholder.png';
            return <img src={imageUrl} alt={title} className="h-16 rounded object-cover" />;
        },
    },
    {
        accessorKey: 'created_at',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal Dibuat" />,
        cell: ({ row }) => <p>{format(new Date(row.getValue('created_at')), 'dd MMM yyyy, HH:mm', { locale: id })}</p>,
    },
    {
        id: 'actions',
        header: () => <div className="text-center">Aksi</div>,
        cell: ({ row }) => <DesignActions design={row.original} />,
    },
];
