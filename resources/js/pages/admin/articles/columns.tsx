'use client';

import { DataTableColumnHeader } from '@/components/data-table-column-header';
import DeleteConfirmDialog from '@/components/delete-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { SharedData } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Clock, Eye, FileText, Trash } from 'lucide-react';

export type Article = {
    id: string;
    title: string;
    slug: string;
    excerpt?: string | null;
    thumbnail?: string | null;
    category: {
        id: string;
        name: string;
    };
    user: {
        id: string;
        name: string;
    };
    read_time: number;
    views: number;
    status: 'draft' | 'published' | 'archived';
    is_featured: boolean;
    published_at?: string | null;
    created_at: string;
};

function ArticleActions({ article }: { article: Article }) {
    const { auth } = usePage<SharedData>().props;
    const isAffiliate = auth.role.includes('affiliate');

    const handleDelete = () => {
        router.delete(route('articles.destroy', article.id));
    };

    return (
        <div className="flex items-center justify-center gap-2">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="link" size="icon" className="size-8" asChild>
                        <Link href={route('articles.show', article.id)}>
                            <FileText />
                            <span className="sr-only">Detail Artikel</span>
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
                                        <span className="sr-only">Hapus Artikel</span>
                                    </Button>
                                }
                                title="Apakah Anda yakin ingin menghapus artikel ini?"
                                itemName={article.title}
                                onConfirm={handleDelete}
                            />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Hapus Artikel</p>
                    </TooltipContent>
                </Tooltip>
            )}
        </div>
    );
}

export const columns: ColumnDef<Article>[] = [
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
        header: ({ column }) => <DataTableColumnHeader column={column} title="Judul Artikel" />,
        cell: ({ row }) => {
            return (
                <div className="flex flex-col">
                    <Link href={route('articles.show', row.original.id)} className="text-primary line-clamp-2 font-medium hover:underline">
                        {row.original.title}
                    </Link>
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
            return <img src={thumbnailUrl} alt={row.original.title} className="w-20 rounded object-cover" />;
        },
    },
    {
        accessorKey: 'category',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Kategori" />,
        cell: ({ row }) => {
            return (
                <Badge variant="outline" className="text-xs">
                    {row.original.category.name}
                </Badge>
            );
        },
    },
    {
        accessorKey: 'user',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Penulis" />,
        cell: ({ row }) => {
            return <span className="text-sm">{row.original.user.name}</span>;
        },
    },
    {
        accessorKey: 'read_time',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Waktu Baca" />,
        cell: ({ row }) => {
            return (
                <div className="flex items-center gap-1 text-sm">
                    <Clock className="h-3 w-3" />
                    <span>{row.original.read_time} menit</span>
                </div>
            );
        },
    },
    {
        accessorKey: 'views',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Views" />,
        cell: ({ row }) => {
            return (
                <div className="flex items-center gap-1 text-sm">
                    <Eye className="h-3 w-3" />
                    <span className="font-medium">{row.original.views.toLocaleString()}</span>
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
        accessorKey: 'published_at',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Dipublikasi" />,
        cell: ({ row }) => {
            const publishedAt = row.original.published_at;
            if (!publishedAt) return <span className="text-muted-foreground text-xs">-</span>;
            return <span className="text-xs">{format(new Date(publishedAt), 'dd MMM yyyy', { locale: id })}</span>;
        },
    },
    {
        id: 'actions',
        header: () => <div className="text-center">Aksi</div>,
        cell: ({ row }) => <ArticleActions article={row.original} />,
    },
];
