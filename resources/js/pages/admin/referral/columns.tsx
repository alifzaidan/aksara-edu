import { Badge } from '@/components/ui/badge';
import { ColumnDef } from '@tanstack/react-table';

export interface Referrer {
    id: string;
    name: string;
    email: string;
    referral_code: string;
    point_balance: number;
    referrals_count: number;
    created_at: string;
}

export const columns: ColumnDef<Referrer>[] = [
    {
        accessorKey: 'no',
        header: 'No',
        cell: ({ row }) => {
            const index = row.index + 1;
            return <div className="font-medium">{index}</div>;
        },
    },
    {
        accessorKey: 'name',
        header: 'Nama Pengguna',
        cell: ({ row }) => {
            return <div className="font-semibold">{row.original.name}</div>;
        },
    },
    {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => {
            return <div className="text-muted-foreground">{row.original.email}</div>;
        },
    },
    {
        accessorKey: 'referral_code',
        header: 'Kode Referral',
        cell: ({ row }) => {
            return (
                <Badge variant="secondary" className="font-mono">
                    {row.original.referral_code}
                </Badge>
            );
        },
    },
    {
        accessorKey: 'point_balance',
        header: 'Saldo Poin',
        cell: ({ row }) => {
            return <div className="font-mono font-semibold">{row.original.point_balance.toLocaleString('id-ID')}</div>;
        },
    },
    {
        accessorKey: 'referrals_count',
        header: () => <div className="text-right">Total Transaksi Rujukan</div>,
        cell: ({ row }) => {
            return <div className="text-right font-bold text-primary">{row.original.referrals_count} ×</div>;
        },
    },
];
