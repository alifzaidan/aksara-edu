import DeleteConfirmDialog from '@/components/delete-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminLayout from '@/layouts/admin-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { format, isPast } from 'date-fns';
import { id } from 'date-fns/locale';
import { BarChart3, Calendar, CircleX, Clock, Copy, Eye, LinkIcon, Send, SquarePen, Trash, TrendingUp } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';

interface PartnershipProduct {
    id: string;
    title: string;
    slug: string;
    category?: { id: string; name: string };
    short_description?: string | null;
    description?: string | null;
    key_points?: string | null;
    thumbnail?: string | null;
    registration_deadline: string;
    duration_days: number;
    schedule_days: string[];
    strikethrough_price: number;
    price: number;
    product_url: string;
    registration_url: string;
    status: 'draft' | 'published' | 'archived';
    type: 'regular' | 'scholarship';
    scholarship_group_link?: string | null;
    clicks_count?: number;
    created_at: string | Date;
    updated_at: string | Date;
}

interface ClickStats {
    date: string;
    clicks: number;
}

interface RecentClick {
    id: string;
    user?: { id: string; name: string } | null;
    ip_address?: string | null;
    created_at: string;
}

interface ShowProps {
    product: PartnershipProduct;
    clickStats: ClickStats[];
    uniqueClicks: number;
    recentClicks: RecentClick[];
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function ShowPartnershipProduct({ product, clickStats, uniqueClicks, recentClicks, flash }: ShowProps) {
    const { auth } = usePage<SharedData>().props;
    const isAffiliate = auth.role.includes('affiliate');

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Sertifikasi Kerjasama',
            href: route('partnership-products.index'),
        },
        {
            title: product.title,
            href: route('partnership-products.show', product.id),
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
        router.delete(route('partnership-products.destroy', product.id));
    };

    const formatRupiah = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const handleCopyRegistrationLink = async () => {
        try {
            await navigator.clipboard.writeText(product.registration_url);
            toast.success('Link pendaftaran berhasil disalin!');
        } catch {
            toast.error('Gagal menyalin link pendaftaran');
        }
    };

    const handleCopyProductLink = async () => {
        try {
            await navigator.clipboard.writeText(product.product_url);
            toast.success('Link produk berhasil disalin!');
        } catch {
            toast.error('Gagal menyalin link produk');
        }
    };

    const statusMap = {
        draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700' },
        published: { label: 'Published', color: 'bg-green-100 text-green-700' },
        archived: { label: 'Archived', color: 'bg-red-100 text-red-700' },
    };

