import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { CheckCircle } from 'lucide-react';

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

interface Withdrawal {
    id: string;
    amount: number;
    withdrawn_at: string;
}

export default function AffiliateWithdrawals({ withdrawals }: { withdrawals: Withdrawal[] }) {
    if (!withdrawals || withdrawals.length === 0) {
        return (
            <div className="space-y-6 rounded-lg border p-4">
                <div>
                    <h2 className="text-lg font-medium">Data Penarikan Komisi</h2>
                    <p className="text-muted-foreground text-sm">Riwayat penarikan komisi affiliate</p>
                </div>
                <div className="rounded-lg border border-dashed p-8 text-center">
                    <p className="text-muted-foreground">Belum ada data penarikan</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 rounded-lg border p-4">
            <div>
                <h2 className="text-lg font-medium">Data Penarikan Komisi</h2>
                <p className="text-muted-foreground text-sm">Riwayat penarikan komisi affiliate</p>
            </div>
            <div className="space-y-4">
                {withdrawals.map((withdrawal) => (
                    <Card key={withdrawal.id} className="bg-green-50 dark:bg-green-950/20">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex flex-1 items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    <div>
                                        <p className="text-lg font-semibold">{formatCurrency(withdrawal.amount)}</p>
                                        <p className="text-muted-foreground text-sm">
                                            {format(new Date(withdrawal.withdrawn_at), 'dd MMMM yyyy HH:mm', { locale: id })}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-green-600">Selesai</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950/20">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Penarikan Keseluruhan</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(withdrawals.reduce((sum, w) => sum + w.amount, 0))}
                </p>
            </div>
        </div>
    );
}
