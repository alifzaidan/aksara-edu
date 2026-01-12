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
import { ExternalLink, Folder, Trash } from 'lucide-react';

export type PartnershipProduct = {
    id: string;
    title: string;
    category_relation?: { id: string; name: string };
    thumbnail?: string | null;
    price: number;
    strikethrough_price: number;
    registration_url: string;
    status: 'draft' | 'published' | 'archived';
    level: 'beginner' | 'intermediate' | 'advanced';
    clicks_count?: number;
    created_at: string;
    type: 'regular' | 'scholarship';
};

function PartnershipProductActions({ product }: { product: PartnershipProduct }) {
    const { auth } = usePage<SharedData>().props;
    const isAffiliate = auth.role.includes('affiliate');

    const handleDelete = () => {
        router.delete(route('partnership-products.destroy', product.id));
    };

    return (
        <div className="flex items-center justify-center gap-2">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="link" size="icon" className="size-8" asChild>
                        <Link href={route('partnership-products.show', product.id)}>
                            <Folder />
                            <span className="sr-only">Detail Produk</span>
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
                                        <span className="sr-only">Hapus Produk</span>
                                    </Button>
                                }
                                title="Apakah Anda yakin ingin menghapus produk ini?"
                                itemName={product.title}
                                onConfirm={handleDelete}
                            />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Hapus Produk</p>
                    </TooltipContent>
                </Tooltip>
            )}
        </div>
    );
}

export const columns: ColumnDef<PartnershipProduct>[] = [
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
        header: ({ column }) => <DataTableColumnHeader column={column} title="Judul Produk" />,
        cell: ({ row }) => {
            return (
                <div className="flex flex-col">
                    <Link href={route('partnership-products.show', row.original.id)} className="text-primary font-medium hover:underline">
                        {row.original.title}
                    </Link>
                    {row.original.category_relation && <span className="text-muted-foreground text-xs">{row.original.category_relation.name}</span>}
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
        accessorKey: 'registration_url',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Link Pendaftaran" />,
        cell: ({ row }) => {
            return (
                <div className="flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" />
                    <a
                        href={row.original.registration_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:underline"
                    >
                        {row.original.registration_url}
                    </a>
                </div>
            );
        },
    },
    {
        accessorKey: 'clicks_count',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Klik" />,
        cell: ({ row }) => {
            const clicks = row.original.clicks_count ?? 0;
            return (
                <div className="flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" />
                    <span className="font-medium">{clicks}</span>
                </div>
            );
        },
    },
    {
        accessorKey: 'type',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tipe Kategori" />,
        cell: ({ row }) => {
            const type = row.original.type;
            const typeMap = {
                regular: { label: 'Reguler', color: 'bg-blue-100 text-blue-700' },
                scholarship: { label: 'Beasiswa', color: 'bg-purple-100 text-purple-700' },
            };
            const typeInfo = typeMap[type];
            return <Badge className={`${typeInfo.color} border-0`}>{typeInfo.label}</Badge>;
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
        cell: ({ row }) => <PartnershipProductActions product={row.original} />,
    },
];
