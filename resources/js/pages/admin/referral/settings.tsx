import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminLayout from '@/layouts/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import {
    Settings,
    Save,
    Award,
    Target,
    BookOpen,
    Video,
    Package,
    GraduationCap,
    Coins,
    Percent,
    ShieldAlert,
    CheckCircle2
} from 'lucide-react';
import { usePermission } from '@/hooks/use-permission';

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

export interface ProgramSettingItem {
    name: string;
    is_enabled: boolean;
    referrer_reward_type: 'fixed' | 'percentage';
    referrer_rate: number;
    referrer_max_reward: number | null;
    buyer_reward_type: 'fixed' | 'percentage';
    buyer_rate: number;
    buyer_max_reward: number | null;
}

interface SettingsProps {
    settings: {
        referral_reward: number;
        buyer_reward: number;
        referral_only_first_purchase: boolean;
        programs: Record<string, ProgramSettingItem>;
    };
    flash?: {
        success?: string;
        error?: string;
    };
}

const PROGRAM_METAS: Record<string, { label: string; icon: any; color: string; desc: string }> = {
    certification_program: {
        label: 'Program Sertifikasi',
        icon: Award,
        color: 'text-amber-500',
        desc: 'Pengaturan koin referral untuk kelas sertifikasi kompetensi.',
    },
    bootcamp: {
        label: 'Bootcamp',
        icon: Target,
        color: 'text-blue-500',
        desc: 'Pengaturan koin referral untuk kelas bootcamp intensif.',
    },
    course: {
        label: 'Kelas Online',
        icon: BookOpen,
        color: 'text-emerald-500',
        desc: 'Pengaturan koin referral untuk video course mandiri.',
    },
    webinar: {
        label: 'Webinar',
        icon: Video,
        color: 'text-purple-500',
        desc: 'Pengaturan koin referral untuk sesi workshop/webinar.',
    },
    bundle: {
        label: 'Paket Bundling',
        icon: Package,
        color: 'text-indigo-500',
        desc: 'Pengaturan koin referral untuk paket bundling gabungan.',
    },
    private: {
        label: 'Kelas Privat',
        icon: GraduationCap,
        color: 'text-rose-500',
        desc: 'Pengaturan koin referral untuk pendampingan 1-on-1 private class.',
    },
};

interface ReferralFormData {
    [key: string]: any;
    referral_reward: number;
    buyer_reward: number;
    referral_only_first_purchase: boolean;
    programs: Record<string, ProgramSettingItem>;
}

