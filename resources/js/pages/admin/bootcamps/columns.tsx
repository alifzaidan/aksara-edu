'use client';

import { DataTableColumnHeader } from '@/components/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { rupiahFormatter } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Folder, Trash } from 'lucide-react';

export default function BootcampActions({ bootcamp }: { bootcamp: Bootcamp }) {
    return (
        <div className="flex items-center justify-center gap-2">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="link" size="icon" className="size-8" asChild>
                        <Link href={route('bootcamps.show', bootcamp.id)}>
                            <Folder />
                            <span className="sr-only">Detail Bootcamp</span>
                        </Link>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Lihat Bootcamp</p>
                </TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="link" size="icon" className="size-8 text-red-500 hover:cursor-pointer" asChild>
                        <Link method="delete" href={route('bootcamps.destroy', bootcamp.id)}>
                            <Trash />
                            <span className="sr-only">Hapus</span>
                        </Link>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Hapus</p>
                </TooltipContent>
            </Tooltip>
        </div>
    );
}

export type Bootcamp = {
    id: string;
    category_id: string;
    schedules: {
        day: string;
        start_time: string;
        end_time: string;
    }[];
    category: {
        name: string;
    };
    title: string;
    thumbnail: string | null;
    price: number;
    start_date: string;
    end_date: string;
    status: 'draft' | 'published' | 'archived';
};

export const columns: ColumnDef<Bootcamp>[] = [
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
        accessorKey: 'title',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Judul" />,
        cell: ({ row }) => {
            return <div className="font-medium">{row.original.title}</div>;
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
            return <img src={thumbnailUrl} alt={title} className="h-16 w-16 rounded object-cover" />;
        },
    },
    {
        accessorKey: 'start_date',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal Pelaksanaan" />,
        cell: ({ row }) => {
            const startDate = new Date(row.original.start_date);
            const endDate = new Date(row.original.end_date);
            const isSameDate =
                startDate.getFullYear() === endDate.getFullYear() &&
                startDate.getMonth() === endDate.getMonth() &&
                startDate.getDate() === endDate.getDate();
            const schedules = row.original.schedules ?? [];

            return (
                <div>
                    <div>
                        {format(startDate, 'dd MMMM yyyy', { locale: id })}
                        {!isSameDate && (
                            <>
                                <span> - </span>
                                {format(endDate, 'dd MMMM yyyy', { locale: id })}
                            </>
                        )}
                    </div>
                    <div className="text-muted-foreground mt-1 text-xs">
                        {schedules.length > 0 ? (
                            <ul>
                                {schedules.map((sch, idx) => (
                                    <li key={idx}>
                                        <span className="capitalize">{sch.day}</span> {sch.start_time?.slice(0, 5)} - {sch.end_time?.slice(0, 5)}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <span>-</span>
                        )}
                    </div>
                </div>
            );
        },
    },
    {
        accessorKey: 'price',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Harga" />,
        cell: ({ row }) => {
            const amount = row.getValue<number>('price');
            if (amount === 0) {
                return <div>Gratis</div>;
            }
            return <div>{rupiahFormatter.format(amount)}</div>;
        },
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
        cell: ({ row }) => <BootcampActions bootcamp={row.original} />,
    },
];
