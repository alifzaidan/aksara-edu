import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { Banknote, CheckCircle, Package, Wallet } from 'lucide-react';
import { Earning, getColumns } from '../earnings/columns';
import { DataTable } from '../earnings/data-table';

interface Stats {
    total_products: number;
    total_commission: number;
    paid_commission: number;
    available_commission: number;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
};

export default function AffiliateEarnings({ earnings, stats }: { earnings: Earning[]; stats: Stats }) {
    const { auth } = usePage<SharedData>().props;
    const role = auth.role[0];
    const isAdmin = role === 'admin';
    const columns = getColumns(isAdmin);

    return (
        <div className="h-full space-y-6 rounded-lg border p-4">
            <div>
                <h2 className="text-lg font-medium">Statistik Pendapatan</h2>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Produk Terjual</CardTitle>
                            <Package className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold md:text-xl">{stats.total_products}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Komisi</CardTitle>
                            <Wallet className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold md:text-xl">{formatCurrency(stats.total_commission)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Komisi Tersedia</CardTitle>
                            <Banknote className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold md:text-xl">{formatCurrency(stats.available_commission)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Komisi Terbayar</CardTitle>
                            <CheckCircle className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold md:text-xl">{formatCurrency(stats.paid_commission)}</div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="mt-6">
                <h2 className="text-lg font-medium">Riwayat Pendapatan</h2>
                <DataTable columns={columns} data={earnings} />
            </div>
        </div>
    );
}
