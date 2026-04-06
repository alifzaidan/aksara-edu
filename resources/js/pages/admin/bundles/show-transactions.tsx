import { columns, type BundleTransactionInvoice } from './columns-transactions';
import { DataTable } from './data-table-transactions';

interface BundleTransactionProps {
    transactions: BundleTransactionInvoice[];
    bundleId: string;
}

export default function BundleTransaction({ transactions, bundleId }: BundleTransactionProps) {
    const paidTransactions = transactions.filter((t) => t.status === 'paid');

    return (
        <div className="h-full space-y-6 rounded-lg border p-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">Transaksi & Peserta</h2>
                {transactions.length > 0 && (
                    <div className="text-muted-foreground text-sm">
                        Total Peserta: <span className="text-foreground font-semibold">{paidTransactions.length}</span>
                    </div>
                )}
            </div>

            {transactions.length > 0 ? (
                <DataTable columns={columns} data={transactions} bundleId={bundleId} />
            ) : (
                <div className="flex flex-col items-center justify-center gap-4 py-12">
                    <img src="/assets/images/not-found.webp" alt="Transaksi Tidak Tersedia" className="w-48" />
                    <p className="text-muted-foreground text-center text-sm">Belum ada transaksi untuk bundle ini.</p>
                </div>
            )}
        </div>
    );
}