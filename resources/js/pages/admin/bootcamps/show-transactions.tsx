import { columns, type Invoice } from './columns-transactions';
import { DataTable } from './data-table-transactions';

export default function BootcampTransaction({ transactions }: { transactions: Invoice[] }) {
    return (
        <div className="h-full space-y-6 rounded-lg border p-4">
            <h2 className="text-lg font-medium">Transaksi</h2>
            {transactions.length > 0 ? (
                <DataTable columns={columns} data={transactions} />
            ) : (
                <div className="flex flex-col items-center justify-center gap-4 py-12">
                    <img src="/assets/images/not-found.svg" alt="Transaksi Tidak Tersedia" className="w-48" />
                    <p className="text-muted-foreground text-center text-sm">Belum ada transaksi untuk bootcamp ini.</p>
                </div>
            )}
        </div>
    );
}
