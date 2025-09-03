import { createColumns, type Invoice } from './columns-transactions';
import { DataTable } from './data-table-transactions';

interface BootcampTransactionProps {
    transactions: Invoice[];
    totalSchedules: number;
}

export default function BootcampTransaction({ transactions, totalSchedules }: BootcampTransactionProps) {
    const columns = createColumns(totalSchedules);

    return (
        <div className="h-full space-y-6 rounded-lg border p-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">Transaksi & Peserta</h2>
                {transactions.length > 0 && (
                    <div className="text-muted-foreground text-sm">Total Peserta: {transactions.filter((t) => t.status === 'paid').length}</div>
                )}
            </div>

            {transactions.length > 0 ? (
                <DataTable columns={columns} data={transactions} />
            ) : (
                <div className="flex flex-col items-center justify-center gap-4 py-12">
                    <img src="/assets/images/not-found.webp" alt="Transaksi Tidak Tersedia" className="w-48" />
                    <p className="text-muted-foreground text-center text-sm">Belum ada transaksi untuk bootcamp ini.</p>
                </div>
            )}
        </div>
    );
}
