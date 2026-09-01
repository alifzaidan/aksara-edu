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
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { AlertTriangle, CalendarClock, CheckCircle, CheckCircle2, Clock, ExternalLink, FileText, Home, XCircle } from 'lucide-react';
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

interface CertificationProgramItem {
    id: string;
    certificationProgram: {
        id: string;
        title: string;
        slug: string;
        thumbnail: string;
    };
}

interface PrivateItem {
    id: string;
    privateClass?: {
        id: string;
        title: string;
        slug: string;
        thumbnail?: string | null;
    };
    private_class?: {
        id: string;
        title: string;
        slug: string;
        thumbnail?: string | null;
    };
}

interface BundleEnrollment {
    id: string;
    bundle?: {
        id: string;
        title: string;
        slug: string;
        thumbnail?: string | null;
    };
}

interface InstallmentTermItem {
    id: string;
    installment_number: number;
    invoice_code: string;
    amount: number;
    status: 'pending' | 'paid' | 'failed';
    installment_due_date: string | null;
    paid_at: string | null;
    payment_method: string | null;
    payment_channel: string | null;
    is_overdue?: boolean;
}

interface Invoice {
    id: string;
    invoice_code: string;
    invoice_url: string;
    amount: number;
    nett_amount: number;
    discount_amount: number;
    status: 'paid' | 'pending' | 'failed' | 'completed' | 'installment_pending';
    is_installment?: boolean;
    access_suspended_at?: string | null;
    installment_terms?: InstallmentTermItem[];
    installmentTerms?: InstallmentTermItem[];
    paid_at: string | null;
    expires_at: string | null;
    payment_method: string | null;
    payment_channel: string | null;
    course_items?: CourseItem[];
    bootcamp_items?: BootcampItem[];
    webinar_items?: WebinarItem[];
    private_items?: PrivateItem[];
    privateItems?: PrivateItem[];
    bundle_enrollments?: BundleEnrollment[];
    bundleEnrollments?: BundleEnrollment[];
    certificationProgramItems?: CertificationProgramItem[];
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

    const terms = invoice.installment_terms || invoice.installmentTerms || [];
    const isInstallment =
        invoice.is_installment ||
        invoice.status === 'installment_pending' ||
        terms.length > 0;
    const paidTermsCount = terms.filter((t: any) => t.status === 'paid').length;
    const totalTermsCount = terms.length;
    const isFullyPaid = totalTermsCount > 0 && paidTermsCount === totalTermsCount;
    const isSuspended = !!invoice.access_suspended_at;
    const isAccessible =
        invoice.status === 'paid' ||
        invoice.status === 'completed' ||
        (invoice.status === 'installment_pending' && !isSuspended);

    const getProductInfo = () => {
        const privateItems = invoice.private_items || invoice.privateItems || [];
        const bundleItems = invoice.bundle_enrollments || invoice.bundleEnrollments || [];

        if (invoice.course_items && invoice.course_items.length > 0) {
            const course = invoice.course_items[0].course;
            return {
                type: 'course',
                name: course.title,
                slug: course.slug,
                thumbnail: course.thumbnail,
                profileUrl: `/profile/my-courses/${course.slug}`,
                publicUrl: `/course/${course.slug}`,
            };
        } else if (invoice.bootcamp_items && invoice.bootcamp_items.length > 0) {
            const bootcamp = invoice.bootcamp_items[0].bootcamp;
            return {
                type: 'bootcamp',
                name: bootcamp.title,
                slug: bootcamp.slug,
                thumbnail: bootcamp.thumbnail,
                profileUrl: `/profile/my-bootcamps/${bootcamp.slug}`,
                publicUrl: `/bootcamp/${bootcamp.slug}`,
            };
        } else if (invoice.webinar_items && invoice.webinar_items.length > 0) {
            const webinar = invoice.webinar_items[0].webinar;
            return {
                type: 'webinar',
                name: webinar.title,
                slug: webinar.slug,
                thumbnail: webinar.thumbnail,
                profileUrl: `/profile/my-webinars/${webinar.slug}`,
                publicUrl: `/webinar/${webinar.slug}`,
            };
        } else if (privateItems.length > 0) {
            const pc = privateItems[0].privateClass || privateItems[0].private_class;
            return {
                type: 'private',
                name: pc?.title || 'Private Class',
                slug: pc?.slug || '',
                thumbnail: pc?.thumbnail || '',
                profileUrl: `/private/${pc?.slug}`,
                publicUrl: `/private/${pc?.slug}`,
            };
        } else if (bundleItems.length > 0) {
            const bundle = bundleItems[0].bundle;
            return {
                type: 'bundle',
                name: bundle?.title || 'Paket Bundling',
                slug: bundle?.slug || '',
                thumbnail: bundle?.thumbnail || '',
                profileUrl: `/bundling/${bundle?.slug}`,
                publicUrl: `/bundling/${bundle?.slug}`,
            };
        } else if (invoice.certificationProgramItems && invoice.certificationProgramItems.length > 0) {
            const certificationProgram = invoice.certificationProgramItems[0].certificationProgram;
            return {
                type: 'certification-program',
                name: certificationProgram.title,
                slug: certificationProgram.slug,
                thumbnail: certificationProgram.thumbnail,
                profileUrl: route('profile.certification-program.detail', { program: certificationProgram.slug }),
                publicUrl: `/certification-program/${certificationProgram.slug}`,
            };
        }
        return null;
    };

