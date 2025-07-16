'use client';

import { DataTableColumnHeader } from '@/components/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Check, Star, X } from 'lucide-react';

interface User {
    id: string;
    name: string;
    email: string;
}

export interface CourseRating {
    id: string;
    user: User;
    course_id: string;
    rating: number;
    review: string | null;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    updated_at: string;
}

export const columns: ColumnDef<CourseRating>[] = [
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
        accessorKey: 'user.name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nama Pengguna" />,
        cell: ({ row }) => (
            <div>
                <div className="font-medium">{row.original.user?.name || '-'}</div>
                <div className="text-xs text-gray-500">{row.original.user?.email || '-'}</div>
            </div>
        ),
    },
    {
        accessorKey: 'rating',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Rating" />,
        cell: ({ row }) => {
            const rating = row.original.rating;
            return (
                <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} size={16} className={`${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                    ))}
                    <span className="ml-1 text-sm font-medium">({rating}/5)</span>
                </div>
            );
        },
    },
    {
        accessorKey: 'review',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Ulasan" />,
        cell: ({ row }) => {
            const review = row.original.review;
            if (!review) return <span className="text-gray-400">-</span>;

            return (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="max-w-[200px] cursor-pointer truncate">{review}</div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[300px]">
                        <p className="whitespace-pre-wrap">{review}</p>
                    </TooltipContent>
                </Tooltip>
            );
        },
    },
    {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => {
            const status = row.original.status;
            const statusConfig = {
                pending: { label: 'Menunggu', className: 'bg-yellow-100 text-yellow-800' },
                approved: { label: 'Disetujui', className: 'bg-green-100 text-green-800' },
                rejected: { label: 'Ditolak', className: 'bg-red-100 text-red-800' },
            };

            const config = statusConfig[status] || statusConfig.pending;

            return <Badge className={config.className}>{config.label}</Badge>;
        },
    },
    {
        accessorKey: 'created_at',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal" />,
        cell: ({ row }) => (
            <div className="text-sm">
                {format(new Date(row.original.created_at), 'dd MMM yyyy', { locale: id })}
                <div className="text-xs text-gray-500">{format(new Date(row.original.created_at), 'HH:mm', { locale: id })}</div>
            </div>
        ),
    },
    {
        id: 'actions',
        header: () => <div className="text-center">Aksi</div>,
        cell: ({ row }) => {
            const rating = row.original;

            const handleApprove = () => {
                router.post(route('course-ratings.approve', { rating: rating.id }));
            };

            const handleReject = () => {
                router.post(route('course-ratings.reject', { rating: rating.id }));
            };

            if (rating.status === 'pending') {
                return (
                    <div className="flex items-center justify-center gap-1">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleApprove}
                                    className="h-8 w-8 p-0 text-green-600 hover:bg-green-50 hover:text-green-700"
                                >
                                    <Check className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Setujui Rating</p>
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleReject}
                                    className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Tolak Rating</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                );
            }

            return <div className="text-center text-xs text-gray-500">{rating.status === 'approved' ? 'Disetujui' : 'Ditolak'}</div>;
        },
    },
];
