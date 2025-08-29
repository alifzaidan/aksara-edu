import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AdminLayout from '@/layouts/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
    BookOpen,
    Calendar,
    CheckCircle,
    Copy,
    CreditCard,
    DollarSign,
    Edit,
    Monitor,
    Percent,
    ShoppingCart,
    Tag,
    Users,
    Video,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface DiscountCodeData {
    id: string;
    code: string;
    name: string;
    description: string | null;
    type: 'percentage' | 'fixed';
    value: number;
    minimum_amount: number | null;
    usage_limit: number | null;
    usage_limit_per_user: number | null;
    used_count: number;
    starts_at: string;
    expires_at: string;
    is_active: boolean;
    applicable_types: string[] | null;
    applicable_ids: string[] | null;
    created_at: string;
    usages: Array<{
        id: string;
        discount_amount: number;
        created_at: string;
        user: {
            id: string;
            name: string;
            email: string;
        };
        invoice: {
            id: string;
            invoice_code: string;
            nett_amount: number;
        };
    }>;
    applicable_products?: Array<{
        type: string;
        id: string;
        title: string;
        price: number;
    }>;
}

interface DiscountCodeShowProps {
    discountCode: DiscountCodeData;
}

const formatCurrency = (amount: number | null) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);
};

const getStatusBadge = (discountCode: DiscountCodeData) => {
    if (!discountCode.is_active) {
        return (
            <Badge variant="destructive" className="flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                Nonaktif
            </Badge>
        );
    }

    const expired = new Date(discountCode.expires_at) < new Date();

    if (expired) {
        return (
            <Badge variant="destructive" className="flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                Kedaluwarsa
            </Badge>
        );
    }

    const now = new Date();
    const startsAt = new Date(discountCode.starts_at);

    if (startsAt > now) {
        return (
            <Badge variant="outline" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Belum Dimulai
            </Badge>
        );
    }

    return (
        <Badge variant="default" className="flex items-center gap-1 bg-green-600">
            <CheckCircle className="h-3 w-3" />
            Aktif
        </Badge>
    );
};

const getTypeBadge = (type: 'percentage' | 'fixed') => {
    return type === 'percentage' ? (
        <Badge variant="outline" className="flex items-center gap-1 border-blue-200 bg-blue-50 text-blue-700">
            <Percent className="h-3 w-3" />
            Persentase
        </Badge>
    ) : (
        <Badge variant="outline" className="flex items-center gap-1 border-green-200 bg-green-50 text-green-700">
            <DollarSign className="h-3 w-3" />
            Nominal
        </Badge>
    );
};

const getProductIcon = (type: string) => {
    switch (type) {
        case 'course':
            return <BookOpen className="h-3 w-3" />;
        case 'bootcamp':
            return <Monitor className="h-3 w-3" />;
        case 'webinar':
            return <Video className="h-3 w-3" />;
        default:
            return <Tag className="h-3 w-3" />;
    }
};

const getProductTypeName = (type: string) => {
    switch (type) {
        case 'course':
            return 'Kelas';
        case 'bootcamp':
            return 'Bootcamp';
        case 'webinar':
            return 'Webinar';
        default:
            return type;
    }
};

