import DeleteConfirmDialog from '@/components/delete-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminLayout from '@/layouts/admin-layout';
import { rupiahFormatter } from '@/lib/utils';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { format, isPast } from 'date-fns';
import { id } from 'date-fns/locale';
import { Calendar, CircleX, Copy, LinkIcon, Package, Send, ShoppingCart, SquarePen, Trash, Users } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';

interface Product {
    id: string;
    title: string;
    slug: string;
    price: number;
}

interface BundleItem {
    id: string;
    bundleable_type: string;
    bundleable_id: string;
    bundleable: Product;
    price: number;
    order: number;
}

interface User {
    id: string;
    name: string;
    email: string;
}

interface Invoice {
    id: string;
    invoice_code: string;
    amount: number;
    status: string;
    paid_at?: string | null;
    user: User;
}

interface EnrollmentBundle {
    id: string;
    price: number;
    created_at: string;
    invoice: Invoice;
}

interface Bundle {
    id: string;
    title: string;
    slug: string;
    short_description?: string | null;
    description?: string | null;
    benefits?: string | null;
    thumbnail?: string | null;
    price: number;
    registration_deadline?: string | null;
    registration_url: string;
    bundle_url: string;
    status: 'draft' | 'published' | 'archived';
    bundle_items: BundleItem[];
    enrollments: EnrollmentBundle[];
    created_at: string;
    updated_at: string;
}

interface GroupedItems {
    courses: BundleItem[];
    bootcamps: BundleItem[];
    webinars: BundleItem[];
}

interface ShowProps {
    bundle: Bundle;
    groupedItems: GroupedItems;
    totalOriginalPrice: number;
    discountAmount: number;
    discountPercentage: number;
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function ShowBundle({ bundle, groupedItems, totalOriginalPrice, discountAmount, discountPercentage, flash }: ShowProps) {
    const { auth } = usePage<SharedData>().props;
    const isAffiliate = auth.role.includes('affiliate');

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Paket Bundling',
            href: route('bundles.index'),
        },
        {
            title: bundle.title,
            href: route('bundles.show', bundle.id),
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
        router.delete(route('bundles.destroy', bundle.id));
    };

    const handleCopyRegistrationLink = async () => {
        try {
            await navigator.clipboard.writeText(bundle.registration_url);
            toast.success('Link pendaftaran berhasil disalin!');
        } catch {
            toast.error('Gagal menyalin link pendaftaran');
        }
    };

