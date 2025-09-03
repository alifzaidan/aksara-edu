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

export default function WebinarActions({ webinar }: { webinar: Webinar }) {
    const { auth } = usePage<SharedData>().props;
    const isAffiliate = auth.role.includes('affiliate');

    const handleDelete = () => {
        router.delete(route('webinars.destroy', webinar.id));
    };

    return (
        <div className="flex items-center justify-center gap-2">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="link" size="icon" className="size-8" asChild>
                        <Link href={route('webinars.show', webinar.id)}>
                            <Folder />
                            <span className="sr-only">Detail Webinar</span>
                        </Link>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Lihat Webinar</p>
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
                                        <span className="sr-only">Hapus Webinar</span>
                                    </Button>
                                }
                                title="Apakah Anda yakin ingin menghapus webinar ini?"
                                itemName={webinar.title}
                                onConfirm={handleDelete}
                            />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Hapus Webinar</p>
                    </TooltipContent>
                </Tooltip>
            )}
        </div>
    );
}

export type Webinar = {
    id: string;
    category_id: string;
    category: {
        name: string;
    };
    title: string;
    thumbnail: string | null;
    strikethrough_price: number;
    price: number;
    start_time: string;
    end_time: string;
    status: 'draft' | 'published' | 'archived';
    certificate?: {
        id: string;
        title: string;
        certificate_number: string;
        created_at: string;
    } | null;
};

export const columns: ColumnDef<Webinar>[] = [
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
                <Link href={route('webinars.show', row.original.id)} className="text-primary font-medium hover:underline">
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
            return <img src={thumbnailUrl} alt={title} className="h-16 w-16 rounded object-cover" />;
        },
    },
    {
        accessorKey: 'start_time',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal Pelaksanaan" />,
        cell: ({ row }) => {
            const startTime = new Date(row.original.start_time);
            const endTime = new Date(row.original.end_time);
            const isSameDate =
                startTime.getFullYear() === endTime.getFullYear() &&
                startTime.getMonth() === endTime.getMonth() &&
                startTime.getDate() === endTime.getDate();

            return (
                <div>
                    <div>
                        {format(startTime, 'dd MMMM yyyy', { locale: id })}
                        {!isSameDate && (
                            <>
                                <span> - </span>
                                {format(endTime, 'dd MMMM yyyy', { locale: id })}
                            </>
                        )}
                    </div>
                    <div className="text-muted-foreground text-xs">
                        {format(startTime, 'HH:mm', { locale: id })} - {format(endTime, 'HH:mm', { locale: id })}
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
                                        program_type: 'webinar',
                                        webinar_id: row.original.id,
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
        cell: ({ row }) => <WebinarActions webinar={row.original} />,
    },
];