export default function DiscountCodeShow({ discountCode }: DiscountCodeShowProps) {
    const [copied, setCopied] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Kode Diskon', href: '/admin/discount-codes' },
        { title: discountCode.code, href: `/admin/discount-codes/${discountCode.id}` },
    ];

    const copyCode = () => {
        navigator.clipboard.writeText(discountCode.code);
        setCopied(true);
        toast.success('Kode diskon berhasil disalin!');
        setTimeout(() => setCopied(false), 2000);
    };

    const usagePercentage = discountCode.usage_limit ? (discountCode.used_count / discountCode.usage_limit) * 100 : 0;

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`Detail Kode Diskon - ${discountCode.code}`} />

            <div className="space-y-6 px-4 py-4 md:px-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold">Detail Kode Diskon</h1>
                            <p className="text-muted-foreground text-sm">Informasi lengkap dan statistik penggunaan</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={route('discount-codes.edit', discountCode.id)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Basic Info */}
                    <div className="space-y-6 lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <Tag className="h-5 w-5" />
                                            Informasi Kode Diskon
                                        </CardTitle>
                                        <CardDescription>Detail konfigurasi kode diskon</CardDescription>
                                    </div>
                                    {getStatusBadge(discountCode)}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="text-muted-foreground text-sm font-medium">Kode Diskon</label>
                                        <div className="mt-1 flex items-center gap-2">
                                            <div className="rounded bg-blue-50 px-3 py-2 font-mono text-lg font-bold text-blue-600">
                                                {discountCode.code}
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={copyCode}>
                                                <Copy className="h-4 w-4" />
                                                {copied ? 'Tersalin!' : 'Salin'}
                                            </Button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-muted-foreground text-sm font-medium">Nama</label>
                                        <p className="mt-1 font-medium">{discountCode.name}</p>
                                    </div>
                                </div>

                                {discountCode.description && (
                                    <div>
                                        <label className="text-muted-foreground text-sm font-medium">Deskripsi</label>
                                        <p className="mt-1">{discountCode.description}</p>
                                    </div>
                                )}

                                <Separator />

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="text-muted-foreground text-sm font-medium">Jenis Diskon</label>
                                        <div className="mt-1">{getTypeBadge(discountCode.type)}</div>
                                    </div>
                                    <div>
                                        <label className="text-muted-foreground text-sm font-medium">Nilai Diskon</label>
                                        <p className="mt-1 text-lg font-bold text-green-600">
                                            {discountCode.type === 'percentage' ? `${discountCode.value}%` : formatCurrency(discountCode.value)}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-muted-foreground text-sm font-medium">Minimum Pembelian</label>
                                    <p className="mt-1 font-medium">{formatCurrency(discountCode.minimum_amount)}</p>
                                </div>

                                <Separator />

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="text-muted-foreground text-sm font-medium">Periode Aktif</label>
                                        <div className="mt-1 space-y-1">
                                            <p className="text-sm">
                                                <span className="font-medium">Mulai:</span>{' '}
                                                {format(new Date(discountCode.starts_at), 'dd MMMM yyyy', { locale: id })}
                                            </p>
                                            <p className="text-sm">
                                                <span className="font-medium">Berakhir:</span>{' '}
                                                {format(new Date(discountCode.expires_at), 'dd MMMM yyyy', { locale: id })}
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-muted-foreground text-sm font-medium">Berlaku Untuk</label>
                                        <div className="mt-1">
                                            {discountCode.applicable_types && discountCode.applicable_types.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {discountCode.applicable_types.map((type) => (
                                                        <Badge key={type} variant="outline" className="flex items-center gap-1 text-xs">
                                                            {getProductIcon(type)}
                                                            {getProductTypeName(type)}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-muted-foreground text-sm">Semua produk</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Specific Products */}
                                {discountCode.applicable_products && discountCode.applicable_products.length > 0 && (
                                    <>
                                        <Separator />
                                        <div>
                                            <label className="text-muted-foreground text-sm font-medium">Produk Spesifik</label>
                                            <div className="mt-2 space-y-2">
                                                {discountCode.applicable_products.map((product, index) => (
                                                    <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                                                                {getProductIcon(product.type)}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium">{product.title}</p>
                                                                <p className="text-muted-foreground text-xs">{getProductTypeName(product.type)}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm font-medium">{formatCurrency(product.price)}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Recent Usage */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ShoppingCart className="h-5 w-5" />
                                    Penggunaan Terbaru
                                </CardTitle>
                                <CardDescription>Transaksi yang menggunakan kode diskon ini</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {discountCode.usages.length === 0 ? (
                                    <div className="py-8 text-center">
                                        <Users className="mx-auto mb-2 h-12 w-12 text-gray-400" />
                                        <p className="text-muted-foreground text-sm">Belum ada yang menggunakan kode diskon ini</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {discountCode.usages.slice(0, 10).map((usage) => (
                                            <div key={usage.id} className="flex items-center justify-between rounded-lg border p-3">
                                                <div className="flex-1">
                                                    <div className="font-medium">{usage.user.name}</div>
                                                    <div className="text-muted-foreground text-sm">{usage.user.email}</div>
                                                    <div className="text-muted-foreground text-xs">
                                                        Invoice: #{usage.invoice.invoice_code} •{' '}
                                                        {format(new Date(usage.created_at), 'dd MMM yyyy', { locale: id })}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-medium text-green-600">-{formatCurrency(usage.discount_amount)}</div>
                                                    <div className="text-muted-foreground text-sm">
                                                        dari {formatCurrency(usage.invoice.nett_amount + usage.discount_amount)}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {discountCode.usages.length > 10 && (
                                            <p className="text-muted-foreground text-center text-sm">
                                                Dan {discountCode.usages.length - 10} penggunaan lainnya...
                                            </p>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Statistics */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Statistik Penggunaan
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground text-sm">Terpakai</span>
                                        <span className="text-lg font-bold">{discountCode.used_count}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground text-sm">Batas Total</span>
                                        <span className="font-medium">{discountCode.usage_limit || '∞'}</span>
                                    </div>
                                    {discountCode.usage_limit && (
                                        <div className="space-y-1">
                                            <div className="h-2 w-full rounded-full bg-gray-200">
                                                <div
                                                    className="h-2 rounded-full bg-blue-600 transition-all"
                                                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                                                />
                                            </div>
                                            <p className="text-muted-foreground text-center text-xs">{usagePercentage.toFixed(1)}% terpakai</p>
                                        </div>
                                    )}
                                </div>

                                <Separator />

                                {discountCode.usage_limit_per_user && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground text-sm">Batas per User</span>
                                        <span className="font-medium">{discountCode.usage_limit_per_user}</span>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground text-sm">Total Diskon</span>
                                        <span className="text-lg font-bold text-green-600">
                                            {formatCurrency(discountCode.usages.reduce((sum, usage) => sum + usage.discount_amount, 0))}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground text-sm">Total Transaksi</span>
                                        <span className="font-medium">
                                            {formatCurrency(discountCode.usages.reduce((sum, usage) => sum + usage.invoice.nett_amount, 0))}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="h-5 w-5" />
                                    Informasi Tambahan
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Dibuat</span>
                                    <span>{format(new Date(discountCode.created_at), 'dd MMM yyyy', { locale: id })}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Status</span>
                                    <span className={discountCode.is_active ? 'text-green-600' : 'text-red-600'}>
                                        {discountCode.is_active ? 'Aktif' : 'Nonaktif'}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
