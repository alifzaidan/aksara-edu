import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Link } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import {
    CreditCard,
    Clock,
    CheckCircle2,
    AlertTriangle,
    Lock,
    ExternalLink,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ActiveInstallmentData } from '@/components/installment-options';

interface ProfileInstallmentActionProps {
    activeInstallment?: ActiveInstallmentData | null;
    invoiceId?: string;
    isInstallment?: boolean;
    isFullyPaid?: boolean;
    isSuspended?: boolean;
    paidTerms?: number;
    totalTerms?: number;
    installmentTerms?: any[];
    productTitle?: string;
    variant?: 'card' | 'banner';
    className?: string;
}

const rupiahFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
});

export default function ProfileInstallmentAction({
    activeInstallment,
    invoiceId,
    isInstallment,
    isFullyPaid,
    isSuspended = false,
    paidTerms,
    totalTerms,
    installmentTerms = [],
    variant = 'card',
    className = '',
}: ProfileInstallmentActionProps) {
    const [isPaying, setIsPaying] = useState(false);

    // Deteksi apakah produk ini menggunakan skema cicilan
    const isInstallmentActive = Boolean(
        activeInstallment !== undefined ? activeInstallment !== null : isInstallment
    );

    if (!isInstallmentActive) {
        return null;
    }

    // Resolusi ID invoice induk
    const parentInvoiceId =
        activeInstallment?.parent_invoice_id || invoiceId || '';

    // Resolusi total dan termin terbayar
    const total =
        activeInstallment?.total_terms ?? totalTerms ?? installmentTerms.length ?? 0;
    const paid =
        activeInstallment?.paid_terms ??
        paidTerms ??
        installmentTerms.filter((t) => t.status === 'paid').length ??
        0;

    // Resolusi status lunas
    const fullyPaid = Boolean(
        activeInstallment?.is_fully_paid ??
        isFullyPaid ??
        (total > 0 && paid >= total)
    );

    // Resolusi termin berikutnya yang belum dibayar
    let nextTerm = activeInstallment?.next_term;
    if (!nextTerm && !fullyPaid && installmentTerms.length > 0) {
        const sorted = [...installmentTerms].sort(
            (a, b) => (a.installment_number || a.term_number) - (b.installment_number || b.term_number)
        );
        const unpaid = sorted.find((t) => t.status !== 'paid');
        if (unpaid) {
            const dueDate = unpaid.installment_due_date || unpaid.due_date;
            const isOverdue = dueDate
                ? new Date(dueDate).getTime() < new Date().setHours(23, 59, 59, 999)
                : false;

            const baseAmount = Number(unpaid.amount || 0);
            const nettAmount = Number(unpaid.nett_amount || baseAmount);
            // Tambahkan admin fee 5000 jika belum ada di amount
            const amountWithAdmin =
                baseAmount === nettAmount && baseAmount > 0
                    ? baseAmount + 5000
                    : baseAmount;

            nextTerm = {
                id: unpaid.id,
                term_number: unpaid.installment_number || unpaid.term_number || (paid + 1),
                amount: amountWithAdmin,
                due_date: dueDate ? (typeof dueDate === 'string' ? dueDate : format(new Date(dueDate), 'yyyy-MM-dd')) : null,
                is_overdue: isOverdue,
            };
        }
    }

    // Eksekusi pembayaran cicilan berikutnya
    async function handlePay() {
        if (!parentInvoiceId) {
            toast.error('Data invoice cicilan tidak ditemukan.');
            return;
        }

        setIsPaying(true);
        try {
            const res = await axios.post(`/installment/${parentInvoiceId}/pay`);
            if (res.data?.success && res.data?.payment_url) {
                toast.success('Mengarahkan ke halaman pembayaran...');
                window.location.href = res.data.payment_url;
            } else {
                toast.error(res.data?.message || 'Gagal memproses pembayaran cicilan.');
                setIsPaying(false);
            }
        } catch (error: any) {
            toast.error(
                error.response?.data?.message ||
                'Terjadi kesalahan saat memproses pembayaran cicilan.'
            );
            setIsPaying(false);
        }
    }

    // Tampilan jika sudah LUNAS
    if (fullyPaid) {
        if (variant === 'banner') {
            return (
                <div
                    className={`flex items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50/80 px-4 py-2.5 text-xs text-green-900 dark:border-green-900/50 dark:bg-green-950/40 dark:text-green-200 ${className}`}
                >
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                        <span className="font-semibold">
                            Cicilan Lunas ({total}/{total} Termin)
                        </span>
                    </div>
                    <Link
                        href="/profile/installments"
                        className="font-medium text-green-700 underline hover:text-green-800 dark:text-green-300"
                    >
                        Riwayat
                    </Link>
                </div>
            );
        }

        return (
            <div
                className={`rounded-xl border border-green-200 bg-green-50/70 p-4 text-xs text-green-900 shadow-sm dark:border-green-900/40 dark:bg-green-950/30 dark:text-green-200 ${className}`}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-600 text-white">
                            <CheckCircle2 className="h-4 w-4" />
                        </div>
                        <div>
                            <p className="font-semibold text-sm">Cicilan Lunas</p>
                            <p className="text-muted-foreground text-[11px] text-green-700 dark:text-green-300">
                                Seluruh {total} termin pembayaran telah lunas.
                            </p>
                        </div>
                    </div>
                    <Badge variant="outline" className="border-green-300 bg-green-100 text-green-800 dark:border-green-800 dark:bg-green-900/40 dark:text-green-300">
                        Lunas
                    </Badge>
                </div>
            </div>
        );
    }

    // Hitung persentase progres
    const progressPercent = total > 0 ? Math.round((paid / total) * 100) : 0;
    const isSuspendedOrOverdue = isSuspended || Boolean(nextTerm?.is_overdue);

    // Format tanggal jatuh tempo jika ada
    let dueDateFormatted: string | null = null;
    if (nextTerm?.due_date) {
        try {
            dueDateFormatted = format(parseISO(nextTerm.due_date), 'dd MMMM yyyy', {
                locale: id,
            });
        } catch {
            dueDateFormatted = nextTerm.due_date;
        }
    }

    // Tampilan BANNER (ringkas untuk ditempatkan di header / bar)
    if (variant === 'banner') {
        return (
            <div
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-3.5 text-xs shadow-sm ${
                    isSuspendedOrOverdue
                        ? 'border-red-300 bg-red-50 text-red-900 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-200'
                        : 'border-amber-200 bg-amber-50/90 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200'
                } ${className}`}
            >
                <div className="flex items-start gap-2.5">
                    {isSuspendedOrOverdue ? (
                        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    ) : (
                        <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    )}
                    <div>
                        <p className="font-semibold text-sm">
                            {isSuspendedOrOverdue
                                ? '⚠️ Akses Ditangguhkan — Tagihan Cicilan Terlewat'
                                : 'Pembayaran Cicilan Aktif'}
                        </p>
                        <p className="mt-0.5 opacity-90">
                            {paid} dari {total} termin lunas ({progressPercent}%).{' '}
                            {nextTerm && (
                                <span>
                                    Tagihan berikutnya: <strong>Termin ke-{nextTerm.term_number}</strong> ({rupiahFormatter.format(nextTerm.amount)})
                                    {dueDateFormatted && ` • Jatuh tempo: ${dueDateFormatted}`}
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                    <Button
                        size="sm"
                        onClick={handlePay}
                        disabled={isPaying || Boolean(nextTerm?.is_overdue)}
                        className={`gap-1.5 font-semibold ${
                            isSuspendedOrOverdue
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'bg-amber-600 hover:bg-amber-700 text-white'
                        }`}
                    >
                        {isPaying ? (
                            <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Memproses...
                            </>
                        ) : (
                            <>
                                <CreditCard className="h-3.5 w-3.5" />
                                {nextTerm?.is_overdue
                                    ? 'Batas Waktu Terlewat'
                                    : nextTerm?.term_number === total
                                      ? 'Lunasi Cicilan'
                                      : `Bayar Termin ke-${nextTerm?.term_number || paid + 1}`}
                            </>
                        )}
                    </Button>
                    <Button asChild size="sm" variant="outline" className="border-current">
                        <Link href="/profile/installments">
                            Riwayat
                        </Link>
                    </Button>
                </div>
            </div>
        );
    }

    // Tampilan CARD (lengkap untuk ditempatkan di sidebar / info section)
    return (
        <div
            className={`rounded-xl border bg-card p-5 shadow-sm transition-all ${
                isSuspendedOrOverdue
                    ? 'border-red-300 dark:border-red-800'
                    : 'border-amber-300/80 dark:border-amber-800/80'
            } ${className}`}
        >
            {/* Header Card */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-border">
                <div className="flex items-center gap-2.5">
                    <div
                        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
                            isSuspendedOrOverdue
                                ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                        }`}
                    >
                        {isSuspendedOrOverdue ? (
                            <Lock className="h-4 w-4" />
                        ) : (
                            <Clock className="h-4 w-4" />
                        )}
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm text-foreground">
                            {isSuspendedOrOverdue
                                ? 'Akses Cicilan Ditangguhkan'
                                : 'Status Pembayaran Cicilan'}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                            {paid} dari {total} termin telah dibayar
                        </p>
                    </div>
                </div>

                <Badge
                    variant="outline"
                    className={`text-xs ${
                        isSuspendedOrOverdue
                            ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400'
                            : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400'
                    }`}
                >
                    {progressPercent}% Lunas
                </Badge>
            </div>

            {/* Progres Bar */}
            <div className="my-3">
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                        className={`h-full transition-all duration-300 ${
                            isSuspendedOrOverdue ? 'bg-red-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            {/* Tagihan Berikutnya Info Box */}
            {nextTerm && (
                <div
                    className={`rounded-lg border p-3.5 text-xs mb-4 space-y-1.5 ${
                        isSuspendedOrOverdue
                            ? 'border-red-200 bg-red-50/60 dark:border-red-900/30 dark:bg-red-950/20'
                            : 'border-border bg-muted/30'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground font-medium">
                            Tagihan Termin ke-{nextTerm.term_number}
                        </span>
                        <span className="font-bold text-sm text-foreground">
                            {rupiahFormatter.format(nextTerm.amount)}
                        </span>
                    </div>

                    {dueDateFormatted && (
                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/50">
                            <span className="text-muted-foreground">Jatuh Tempo</span>
                            <span
                                className={`font-medium ${
                                    nextTerm.is_overdue
                                        ? 'text-red-600 dark:text-red-400 font-semibold'
                                        : 'text-foreground'
                                }`}
                            >
                                {nextTerm.is_overdue ? `Terlewat (${dueDateFormatted})` : dueDateFormatted}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Warning Overdue Message */}
            {nextTerm?.is_overdue && (
                <div className="mb-3.5 rounded-lg bg-red-50 border border-red-200 p-2.5 text-xs text-red-800 dark:bg-red-950/30 dark:border-red-900 dark:text-red-300 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <span>
                        Batas waktu pembayaran telah melewati jatuh tempo. Hubungi admin via WhatsApp untuk penyelesaian cicilan.
                    </span>
                </div>
            )}

            {/* Tombol Aksi Pelunasan Cicilan */}
            <div className="space-y-2">
                <Button
                    type="button"
                    className={`w-full font-semibold gap-2 ${
                        isSuspendedOrOverdue
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                    }`}
                    size="lg"
                    onClick={handlePay}
                    disabled={isPaying || Boolean(nextTerm?.is_overdue)}
                    id="btn-lunasi-cicilan-profile"
                >
                    {isPaying ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Memproses Pembayaran...
                        </>
                    ) : (
                        <>
                            <CreditCard className="h-4 w-4" />
                            {nextTerm?.is_overdue
                                ? `Cicilan ke-${nextTerm.term_number} — Batas Waktu Terlewat`
                                : nextTerm?.term_number === total
                                  ? `Lunasi Cicilan (${rupiahFormatter.format(nextTerm.amount)})`
                                  : `Bayar Cicilan ke-${nextTerm?.term_number || paid + 1} (${nextTerm ? rupiahFormatter.format(nextTerm.amount) : ''})`}
                        </>
                    )}
                </Button>

                <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-muted-foreground hover:text-foreground"
                >
                    <Link href="/profile/installments" className="flex items-center justify-center gap-1.5">
                        <span>Lihat Riwayat & Jadwal Cicilan</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                </Button>
            </div>
        </div>
    );
}
