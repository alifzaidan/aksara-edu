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
import { usePermission } from '@/hooks/use-permission';

export default function WebinarActions({ webinar }: { webinar: Webinar }) {
    const { canManage } = usePermission();
    const canManageWebinars = canManage('webinars');

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
            {canManageWebinars && (
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
    recording_url?: string | null;
    installment_enabled?: boolean;
    has_certificate?: boolean;
    requires_review?: boolean;
    next_step_type?: string | null;
    next_step_id?: string | null;
    next_step_product?: {
        id: string;
        title: string;
        slug: string;
        batch?: string | null;
        thumbnail?: string | null;
        price: number;
        strikethrough_price: number;
        type: string;
        type_label: string;
        url?: string | null;
        admin_url?: string | null;
    } | null;
    certificate?: {
        id: string;
        title: string;
        certificate_number: string;
        created_at: string;
    } | null;
};

function PriceCell({ row }: { row: { original: Webinar } }) {
    const { roles, isAdmin } = usePermission();
    const isStaff = roles.includes('staff') && !isAdmin;

    const strikethroughPrice = row.original.strikethrough_price;
    const price = row.original.price;
    const webinar = row.original;

    if (price === 0) {
        return <div className="text-base font-semibold">Gratis</div>;
    }

    if (isStaff) {
        return <div className="text-base font-semibold text-muted-foreground">Rp ***</div>;
    }

    return (
        <div>
            {strikethroughPrice > 0 && <div className="text-xs text-gray-500 line-through">{rupiahFormatter.format(strikethroughPrice)}</div>}
            <div className="text-base font-semibold">{rupiahFormatter.format(price)}</div>
            {webinar.installment_enabled && (
                <Badge variant="outline" className="mt-1 border-primary/30 bg-primary/10 text-primary text-[10px] px-1.5 py-0 font-medium">
                    Bisa Dicicil
                </Badge>
            )}
        </div>
    );
}

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
                <Link href={route('webinars.show', row.original.id)} className="text-foreground font-medium hover:underline">
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
        cell: ({ row }) => <PriceCell row={row} />,
    },
    {
        id: 'recording_status',
        accessorFn: (row) => (row.recording_url ? 'yes' : 'no'),
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status Rekaman" />,
        cell: ({ row }) => {
            const hasRecording = row.getValue('recording_status') === 'yes';
            return (
                <Badge
                    variant="outline"
                    className={hasRecording ? 'border-green-200 bg-green-50 text-green-700' : 'border-gray-200 bg-gray-50 text-gray-600'}
                >
                    {hasRecording ? 'Ada' : 'Belum Ada'}
                </Badge>
            );
        },
        enableSorting: false,
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
        header: ({ column }) => <DataTableColumnHeader column={column} title="Sertifikat & Alur" />,
        cell: ({ row }) => {
            const webinar = row.original;
            const certificate = webinar.certificate;
            const certificateRequired = webinar.has_certificate !== false && (webinar.has_certificate as any) !== 0;

            return (
                <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                        {!certificateRequired ? (
                            <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-500 text-[11px]">
                                Tanpa Sertifikat
                            </Badge>
                        ) : certificate ? (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-6 px-1.5" asChild>
                                        <Link href={route('certificates.show', { certificate: certificate.id })}>
                                            <Award className="h-3.5 w-3.5 text-green-600" />
                                            <Badge variant="outline" className="ml-1 border-green-200 bg-green-50 text-green-700 text-[11px]">
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
                        ) : (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-6 px-1.5" asChild>
                                        <Link
                                            href={route('certificates.create', {
                                                program_type: 'webinar',
                                                webinar_id: webinar.id,
                                            })}
                                        >
                                            <Award className="h-3.5 w-3.5 text-gray-400" />
                                            <Badge variant="outline" className="ml-1 border-gray-200 bg-gray-50 text-gray-600 text-[11px]">
                                                Belum Ada
                                            </Badge>
                                        </Link>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="text-xs">Klik untuk membuat sertifikat</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </div>

                    <div className="flex items-center gap-1 flex-wrap">
                        {webinar.requires_review === false || !certificateRequired ? (
                            <Badge variant="outline" className="border-gray-100 bg-gray-50/70 text-gray-700 text-[10px] px-1 py-0 font-normal">
                                Tanpa Review
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="border-blue-100 bg-blue-50/70 text-blue-700 text-[10px] px-1 py-0 font-normal">
                                Wajib Review
                            </Badge>
                        )}

                        {webinar.next_step_product && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Badge variant="outline" className="border-purple-200 bg-purple-50 text-purple-700 text-[10px] px-1 py-0 font-normal cursor-help">
                                        Next: {webinar.next_step_product.type_label}
                                    </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="text-xs font-medium">Lanjutan: {webinar.next_step_product.title}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </div>
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
