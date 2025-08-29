'use client';

import { DataTableColumnHeader } from '@/components/data-table-column-header';
import DeleteConfirmDialog from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { rupiahFormatter } from '@/lib/utils';
import { Link, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Folder, Trash } from 'lucide-react';

export default function MentorActions({ mentor }: { mentor: Mentor }) {
    const handleDelete = () => {
        router.delete(route('mentors.destroy', mentor.id));
    };

    return (
        <div className="flex items-center justify-center gap-2">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="link" size="icon" className="size-8" asChild>
                        <Link href={route('mentors.show', mentor.id)}>
                            <Folder />
                            <span className="sr-only">Detail Mentor</span>
                        </Link>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Lihat Mentor</p>
                </TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div>
                        <DeleteConfirmDialog
                            trigger={
                                <Button variant="link" size="icon" className="size-8 text-red-500 hover:cursor-pointer">
                                    <Trash />
                                    <span className="sr-only">Hapus Mentor</span>
                                </Button>
                            }
                            title="Apakah Anda yakin ingin menghapus mentor ini?"
                            itemName={mentor.name}
                            onConfirm={handleDelete}
                        />
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Hapus Mentor</p>
                </TooltipContent>
            </Tooltip>
        </div>
    );
}

export type Mentor = {
    id: string;
    name: string;
    bio?: string;
    email: string;
    phone_number: string;
    commission: number;
    created_at: string;
    total_courses: number;
    total_earnings: number;
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
            return (
                <Link href={route('mentors.show', row.original.id)} className="text-primary font-medium hover:underline">
                    {row.original.name}
                </Link>
            );
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
        accessorKey: 'total_courses',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Total Kelas" />,
        cell: ({ row }) => {
            const totalCourses = row.original.total_courses || 0;
            return <span className="font-medium text-blue-600">{totalCourses} Kelas</span>;
        },
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
        cell: ({ row }) => <MentorActions mentor={row.original} />,
    },
];
