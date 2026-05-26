'use client';

import { DataTableColumnHeader } from '@/components/data-table-column-header';
import DeleteConfirmDialog from '@/components/delete-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { rupiahFormatter } from '@/lib/utils';
import { Link, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Edit, Folder, Trash } from 'lucide-react';

export default function CertificationProgramActions({ program }: { program: CertificationProgram }) {
    const handleDelete = () => {
        router.delete(route('certification-programs.destroy', program.id));
    };

    return (
        <div className="flex items-center justify-center gap-2">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="link" size="icon" className="size-8" asChild>
                        <Link href={route('certification-programs.show', program.id)}>
                            <Folder />
                            <span className="sr-only">Detail Program</span>
                        </Link>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Lihat Detail</p>
                </TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="link" size="icon" className="size-8" asChild>
                        <Link href={route('certification-programs.edit', program.id)}>
                            <Edit />
                            <span className="sr-only">Edit Program</span>
                        </Link>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Edit</p>
                </TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <div>
                        <DeleteConfirmDialog
                            trigger={
                                <Button variant="link" size="icon" className="size-8 text-red-500 hover:cursor-pointer">
                                    <Trash />
                                    <span className="sr-only">Hapus Program</span>
                                </Button>
                            }
                            title="Apakah Anda yakin ingin menghapus program ini?"
                            itemName={program.title}
                            onConfirm={handleDelete}
                        />
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Hapus</p>
                </TooltipContent>
            </Tooltip>
        </div>
    );
}

export type CertificationProgram = {
    id: string;
    title: string;
    slug: string;
    type: 'regular' | 'scholarship';
    status: 'draft' | 'published' | 'archived' | 'hidden';
    category_id: string;
    category: {
        name: string;
    };
    price: number;
    scholarship_price?: number;
    strikethrough_price: number;
    thumbnail?: string | null;
    registration_deadline?: string;
    schedules?: {
        id: string;
        schedule_date: string;
        day: string;
        start_time: string;
        end_time: string;
    }[];
    batch?: string | null;
};

export const columns: ColumnDef<CertificationProgram>[] = [
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
        header: ({ column }) => <DataTableColumnHeader column={column} title="Judul Program" />,
        cell: ({ row }) => {
            return (
                <Link href={route('certification-programs.show', row.original.id)} className="text-primary font-medium hover:underline">
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
        accessorKey: 'type',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tipe" />,
        cell: ({ row }) => {
            const type = row.original.type;
            const isScholarship = type === 'scholarship';
            return (
                <Badge className={`capitalize border-0 ${isScholarship ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                    {isScholarship ? 'Beasiswa' : 'Reguler'}
                </Badge>
            );
        },
    },
    {
        accessorKey: 'batch',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Batch" />,
        cell: ({ row }) => <div className="font-medium">{row.original.batch || '-'}</div>,
    },
    {
        accessorKey: 'price',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Harga" />,
        cell: ({ row }) => {
            const { price, strikethrough_price, scholarship_price, type } = row.original;

            const displayPrice = type === 'scholarship' ? (scholarship_price ?? 0) : price;

            if (displayPrice === 0) {
                return <div className="text-base font-semibold">Gratis</div>;
            }

            return (
                <div>
                    {strikethrough_price > 0 && (
                        <div className="text-xs text-gray-500 line-through">{rupiahFormatter.format(strikethrough_price)}</div>
                    )}
                    <div className="text-base font-semibold">{rupiahFormatter.format(displayPrice)}</div>
                    {type === 'scholarship' && scholarship_price !== undefined && scholarship_price > 0 && (
                        <div className="mt-0.5 text-xs text-purple-600">Harga Beasiswa</div>
                    )}
                </div>
            );
        },
    },
    {
        accessorKey: 'schedules',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal Pelaksanaan" />,
        cell: ({ row }) => {
            const schedules = row.original.schedules ?? [];

            if (schedules.length === 0) {
                return <span className="text-muted-foreground text-sm">-</span>;
            }

            // Sort schedules by date
            const sorted = [...schedules].sort((a, b) => a.schedule_date.localeCompare(b.schedule_date));
            const first = sorted[0];
            const last = sorted[sorted.length - 1];

            const startDate = new Date(first.schedule_date);
            const endDate = new Date(last.schedule_date);
            const isSameDate =
                startDate.getFullYear() === endDate.getFullYear() &&
                startDate.getMonth() === endDate.getMonth() &&
                startDate.getDate() === endDate.getDate();

            return (
                <div>
                    <div className="text-sm font-medium">
                        {format(startDate, 'dd MMMM yyyy', { locale: id })}
                        {!isSameDate && (
                            <>
                                <span> – </span>
                                {format(endDate, 'dd MMMM yyyy', { locale: id })}
                            </>
                        )}
                    </div>
                    <div className="text-muted-foreground mt-1 text-xs">
                        <ul>
                            {sorted.map((sch, idx) => (
                                <li key={idx}>
                                    {format(new Date(sch.schedule_date), 'dd MMM yyyy', { locale: id })} :{' '}
                                    <span className="capitalize">{sch.day}</span> {sch.start_time?.slice(0, 5)} – {sch.end_time?.slice(0, 5)}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            );
        },
        enableSorting: false,
    },
    {
        accessorKey: 'registration_deadline',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Deadline Pendaftaran" />,
        cell: ({ row }) => {
            const deadline = row.original.registration_deadline;
            return (
                <span className="text-sm">
                    {deadline ? format(new Date(deadline), 'dd MMM yyyy', { locale: id }) : '-'}
                </span>
            );
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
            if (status === 'hidden') color = 'bg-yellow-300 text-yellow-700';
            const labelMap: Record<string, string> = {
                draft: 'Draft',
                published: 'Published',
                archived: 'Archived',
                hidden: 'Hidden',
            };
            return <Badge className={`capitalize border-0 ${color}`}>{labelMap[status] ?? status}</Badge>;
        },
    },
    {
        id: 'actions',
        header: () => <div className="text-center">Aksi</div>,
        cell: ({ row }) => <CertificationProgramActions program={row.original} />,
    },
];