    const totalClicks = product.clicks_count || 0;
    const deadlineDate = new Date(product.registration_deadline);
    const isDeadlinePassed = isPast(deadlineDate);

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`Detail - ${product.title}`} />
            <div className="px-4 py-4 md:px-6">
                <h1 className="mb-4 text-2xl font-semibold">Detail {product.title}</h1>

                <div className={`${!isAffiliate ? 'lg:grid-cols-3' : ''} grid grid-cols-1 gap-4 lg:gap-6`}>
                    <Tabs defaultValue="detail" className="lg:col-span-2">
                        <TabsList>
                            <TabsTrigger value="detail">Detail Produk</TabsTrigger>
                            {!isAffiliate && (
                                <TabsTrigger value="analytics">
                                    Analitik
                                    {totalClicks > 0 && <span className="bg-primary/10 ml-1 rounded-full px-2 py-0.5 text-xs">{totalClicks}</span>}
                                </TabsTrigger>
                            )}
                        </TabsList>

                        {/* Detail Tab */}
                        <TabsContent value="detail">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle>{product.title}</CardTitle>
                                            {product.category && (
                                                <CardDescription className="mt-1">Kategori: {product.category.name}</CardDescription>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <Badge className={statusMap[product.status].color}>{statusMap[product.status].label}</Badge>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex flex-col gap-4 md:flex-row">
                                        <div className="flex-1 space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Link Pendaftaran</label>
                                            <Input
                                                type="text"
                                                value={product.registration_url}
                                                readOnly
                                                className="rounded border p-2 text-sm"
                                                placeholder="Link Pendaftaran"
                                            />
                                            <Button
                                                type="button"
                                                onClick={handleCopyRegistrationLink}
                                                className="w-full hover:cursor-pointer"
                                                disabled={product.status === 'draft' || product.status === 'archived'}
                                            >
                                                Salin Link Pendaftaran <LinkIcon />
                                            </Button>
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <label className="text-sm font-medium text-gray-700">
                                                Link Sertifikasi Kerjasama {isAffiliate && '(dengan kode afiliasi)'}
                                            </label>
                                            <Input
                                                type="text"
                                                value={product.product_url}
                                                readOnly
                                                className="rounded border p-2 text-sm"
                                                placeholder="Link Sertifikasi Kerjasama"
                                            />
                                            <Button
                                                type="button"
                                                onClick={handleCopyProductLink}
                                                className="w-full hover:cursor-pointer"
                                                disabled={product.status === 'draft' || product.status === 'archived'}
                                            >
                                                Salin Link Produk <LinkIcon />
                                            </Button>
                                        </div>
                                    </div>

                                    {product.status === 'published' ? (
                                        <p className="text-muted-foreground text-center text-sm">
                                            Share link diatas ke sosial media, whatsapp, tiktok, landing page, email ataupun channel penjualan lainnya
                                            untuk mendapatkan klik dan pendaftaran sertifikasi kerjasama.
                                        </p>
                                    ) : (
                                        <p className="text-center text-sm text-red-500">
                                            Product ini belum diterbitkan. Silakan terbitkan product terlebih dahulu untuk membagikan link akses
                                            sertifikasi kerjasama.
                                        </p>
                                    )}

                                    <div className="rounded-lg border p-4 md:text-center">
                                        <h3 className="mb-3 text-sm font-medium">Harga</h3>
                                        <div className="flex flex-col md:justify-center">
                                            {product.strikethrough_price > 0 && (
                                                <span className="text-muted-foreground text-md line-through">
                                                    {formatRupiah(product.strikethrough_price)}
                                                </span>
                                            )}
                                            <span className="text-3xl font-bold">{formatRupiah(product.price)}</span>
                                        </div>
                                        <p className="text-muted-foreground mt-2 text-xs">*Harga produk, tidak untuk transaksi di platform</p>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="rounded-lg border p-4">
                                            <h3 className="mb-3 text-sm font-medium">Tipe Kategori</h3>
                                            <Badge
                                                className={`${
                                                    product.type === 'scholarship' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                                } border-0 text-base`}
                                            >
                                                {product.type === 'scholarship' ? 'Beasiswa' : 'Reguler'}
                                            </Badge>
                                        </div>

                                        {product.type === 'scholarship' && product.scholarship_group_link && (
                                            <div className="rounded-lg border p-4">
                                                <h3 className="mb-3 text-sm font-medium">Grup WhatsApp/Telegram</h3>
                                                <a
                                                    href={product.scholarship_group_link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-green-100"
                                                >
                                                    <img src="/assets/images/icon-wa.svg" alt="WhatsApp" className="h-8 w-8 md:h-12 md:w-12" />
                                                    Buka Grup
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <h3 className="mb-2 text-sm font-medium">Thumbnail</h3>
                                        <img
                                            src={product.thumbnail ? `/storage/${product.thumbnail}` : '/assets/images/placeholder.png'}
                                            alt={product.title}
                                            className="h-56 rounded-lg border object-cover"
                                        />
                                    </div>

                                    {product.short_description && (
                                        <div>
                                            <h3 className="mb-2 text-sm font-medium">Deskripsi Singkat</h3>
                                            <p className="text-muted-foreground text-sm">{product.short_description}</p>
                                        </div>
                                    )}

                                    {product.description && (
                                        <div>
                                            <h3 className="mb-2 text-sm font-medium">Deskripsi Lengkap</h3>
                                            <p className="text-muted-foreground text-sm whitespace-pre-line">{product.description}</p>
                                        </div>
                                    )}

                                    {product.key_points && (
                                        <div>
                                            <h3 className="mb-2 text-sm font-medium">Poin-Poin Penting</h3>
                                            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: product.key_points }} />
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Analytics Tab */}
                        {!isAffiliate && (
                            <TabsContent value="analytics">
                                <div className="space-y-4">
                                    {/* Stats Cards */}
                                    <div className="grid gap-4 md:grid-cols-3">
                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-sm font-medium">Total Klik</CardTitle>
                                                <Eye className="text-muted-foreground h-4 w-4" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold">{totalClicks}</div>
                                                <p className="text-muted-foreground text-xs">Semua waktu</p>
                                            </CardContent>
                                        </Card>

                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-sm font-medium">User Unik</CardTitle>
                                                <TrendingUp className="text-muted-foreground h-4 w-4" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold">{uniqueClicks}</div>
                                                <p className="text-muted-foreground text-xs">User yang login</p>
                                            </CardContent>
                                        </Card>

                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-sm font-medium">Klik (30 Hari)</CardTitle>
                                                <BarChart3 className="text-muted-foreground h-4 w-4" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold">{clickStats.reduce((sum, stat) => sum + stat.clicks, 0)}</div>
                                                <p className="text-muted-foreground text-xs">Bulan ini</p>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Click History */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Riwayat Klik (30 Hari Terakhir)</CardTitle>
                                            <CardDescription>Grafik klik produk dalam 30 hari terakhir</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            {clickStats.length > 0 ? (
                                                <div className="space-y-2">
                                                    {clickStats.map((stat, index) => (
                                                        <div key={index} className="flex items-center justify-between text-sm">
                                                            <span className="text-muted-foreground">
                                                                {format(new Date(stat.date), 'dd MMM yyyy', { locale: id })}
                                                            </span>
                                                            <span className="font-medium">{stat.clicks} klik</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-muted-foreground text-center text-sm">Belum ada data klik</p>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Recent Clicks */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Klik Terbaru</CardTitle>
                                            <CardDescription>10 klik terakhir ke produk ini</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            {recentClicks.length > 0 ? (
                                                <div className="space-y-3">
                                                    {recentClicks.map((click) => (
                                                        <div key={click.id} className="flex items-start justify-between border-b pb-2 last:border-0">
                                                            <div>
                                                                <p className="text-sm font-medium">
                                                                    {click.user?.name || 'Guest'} {!click.user && `(${click.ip_address})`}
                                                                </p>
                                                                <p className="text-muted-foreground text-xs">
                                                                    {format(new Date(click.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-muted-foreground text-center text-sm">Belum ada klik</p>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>
                        )}
                    </Tabs>

                    {/* Sidebar Actions */}
                    {!isAffiliate && (
                        <div>
                            <h2 className="my-2 text-lg font-medium">Aksi & Pengaturan</h2>
                            <div className="space-y-4 rounded-lg border p-4">
                                {(product.status === 'draft' || product.status === 'archived') && (
                                    <>
                                        {!product.thumbnail && (
                                            <div className="mb-4 rounded-lg bg-red-50 p-3 text-center text-sm text-red-700">
                                                Thumbnail belum diupload. Silakan upload thumbnail sebelum menerbitkan.
                                            </div>
                                        )}
                                        {!product.description && (
                                            <div className="mb-4 rounded-lg bg-red-50 p-3 text-center text-sm text-red-700">
                                                Deskripsi belum diisi. Silakan isi deskripsi sebelum menerbitkan.
                                            </div>
                                        )}
                                        {!product.registration_deadline && (
                                            <div className="mb-4 rounded-lg bg-red-50 p-3 text-center text-sm text-red-700">
                                                Batas pendaftaran belum diisi. Silakan isi batas pendaftaran sebelum menerbitkan.
                                            </div>
                                        )}
                                        <Button
                                            asChild
                                            className="w-full"
                                            disabled={!product.thumbnail || !product.description || !product.registration_deadline}
                                        >
                                            <Link method="post" href={route('partnership-products.publish', product.id)}>
                                                <Send />
                                                Terbitkan
                                            </Link>
                                        </Button>
                                    </>
                                )}

                                {product.status === 'published' && (
                                    <Button asChild className="w-full">
                                        <Link method="post" href={route('partnership-products.archive', product.id)}>
                                            <CircleX />
                                            Arsipkan
                                        </Link>
                                    </Button>
                                )}

                                <Separator />

                                {/* Action Buttons */}
                                <div className="space-y-2">
                                    <Button asChild className="w-full" variant="secondary">
                                        <Link href={route('partnership-products.edit', product.id)}>
                                            <SquarePen /> Edit
                                        </Link>
                                    </Button>
                                    <Button asChild className="w-full" variant="secondary">
                                        <Link method="post" href={route('partnership-products.duplicate', product.id)}>
                                            <Copy /> Duplicate
                                        </Link>
                                    </Button>
                                    <DeleteConfirmDialog
                                        trigger={
                                            <Button variant="destructive" className="w-full">
                                                <Trash /> Hapus
                                            </Button>
                                        }
                                        title="Apakah Anda yakin ingin menghapus produk ini?"
                                        itemName={product.title}
                                        onConfirm={handleDelete}
                                    />
                                </div>
                            </div>

                            {/* Product Info */}
                            <div className="mt-4 space-y-4 rounded-lg border p-4">
                                <h3 className="text-sm font-medium">Informasi Produk</h3>
                                <div className="space-y-3 text-sm">
                                    {product.registration_deadline && (
                                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                                            <div className="mb-1 flex items-center gap-2 text-xs font-medium text-gray-600">
                                                <Calendar className="h-3 w-3" />
                                                Batas Pendaftaran
                                            </div>
                                            <p className={`text-sm font-medium ${isDeadlinePassed ? 'text-red-600' : 'text-gray-900'}`}>
                                                {format(deadlineDate, 'dd MMMM yyyy', { locale: id })}
                                            </p>
                                            <p className="text-xs text-gray-500">Pukul {format(deadlineDate, 'HH:mm', { locale: id })} WIB</p>
                                        </div>
                                    )}

                                    {product.schedule_days && product.schedule_days.length > 0 && (
                                        <div>
                                            <h4 className="mb-2 text-xs font-medium text-gray-600">Jadwal Pelaksanaan</h4>
                                            <div className="flex flex-wrap gap-1.5">
                                                {product.schedule_days.map((day: string) => (
                                                    <Badge key={day} variant="outline" className="bg-blue-50 text-xs">
                                                        {day}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {product.duration_days > 0 && (
                                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                                            <div className="mb-1 flex items-center gap-2 text-xs font-medium text-gray-600">
                                                <Clock className="h-3 w-3" />
                                                Durasi Program
                                            </div>
                                            <p className="text-sm font-medium text-gray-900">{product.duration_days} hari</p>
                                        </div>
                                    )}

                                    <Separator />

                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground text-xs">Slug:</span>
                                        <code className="text-primary rounded bg-gray-100 px-1.5 py-0.5 text-xs">{product.slug}</code>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground text-xs">Dibuat:</span>
                                        <span className="text-xs">{format(new Date(product.created_at), 'dd MMM yyyy', { locale: id })}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground text-xs">Diperbarui:</span>
                                        <span className="text-xs">{format(new Date(product.updated_at), 'dd MMM yyyy', { locale: id })}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
