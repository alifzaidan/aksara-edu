import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Link } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { enUS, id } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
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
    const { t, i18n } = useTranslation('profile');
    const dateLocale = i18n.language === 'en' ? 'en-US' : 'id-ID';
    const dateLocaleObj = i18n.language === 'en' ? enUS : id;

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat(dateLocale, {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(val);

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
            toast.error(t('installmentAction.invoiceNotFound'));
            return;
        }

        setIsPaying(true);
        try {
            const res = await axios.post(`/installment/${parentInvoiceId}/pay`);
            if (res.data?.success && res.data?.payment_url) {
                toast.success(t('installmentAction.redirectingToPayment'));
                window.location.href = res.data.payment_url;
            } else {
                toast.error(res.data?.message || t('installmentAction.failedToProcess'));
                setIsPaying(false);
            }
        } catch (error: any) {
            toast.error(
                error.response?.data?.message ||
                t('installmentAction.errorOccurred')
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
                            {t('installmentAction.paidBanner', { paid: total, total })}
                        </span>
                    </div>
                    <Link
                        href="/profile/installments"
                        className="font-medium text-green-700 underline hover:text-green-800 dark:text-green-300"
                    >
                        {t('installmentAction.history')}
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
                            <p className="font-semibold text-sm">{t('installmentAction.paidTitle')}</p>
                            <p className="text-[11px] text-green-700 dark:text-green-300">
                                {t('installmentAction.paidDesc', { total })}
                            </p>
                        </div>
                    </div>
                    <Badge variant="outline" className="border-green-300 bg-green-100 text-green-800 dark:border-green-800 dark:bg-green-900/40 dark:text-green-300">
                        {t('installmentAction.paidBadge')}
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
                locale: dateLocaleObj,
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
                                ? t('installmentAction.accessSuspendedBanner')
                                : t('installmentAction.activePaymentBanner')}
                        </p>
                        <p className="mt-0.5 opacity-90">
                            {t('installmentAction.bannerProgress', { paid, total, percent: progressPercent })}{' '}
                            {nextTerm && (
                                <span>
                                    {t('installmentAction.bannerNextTerm', { term: nextTerm.term_number, amount: formatCurrency(nextTerm.amount) })}
                                    {dueDateFormatted && ` • ${t('installmentAction.dueDate', { date: dueDateFormatted })}`}
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
                                {t('installmentAction.processing')}
                            </>
                        ) : (
                            <>
                                <CreditCard className="h-3.5 w-3.5" />
                                {nextTerm?.is_overdue
                                    ? t('installmentAction.deadlinePassed')
                                    : nextTerm?.term_number === total
                                      ? t('installmentAction.payOffInstallment')
                                      : t('installmentAction.payTermN', { term: nextTerm?.term_number || paid + 1 })}
                            </>
                        )}
                    </Button>
                    <Button asChild size="sm" variant="outline" className="border-current">
                        <Link href="/profile/installments">
                            {t('installmentAction.history')}
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
                                ? t('installmentAction.suspendedTitle')
                                : t('installmentAction.activeTitle')}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                            {t('installmentAction.paidTermsCount', { paid, total })}
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
                    {t('installmentAction.percentPaid', { percent: progressPercent })}
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
                            {t('installmentAction.nextTermLabel', { term: nextTerm.term_number })}
                        </span>
                        <span className="font-bold text-sm text-foreground">
                            {formatCurrency(nextTerm.amount)}
                        </span>
                    </div>

                    {dueDateFormatted && (
                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/50">
                            <span className="text-muted-foreground">{t('common.dueDate') || 'Jatuh Tempo'}</span>
                            <span
                                className={`font-medium ${
                                    nextTerm.is_overdue
                                        ? 'text-red-600 dark:text-red-400 font-semibold'
                                        : 'text-foreground'
                                }`}
                            >
                                {nextTerm.is_overdue ? t('installmentAction.dueDateOverdue', { date: dueDateFormatted }) : dueDateFormatted}
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
                        {t('installmentAction.overdueWarning')}
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
                            {t('installmentAction.processingPayment')}
                        </>
                    ) : (
                        <>
                            <CreditCard className="h-4 w-4" />
                            {nextTerm?.is_overdue
                                ? t('installmentAction.termOverdueBtn', { term: nextTerm.term_number })
                                : nextTerm?.term_number === total
                                  ? t('installmentAction.payOffWithAmount', { amount: formatCurrency(nextTerm.amount) })
                                  : t('installmentAction.payTermWithAmount', { term: nextTerm?.term_number || paid + 1, amount: nextTerm ? formatCurrency(nextTerm.amount) : '' })}
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
                        <span>{t('installmentAction.viewScheduleAndHistory')}</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                </Button>
            </div>
        </div>
    );
}
