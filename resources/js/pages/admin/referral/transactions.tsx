import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import AdminLayout from '@/layouts/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Award, Search, ArrowUpRight, ArrowDownLeft, Plus, AlertCircle, Coins } from 'lucide-react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Referral & Poin',
        href: '#',
    },
    {
        title: 'Riwayat Transaksi',
        href: '/admin/referral/transactions',
    },
];

interface UserSelect {
    id: string;
    name: string;
    email: string;
    point_balance: number;
}

interface PointTransaction {
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

interface TransactionsProps {
    transactions: {
        data: PointTransaction[];
        current_page: number;
        last_page: number;
        total: number;
        links: any[];
    };
    users: UserSelect[];
    filters: {
        search?: string;
    };
}

export default function PointTransactions({ transactions, users, filters }: TransactionsProps) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    
    const { data, setData, post, processing, errors, reset } = useForm({
        user_id: '',
        amount: '',
        description: '',
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // Trigger page load with search parameter
        const url = new URL(window.location.href);
        if (searchQuery.trim()) {
            url.searchParams.set('search', searchQuery);
        } else {
            url.searchParams.delete('search');
        }
        window.location.href = url.pathname + url.search;
    };

    const handleAdjust = (e: React.FormEvent) => {
        e.preventDefault();
        if (!data.user_id) {
            toast.error('Pilih pengguna terlebih dahulu.');
            return;
        }
        if (!data.amount || parseInt(data.amount) === 0) {
            toast.error('Masukkan jumlah koin penyesuaian non-nol.');
            return;
        }
        if (!data.description.trim()) {
            toast.error('Masukkan keterangan alasan penyesuaian.');
            return;
        }

        post(route('admin.referral.adjust-points'), {
            onSuccess: () => {
                toast.success('Poin berhasil disesuaikan secara manual!');
                reset();
            },
            onError: (err) => {
                toast.error(err.amount || err.error || 'Gagal menyesuaikan poin.');
            }
        });
    };

    const getTransactionBadge = (type: string, source: string) => {
        if (source === 'referral') {
            return <Badge className="bg-green-100 text-green-800 border-green-200">Referral Reward</Badge>;
        }
        if (source === 'checkout') {
            if (type === 'redeem') {
                return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Diskon Pembelian</Badge>;
            }
            if (type === 'adjustment') {
                return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Refund Poin</Badge>;
            }
        }
        if (source === 'admin') {
            return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Koreksi Admin</Badge>;
        }
        return <Badge variant="outline">{type} / {source}</Badge>;
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Transaksi Koin & Penyesuaian" />
            <div className="px-4 py-4 md:px-6">
                <div className="mb-6 space-y-1">
                    <h1 className="text-2xl font-semibold flex items-center gap-2">
                        <Coins className="h-6 w-6 text-gray-700" />
                        Audit Ledger Poin & Penyesuaian Manual
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Laporan audit log pergerakan poin sistem dan form untuk koreksi saldo poin pengguna.
                    </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Left: Point Transactions Table */}
                    <div className="lg:col-span-2 space-y-4">
                        <Card>
                            <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div>
                                    <CardTitle>Riwayat Ledger Poin</CardTitle>
                                    <CardDescription>
                                        Log mutasi koin riil di database untuk audit.
                                    </CardDescription>
                                </div>
                                <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-auto">
                                    <Input
                                        placeholder="Cari nama / email..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="h-8 max-w-xs"
                                    />
                                    <Button type="submit" size="sm" variant="secondary" className="h-8">
                                        <Search className="h-4 w-4" />
                                    </Button>
                                </form>
                            </CardHeader>
                            <CardContent>
                                {transactions.data.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <Award className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                                        <p className="text-sm">Tidak ada mutasi poin yang ditemukan.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>User / Tanggal</TableHead>
                                                    <TableHead>Jenis Mutasi</TableHead>
                                                    <TableHead>Keterangan</TableHead>
                                                    <TableHead className="text-right">Jumlah Poin</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {transactions.data.map((tx) => (
                                                    <TableRow key={tx.id}>
                                                        <TableCell>
                                                            <div className="font-semibold text-sm">{tx.user?.name || 'Deleted User'}</div>
                                                            <div className="text-xs text-gray-500">
                                                                {format(new Date(tx.created_at), 'dd MMM yyyy HH:mm', { locale: localeId })}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>{getTransactionBadge(tx.type, tx.source)}</TableCell>
                                                        <TableCell className="text-xs max-w-[200px] truncate">{tx.description}</TableCell>
                                                        <TableCell className={`text-right font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                            <span className="inline-flex items-center gap-0.5 text-sm">
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
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>

                                        {/* Pagination */}
                                        {transactions.last_page > 1 && (
                                            <div className="flex items-center justify-between pt-4 mt-4 border-t">
                                                <span className="text-xs text-muted-foreground">
                                                    Halaman {transactions.current_page} dari {transactions.last_page}
                                                </span>
                                                <div className="flex gap-2">
                                                    {transactions.links.map((link, idx) => {
                                                        if (link.url === null) return null;
                                                        return (
                                                            <Link
                                                                key={idx}
                                                                href={link.url}
                                                                className={`px-2.5 py-1 text-xs border rounded-md ${
                                                                    link.active
                                                                        ? 'bg-primary text-white font-bold'
                                                                        : 'bg-white text-gray-700 hover:bg-gray-50'
                                                                }`}
                                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right: Manual Adjustment Form */}
                    <div className="space-y-4">
                        <form onSubmit={handleAdjust}>
                            <Card className="border-indigo-100 dark:border-zinc-800">
                                <CardHeader>
                                    <CardTitle className="text-indigo-900 dark:text-indigo-400 flex items-center gap-2">
                                        <Plus className="h-5 w-5" />
                                        Penyesuaian Saldo Poin
                                    </CardTitle>
                                    <CardDescription>
                                        Kurangi atau tambahkan saldo poin secara langsung ke akun pengguna.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="user_id">Pilih Pengguna</Label>
                                        <select
                                            id="user_id"
                                            value={data.user_id}
                                            onChange={(e) => setData('user_id', e.target.value)}
                                            className="w-full border rounded-md px-3 py-2 text-sm bg-white dark:bg-zinc-950"
                                            required
                                        >
                                            <option value="">-- Pilih Pengguna --</option>
                                            {users.map((u) => (
                                                <option key={u.id} value={u.id}>
                                                    {u.name} ({u.email}) - Saldo: {u.point_balance.toLocaleString('id-ID')}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.user_id && <p className="text-xs text-red-600">{errors.user_id}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="amount">Jumlah Poin</Label>
                                        <Input
                                            id="amount"
                                            type="number"
                                            placeholder="Gunakan tanda minus (-) untuk mengurangi"
                                            value={data.amount}
                                            onChange={(e) => setData('amount', e.target.value)}
                                            required
                                        />
                                        <p className="text-[11px] text-muted-foreground">
                                            Contoh: <span className="font-semibold text-green-600">5000</span> untuk menambah 5,000 poin, atau <span className="font-semibold text-red-600">-3000</span> untuk mengurangi 3,000 poin.
                                        </p>
                                        {errors.amount && <p className="text-xs text-red-600">{errors.amount}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description">Alasan / Keterangan Penyesuaian</Label>
                                        <textarea
                                            id="description"
                                            placeholder="Contoh: Bonus pendaftaran webinar khusus atau koreksi saldo kesalahan sistem."
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            className="w-full border rounded-md px-3 py-2 text-sm bg-white dark:bg-zinc-950 h-20"
                                            required
                                        />
                                        {errors.description && <p className="text-xs text-red-600">{errors.description}</p>}
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-indigo-50/20 border-t px-6 py-4 dark:bg-zinc-900/10">
                                    <Button type="submit" disabled={processing} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                                        {processing ? 'Memproses...' : 'Terapkan Penyesuaian'}
                                    </Button>
                                </CardFooter>
                            </Card>
                        </form>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