export default function ReferralSettings({ settings }: SettingsProps) {
    const { canManage } = usePermission();
    const canManageReferral = canManage('referral');

    const [activeTab, setActiveTab] = useState<string>('certification_program');

    const { data, setData, post, processing, errors } = useForm<ReferralFormData>({
        referral_reward: settings.referral_reward,
        buyer_reward: settings.buyer_reward,
        referral_only_first_purchase: settings.referral_only_first_purchase,
        programs: settings.programs || {},
    });

    const updateProgramField = (programKey: string, field: keyof ProgramSettingItem, value: any) => {
        setData('programs', {
            ...(data.programs || {}),
            [programKey]: {
                ...(data.programs?.[programKey] || {}),
                [field]: value,
            },
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!canManageReferral) return;

        post(route('admin.referral.settings.update'), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Pengaturan referral berhasil disimpan!');
            },
            onError: () => {
                toast.error('Gagal menyimpan pengaturan. Mohon periksa kembali input Anda.');
            },
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
                        Konfigurasi aturan reward referral modular per program dalam nominal tetap (Rp) maupun persentase (%).
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Aturan Global Akun */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <ShieldAlert className="h-5 w-5 text-primary" />
                                Kebijakan Global Pembelian Pertama
                            </CardTitle>
                            <CardDescription>
                                Berlaku untuk seluruh program agar mencegah eksploitasi kode referral oleh user yang sama.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between space-y-0 bg-muted/40 p-4 rounded-lg border">
                                <div className="space-y-0.5">
                                    <Label className="text-base font-semibold" htmlFor="referral_only_first_purchase">
                                        Hanya Berlaku pada Pembelian Pertama
                                    </Label>
                                    <p className="text-muted-foreground text-xs pr-4">
                                        Jika diaktifkan, bonus referral hanya akan diberikan jika pembeli belum pernah memiliki transaksi berbayar yang sukses di platform.
                                    </p>
                                </div>
                                <Switch
                                    id="referral_only_first_purchase"
                                    disabled={!canManageReferral}
                                    checked={data.referral_only_first_purchase}
                                    onCheckedChange={(checked) => setData('referral_only_first_purchase', checked)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Matrix Program Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Coins className="h-5 w-5 text-amber-500" />
                                Pengaturan Referral per Jenis Program
                            </CardTitle>
                            <CardDescription>
                                Setiap kategori program memiliki saklar aktif dan parameter reward independen. 1 Poin = Rp 1 potongan belanja.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                <TabsList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 h-auto p-1 bg-muted/60">
                                    {Object.entries(PROGRAM_METAS).map(([key, meta]) => {
                                        const prog = data.programs[key];
                                        const isEnabled = prog?.is_enabled ?? true;
                                        const IconComp = meta.icon;

                                        return (
                                            <TabsTrigger
                                                key={key}
                                                value={key}
                                                className="flex flex-col items-center gap-1 py-2 text-xs relative data-[state=active]:bg-background data-[state=active]:shadow-sm"
                                            >
                                                <div className="flex items-center gap-1.5">
                                                    <IconComp className={`h-4 w-4 ${meta.color}`} />
                                                    <span className="font-medium truncate">{meta.label}</span>
                                                </div>
                                                <Badge
                                                    variant={isEnabled ? 'default' : 'secondary'}
                                                    className={`text-[10px] px-1.5 py-0 font-normal ${
                                                        isEnabled ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-muted-foreground/20 text-muted-foreground'
                                                    }`}
                                                >
                                                    {isEnabled ? 'Aktif' : 'Nonaktif'}
                                                </Badge>
                                            </TabsTrigger>
                                        );
                                    })}
                                </TabsList>

                                {Object.entries(PROGRAM_METAS).map(([key, meta]) => {
                                    const prog = data.programs[key] || {
                                        name: meta.label,
                                        is_enabled: true,
                                        referrer_reward_type: 'fixed',
                                        referrer_rate: 20000,
                                        referrer_max_reward: null,
                                        buyer_reward_type: 'fixed',
                                        buyer_rate: 15000,
                                        buyer_max_reward: null,
                                    };
                                    const IconComp = meta.icon;

                                    return (
                                        <TabsContent key={key} value={key} className="mt-4 space-y-6">
                                            {/* Header Saklar Program */}
                                            <div className="flex items-center justify-between p-4 rounded-xl border bg-card shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2.5 rounded-lg bg-muted">
                                                        <IconComp className={`h-6 w-6 ${meta.color}`} />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-base">{meta.label}</h3>
                                                        <p className="text-xs text-muted-foreground">{meta.desc}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Label htmlFor={`enabled_${key}`} className="text-sm font-medium">
                                                        {prog.is_enabled ? 'Referral Diizinkan' : 'Referral Dinonaktifkan'}
                                                    </Label>
                                                    <Switch
                                                        id={`enabled_${key}`}
                                                        disabled={!canManageReferral}
                                                        checked={prog.is_enabled}
                                                        onCheckedChange={(checked) => updateProgramField(key, 'is_enabled', checked)}
                                                    />
                                                </div>
                                            </div>

                                            {!prog.is_enabled ? (
                                                <div className="p-8 text-center border rounded-xl bg-muted/20 space-y-2">
                                                    <div className="inline-flex p-3 rounded-full bg-muted text-muted-foreground">
                                                        <ShieldAlert className="h-6 w-6" />
                                                    </div>
                                                    <h4 className="font-medium text-sm">Referral Dinonaktifkan untuk {meta.label}</h4>
                                                    <p className="text-xs text-muted-foreground max-w-md mx-auto">
                                                        Pengguna tidak dapat menggunakan kode referral saat membeli program ini di halaman checkout.
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="grid gap-6 md:grid-cols-2">
                                                    {/* Sisi Perujuk (Referrer) */}
                                                    <Card className="border bg-card/50 shadow-none">
                                                        <CardHeader className="pb-3 border-b bg-muted/10">
                                                            <div className="flex items-center justify-between">
                                                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                                                    <Coins className="h-4 w-4 text-amber-500" />
                                                                    Reward Pemilik Kode (Perujuk)
                                                                </CardTitle>
                                                                <Badge variant="outline" className="text-xs font-mono">
                                                                    {prog.referrer_reward_type === 'percentage' ? 'Persen (%)' : 'Nominal (Rp)'}
                                                                </Badge>
                                                            </div>
                                                            <CardDescription className="text-xs">
                                                                Koin yang diterima pengguna yang membagikan referral saat kodenya berhasil digunakan.
                                                            </CardDescription>
                                                        </CardHeader>
                                                        <CardContent className="pt-4 space-y-4">
                                                            <div className="space-y-1.5">
                                                                <Label className="text-xs font-medium">Tipe Reward</Label>
                                                                <Select
                                                                    disabled={!canManageReferral}
                                                                    value={prog.referrer_reward_type}
                                                                    onValueChange={(val: 'fixed' | 'percentage') =>
                                                                        updateProgramField(key, 'referrer_reward_type', val)
                                                                    }
                                                                >
                                                                    <SelectTrigger className="h-9 text-xs">
                                                                        <SelectValue placeholder="Pilih Tipe Reward" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="fixed" className="text-xs">
                                                                            Nominal Tetap (Rp / Poin Flat)
                                                                        </SelectItem>
                                                                        <SelectItem value="percentage" className="text-xs">
                                                                            Persentase (% dari Harga Nett)
                                                                        </SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>

                                                            <div className="space-y-1.5">
                                                                <Label className="text-xs font-medium">
                                                                    {prog.referrer_reward_type === 'percentage'
                                                                        ? 'Persentase Reward'
                                                                        : 'Nominal Reward'}
                                                                </Label>
                                                                <div className="relative">
                                                                    <Input
                                                                        type="number"
                                                                        min="0"
                                                                        max={prog.referrer_reward_type === 'percentage' ? 100 : undefined}
                                                                        disabled={!canManageReferral}
                                                                        value={prog.referrer_rate}
                                                                        onChange={(e) =>
                                                                            updateProgramField(key, 'referrer_rate', parseInt(e.target.value) || 0)
                                                                        }
                                                                        className="h-9 pr-14 text-sm"
                                                                        required
                                                                    />
                                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                                                                        {prog.referrer_reward_type === 'percentage' ? '%' : 'POIN'}
                                                                    </span>
                                                                </div>
                                                                <p className="text-[11px] text-muted-foreground">
                                                                    {prog.referrer_reward_type === 'percentage'
                                                                        ? `Contoh: 10% dari transaksi Rp 500.000 = 50.000 koin.`
                                                                        : `Perujuk mendapatkan ${prog.referrer_rate.toLocaleString('id-ID')} koin per transaksi.`}
                                                                </p>
                                                            </div>

                                                            {prog.referrer_reward_type === 'percentage' && (
                                                                <div className="space-y-1.5 pt-1">
                                                                    <Label className="text-xs font-medium flex items-center justify-between">
                                                                        <span>Batas Maksimal Reward (Cap Limit)</span>
                                                                        <span className="text-[10px] text-muted-foreground font-normal">Opsional</span>
                                                                    </Label>
                                                                    <div className="relative">
                                                                        <Input
                                                                            type="number"
                                                                            min="0"
                                                                            placeholder="Tanpa batas maksimal"
                                                                            disabled={!canManageReferral}
                                                                            value={prog.referrer_max_reward ?? ''}
                                                                            onChange={(e) =>
                                                                                updateProgramField(
                                                                                    key,
                                                                                    'referrer_max_reward',
                                                                                    e.target.value === '' ? null : parseInt(e.target.value) || 0
                                                                                )
                                                                            }
                                                                            className="h-9 pr-14 text-sm"
                                                                        />
                                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                                                                            POIN
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-[11px] text-muted-foreground">
                                                                        Mencegah koin melebihi batas jika harga program sangat tinggi. Kosongkan jika tanpa batas.
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </CardContent>
                                                    </Card>

                                                    {/* Sisi Pembeli (Buyer) */}
                                                    <Card className="border bg-card/50 shadow-none">
                                                        <CardHeader className="pb-3 border-b bg-muted/10">
                                                            <div className="flex items-center justify-between">
                                                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                                    Reward Pembeli (Pengguna Kode)
                                                                </CardTitle>
                                                                <Badge variant="outline" className="text-xs font-mono">
                                                                    {prog.buyer_reward_type === 'percentage' ? 'Persen (%)' : 'Nominal (Rp)'}
                                                                </Badge>
                                                            </div>
                                                            <CardDescription className="text-xs">
                                                                Koin bonus yang diterima pembeli baru yang melakukan transaksi memakai kode referral.
                                                            </CardDescription>
                                                        </CardHeader>
                                                        <CardContent className="pt-4 space-y-4">
                                                            <div className="space-y-1.5">
                                                                <Label className="text-xs font-medium">Tipe Reward</Label>
                                                                <Select
                                                                    disabled={!canManageReferral}
                                                                    value={prog.buyer_reward_type}
                                                                    onValueChange={(val: 'fixed' | 'percentage') =>
                                                                        updateProgramField(key, 'buyer_reward_type', val)
                                                                    }
                                                                >
                                                                    <SelectTrigger className="h-9 text-xs">
                                                                        <SelectValue placeholder="Pilih Tipe Reward" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="fixed" className="text-xs">
                                                                            Nominal Tetap (Rp / Poin Flat)
                                                                        </SelectItem>
                                                                        <SelectItem value="percentage" className="text-xs">
                                                                            Persentase (% dari Harga Nett)
                                                                        </SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>

                                                            <div className="space-y-1.5">
                                                                <Label className="text-xs font-medium">
                                                                    {prog.buyer_reward_type === 'percentage'
                                                                        ? 'Persentase Reward'
                                                                        : 'Nominal Reward'}
                                                                </Label>
                                                                <div className="relative">
                                                                    <Input
                                                                        type="number"
                                                                        min="0"
                                                                        max={prog.buyer_reward_type === 'percentage' ? 100 : undefined}
                                                                        disabled={!canManageReferral}
                                                                        value={prog.buyer_rate}
                                                                        onChange={(e) =>
                                                                            updateProgramField(key, 'buyer_rate', parseInt(e.target.value) || 0)
                                                                        }
                                                                        className="h-9 pr-14 text-sm"
                                                                        required
                                                                    />
                                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                                                                        {prog.buyer_reward_type === 'percentage' ? '%' : 'POIN'}
                                                                    </span>
                                                                </div>
                                                                <p className="text-[11px] text-muted-foreground">
                                                                    {prog.buyer_reward_type === 'percentage'
                                                                        ? `Contoh: 5% dari transaksi Rp 500.000 = 25.000 koin.`
                                                                        : `Pembeli mendapatkan ${prog.buyer_rate.toLocaleString('id-ID')} koin per transaksi.`}
                                                                </p>
                                                            </div>

                                                            {prog.buyer_reward_type === 'percentage' && (
                                                                <div className="space-y-1.5 pt-1">
                                                                    <Label className="text-xs font-medium flex items-center justify-between">
                                                                        <span>Batas Maksimal Reward (Cap Limit)</span>
                                                                        <span className="text-[10px] text-muted-foreground font-normal">Opsional</span>
                                                                    </Label>
                                                                    <div className="relative">
                                                                        <Input
                                                                            type="number"
                                                                            min="0"
                                                                            placeholder="Tanpa batas maksimal"
                                                                            disabled={!canManageReferral}
                                                                            value={prog.buyer_max_reward ?? ''}
                                                                            onChange={(e) =>
                                                                                updateProgramField(
                                                                                    key,
                                                                                    'buyer_max_reward',
                                                                                    e.target.value === '' ? null : parseInt(e.target.value) || 0
                                                                                )
                                                                            }
                                                                            className="h-9 pr-14 text-sm"
                                                                        />
                                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                                                                            POIN
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-[11px] text-muted-foreground">
                                                                        Mencegah koin pembeli melebihi batas wajar. Kosongkan jika tanpa batas.
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </CardContent>
                                                    </Card>
                                                </div>
                                            )}
                                        </TabsContent>
                                    );
                                })}
                            </Tabs>
                        </CardContent>

                        {canManageReferral && (
                            <CardFooter className="justify-end border-t bg-muted/20 px-6 py-4">
                                <Button type="submit" disabled={processing} className="gap-2">
                                    <Save className="h-4 w-4" />
                                    {processing ? 'Menyimpan...' : 'Simpan Semua Pengaturan'}
                                </Button>
                            </CardFooter>
                        )}
                    </Card>
                </form>
            </div>
        </AdminLayout>
    );
}
