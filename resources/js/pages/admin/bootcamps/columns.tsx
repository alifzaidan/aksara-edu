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
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Award, Folder, Trash } from 'lucide-react';

export default function BootcampActions({ bootcamp }: { bootcamp: Bootcamp }) {
    const { auth } = usePage<SharedData>().props;
    const isAffiliate = auth.role.includes('affiliate');

    const handleDelete = () => {
        router.delete(route('bootcamps.destroy', bootcamp.id));
    };

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
            {!isAffiliate && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div>
                            <DeleteConfirmDialog
                                trigger={
                                    <Button variant="link" size="icon" className="size-8 text-red-500 hover:cursor-pointer">
                                        <Trash />
                                        <span className="sr-only">Hapus Bootcamp</span>
                                    </Button>
                                }
                                title="Apakah Anda yakin ingin menghapus bootcamp ini?"
                                itemName={bootcamp.title}
                                onConfirm={handleDelete}
                            />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Hapus Bootcamp</p>
                    </TooltipContent>
                </Tooltip>
            )}
        </div>
    );
}

export type Bootcamp = {
    id: string;
    category_id: string;
    schedules: {
        schedule_date: string;
        day: string;
        start_time: string;
        end_time: string;
    }[];
    category: {
        name: string;
    };
    title: string;
    thumbnail: string | null;
    strikethrough_price: number;
    price: number;
    start_date: string;
    end_date: string;
    status: 'draft' | 'published' | 'archived' | 'hidden';
    certificate?: {
        id: string;
        title: string;
        certificate_number: string;
        created_at: string;
    } | null;
};

export const columns: ColumnDef<Bootcamp>[] = [
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
                <Link href={route('bootcamps.show', row.original.id)} className="text-primary font-medium hover:underline">
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
                                        {format(sch.schedule_date, 'dd MMM yyyy', { locale: id })} : <span className="capitalize">{sch.day}</span>{' '}
                                        {sch.start_time?.slice(0, 5)} - {sch.end_time?.slice(0, 5)}
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
            const strikethroughPrice = row.original.strikethrough_price;
            const price = row.original.price;
            if (price === 0) {
                return <div className="text-base font-semibold">Gratis</div>;
            }
            return (
                <div>
                    {strikethroughPrice > 0 && <div className="text-xs text-gray-500 line-through">{rupiahFormatter.format(strikethroughPrice)}</div>}
                    <div className="text-base font-semibold">{rupiahFormatter.format(price)}</div>
                </div>
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
            return <Badge className={`capitalize ${color} border-0`}>{status}</Badge>;
        },
    },
    {
        accessorKey: 'certificate',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Sertifikat" />,
        cell: ({ row }) => {
            const certificate = row.original.certificate;

            if (certificate) {
                return (
                    <div className="flex items-center gap-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href={route('certificates.show', { certificate: certificate.id })}>
                                        <Award className="h-4 w-4 text-green-600" />
                                        <Badge variant="outline" className="ml-1 border-green-200 bg-green-50 text-green-700">
                                            Tersedia
                                        </Badge>
                                    </Link>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <div className="text-xs">
                                    <p className="font-medium">{certificate.title}</p>
                                    <p className="text-muted-foreground">
                                        Dibuat: {format(new Date(certificate.created_at), 'dd MMM yyyy', { locale: id })}
                                    </p>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                );
            }

            return (
                <div className="flex items-center gap-2">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" asChild>
                                <Link
                                    href={route('certificates.create', {
                                        program_type: 'bootcamp',
                                        bootcamp_id: row.original.id,
                                    })}
                                >
                                    <Award className="h-4 w-4 text-gray-400" />
                                    <Badge variant="outline" className="ml-1 border-gray-200 bg-gray-50 text-gray-600">
                                        Belum Ada
                                    </Badge>
                                </Link>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="text-xs">Klik untuk membuat sertifikat</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            );
        },
        enableSorting: false,
    },
    {
        id: 'actions',
        header: () => <div className="text-center">Aksi</div>,
        cell: ({ row }) => <BootcampActions bootcamp={row.original} />,
    },
];
