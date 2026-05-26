import { transactionColumns, type Invoice } from './columns-transactions';
import { DataTable } from './data-table-transactions';

interface CertificationProgramTransactionProps {
    transactions: Invoice[];
    programId: string;
}

export default function CertificationProgramTransaction({ transactions, programId }: CertificationProgramTransactionProps) {
    return (
        <div className="h-full space-y-6 rounded-lg border p-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">Data Transaksi Pembayaran</h2>
                {transactions.length > 0 && (
                    <div className="text-muted-foreground text-sm">
                        Total Transaksi Berhasil:{' '}
                        <span className="text-foreground font-semibold">{transactions.filter((t) => t.status === 'paid').length}</span>
                    </div>
                )}
            </div>

            {transactions && transactions.length > 0 ? (
                <DataTable columns={transactionColumns} data={transactions} programId={programId} />
            ) : (
                <div className="flex flex-col items-center justify-center gap-4 py-12">
                    <img src="/assets/images/not-found.webp" alt="Transaksi Tidak Tersedia" className="w-48" />
                    <p className="text-muted-foreground text-center text-sm">Belum ada transaksi untuk program ini.</p>
                </div>
            )}
        </div>
    );
}