    const productInfo = getProductInfo();

    const handleCancelConfirm = async () => {
        setCancelLoading(true);
        setDialogOpen(false);

        try {
            const res = await axios.post(route('invoice.cancel', invoice.id));

            if (res.data?.success) {
                toast.success('Pesanan berhasil dibatalkan dan invoice telah dinonaktifkan.');
                window.location.reload();
            } else {
                toast.error(res.data?.message || 'Gagal membatalkan pesanan.');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Terjadi kesalahan saat membatalkan pesanan.');
        } finally {
            setCancelLoading(false);
        }
    };

    const getStatusIcon = () => {
        if (isInstallment) {
            if (isFullyPaid || invoice.status === 'paid' || invoice.status === 'completed') {
                return <CheckCircle className="mt-1 h-6 w-6 text-green-500" />;
            }
            if (isSuspended) {
                return <AlertTriangle className="mt-1 h-6 w-6 text-red-500" />;
            }
            return <Clock className="mt-1 h-6 w-6 text-amber-500" />;
        }
        switch (invoice.status) {
            case 'paid':
            case 'completed':
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
        if (isInstallment) {
            if (isFullyPaid || invoice.status === 'paid' || invoice.status === 'completed') {
                return 'Cicilan Lunas';
            }
            if (isSuspended) {
                return 'Akses Program Dibekukan';
            }
            return `Cicilan Berjalan (${paidTermsCount}/${totalTermsCount || '?'} Termin Terbayar)`;
        }
        switch (invoice.status) {
            case 'paid':
            case 'completed':
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
        if (isInstallment) {
            if (isFullyPaid || invoice.status === 'paid' || invoice.status === 'completed') {
                return 'text-green-600';
            }
            if (isSuspended) {
                return 'text-red-600';
            }
            return 'text-amber-500';
        }
        switch (invoice.status) {
            case 'paid':
            case 'completed':
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
                            {isInstallment && (
                                <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-900/20">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <h4 className="font-semibold text-amber-900 dark:text-amber-200">
                                                {isSuspended ? '⚠️ Akses Program Sedang Dibekukan' : 'ℹ️ Transaksi Pembayaran Cicilan'}
                                            </h4>
                                            <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
                                                {isSuspended
                                                    ? 'Akses materi dan sesi program dibekukan karena terdapat termin cicilan yang telah melewati tanggal jatuh tempo.'
                                                    : `Anda telah membayar ${paidTermsCount} dari ${totalTermsCount} termin cicilan. Program aktif dan dapat diakses.`}
                                            </p>
                                        </div>
                                        <Button asChild size="sm" className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white">
                                            <Link href={route('profile.installments')}>
                                                Kelola Cicilan Saya
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            )}

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
                                                      : productInfo.type === 'webinar'
                                                        ? 'Webinar'
                                                        : productInfo.type === 'private'
                                                          ? 'Private Class'
                                                          : productInfo.type === 'bundle'
                                                            ? 'Paket Bundling'
                                                            : 'Sertifikasi Program'}
                                            </p>
                                            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                                                {isAccessible ? (
                                                    <Button asChild size="sm" variant="outline">
                                                        <Link href={productInfo.profileUrl}>
                                                            <ExternalLink className="mr-2 h-4 w-4" />
                                                            Buka di Profile
                                                        </Link>
                                                    </Button>
                                                ) : (
                                                    <Button asChild size="sm" variant="ghost">
                                                        <Link href={productInfo.publicUrl}>
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

                            {/* Installment terms breakdown */}
                            {isInstallment && terms.length > 0 && (
                                <div className="mb-6 rounded-lg border border-border bg-gray-50 dark:bg-gray-700/30 p-4">
                                    <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Rincian Termin Cicilan</h3>
                                    <div className="space-y-2">
                                        {terms.map((term: InstallmentTermItem) => {
                                            const isTermOverdue = term.is_overdue ?? false;
                                            return (
                                                <div
                                                    key={term.id}
                                                    className={`flex items-start gap-3 rounded-lg border p-3 bg-white dark:bg-gray-800 ${
                                                        term.status === 'paid'
                                                            ? 'border-green-200 dark:border-green-800'
                                                            : isTermOverdue
                                                              ? 'border-orange-200 dark:border-orange-800'
                                                              : 'border-border'
                                                    }`}
                                                >
                                                    <div
                                                        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white mt-0.5 ${
                                                            term.status === 'paid'
                                                                ? 'bg-green-500'
                                                                : isTermOverdue
                                                                  ? 'bg-orange-500'
                                                                  : 'bg-slate-400'
                                                        }`}
                                                    >
                                                        {term.installment_number}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                Termin ke-{term.installment_number}{term.installment_number === 1 ? ' (DP)' : ''}
                                                            </p>
                                                            {term.status === 'paid' ? (
                                                                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs px-2 py-0.5">
                                                                    <CheckCircle2 className="h-3 w-3" /> Lunas
                                                                </span>
                                                            ) : isTermOverdue ? (
                                                                <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs px-2 py-0.5">
                                                                    <XCircle className="h-3 w-3" /> Jatuh Tempo Terlewat
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs px-2 py-0.5">
                                                                    <Clock className="h-3 w-3" /> Menunggu
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="space-y-0.5 text-xs">
                                                            {term.installment_due_date && (
                                                                <p className={isTermOverdue ? 'text-orange-600 dark:text-orange-400 font-medium' : 'text-gray-500 dark:text-gray-400'}>
                                                                    <CalendarClock className="h-3 w-3 inline-block mr-1 -mt-0.5" />
                                                                    Jatuh tempo: {format(parseISO(term.installment_due_date), 'dd MMMM yyyy', { locale: idLocale })}
                                                                </p>
                                                            )}
                                                            {term.paid_at && (
                                                                <p className="text-green-600 dark:text-green-400">
                                                                    <CheckCircle className="h-3 w-3 inline-block mr-1 -mt-0.5" />
                                                                    Dibayar: {format(parseISO(term.paid_at), 'dd MMMM yyyy, HH:mm', { locale: idLocale })}
                                                                    {term.payment_channel && ` · via ${term.payment_channel}`}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <p className="text-sm font-semibold flex-shrink-0 mt-0.5 text-gray-900 dark:text-white">
                                                        Rp {term.amount.toLocaleString('id-ID')}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

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

                                {(invoice.status === 'paid' || (isInstallment && isFullyPaid)) && (
                                    <>
                                        <Button asChild className="w-full sm:w-auto" variant="outline">
                                            <Link href={route('profile.transactions')}>Lihat Riwayat Transaksi</Link>
                                        </Button>
                                        {/* Hanya tampilkan tombol invoice jika bukan cicilan atau cicilan sudah lunas */}
                                        {(!isInstallment || isFullyPaid) && (
                                            <Button asChild>
                                                <a href={route('invoice.pdf', { id: invoice.id })} target="_blank" rel="noopener noreferrer">
                                                    <FileText className="size-4" />
                                                    Unduh Invoice
                                                </a>
                                            </Button>
                                        )}
                                    </>
                                )}

                                {isInstallment && !isFullyPaid && (
                                    <Button asChild className="w-full sm:w-auto" variant="outline">
                                        <Link href={route('profile.installments')}>Lihat Cicilan Saya</Link>
                                    </Button>
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
