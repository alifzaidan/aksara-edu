import { ColumnDef } from '@tanstack/react-table';

export interface Promotion {
    id: number;
    promotion_flyer: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
    url_redirect: string;
}

export const columns: ColumnDef<Promotion>[] = [
    {
        accessorKey: 'promotion_flyer',
        header: 'Flyer',
        cell: ({ row }) => (
            <img
                src={row.original.promotion_flyer}
                alt="Flyer"
                className="h-16 rounded border object-cover"
            />
        ),
    },
    {
        accessorKey: 'start_date',
        header: 'Mulai',
    },
    {
        accessorKey: 'end_date',
        header: 'Selesai',
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
        cell: ({ row }) => (
            <a
                href={row.original.url_redirect}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
            >
                {row.original.url_redirect}
            </a>
        ),
    },
    // Tambahkan kolom aksi jika perlu
];