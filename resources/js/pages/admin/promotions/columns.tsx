'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import ActionCell from './action-cell';

export interface Promotion {
    id: string;
    promotion_flyer: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
    url_redirect: string;
}

export const getColumns = (promotions: Promotion[]): ColumnDef<Promotion>[] => [
    {
        id: 'number',
        header: 'No',
        cell: ({ row }) => {
            return <div className="ml-4 justify-center font-medium">{row.index + 1}</div>;
        },
    },
    {
        accessorKey: 'promotion_flyer',
        header: 'Flyer',
        cell: ({ row }) => {
            const imageSrc = row.original.promotion_flyer;
            return imageSrc ? (
                <img
                    src={imageSrc}
                    alt="Flyer"
                    className="h-16 w-24 rounded border object-cover"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/images/placeholder.png';
                    }}
                />
            ) : (
                <div className="flex h-16 w-24 items-center justify-center rounded border bg-gray-100 text-xs text-gray-400">No Image</div>
            );
        },
    },
    {
        accessorKey: 'start_date',
        header: 'Durasi',
        cell: ({ row }) => {
            return (
                <div className="flex gap-1">
                    <div className="text-xs">{format(new Date(row.original.start_date), 'dd MMM yyyy', { locale: id })}</div>
                    <div className="text-xs">s/d {format(new Date(row.original.end_date), 'dd MMM yyyy', { locale: id })}</div>
                </div>
            );
        },
    },
    {
        accessorKey: 'is_active',
        header: 'Status',
        cell: ({ row }) =>
            row.original.is_active ? (
                <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-700">Aktif</span>
            ) : (
                <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-500">Nonaktif</span>
            ),
    },
    {
        accessorKey: 'url_redirect',
        header: 'URL Redirect',
        cell: ({ row }) => {
            const url = row.original.url_redirect;
            return url && url.trim() ? (
                <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800">
                    {url.length > 30 ? `${url.substring(0, 30)}...` : url}
                </a>
            ) : (
                <span className="text-gray-400">-</span>
            );
        },
    },
    {
        id: 'actions',
        header: 'Aksi',
        cell: ({ row }) => <ActionCell promotion={row.original} promotions={promotions} />,
    },
];
