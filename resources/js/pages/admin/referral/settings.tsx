import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import AdminLayout from '@/layouts/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Settings, Save } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Referral & Poin',
        href: '#',
    },
    {
        title: 'Pengaturan',
        href: '/admin/referral/settings',
    },
];

interface SettingsProps {
    settings: {
        referral_reward: number;
        buyer_reward: number;
        referral_only_first_purchase: boolean;
    };
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function ReferralSettings({ settings, flash }: SettingsProps) {
    const { data, setData, post, processing, errors } = useForm({
        referral_reward: settings.referral_reward,
        buyer_reward: settings.buyer_reward,
        referral_only_first_purchase: settings.referral_only_first_purchase,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.referral.settings.update'), {
            onSuccess: () => {
                toast.success('Pengaturan referral berhasil disimpan!');
            },
            onError: () => {
                toast.error('Gagal menyimpan pengaturan.');
            }
        });
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Pengaturan Referral & Poin" />
            <div className="px-4 py-4 md:px-6 max-w-7xl">
                <div className="mb-6 space-y-1">
                    <h1 className="text-2xl font-semibold flex items-center gap-2">
                        <Settings className="h-6 w-6 text-foreground" />
                        Pengaturan Program Referral & Koin
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Konfigurasi reward poin yang diberikan kepada perujuk dan pembeli.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Parameter Reward</CardTitle>
                            <CardDescription>
                                Nilai 1 Poin setara dengan Rp 1 potongan harga saat checkout produk.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="referral_reward">Reward Perujuk (Referrer)</Label>
                                    <div className="relative">
                                        <Input
                                            id="referral_reward"
                                            type="number"
                                            min="0"
                                            value={data.referral_reward}
                                            onChange={(e) => setData('referral_reward', parseInt(e.target.value) || 0)}
                                            className="pr-16 bg-background"
                                            required
                                        />
                                        <div className="absolute top-1/2 right-3 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                                            POIN
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Jumlah poin yang diterima oleh pemilik kode referral saat kodenya berhasil digunakan.
                                    </p>
                                    {errors.referral_reward && (
                                        <p className="text-xs text-red-600">{errors.referral_reward}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="buyer_reward">Reward Pembeli (Buyer)</Label>
                                    <div className="relative">
                                        <Input
                                            id="buyer_reward"
                                            type="number"
                                            min="0"
                                            value={data.buyer_reward}
                                            onChange={(e) => setData('buyer_reward', parseInt(e.target.value) || 0)}
                                            className="pr-16 bg-background"
                                            required
                                        />
                                        <div className="absolute top-1/2 right-3 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                                            POIN
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Jumlah poin bonus yang didapatkan oleh pembeli baru yang menggunakan kode referral.
                                    </p>
                                    {errors.buyer_reward && (
                                        <p className="text-xs text-red-600">{errors.buyer_reward}</p>
                                    )}
                                </div>
                            </div>

                            <Separator />

                            <div className="flex items-center justify-between space-y-0 bg-muted/40 p-4 rounded-lg border">
                                <div className="space-y-0.5">
                                    <Label className="text-base" htmlFor="referral_only_first_purchase">
                                        Hanya Pembelian Pertama
                                    </Label>
                                    <p className="text-muted-foreground text-xs pr-4">
                                        Jika diaktifkan, bonus referral hanya akan diberikan ketika pembeli melakukan transaksi pertama kali di platform.
                                    </p>
                                </div>
                                <Switch
                                    id="referral_only_first_purchase"
                                    checked={data.referral_only_first_purchase}
                                    onCheckedChange={(checked) => setData('referral_only_first_purchase', checked)}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="justify-end border-t bg-muted/20 px-6 py-4">
                            <Button type="submit" disabled={processing} className="gap-2">
                                <Save className="h-4 w-4" />
                                {processing ? 'Menyimpan...' : 'Simpan Pengaturan'}
                            </Button>
                        </CardFooter>
                    </Card>
                </form>
            </div>
        </AdminLayout>
    );
}
