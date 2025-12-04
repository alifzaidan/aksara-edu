import DeleteConfirmDialog from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminLayout from '@/layouts/admin-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Banknote, CirclePower, Edit, Trash } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Affiliate } from '../affiliates/columns';
import { Earning } from '../earnings/columns';
import EditAffiliate from './edit';
import AffiliateDetail from './show-details';
import AffiliateEarnings from './show-earnings';

interface Stats {
    total_products: number;
    total_commission: number;
    paid_commission: number;
    available_commission: number;
}

interface AffiliateProps {
    affiliate: Affiliate;
    earnings?: Earning[];
    stats: Stats;
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function ShowAffiliate({ affiliate, earnings, stats, flash }: AffiliateProps) {
    const [open, setOpen] = useState(false);
    const [withdrawOpen, setWithdrawOpen] = useState(false);
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Afiliasi',
            href: route('affiliates.index'),
        },
        {
            title: affiliate.name,
            href: route('affiliates.show', { affiliate: affiliate.id }),
        },
    ];

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const handleDelete = () => {
        router.delete(route('affiliates.destroy', affiliate.id));
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        setWithdrawAmount(value);
    };

    const handleWithdraw = () => {
        const amount = parseInt(withdrawAmount);

        if (!amount || amount <= 0) {
            toast.error('Masukkan nominal yang valid');
            return;
        }

        if (amount > stats.available_commission) {
            toast.error(`Nominal melebihi komisi tersedia (${formatCurrency(stats.available_commission)})`);
            return;
        }

        setIsWithdrawing(true);
        router.post(
            route('affiliates.withdraw', affiliate.id),
            { amount }, // ✅ Send amount to backend
            {
                onSuccess: () => {
                    setWithdrawOpen(false);
                    setWithdrawAmount('');
                },
                onFinish: () => setIsWithdrawing(false),
            },
        );
    };

    const handleQuickFill = (percentage: number) => {
        const amount = Math.floor(stats.available_commission * percentage);
        setWithdrawAmount(amount.toString());
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`Detail Afiliasi - ${affiliate.name}`} />
            <div className="px-4 py-4 md:px-6">
                <h1 className="mb-4 text-2xl font-semibold">{`Detail ${affiliate.name}`}</h1>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
                    <Tabs defaultValue="detail" className="lg:col-span-2">
                        <TabsList>
                            <TabsTrigger value="detail">Detail</TabsTrigger>
                            <TabsTrigger value="transaksi">
                                Transaksi
                                {earnings!.length > 0 && (
                                    <span className="bg-primary/10 ml-1 rounded-full px-2 py-0.5 text-xs">{earnings!.length}</span>
                                )}
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="detail">
                            <AffiliateDetail affiliate={affiliate} />
                        </TabsContent>
                        <TabsContent value="transaksi">
                            <AffiliateEarnings earnings={earnings ?? []} stats={stats} />
                        </TabsContent>
                    </Tabs>

                    <div>
                        <h2 className="my-2 text-lg font-medium">Edit & Kustom</h2>
                        <div className="space-y-4 rounded-lg border p-4">
                            {stats.available_commission > 0 && (
                                <>
                                    <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
                                        <DialogTrigger asChild>
                                            <Button className="w-full border-green-700 bg-green-600 hover:bg-green-700">
                                                <Banknote />
                                                Tarik Komisi
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Tarik Komisi</DialogTitle>
                                                <DialogDescription>
                                                    Masukkan nominal komisi yang ingin ditarik untuk {affiliate.name}
                                                </DialogDescription>
                                            </DialogHeader>

                                            <div className="space-y-4 py-4">
                                                <div className="rounded-lg bg-green-50 p-4 dark:bg-green-950/20">
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">Komisi Tersedia</p>
                                                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                                        {formatCurrency(stats.available_commission)}
                                                    </p>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="amount">Nominal Penarikan</Label>
                                                    <div className="relative">
                                                        <span className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500">Rp</span>
                                                        <Input
                                                            id="amount"
                                                            type="text"
                                                            placeholder="0"
                                                            value={withdrawAmount ? parseInt(withdrawAmount).toLocaleString('id-ID') : ''}
                                                            onChange={handleAmountChange}
                                                            className="pl-10"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label className="text-sm">Pilih Cepat</Label>
                                                    <div className="grid grid-cols-4 gap-2">
                                                        <Button type="button" variant="outline" size="sm" onClick={() => handleQuickFill(0.25)}>
                                                            25%
                                                        </Button>
                                                        <Button type="button" variant="outline" size="sm" onClick={() => handleQuickFill(0.5)}>
                                                            50%
                                                        </Button>
                                                        <Button type="button" variant="outline" size="sm" onClick={() => handleQuickFill(0.75)}>
                                                            75%
                                                        </Button>
                                                        <Button type="button" variant="outline" size="sm" onClick={() => handleQuickFill(1)}>
                                                            100%
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>

                                            <DialogFooter>
                                                <Button variant="outline" onClick={() => setWithdrawOpen(false)} disabled={isWithdrawing}>
                                                    Batal
                                                </Button>
                                                <Button onClick={handleWithdraw} disabled={isWithdrawing} className="bg-green-600 hover:bg-green-700">
                                                    {isWithdrawing ? 'Memproses...' : 'Tarik Sekarang'}
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                    <Separator />
                                </>
                            )}

                            <Button asChild className="w-full">
                                <Link method="post" href={route('affiliates.toggleStatus', { affiliate: affiliate.id })}>
                                    <CirclePower />
                                    {affiliate.affiliate_status === 'Active' ? <span>Non Aktifkan Afiliasi</span> : <span>Aktifkan Afiliasi</span>}
                                </Link>
                            </Button>
                            <Separator />
                            <div className="space-y-2">
                                <Dialog open={open} onOpenChange={setOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="w-full" variant="secondary">
                                            <Edit />
                                            Edit
                                        </Button>
                                    </DialogTrigger>
                                    <EditAffiliate affiliate={affiliate} setOpen={setOpen} />
                                </Dialog>
                                <DeleteConfirmDialog
                                    trigger={
                                        <Button variant="destructive" className="w-full">
                                            <Trash /> Hapus
                                        </Button>
                                    }
                                    title="Apakah Anda yakin ingin menghapus afiliasi ini?"
                                    itemName={affiliate.name}
                                    onConfirm={handleDelete}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-4 rounded-lg border p-4">
                    <h3 className="text-muted-foreground text-center text-sm">
                        Dibuat pada : {format(new Date(affiliate.created_at), 'dd MMMM yyyy HH:mm', { locale: id })}
                    </h3>
                </div>
            </div>
        </AdminLayout>
    );
}
