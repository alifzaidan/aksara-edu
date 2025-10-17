import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import UserLayout from '@/layouts/user-layout';
import { Head, Link } from '@inertiajs/react';
import { AlertTriangle, CheckCircle, Clock, ExternalLink, FileText, Home, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface CourseItem {
    id: string;
    course: {
        id: string;
        title: string;
        slug: string;
        thumbnail: string;
    };
}

interface BootcampItem {
    id: string;
    bootcamp: {
        id: string;
        title: string;
        slug: string;
        thumbnail: string;
    };
}

interface WebinarItem {
    id: string;
    webinar: {
        id: string;
        title: string;
        slug: string;
        thumbnail: string;
    };
}

interface Invoice {
    id: string;
    invoice_code: string;
    invoice_url: string;
    amount: number;
    nett_amount: number;
    discount_amount: number;
    status: 'paid' | 'pending' | 'failed';
    paid_at: string | null;
    expires_at: string | null;
    payment_method: string | null;
    payment_channel: string | null;
    course_items?: CourseItem[];
    bootcamp_items?: BootcampItem[];
    webinar_items?: WebinarItem[];
}

interface Props {
    invoice: Invoice;
}

export default function TransactionShow({ invoice }: Props) {
    const [cancelLoading, setCancelLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);

    const isExpired = invoice.expires_at && new Date() > new Date(invoice.expires_at);
    const timeLeft = invoice.expires_at ? new Date(invoice.expires_at).getTime() - new Date().getTime() : 0;
    const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

    const getProductInfo = () => {
        if (invoice.course_items && invoice.course_items.length > 0) {
            const course = invoice.course_items[0].course;
            return {
                type: 'course',
                name: course.title,
                slug: course.slug,
                thumbnail: course.thumbnail,
                profileRoute: 'profile.course.detail',
                publicRoute: 'course.detail',
            };
        } else if (invoice.bootcamp_items && invoice.bootcamp_items.length > 0) {
            const bootcamp = invoice.bootcamp_items[0].bootcamp;
            return {
                type: 'bootcamp',
                name: bootcamp.title,
                slug: bootcamp.slug,
                thumbnail: bootcamp.thumbnail,
                profileRoute: 'profile.bootcamp.detail',
                publicRoute: 'bootcamp.detail',
            };
        } else if (invoice.webinar_items && invoice.webinar_items.length > 0) {
            const webinar = invoice.webinar_items[0].webinar;
            return {
                type: 'webinar',
                name: webinar.title,
                slug: webinar.slug,
                thumbnail: webinar.thumbnail,
                profileRoute: 'profile.webinar.detail',
                publicRoute: 'webinar.detail',
            };
        }
        return null;
    };

    const productInfo = getProductInfo();

    const handleCancelConfirm = async () => {
        setCancelLoading(true);
        setDialogOpen(false);

        try {
            const res = await fetch(route('invoice.cancel', { id: invoice.id }), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
            });

            const data = await res.json();

            if (data.success) {
                toast.success('Pesanan berhasil dibatalkan dan invoice telah dinonaktifkan.');
                window.location.reload();
            } else {
                toast.error(data.message || 'Gagal membatalkan pesanan.');
            }
        } catch {
            toast.error('Terjadi kesalahan saat membatalkan pesanan.');
        } finally {
            setCancelLoading(false);
        }
    };

    const getStatusIcon = () => {
        switch (invoice.status) {
            case 'paid':
                return <CheckCircle className="mt-1 h-6 w-6 text-green-500" />;
            case 'pending':
                return <Clock className="mt-1 h-6 w-6 text-yellow-500" />;
            case 'failed':
                return <XCircle className="mt-1 h-6 w-6 text-red-500" />;
            default:
                return <AlertTriangle className="mt-1 h-6 w-6 text-gray-500" />;
        }
    };

    const getStatusText = () => {
        switch (invoice.status) {
            case 'paid':
                return 'Pembayaran Berhasil';
            case 'pending':
                return isExpired ? 'Pembayaran Kedaluwarsa' : 'Menunggu Pembayaran';
            case 'failed':
                return 'Pembayaran Dibatalkan';
            default:
                return 'Status Tidak Diketahui';
        }
    };

    const getStatusColor = () => {
        switch (invoice.status) {
            case 'paid':
                return 'text-green-600';
            case 'pending':
                return isExpired ? 'text-red-600' : 'text-yellow-600';
            case 'failed':
                return 'text-red-600';
            default:
                return 'text-gray-600';
        }
    };

    return (
        <UserLayout>
            <Head title={`Invoice ${invoice.invoice_code}`} />

            <div className="min-h-screen bg-gray-50 py-4 md:py-8 dark:bg-gray-900">
                <div className="mx-auto max-w-7xl px-4">
                    <div className="overflow-hidden rounded-lg bg-white shadow-lg dark:bg-gray-800">
                        <div className="to-primary flex gap-3 bg-gradient-to-tl from-black px-6 py-4 text-white">
                            {getStatusIcon()}
                            <div>
                                <h1 className={`text-xl font-bold md:text-2xl ${getStatusColor()}`}>{getStatusText()}</h1>
                                <p className="mt-1 text-sm text-blue-100 md:text-base">Invoice #{invoice.invoice_code}</p>
                            </div>
                        </div>

                        <div className="p-6">
                            {productInfo && (
                                <div className="mb-6 rounded-lg border bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700">
                                    <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Produk yang Dibeli</h3>
                                    <div className="flex items-start gap-4">
                                        <img
                                            src={productInfo.thumbnail ? `/storage/${productInfo.thumbnail}` : '/assets/images/placeholder.png'}
                                            alt={productInfo.name}
                                            className="h-16 rounded-lg object-cover md:h-20"
                                        />
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-900 dark:text-white">{productInfo.name}</h4>
                                            <p className="text-sm text-gray-600 capitalize dark:text-gray-400">
                                                {productInfo.type === 'course'
                                                    ? 'Kelas Online'
                                                    : productInfo.type === 'bootcamp'
                                                      ? 'Bootcamp'
                                                      : 'Webinar'}
                                            </p>
                                            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                                                {invoice.status === 'paid' ? (
                                                    <Button asChild size="sm" variant="outline">
                                                        <Link href={route(productInfo.profileRoute, { [productInfo.type]: productInfo.slug })}>
                                                            <ExternalLink className="mr-2 h-4 w-4" />
                                                            Buka di Profile
                                                        </Link>
                                                    </Button>
                                                ) : (
                                                    <Button asChild size="sm" variant="ghost">
                                                        <Link href={route(productInfo.publicRoute, { [productInfo.type]: productInfo.slug })}>
                                                            <ExternalLink className="mr-2 h-4 w-4" />
                                                            Lihat Detail Produk
                                                        </Link>
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {invoice.status === 'pending' && !isExpired && (
                                <Alert className="mb-6 border-yellow-200 bg-yellow-50">
                                    <Clock className="h-4 w-4" />
                                    <AlertDescription>
                                        <div className="flex items-center justify-between">
                                            <span>
                                                Pembayaran akan kedaluwarsa dalam {hoursLeft} jam {minutesLeft} menit.
                                            </span>
                                        </div>
                                    </AlertDescription>
                                </Alert>
                            )}

                            {invoice.status === 'pending' && isExpired && (
                                <Alert className="mb-6 border-red-200 bg-red-50">
                                    <XCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        Invoice ini sudah kedaluwarsa dan tidak dapat dibayar lagi. Silakan buat pesanan baru.
                                    </AlertDescription>
                                </Alert>
                            )}

                            {invoice.status === 'failed' && (
                                <Alert className="mb-6 border-red-200 bg-red-50">
                                    <XCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        Invoice ini telah dibatalkan dan tidak dapat dibayar lagi. Silakan buat pesanan baru jika masih ingin membeli.
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div>
                                    <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Detail Pembayaran</h3>
                                    <div className="space-y-2 text-sm">
                                        {invoice.discount_amount > 0 && (
                                            <>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600 dark:text-gray-400">Harga Asli:</span>
                                                    <span className="medium">
                                                        Rp {(invoice.discount_amount + invoice.nett_amount)?.toLocaleString('id-ID')}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600 dark:text-gray-400">Diskon:</span>
                                                    <span className="text-gray-500 line-through">
                                                        Rp {invoice.discount_amount?.toLocaleString('id-ID') || '0'}
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                                            <span className="font-medium">Rp {invoice.nett_amount?.toLocaleString('id-ID') || '0'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Biaya Transaksi:</span>
                                            <span className="font-medium">
                                                Rp {((invoice.amount || 0) - (invoice.nett_amount || 0)).toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-t pt-2 text-lg font-semibold">
                                            <span>Total:</span>
                                            <span>Rp {invoice.amount?.toLocaleString('id-ID') || '0'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Informasi Pembayaran</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">Status:</span>
                                            <span className={`font-medium ${getStatusColor()}`}>{getStatusText()}</span>
                                        </div>
                                        {invoice.payment_method && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600 dark:text-gray-400">Metode:</span>
                                                <span className="font-medium">{invoice.payment_method}</span>
                                            </div>
                                        )}
                                        {invoice.payment_channel && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600 dark:text-gray-400">Channel:</span>
                                                <span className="font-medium">{invoice.payment_channel}</span>
                                            </div>
                                        )}
                                        {invoice.paid_at && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600 dark:text-gray-400">Dibayar pada:</span>
                                                <span className="font-medium">{new Date(invoice.paid_at).toLocaleString('id-ID')}</span>
                                            </div>
                                        )}
                                        {invoice.expires_at && invoice.status === 'pending' && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600 dark:text-gray-400">Kedaluwarsa:</span>
                                                <span className="font-medium">{new Date(invoice.expires_at).toLocaleString('id-ID')}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col justify-center gap-4 sm:flex-row">
                                {invoice.status === 'pending' && !isExpired && invoice.invoice_url && (
                                    <>
                                        <Button asChild size="lg" className="w-full sm:w-auto">
                                            <a href={invoice.invoice_url} target="_blank" rel="noopener noreferrer">
                                                Lanjutkan Pembayaran
                                            </a>
                                        </Button>

                                        <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="lg"
                                                    className="w-full border-red-600 text-red-600 hover:bg-red-50 sm:w-auto"
                                                    disabled={cancelLoading}
                                                >
                                                    {cancelLoading ? 'Membatalkan...' : 'Batalkan Pesanan'}
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Batalkan Pesanan?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Apakah Anda yakin ingin membatalkan pesanan ini? Invoice akan dinonaktifkan dan tidak dapat
                                                        dibayar lagi. Tindakan ini tidak dapat dibatalkan.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Tidak, Pertahankan</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={handleCancelConfirm}
                                                        className="border-red-600 bg-red-600 hover:bg-red-700"
                                                    >
                                                        Ya, Batalkan Pesanan
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </>
                                )}

                                {invoice.status === 'paid' && (
                                    <>
                                        <Button asChild className="w-full sm:w-auto" variant="outline">
                                            <Link href={route('profile.transactions')}>Lihat Riwayat Transaksi</Link>
                                        </Button>
                                        <Button asChild>
                                            <a href={route('invoice.pdf', { id: invoice.id })} target="_blank" rel="noopener noreferrer">
                                                <FileText className="size-4" />
                                                Unduh Invoice
                                            </a>
                                        </Button>
                                    </>
                                )}

                                {(invoice.status === 'failed' || isExpired) && (
                                    <Button asChild size="lg" className="w-full sm:w-auto">
                                        <Link href={route('home')}>
                                            <Home /> Kembali ke Beranda
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </UserLayout>
    );
}
