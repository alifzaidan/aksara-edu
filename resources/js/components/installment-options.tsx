import axios from 'axios';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { rupiahFormatter } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { enUS, id } from 'date-fns/locale';
import { AlertCircle, CheckCircle2, Clock, CreditCard, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { usePage } from '@inertiajs/react';

export interface InstallmentTermOption {
    term_number: number;
    amount: number;
    due_date: string;
}

export interface ActiveInstallmentTerm {
    id: string;
    term_number: number;
    amount: number;
    due_date: string | null;
    status: string;
    paid_at: string | null;
}

export interface ActiveInstallmentData {
    parent_invoice_id: string;
    invoice_code: string;
    status: string;
    amount: number;
    total_terms: number;
    paid_terms: number;
    is_fully_paid: boolean;
    next_term: {
        id: string;
        term_number: number;
        amount: number;
        due_date: string | null;
        is_overdue: boolean;
    } | null;
    terms: ActiveInstallmentTerm[];
}

interface InstallmentOptionsProps {
    productType: string;
    productId: string;
    productPrice: number;
    terms: InstallmentTermOption[];
    activeInstallment?: ActiveInstallmentData | null;
    privateClassScheduleId?: string;
    termsAccepted?: boolean;
    onTermsAcceptedChange?: (accepted: boolean) => void;
    onBeforePay?: () => Promise<boolean> | boolean;
}

export default function InstallmentOptions({
    productType,
    productId,
    terms,
    activeInstallment,
    privateClassScheduleId,
    termsAccepted,
    onTermsAcceptedChange,
    onBeforePay,
}: InstallmentOptionsProps) {
    const { t, i18n } = useTranslation('user');
    const dateLocale = i18n.language === 'en' ? 'en-US' : 'id-ID';
    const dateLocaleObj = i18n.language === 'en' ? enUS : id;

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat(dateLocale, {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(val);

    const [isLoading, setIsLoading] = useState(false);
    const { auth } = usePage<{ auth: { user: any | null } }>().props;

    const ADMIN_FEE = 5000;

    const hasActiveInstallment = !!activeInstallment && activeInstallment.terms?.length > 0;
    const isFullyPaid = hasActiveInstallment && activeInstallment.is_fully_paid;
    const nextTerm = hasActiveInstallment ? activeInstallment.next_term : null;

    const baseTotalAmount = terms.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const totalAmount = baseTotalAmount + (terms.length * ADMIN_FEE);
    const baseDpAmount = Number(terms[0]?.amount ?? 0);
    const dpAmount = baseDpAmount > 0 ? baseDpAmount + ADMIN_FEE : 0;

    const remainingAmount = hasActiveInstallment
        ? activeInstallment.terms.filter((t) => t.status !== 'paid').reduce((sum, t) => sum + Number(t.amount || 0), 0)
        : totalAmount;

    const isTermOverdueCheck = (dueDateStr?: string | null) => {
        if (!dueDateStr) return false;
        try {
            const d = typeof dueDateStr === 'string' ? parseISO(dueDateStr) : new Date(dueDateStr);
            if (isNaN(d.getTime())) return false;
            const endOfDay = new Date(d);
            endOfDay.setHours(23, 59, 59, 999);
            return new Date() > endOfDay;
        } catch {
            return false;
        }
    };

    const isAnyTermOverdue = !hasActiveInstallment && terms.some((t) => isTermOverdueCheck(t.due_date));

    async function handlePayNextTerm() {
        if (!activeInstallment || !nextTerm) return;

        if (!auth?.user) {
            toast.error(t('installmentOptions.errors.loginRequiredToContinue'));
            window.location.href = '/login';
            return;
        }

        setIsLoading(true);
        try {
            if (onBeforePay) {
                const canProceed = await onBeforePay();
                if (!canProceed) {
                    setIsLoading(false);
                    return;
                }
            }

            const res = await axios.post(`/installment/${activeInstallment.parent_invoice_id}/pay`);

            if (res.data.success && res.data.payment_url) {
                window.location.href = res.data.payment_url;
            } else {
                toast.error(res.data.message || t('installmentOptions.errors.failedToProcessTermPayment'));
                setIsLoading(false);
            }
        } catch (error: any) {
            setIsLoading(false);
            if (error.response?.status === 401) {
                toast.error(t('installmentOptions.errors.completeDataOrLogin'));
            } else {
                toast.error(error.response?.data?.message || t('installmentOptions.errors.termPaymentError'));
            }
        }
    }

    async function handlePayInstallment() {
        if (isAnyTermOverdue) {
            toast.error(t('installmentOptions.errors.installmentExpired'));
            return;
        }

        if (!auth?.user) {
            toast.error(t('installmentOptions.errors.loginRequiredToContinueInstallment'));
            window.location.href = '/login';
            return;
        }

        if (termsAccepted !== undefined && !termsAccepted) {
            toast.error(t('installmentOptions.errors.agreeTermsRequired'));
            return;
        }

        setIsLoading(true);
        try {
            if (onBeforePay) {
                const canProceed = await onBeforePay();
                if (!canProceed) {
                    setIsLoading(false);
                    return;
                }
            }

            const payload: Record<string, unknown> = {
                type: productType,
                id: productId,
            };
            if (privateClassScheduleId) {
                payload.private_class_schedule_id = privateClassScheduleId;
            }

            const storedAffiliate = sessionStorage.getItem('affiliate_code') || new URLSearchParams(window.location.search).get('ref');
            if (storedAffiliate) {
                payload.affiliate_code = storedAffiliate;
            }

            const res = await axios.post('/invoice/installment', payload);

            if (res.data.success && res.data.payment_url) {
                window.location.href = res.data.payment_url;
            } else {
                toast.error(res.data.message || t('installmentOptions.errors.failedToCreateInstallmentInvoice'));
                setIsLoading(false);
            }
        } catch (error: any) {
            setIsLoading(false);
            if (error.response?.status === 401) {
                toast.error(t('installmentOptions.errors.completeRegistrationDataOrLogin'));
            } else {
                toast.error(error.response?.data?.message || t('installmentOptions.errors.installmentPaymentError'));
            }
        }
    }

    if (terms.length === 0 && !hasActiveInstallment) return null;

    // JIKA CICILAN SUDAH LUNAS SEMUA
    if (isFullyPaid) {
        return (
            <div className="space-y-4 rounded-xl border border-green-200 bg-green-50/50 p-5 text-center dark:border-green-900/50 dark:bg-green-950/20">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                    <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                    <h4 className="font-semibold text-foreground text-base">{t('installmentOptions.allPaidTitle')}</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                        {t('installmentOptions.allPaidDesc', { total: activeInstallment?.total_terms })}
                    </p>
                </div>
                <Button asChild className="w-full bg-green-600 hover:bg-green-700 text-white">
                    <a href="/profile/installments">{t('installmentOptions.btnViewInstallmentHistory')}</a>
                </Button>
            </div>
        );
    }

    // JIKA ADA CICILAN AKTIF (USER SEDANG DALAM PROSES CICILAN, MISAL SUDAH BAYAR DP / TERMIN 1)
    if (hasActiveInstallment && nextTerm) {
        return (
            <div className="space-y-4">
                {/* Banner Info Cicilan Aktif */}
                <div className="rounded-lg border border-blue-200 bg-blue-50/80 p-3.5 text-xs text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-200 flex items-start gap-2.5">
                    <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="font-semibold">{t('installmentOptions.activeInstallmentDetected', { code: activeInstallment.invoice_code })}</p>
                        <p className="mt-0.5 opacity-90">
                            {t('installmentOptions.activeInstallmentInfo', { paid: activeInstallment.paid_terms, total: activeInstallment.total_terms })}
                        </p>
                    </div>
                </div>

                {/* Summary Tagihan Berikutnya & Sisa */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-card border-2 border-primary/40 p-3.5 shadow-sm">
                        <p className="text-xs font-medium text-primary mb-1">{t('installmentOptions.nextTermBill', { term: nextTerm.term_number })}</p>
                        <p className="font-bold text-primary text-xl">{formatCurrency(nextTerm.amount)}</p>
                    </div>
                    <div className="rounded-lg bg-card border border-border p-3.5 shadow-sm">
                        <p className="text-xs text-muted-foreground mb-1">{t('installmentOptions.remainingPayment')}</p>
                        <p className="font-bold text-foreground text-xl">{formatCurrency(remainingAmount)}</p>
                    </div>
                </div>

                {/* Daftar Status Termin */}
                <div className="space-y-2.5 rounded-lg border border-border bg-card p-4">
                    <div className="flex items-center justify-between pb-1 border-b border-border">
                        <span className="text-xs font-semibold text-foreground">{t('installmentOptions.termPaymentStatus')}</span>
                        <Badge variant="outline" className="text-[11px] bg-primary/10 text-primary border-primary/20">
                            {t('installmentOptions.totalTermsBadge', { total: activeInstallment.total_terms })}
                        </Badge>
                    </div>

                    <div className="space-y-2 pt-1">
                        {activeInstallment.terms.map((term) => {
                            const isPaid = term.status === 'paid';
                            const isCurrent = term.term_number === nextTerm.term_number;

                            return (
                                <div
                                    key={term.id}
                                    className={`flex items-center justify-between gap-3 rounded-md p-2.5 text-xs transition-all ${
                                        isPaid
                                            ? 'bg-green-50/70 border border-green-200 dark:bg-green-950/20 dark:border-green-900/40'
                                            : isCurrent
                                              ? 'bg-primary/5 border-2 border-primary/50 shadow-sm'
                                              : 'bg-muted/40 border border-transparent opacity-60'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div
                                            className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                                                isPaid
                                                    ? 'bg-green-600 text-white'
                                                    : isCurrent
                                                      ? 'bg-primary text-primary-foreground'
                                                      : 'bg-muted-foreground/20 text-muted-foreground'
                                            }`}
                                        >
                                            {isPaid ? <CheckCircle2 className="h-4 w-4" /> : term.term_number}
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground flex items-center gap-1.5">
                                                {term.term_number === 1 ? t('installmentOptions.term1Dp') : t('installmentOptions.termN', { term: term.term_number })}
                                                {isPaid && (
                                                    <span className="text-[10px] font-semibold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/40 px-1.5 py-0.5 rounded">
                                                        {t('installmentOptions.paidStatus')}
                                                    </span>
                                                )}
                                                {isCurrent && (
                                                    <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                                        {t('installmentOptions.payNowStatus')}
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                                <Clock className="h-3 w-3" />
                                                {term.due_date
                                                    ? t('installmentOptions.dueDateLabel', { date: format(parseISO(term.due_date), 'dd MMMM yyyy', { locale: dateLocaleObj }) })
                                                    : '-'}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`font-semibold ${isPaid ? 'text-green-700 dark:text-green-400 line-through' : 'text-foreground'}`}>
                                        {formatCurrency(term.amount)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {nextTerm.is_overdue && (
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-200 flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <span>{t('installmentOptions.overdueNotice')}</span>
                    </div>
                )}

                {/* Tombol Pembayaran Termin Selanjutnya */}
                <Button
                    type="button"
                    className="w-full gap-2"
                    size="lg"
                    onClick={handlePayNextTerm}
                    disabled={isLoading || nextTerm.is_overdue}
                    id="btn-pay-next-installment"
                >
                    <CreditCard className="h-4 w-4" />
                    {isLoading
                        ? t('installmentOptions.processing')
                        : t('installmentOptions.btnPayNextTerm', { term: nextTerm.term_number, amount: formatCurrency(nextTerm.amount) })}
                </Button>
            </div>
        );
    }

    // TAMPILAN AWAL (BELUM ADA CICILAN - BAYAR DP)
    return (
        <div className="space-y-4">
            {/* Banner Overdue / Cicilan Ditutup */}
            {isAnyTermOverdue && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3.5 text-xs text-destructive dark:text-red-400 flex items-start gap-2.5">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="font-semibold">{t('installmentOptions.registrationClosedTitle')}</p>
                        <p className="mt-0.5 opacity-90 leading-relaxed">
                            {t('installmentOptions.registrationClosedDesc')}
                        </p>
                    </div>
                </div>
            )}

            {/* Summary DP & Total */}
            <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-card border border-border p-3.5 shadow-sm">
                    <p className="text-xs text-muted-foreground mb-1">{t('installmentOptions.payNowDp')}</p>
                    <p className="font-bold text-primary text-xl">{formatCurrency(dpAmount)}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                        {t('installmentOptions.basePlusAdmin', { base: formatCurrency(baseDpAmount), admin: formatCurrency(ADMIN_FEE) })}
                    </p>
                </div>
                <div className="rounded-lg bg-card border border-border p-3.5 shadow-sm">
                    <p className="text-xs text-muted-foreground mb-1">{t('installmentOptions.totalOverall')}</p>
                    <p className="font-bold text-foreground text-xl">{formatCurrency(totalAmount)}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                        {t('installmentOptions.includingAdminFee', { count: terms.length })}
                    </p>
                </div>
            </div>

            {/* Jadwal Pembayaran */}
            <div className="space-y-2.5 rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between pb-1 border-b border-border">
                    <span className="text-xs font-semibold text-foreground">{t('installmentOptions.installmentScheduleTitle')}</span>
                    <Badge variant="outline" className="text-[11px] bg-primary/10 text-primary border-primary/20">
                        {t('installmentOptions.totalTermsBadge', { total: terms.length })}
                    </Badge>
                </div>

                <div className="space-y-2 pt-1">
                    {terms.map((term, i) => {
                        const termGross = Number(term.amount) + ADMIN_FEE;
                        const isOverdue = isTermOverdueCheck(term.due_date);
                        return (
                            <div
                                key={i}
                                className={`flex items-center justify-between gap-3 rounded-md p-2.5 text-xs transition-colors ${
                                    isOverdue
                                        ? 'bg-destructive/5 border border-destructive/20 text-destructive dark:text-red-300'
                                        : 'bg-muted/40'
                                }`}
                            >
                                <div className="flex items-center gap-2.5">
                                    <div
                                        className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                                            isOverdue
                                                ? 'bg-destructive/20 text-destructive dark:text-red-400'
                                                : i === 0
                                                  ? 'bg-primary text-primary-foreground'
                                                  : 'bg-muted-foreground/20 text-muted-foreground'
                                        }`}
                                    >
                                        {term.term_number}
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground flex items-center gap-1.5">
                                            {i === 0 ? t('installmentOptions.term1Dp') : t('installmentOptions.termN', { term: term.term_number })}
                                            {isOverdue && (
                                                <span className="text-[10px] font-semibold text-destructive bg-destructive/10 dark:text-red-400 dark:bg-destructive/20 px-1.5 py-0.5 rounded">
                                                    {t('installmentOptions.termExpired')}
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                            <Clock className="h-3 w-3" />
                                            {term.due_date
                                                ? format(parseISO(term.due_date), 'dd MMMM yyyy', { locale: dateLocaleObj })
                                                : '-'}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <span className="font-semibold text-foreground">{formatCurrency(termGross)}</span>
                                    <p className="text-[10px] text-muted-foreground">
                                        {t('installmentOptions.basePlusAdmin', { base: formatCurrency(term.amount), admin: formatCurrency(ADMIN_FEE) })}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Ketentuan Cicilan */}
            <div className="rounded-lg bg-muted/30 border border-border p-3 space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <span>{t('installmentOptions.clauseAdminFee', { fee: formatCurrency(ADMIN_FEE) })}</span>
                </div>
                <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <span>{t('installmentOptions.clauseAccessActive')}</span>
                </div>
                <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <span>{t('installmentOptions.clauseNoVoucher')}</span>
                </div>
                <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <span>{t('installmentOptions.clauseSuspension')}</span>
                </div>
            </div>

            {/* Checkbox Syarat & Ketentuan */}
            {onTermsAcceptedChange && (
                <div className="flex items-center gap-3 pt-1">
                    <Checkbox
                        id="installment-terms-checkbox"
                        checked={termsAccepted}
                        disabled={isAnyTermOverdue}
                        onCheckedChange={(checked) => onTermsAcceptedChange(checked === true)}
                    />
                    <Label
                        htmlFor="installment-terms-checkbox"
                        className={`text-xs ${isAnyTermOverdue ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                        {t('installmentOptions.agreeTerms')}{' '}
                        <a
                            href="/terms-and-conditions"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                        >
                            {t('installmentOptions.termsAndConditionsInstallment')}
                        </a>
                    </Label>
                </div>
            )}

            {/* 1 Tombol Tunggal untuk Pembayaran DP */}
            <Button
                type="button"
                className="w-full gap-2"
                size="lg"
                onClick={handlePayInstallment}
                disabled={isLoading || (termsAccepted !== undefined && !termsAccepted) || isAnyTermOverdue}
                id="btn-pay-installment"
            >
                <CreditCard className="h-4 w-4" />
                {isAnyTermOverdue
                    ? t('installmentOptions.btnInstallmentClosed')
                    : isLoading
                      ? t('installmentOptions.processing')
                      : t('installmentOptions.btnPayDp', { amount: formatCurrency(dpAmount) })}
            </Button>
        </div>
    );
}
