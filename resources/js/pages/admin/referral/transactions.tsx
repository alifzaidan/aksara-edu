import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/layouts/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { Search, Plus, Coins, X } from 'lucide-react';
import { columns, PointTransaction } from './transaction-columns';
import { DataTable } from './data-table';

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

export default function PointTransactions({ transactions, users: initialUsers, filters }: TransactionsProps) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [dynamicSuggestions, setDynamicSuggestions] = useState<UserSelect[]>([]);
    const [selectedUser, setSelectedUser] = useState<{ name: string; email: string; point_balance: number } | null>(null);

    const suggestionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    const { data, setData, post, processing, errors, reset } = useForm({
        user_id: '',
        amount: '',
        description: '',
    });

    // Dynamic user search & check-email effect
    useEffect(() => {
        const query = data.user_id.trim();

        if (!query) {
            setDynamicSuggestions([]);
            setSelectedUser(null);
            return;
        }

        // Check if query matches selected user email
        if (selectedUser && selectedUser.email.toLowerCase() === query.toLowerCase()) {
            return;
        }

        const timer = setTimeout(async () => {
            setSearchLoading(true);

            try {
                // 1. Search endpoint for suggestions (searches all registered users in DB)
                const searchRes = await axios.get('/admin/referral/search-users', {
                    params: { q: query },
                });
                const fetchedUsers: UserSelect[] = searchRes.data || [];
                setDynamicSuggestions(fetchedUsers);

                // Check exact match from fetched users
                const exactMatch = fetchedUsers.find(
                    (u) => u.email.toLowerCase() === query.toLowerCase() || u.id === query
                );
                if (exactMatch) {
                    setSelectedUser({
                        name: exactMatch.name,
                        email: exactMatch.email,
                        point_balance: exactMatch.point_balance || 0,
                    });
                } else if (query.includes('@')) {
                    // 2. Check-email endpoint (register implementation)
                    const checkRes = await axios.post('/api/check-email', { email: query });
                    if (checkRes.data?.exists) {
                        setSelectedUser({
                            name: checkRes.data.name || 'Pengguna Terdaftar',
                            email: query,
                            point_balance: checkRes.data.point_balance || 0,
                        });
                    } else {
                        setSelectedUser(null);
                    }
                } else {
                    setSelectedUser(null);
                }
            } catch {
                setDynamicSuggestions([]);
                setSelectedUser(null);
            } finally {
                setSearchLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [data.user_id, selectedUser]);

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
                setSelectedUser(null);
                setDynamicSuggestions([]);
            },
            onError: (err) => {
                toast.error(err.amount || err.error || 'Gagal menyesuaikan poin.');
            }
        });
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Transaksi Koin & Penyesuaian" />
            <div className="px-4 py-4 md:px-6">
                <div className="mb-6 space-y-1">
                    <h1 className="text-2xl font-semibold flex items-center gap-2">
                        <Coins className="h-6 w-6 text-foreground" />
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
                            <CardHeader>
                                <CardTitle>Riwayat Ledger Poin</CardTitle>
                                <CardDescription>
                                    Log mutasi koin riil di database untuk audit.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <DataTable columns={columns} data={transactions.data} searchKey="user" searchPlaceholder="Cari nama..." />

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
                                                                ? 'bg-primary text-primary-foreground font-bold'
                                                                : 'bg-background text-foreground hover:bg-muted'
                                                        }`}
                                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right: Manual Adjustment Form */}
                    <div className="space-y-4">
                        <form onSubmit={handleAdjust}>
                            <Card className="border-border">
                                <CardHeader>
                                    <CardTitle className="text-foreground flex items-center gap-2">
                                        <Plus className="h-5 w-5" />
                                        Penyesuaian Saldo Poin
                                    </CardTitle>
                                    <CardDescription>
                                        Kurangi atau tambahkan saldo poin secara langsung ke akun pengguna.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2" ref={suggestionRef}>
                                        <Label htmlFor="user_id">Nama / Email Pengguna</Label>
                                        <div className="relative">
                                            <Input
                                                id="user_id"
                                                placeholder="Masukkan nama atau email pengguna terdaftar..."
                                                value={data.user_id}
                                                onChange={(e) => {
                                                    setData('user_id', e.target.value);
                                                    setShowSuggestions(true);
                                                }}
                                                onFocus={() => setShowSuggestions(true)}
                                                className="bg-background"
                                                required
                                                autoComplete="off"
                                            />
                                            {showSuggestions && dynamicSuggestions.length > 0 && (
                                                <div className="absolute z-50 w-full mt-1 bg-popover text-popover-foreground border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                                                    {dynamicSuggestions.map((u) => (
                                                        <button
                                                            key={u.id}
                                                            type="button"
                                                            className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground flex flex-col border-b border-border/50 last:border-b-0"
                                                            onClick={() => {
                                                                setData('user_id', u.email);
                                                                setSelectedUser({
                                                                    name: u.name,
                                                                    email: u.email,
                                                                    point_balance: u.point_balance || 0,
                                                                });
                                                                setShowSuggestions(false);
                                                            }}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-medium text-foreground">{u.name}</span>
                                                                <span className="text-xs text-emerald-600 font-semibold">{u.point_balance.toLocaleString('id-ID')} poin</span>
                                                            </div>
                                                            <span className="text-xs text-muted-foreground">{u.email}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {searchLoading && <p className="text-xs text-muted-foreground">Mencari pengguna terdaftar...</p>}

                                        {/* Selected User Badge */}
                                        {selectedUser && (
                                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                                <Badge
                                                    variant="secondary"
                                                    className="px-3 py-1.5 text-xs font-medium border border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 flex items-center gap-2"
                                                >
                                                    <span className="font-semibold">{selectedUser.email}</span>
                                                    <span className="text-muted-foreground">|</span>
                                                    <span>
                                                        point :{' '}
                                                        <strong className="text-emerald-700 dark:text-emerald-300 font-bold">
                                                            {selectedUser.point_balance.toLocaleString('id-ID')}
                                                        </strong>
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setData('user_id', '');
                                                            setSelectedUser(null);
                                                        }}
                                                        className="ml-1 text-emerald-700 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-100"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </Badge>
                                            </div>
                                        )}

                                        {!searchLoading && data.user_id.includes('@') && !selectedUser && (
                                            <p className="text-xs text-amber-600">Email tidak ditemukan di sistem.</p>
                                        )}

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
                                            className="bg-background"
                                            required
                                        />
                                        <p className="text-[11px] text-muted-foreground">
                                            Contoh: <span className="font-semibold text-green-600">5000</span> untuk menambah 5,000 poin, atau <span className="font-semibold text-red-600">-3000</span> untuk mengurangi 3,000 poin.
                                        </p>
                                        {errors.amount && <p className="text-xs text-red-600">{errors.amount}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description">Alasan / Keterangan Penyesuaian</Label>
                                        <Textarea
                                            id="description"
                                            placeholder="Contoh: Bonus pendaftaran webinar khusus atau koreksi saldo kesalahan sistem."
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            className="bg-background h-20"
                                            required
                                        />
                                        {errors.description && <p className="text-xs text-red-600">{errors.description}</p>}
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-muted/20 border-t px-6 py-4">
                                    <Button type="submit" disabled={processing} className="w-full">
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
