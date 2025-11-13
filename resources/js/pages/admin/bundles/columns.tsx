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
import { Folder, Package, Trash } from 'lucide-react';

export type BundleItem = {
    id: string;
    bundleable_type: string;
    bundleable: {
        id: string;
        title: string;
        slug: string;
    };
    price: number;
};

export type Bundle = {
    id: string;
    title: string;
    slug: string;
    thumbnail?: string | null;
    price: number;
    strikethrough_price: number;
    registration_deadline?: string | null;
    status: 'draft' | 'published' | 'archived';
    bundle_items?: BundleItem[];
    enrollments_count?: number;
    created_at: string;
};

function BundleActions({ bundle }: { bundle: Bundle }) {
    const { auth } = usePage<SharedData>().props;
    const isAffiliate = auth.role.includes('affiliate');

    const handleDelete = () => {
        router.delete(route('bundles.destroy', bundle.id));
    };

    return (
        <div className="flex items-center justify-center gap-2">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="link" size="icon" className="size-8" asChild>
                        <Link href={route('bundles.show', bundle.id)}>
                            <Folder />
                            <span className="sr-only">Detail Paket Bundling</span>
                        </Link>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Lihat Detail</p>
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
                                        <span className="sr-only">Hapus Paket Bundling</span>
                                    </Button>
                                }
                                title="Apakah Anda yakin ingin menghapus bundle ini?"
                                itemName={bundle.title}
                                onConfirm={handleDelete}
                            />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Hapus Bundling</p>
                    </TooltipContent>
                </Tooltip>
            )}
        </div>
    );
}

export const columns: ColumnDef<Bundle>[] = [
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
        header: ({ column }) => <DataTableColumnHeader column={column} title="Judul Paket Bundling" />,
        cell: ({ row }) => {
            const itemCount = row.original.bundle_items?.length || 0;
            return (
                <div className="flex flex-col">
                    <Link href={route('bundles.show', row.original.id)} className="text-primary font-medium hover:underline">
                        {row.original.title}
                    </Link>
                    <span className="text-muted-foreground text-xs">{itemCount} item</span>
                </div>
            );
        },
    },
    {
        accessorKey: 'thumbnail',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Thumbnail" />,
        cell: ({ row }) => {
            const thumbnail = row.original.thumbnail;
            const thumbnailUrl = thumbnail ? `/storage/${thumbnail}` : '/assets/images/placeholder.png';
            return <img src={thumbnailUrl} alt={row.original.title} className="h-14 rounded object-cover" />;
        },
    },
    {
        accessorKey: 'bundle_items',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Isi Paket" />,
        cell: ({ row }) => {
            const items = row.original.bundle_items || [];
            const grouped = items.reduce(
                (acc, item) => {
                    if (item.bundleable_type.includes('Course')) acc.courses++;
                    else if (item.bundleable_type.includes('Bootcamp')) acc.bootcamps++;
                    else if (item.bundleable_type.includes('Webinar')) acc.webinars++;
                    return acc;
                },
                { courses: 0, bootcamps: 0, webinars: 0 },
            );

            return (
                <div className="flex flex-wrap gap-1">
                    {grouped.courses > 0 && (
                        <Badge variant="outline" className="bg-blue-50 text-xs">
                            {grouped.courses} Course
                        </Badge>
                    )}
                    {grouped.bootcamps > 0 && (
                        <Badge variant="outline" className="bg-purple-50 text-xs">
                            {grouped.bootcamps} Bootcamp
                        </Badge>
                    )}
                    {grouped.webinars > 0 && (
                        <Badge variant="outline" className="bg-green-50 text-xs">
                            {grouped.webinars} Webinar
                        </Badge>
                    )}
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
            return (
                <div>
                    {strikethroughPrice > 0 && <div className="text-xs text-gray-500 line-through">{rupiahFormatter.format(strikethroughPrice)}</div>}
                    <div className="text-base font-semibold">{rupiahFormatter.format(price)}</div>
                </div>
            );
        },
    },
    {
        accessorKey: 'enrollments_count',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Terjual" />,
        cell: ({ row }) => {
            const count = row.original.enrollments_count ?? 0;
            return (
                <div className="flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    <span className="font-medium">{count}</span>
                </div>
            );
        },
    },
    {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => {
            const status = row.original.status;
            const statusMap = {
                draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700' },
                published: { label: 'Published', color: 'bg-green-100 text-green-700' },
                archived: { label: 'Archived', color: 'bg-red-100 text-red-700' },
            };
            const statusInfo = statusMap[status];
            return <Badge className={`${statusInfo.color} border-0`}>{statusInfo.label}</Badge>;
        },
    },
    {
        id: 'actions',
        header: () => <div className="text-center">Aksi</div>,
        cell: ({ row }) => <BundleActions bundle={row.original} />,
    },
];
