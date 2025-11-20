'use client';

import { DataTableColumnHeader } from '@/components/data-table-column-header';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Star } from 'lucide-react';

export type WebinarRating = {
    id: string;
    user: {
        id: string;
        name: string;
    };
    rating: number;
    review: string;
    created_at: string;
};

export const columns: ColumnDef<WebinarRating>[] = [
    {
        accessorKey: 'user.name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Peserta" />,
        cell: ({ row }) => {
            const name = row.original.user.name;
            const initials = name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);

            return (
                <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{name}</span>
                </div>
            );
        },
    },
    {
        accessorKey: 'rating',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Rating" />,
        cell: ({ row }) => {
            const rating = row.original.rating;
            return (
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} size={16} className={`${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                        ))}
                    </div>
                    <span className="text-sm font-medium">({rating}/5)</span>
                </div>
            );
        },
    },
    {
        accessorKey: 'review',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Ulasan" />,
        cell: ({ row }) => {
            const review = row.original.review;
            return (
                <div className="max-w-md">
                    <p className="text-sm text-wrap text-gray-600 dark:text-gray-400">{review}</p>
                </div>
            );
        },
    },
    {
        accessorKey: 'created_at',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal" />,
        cell: ({ row }) => {
            const date = new Date(row.original.created_at);
            return <div className="text-sm text-gray-600">{format(date, 'dd MMM yyyy, HH:mm', { locale: id })}</div>;
        },
    },
];
