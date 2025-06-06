'use client';

import { DataTableColumnHeader } from '@/components/data-table-column-header';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Link } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Edit, Trash } from 'lucide-react';
import { useState } from 'react';
import EditMentor from './edit';

export default function MentorActions({ mentor }: { mentor: Mentor }) {
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
                <EditMentor mentor={mentor} setOpen={setOpen} />
            </Dialog>
            <Button variant="link" asChild className="text-red-500 hover:cursor-pointer">
                <Link method="delete" href={route('mentors.destroy', mentor.id)}>
                    <Trash /> Hapus
                </Link>
            </Button>
        </div>
    );
}

export type Mentor = {
    id: string;
    name: string;
    bio?: string;
    email: string;
    phone_number: string;
    created_at: string;
};

export const columns: ColumnDef<Mentor>[] = [
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
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nama Mentor" />,
        cell: ({ row }) => {
            return <div className="font-medium">{row.original.name}</div>;
        },
    },
    {
        accessorKey: 'bio',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Bio Mentor" />,
        cell: ({ row }) => {
            return <div className="font-medium">{row.original.bio}</div>;
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
        accessorKey: 'created_at',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal Bergabung" />,
        cell: ({ row }) => <p>{row.original.created_at ? format(new Date(row.original.created_at), 'dd MMMM yyyy', { locale: id }) : '-'}</p>,
    },
    {
        id: 'actions',
        header: () => <div className="text-center">Aksi</div>,
        cell: ({ row }) => <MentorActions mentor={row.original} />,
    },
];
