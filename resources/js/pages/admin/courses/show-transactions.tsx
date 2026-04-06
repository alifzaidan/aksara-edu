import { columns, type Invoice } from './columns-transactions';
import { DataTable } from './data-table-transactions';

interface CourseTransactionProps {
    transactions: Invoice[];
    courseId: string;
}

export default function CourseTransaction({ transactions, courseId }: CourseTransactionProps) {
    return (
        <div className="h-full space-y-6 rounded-lg border p-4">
            <h2 className="text-lg font-medium">Transaksi</h2>
            {transactions && transactions.length > 0 ? (
                <DataTable columns={columns} data={transactions} courseId={courseId} />
            ) : (
                <div className="flex flex-col items-center justify-center gap-4 py-12">
                    <img src="/assets/images/not-found.webp" alt="Transaksi Tidak Tersedia" className="w-48" />
                    <p className="text-muted-foreground text-center text-sm">Belum ada transaksi untuk kelas ini.</p>
                </div>
            )}
        </div>
    );
}
