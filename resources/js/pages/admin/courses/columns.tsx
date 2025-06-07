'use client';

import { DataTableColumnHeader } from '@/components/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Link } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Edit, Trash } from 'lucide-react';

export default function CourseActions({ course }: { course: Course }) {
    return (
        <div className="flex items-center justify-center gap-2">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="link" size="icon" className="size-8" asChild>
                        <Link href={route('courses.edit', course.id)}>
                            <Edit />
                            <span className="sr-only">Edit</span>
                        </Link>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Edit</p>
                </TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="link" size="icon" className="size-8 text-red-500 hover:cursor-pointer" asChild>
                        <Link method="delete" href={route('courses.destroy', course.id)}>
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

export type Course = {
    id: string;
    category_id: string;
    category: {
        name: string;
    };
    user?: {
        name: string;
    };
    title: string;
    short_description: string | null;
    description: string | null;
    thumbnail: string | null;
    price: number;
    status: 'draft' | 'published' | 'archived';
    level: 'beginner' | 'intermediate' | 'advanced';
    created_at: string;
};

export const columns: ColumnDef<Course>[] = [
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
        accessorKey: 'user.name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Mentor" />,
    },
    {
        accessorKey: 'thumbnail',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Thumbnail" />,
        cell: ({ row }) => {
            const title = row.original.title;
            const thumbnail = row.original.thumbnail;
            const thumbnailUrl = thumbnail ? `/storage/${thumbnail}` : '/placeholder.png';
            return <img src={thumbnailUrl} alt={title} className="h-16 w-16 rounded object-cover" />;
        },
    },
    {
        accessorKey: 'level',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Level" />,
        cell: ({ row }) => {
            return <Badge className="capitalize">{row.original.level}</Badge>;
        },
    },
    {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => {
            return <Badge className="capitalize">{row.original.status}</Badge>;
        },
    },
    {
        accessorKey: 'price',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Harga" />,
    },
    {
        accessorKey: 'created_at',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal Dibuat" />,
        cell: ({ row }) => <p>{row.original.created_at ? format(new Date(row.original.created_at), 'dd MMMM yyyy', { locale: id }) : '-'}</p>,
    },
    {
        id: 'actions',
        header: () => <div className="text-center">Aksi</div>,
        cell: ({ row }) => <CourseActions course={row.original} />,
    },
];
