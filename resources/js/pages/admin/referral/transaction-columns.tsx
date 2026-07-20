import { Badge } from '@/components/ui/badge';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export interface PointTransaction {
    id: string;
    amount: number;
    type: 'reward' | 'redeem' | 'adjustment';
    source: 'referral' | 'checkout' | 'admin';
    description: string;
    created_at: string;
    user: {
        name: string;
        email: string;
    };
}

const getTransactionBadge = (type: string, source: string) => {
    if (source === 'referral') {
        return <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300">Referral Reward</Badge>;
    }
    if (source === 'checkout') {
        if (type === 'redeem') {
            return <Badge className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300">Diskon Pembelian</Badge>;
        }
        if (type === 'adjustment') {
            return <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300">Refund Poin</Badge>;
        }
    }
    if (source === 'admin') {
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300">Koreksi Admin</Badge>;
    }
    return <Badge variant="outline">{type} / {source}</Badge>;
};

export const columns: ColumnDef<PointTransaction>[] = [
    {
        accessorKey: 'no',
        header: 'No',
        cell: ({ row }) => {
            const index = row.index + 1;
            return <div className="font-medium">{index}</div>;
        },
    },
    {
        id: 'user',
        accessorFn: (row) => row.user?.name || 'Deleted User',
        header: 'User / Tanggal',
        cell: ({ row }) => {
            const tx = row.original;
            return (
                <div>
                    <div className="font-semibold text-sm">{tx.user?.name || 'Deleted User'}</div>
                    <div className="text-xs text-muted-foreground">
                        {format(new Date(tx.created_at), 'dd MMM yyyy HH:mm', { locale: localeId })}
                    </div>
                </div>
            );
        },
    },
    {
        accessorKey: 'type',
        header: 'Jenis Mutasi',
        cell: ({ row }) => {
            return getTransactionBadge(row.original.type, row.original.source);
        },
    },
    {
        accessorKey: 'description',
        header: 'Keterangan',
        cell: ({ row }) => {
            return <div className="text-xs text-muted-foreground max-w-[200px] truncate">{row.original.description}</div>;
        },
    },
    {
        accessorKey: 'amount',
        header: () => <div className="text-right">Jumlah Poin</div>,
        cell: ({ row }) => {
            const tx = row.original;
            return (
                <div className={`text-right font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <span className="inline-flex items-center gap-0.5 text-sm justify-end w-full">
                        {tx.amount > 0 ? (
                            <>
                                <ArrowUpRight className="h-3 w-3" />
                                +{tx.amount.toLocaleString('id-ID')}
                            </>
                        ) : (
                            <>
                                <ArrowDownLeft className="h-3 w-3" />
                                {tx.amount.toLocaleString('id-ID')}
                            </>
                        )}
                    </span>
                </div>
            );
        },
    },
];