    const handleCopyBundleLink = async () => {
        try {
            await navigator.clipboard.writeText(bundle.bundle_url);
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

    const totalEnrollments = bundle.enrollments.length;
    const paidEnrollments = bundle.enrollments.filter((e) => e.invoice.status === 'paid').length;
    const totalRevenue = bundle.enrollments.filter((e) => e.invoice.status === 'paid').reduce((sum, e) => sum + e.invoice.amount, 0);

    const deadlineDate = bundle.registration_deadline ? new Date(bundle.registration_deadline) : null;
    const isDeadlinePassed = deadlineDate ? isPast(deadlineDate) : false;

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`Detail ${bundle.title}`} />
            <div className="px-4 py-4 md:px-6">
                <h1 className="mb-4 text-2xl font-semibold">Detail {bundle.title}</h1>

                <div className={`${!isAffiliate ? 'lg:grid-cols-3' : ''} grid grid-cols-1 gap-4 lg:gap-6`}>
                    <Tabs defaultValue="detail" className="lg:col-span-2">
                        <TabsList>
                            <TabsTrigger value="detail">Detail Bundling</TabsTrigger>
                            {!isAffiliate && (
                                <TabsTrigger value="enrollments">
                                    Pembelian
                                    {totalEnrollments > 0 && (
                                        <span className="bg-primary/10 ml-1 rounded-full px-2 py-0.5 text-xs">{totalEnrollments}</span>
                                    )}
                                </TabsTrigger>
                            )}
                        </TabsList>

                        {/* Detail Tab */}
                        <TabsContent value="detail">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle>{bundle.title}</CardTitle>
                                            <CardDescription className="mt-1">{bundle.bundle_items.length} item dalam paket</CardDescription>
                                        </div>
                                        <Badge className={statusMap[bundle.status].color}>{statusMap[bundle.status].label}</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex flex-col gap-4 md:flex-row">
                                        <div className="flex-1 space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Link Pendaftaran</label>
                                            <Input
                                                type="text"
                                                value={bundle.registration_url}
                                                readOnly
                                                className="rounded border p-2 text-sm"
                                                placeholder="Link Pendaftaran"
                                            />
                                            <Button
                                                type="button"
                                                onClick={handleCopyRegistrationLink}
                                                className="w-full hover:cursor-pointer"
                                                disabled={bundle.status === 'draft' || bundle.status === 'archived'}
                                            >
                                                Salin Link Pendaftaran <LinkIcon />
                                            </Button>
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <label className="text-sm font-medium text-gray-700">
                                                Link Produk Bundling {isAffiliate && '(dengan kode afiliasi)'}
                                            </label>
                                            <Input
                                                type="text"
                                                value={bundle.bundle_url}
                                                readOnly
                                                className="rounded border p-2 text-sm"
                                                placeholder="Link Produk Bundling"
                                            />
                                            <Button
                                                type="button"
                                                onClick={handleCopyBundleLink}
                                                className="w-full hover:cursor-pointer"
                                                disabled={bundle.status === 'draft' || bundle.status === 'archived'}
                                            >
                                                Salin Link Produk <LinkIcon />
                                            </Button>
                                        </div>
                                    </div>

                                    {bundle.status === 'published' ? (
                                        <p className="text-muted-foreground text-center text-sm">
                                            Share link diatas ke sosial media, whatsapp, tiktok, landing page, email ataupun channel penjualan lainnya
                                            untuk mendapatkan klik dan pendaftaran produk bundling.
                                        </p>
                                    ) : (
                                        <p className="text-center text-sm text-red-500">
                                            Produk ini belum diterbitkan. Silakan terbitkan produk terlebih dahulu untuk membagikan link akses
                                            bundling produk.
                                        </p>
                                    )}

                                    {/* Thumbnail */}
                                    <div>
                                        <h3 className="mb-2 text-sm font-medium">Thumbnail</h3>
                                        <img
                                            src={bundle.thumbnail ? `/storage/${bundle.thumbnail}` : '/assets/images/placeholder.png'}
                                            alt={bundle.title}
                                            className="h-56 rounded-lg border"
                                        />
                                    </div>

                                    {/* Price Info */}
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="rounded-lg border p-4">
                                            <h3 className="mb-3 text-sm font-medium text-gray-600">Total Harga Normal</h3>
                                            <p className="text-2xl font-bold text-gray-900">{rupiahFormatter.format(totalOriginalPrice)}</p>
                                        </div>
                                        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                                            <h3 className="mb-3 text-sm font-medium text-green-700">Harga Bundle</h3>
                                            <p className="text-2xl font-bold text-green-700">{rupiahFormatter.format(bundle.price)}</p>
                                            {discountPercentage > 0 && (
                                                <p className="mt-2 text-xs text-green-600">
                                                    Hemat {discountPercentage}% ({rupiahFormatter.format(discountAmount)})
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Bundle Items */}
                                    <div>
                                        <h3 className="mb-3 text-sm font-medium">Isi Paket Bundling</h3>
                                        <div className="space-y-4">
                                            {/* Courses */}
                                            {groupedItems.courses.length > 0 && (
                                                <div>
                                                    <h4 className="mb-2 text-xs font-medium text-gray-500">
                                                        KELAS ONLINE ({groupedItems.courses.length})
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {groupedItems.courses.map((item) =>
                                                            item.bundleable ? (
                                                                <div
                                                                    key={item.id}
                                                                    className="flex items-center justify-between rounded-lg border p-3"
                                                                >
                                                                    <div className="flex-1">
                                                                        <p className="text-sm font-medium">{item.bundleable.title}</p>
                                                                        <Badge variant="outline" className="mt-1 bg-blue-50 text-xs">
                                                                            Course
                                                                        </Badge>
                                                                    </div>
                                                                    <span className="text-sm font-medium text-gray-600">
                                                                        {rupiahFormatter.format(item.price)}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <div
                                                                    key={item.id}
                                                                    className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3"
                                                                >
                                                                    <div className="flex-1">
                                                                        <p className="text-sm font-medium text-red-600">
                                                                            Course tidak ditemukan (sudah dihapus)
                                                                        </p>
                                                                        <Badge variant="outline" className="mt-1 bg-red-100 text-xs text-red-700">
                                                                            Course
                                                                        </Badge>
                                                                    </div>
                                                                    <span className="text-sm font-medium text-red-600">
                                                                        {rupiahFormatter.format(item.price)}
                                                                    </span>
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Bootcamps */}
                                            {groupedItems.bootcamps.length > 0 && (
                                                <div>
                                                    <h4 className="mb-2 text-xs font-medium text-gray-500">
                                                        BOOTCAMP ({groupedItems.bootcamps.length})
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {groupedItems.bootcamps.map((item) =>
                                                            item.bundleable ? (
                                                                <div
                                                                    key={item.id}
                                                                    className="flex items-center justify-between rounded-lg border p-3"
                                                                >
                                                                    <div className="flex-1">
                                                                        <p className="text-sm font-medium">{item.bundleable.title}</p>
                                                                        <Badge variant="outline" className="mt-1 bg-purple-50 text-xs">
                                                                            Bootcamp
                                                                        </Badge>
                                                                    </div>
                                                                    <span className="text-sm font-medium text-gray-600">
                                                                        {rupiahFormatter.format(item.price)}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <div
                                                                    key={item.id}
                                                                    className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3"
                                                                >
                                                                    <div className="flex-1">
                                                                        <p className="text-sm font-medium text-red-600">
                                                                            Bootcamp tidak ditemukan (sudah dihapus)
                                                                        </p>
                                                                        <Badge variant="outline" className="mt-1 bg-red-100 text-xs text-red-700">
                                                                            Bootcamp
                                                                        </Badge>
                                                                    </div>
                                                                    <span className="text-sm font-medium text-red-600">
                                                                        {rupiahFormatter.format(item.price)}
                                                                    </span>
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Webinars */}
                                            {groupedItems.webinars.length > 0 && (
                                                <div>
                                                    <h4 className="mb-2 text-xs font-medium text-gray-500">
                                                        WEBINAR ({groupedItems.webinars.length})
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {groupedItems.webinars.map((item) =>
                                                            item.bundleable ? (
                                                                <div
                                                                    key={item.id}
                                                                    className="flex items-center justify-between rounded-lg border p-3"
                                                                >
                                                                    <div className="flex-1">
                                                                        <p className="text-sm font-medium">{item.bundleable.title}</p>
                                                                        <Badge variant="outline" className="mt-1 bg-green-50 text-xs">
                                                                            Webinar
                                                                        </Badge>
                                                                    </div>
                                                                    <span className="text-sm font-medium text-gray-600">
                                                                        {rupiahFormatter.format(item.price)}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <div
                                                                    key={item.id}
                                                                    className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3"
                                                                >
                                                                    <div className="flex-1">
                                                                        <p className="text-sm font-medium text-red-600">
                                                                            Webinar tidak ditemukan (sudah dihapus)
                                                                        </p>
                                                                        <Badge variant="outline" className="mt-1 bg-red-100 text-xs text-red-700">
                                                                            Webinar
                                                                        </Badge>
                                                                    </div>
                                                                    <span className="text-sm font-medium text-red-600">
                                                                        {rupiahFormatter.format(item.price)}
                                                                    </span>
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Descriptions */}
                                    {bundle.short_description && (
                                        <div>
                                            <h3 className="mb-2 text-sm font-medium">Deskripsi Singkat</h3>
                                            <p className="text-muted-foreground text-sm">{bundle.short_description}</p>
                                        </div>
                                    )}

                                    {bundle.description && (
                                        <div>
                                            <h3 className="mb-2 text-sm font-medium">Deskripsi Lengkap</h3>
                                            <p className="text-muted-foreground text-sm whitespace-pre-line">{bundle.description}</p>
                                        </div>
                                    )}

                                    {bundle.benefits && (
                                        <div>
                                            <h3 className="mb-2 text-sm font-medium">Benefit Bundling</h3>
                                            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: bundle.benefits }} />
                                        </div>
                                    )}

                                    {/* URLs */}
                                    {bundle.registration_url && (
                                        <div>
                                            <h3 className="mb-2 text-sm font-medium">URL Pendaftaran</h3>
                                            <a
                                                href={bundle.registration_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary text-sm hover:underline"
                                            >
                                                {bundle.registration_url}
                                            </a>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Enrollments Tab */}
                        {!isAffiliate && (
                            <TabsContent value="enrollments">
                                <div className="space-y-4">
                                    {/* Stats Cards */}
                                    <div className="grid gap-4 md:grid-cols-3">
                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-sm font-medium">Total Pembelian</CardTitle>
                                                <ShoppingCart className="text-muted-foreground h-4 w-4" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold">{totalEnrollments}</div>
                                                <p className="text-muted-foreground text-xs">Semua transaksi</p>
                                            </CardContent>
                                        </Card>

                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-sm font-medium">Pembayaran Sukses</CardTitle>
                                                <Users className="text-muted-foreground h-4 w-4" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold">{paidEnrollments}</div>
                                                <p className="text-muted-foreground text-xs">User yang sudah bayar</p>
                                            </CardContent>
                                        </Card>

                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                                                <Package className="text-muted-foreground h-4 w-4" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold">{rupiahFormatter.format(totalRevenue)}</div>
                                                <p className="text-muted-foreground text-xs">Dari pembayaran sukses</p>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Enrollments Table */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Daftar Pembelian</CardTitle>
                                            <CardDescription>Riwayat pembelian bundle oleh user</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            {bundle.enrollments.length > 0 ? (
                                                <div className="overflow-x-auto">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>No</TableHead>
                                                                <TableHead>User</TableHead>
                                                                <TableHead>Kode Invoice</TableHead>
                                                                <TableHead>Total</TableHead>
                                                                <TableHead>Status</TableHead>
                                                                <TableHead>Tanggal</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {bundle.enrollments.map((enrollment, index) => (
                                                                <TableRow key={enrollment.id}>
                                                                    <TableCell>{index + 1}</TableCell>
                                                                    <TableCell>
                                                                        <div>
                                                                            <p className="font-medium">{enrollment.invoice.user.name}</p>
                                                                            <p className="text-muted-foreground text-xs">
                                                                                {enrollment.invoice.user.email}
                                                                            </p>
                                                                        </div>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <code className="text-primary rounded bg-gray-100 px-2 py-1 text-xs">
                                                                            {enrollment.invoice.invoice_code}
                                                                        </code>
                                                                    </TableCell>
                                                                    <TableCell className="font-medium">
                                                                        {rupiahFormatter.format(enrollment.invoice.amount)}
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Badge
                                                                            className={
                                                                                enrollment.invoice.status === 'paid'
                                                                                    ? 'bg-green-100 text-green-700'
                                                                                    : enrollment.invoice.status === 'pending'
                                                                                      ? 'bg-yellow-100 text-yellow-700'
                                                                                      : 'bg-red-100 text-red-700'
                                                                            }
                                                                        >
                                                                            {enrollment.invoice.status}
                                                                        </Badge>
                                                                    </TableCell>
                                                                    <TableCell className="text-sm">
                                                                        {enrollment.invoice.paid_at
                                                                            ? format(new Date(enrollment.invoice.paid_at), 'dd MMM yyyy HH:mm', {
                                                                                  locale: id,
                                                                              })
                                                                            : format(new Date(enrollment.created_at), 'dd MMM yyyy HH:mm', {
                                                                                  locale: id,
                                                                              })}
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            ) : (
                                                <p className="text-muted-foreground py-8 text-center text-sm">Belum ada pembelian untuk bundle ini</p>
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
                                {(bundle.status === 'draft' || bundle.status === 'archived') && (
                                    <>
                                        {!bundle.thumbnail && (
                                            <div className="mb-4 rounded-lg bg-red-50 p-3 text-center text-sm text-red-700">
                                                Thumbnail belum diupload. Silakan upload thumbnail sebelum menerbitkan.
                                            </div>
                                        )}
                                        {bundle.bundle_items.length < 2 && (
                                            <div className="mb-4 rounded-lg bg-red-50 p-3 text-center text-sm text-red-700">
                                                Item bundle minimal 2. Silakan tambahkan item sebelum menerbitkan.
                                            </div>
                                        )}
                                        {bundle.price <= 0 && (
                                            <div className="mb-4 rounded-lg bg-red-50 p-3 text-center text-sm text-red-700">
                                                Harga bundle belum diset. Silakan set harga sebelum menerbitkan.
                                            </div>
                                        )}
                                        <Button
                                            asChild
                                            className="w-full"
                                            disabled={!bundle.thumbnail || bundle.bundle_items.length < 2 || bundle.price <= 0}
                                        >
                                            <Link method="post" href={route('bundles.publish', bundle.id)}>
                                                <Send />
                                                Terbitkan
                                            </Link>
                                        </Button>
                                    </>
                                )}

                                {bundle.status === 'published' && (
                                    <Button asChild className="w-full">
                                        <Link method="post" href={route('bundles.archive', bundle.id)}>
                                            <CircleX />
                                            Arsipkan
                                        </Link>
                                    </Button>
                                )}

                                <Separator />

                                {/* Action Buttons */}
                                <div className="space-y-2">
                                    <Button asChild className="w-full" variant="secondary">
                                        <Link href={route('bundles.edit', bundle.id)}>
                                            <SquarePen /> Edit
                                        </Link>
                                    </Button>
                                    <Button asChild className="w-full" variant="secondary">
                                        <Link method="post" href={route('bundles.duplicate', bundle.id)}>
                                            <Copy /> Duplicate
                                        </Link>
                                    </Button>
                                    <DeleteConfirmDialog
                                        trigger={
                                            <Button variant="destructive" className="w-full" disabled={bundle.enrollments.length > 0}>
                                                <Trash /> Hapus
                                            </Button>
                                        }
                                        title="Apakah Anda yakin ingin menghapus bundle ini?"
                                        itemName={bundle.title}
                                        onConfirm={handleDelete}
                                    />
                                    {bundle.enrollments.length > 0 && (
                                        <p className="text-center text-xs text-red-500">Bundle tidak dapat dihapus karena sudah ada pembelian</p>
                                    )}
                                </div>
                            </div>

                            {/* Bundle Info */}
                            <div className="mt-4 space-y-4 rounded-lg border p-4">
                                <h3 className="text-sm font-medium">Informasi Bundling</h3>
                                <div className="space-y-3 text-sm">
                                    {deadlineDate && (
                                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                                            <div className="mb-1 flex items-center gap-2 text-xs font-medium text-gray-600">
                                                <Calendar className="h-3 w-3" />
                                                Batas Pendaftaran
                                            </div>
                                            <p className={`text-sm font-medium ${isDeadlinePassed ? 'text-red-600' : 'text-gray-900'}`}>
                                                {format(deadlineDate, 'dd MMMM yyyy', { locale: id })}
                                            </p>
                                            <p className="text-xs text-gray-500">Pukul {format(deadlineDate, 'HH:mm', { locale: id })} WIB</p>
                                            {isDeadlinePassed && <p className="mt-1 text-xs text-red-600">Pendaftaran sudah ditutup</p>}
                                        </div>
                                    )}

                                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                                        <div className="mb-1 flex items-center gap-2 text-xs font-medium text-gray-600">
                                            <Package className="h-3 w-3" />
                                            Total Item
                                        </div>
                                        <p className="text-sm font-medium text-gray-900">{bundle.bundle_items.length} item</p>
                                        <div className="mt-2 flex gap-1">
                                            {groupedItems.courses.length > 0 && (
                                                <Badge variant="outline" className="text-xs">
                                                    {groupedItems.courses.length} Course
                                                </Badge>
                                            )}
                                            {groupedItems.bootcamps.length > 0 && (
                                                <Badge variant="outline" className="text-xs">
                                                    {groupedItems.bootcamps.length} Bootcamp
                                                </Badge>
                                            )}
                                            {groupedItems.webinars.length > 0 && (
                                                <Badge variant="outline" className="text-xs">
                                                    {groupedItems.webinars.length} Webinar
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground text-xs">Slug:</span>
                                        <code className="text-primary rounded bg-gray-100 px-1.5 py-0.5 text-xs">{bundle.slug}</code>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground text-xs">Dibuat:</span>
                                        <span className="text-xs">{format(new Date(bundle.created_at), 'dd MMM yyyy', { locale: id })}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground text-xs">Diperbarui:</span>
                                        <span className="text-xs">{format(new Date(bundle.updated_at), 'dd MMM yyyy', { locale: id })}</span>
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
