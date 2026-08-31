import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ProfileLayout from '@/layouts/profile/layout';
import UserLayout from '@/layouts/user-layout';
import { rupiahFormatter } from '@/lib/utils';
import { Head, router } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { AlertTriangle, CalendarClock, CheckCircle2, Clock, CreditCard, Lock, Package } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface InstallmentTermDetail {
    id: string;
    installment_number: number;
    invoice_code: string;
    amount: number;
    status: 'pending' | 'paid' | 'failed';
    installment_due_date: string | null;
    paid_at: string | null;
}

interface NextUnpaidTerm {
    id: string;
    installment_number: number;
    amount: number;
    installment_due_date: string | null;
    status: string;
}

interface Installment {
    id: string;
    invoice_code: string;
    status: string;
    amount: number;
    is_access_suspended: boolean;
    access_suspended_at: string | null;
    created_at: string;
    product_type: string;
    product_name: string;
    paid_terms: number;
    total_terms: number;
    next_unpaid_term: NextUnpaidTerm | null;
    terms: InstallmentTermDetail[];
}

interface InstallmentsProps {
    installments: Installment[];
}

function TermStatusBadge({ status }: { status: string }) {
    if (status === 'paid') return (
        <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle2 className="h-3 w-3 mr-1" /> Lunas
        </Badge>
    );
    if (status === 'failed') return (
        <Badge variant="destructive">Gagal</Badge>
    );
    return (
        <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400">
            <Clock className="h-3 w-3 mr-1" /> Menunggu
        </Badge>
    );
}

import axios from 'axios';

function InstallmentCard({ item }: { item: Installment }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isPayingTerm, setIsPayingTerm] = useState(false);

    async function handlePayTerm() {
        setIsPayingTerm(true);
        try {
            const res = await axios.post(`/installment/${item.id}/pay`);
            if (res.data.success && res.data.payment_url) {
                window.location.href = res.data.payment_url;
            } else {
                toast.error(res.data.message || 'Gagal membuat tagihan pembayaran');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Terjadi kesalahan saat memproses pembayaran.');
        } finally {
            setIsPayingTerm(false);
        }
    }

    const progressPercent = item.total_terms > 0 ? (item.paid_terms / item.total_terms) * 100 : 0;
    const isFullyPaid = item.status === 'paid';

    return (
        <div className={`rounded-xl border bg-card overflow-hidden transition-all ${item.is_access_suspended ? 'border-red-300 dark:border-red-800' : 'border-border'}`}>
            {/* Header */}
            <div className="p-4 sm:p-5">
                <div className="flex items-start gap-3">
                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${isFullyPaid ? 'bg-green-100 dark:bg-green-900/30' : item.is_access_suspended ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                        {isFullyPaid
                            ? <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                            : item.is_access_suspended
                                ? <Lock className="h-5 w-5 text-red-600 dark:text-red-400" />
                                : <CalendarClock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        }
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground truncate">{item.product_name}</h3>
                            <Badge variant="outline" className="text-xs capitalize">{item.product_type.replace('_', ' ')}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">{item.invoice_code}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                        <p className="font-bold text-foreground">{rupiahFormatter.format(item.amount)}</p>
                        <p className="text-xs text-muted-foreground">{item.paid_terms}/{item.total_terms} termin lunas</p>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-muted-foreground">Progress Pembayaran</span>
                        <span className="text-xs font-medium">{Math.round(progressPercent)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all ${isFullyPaid ? 'bg-green-500' : item.is_access_suspended ? 'bg-red-500' : 'bg-blue-500'}`}
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>

                {/* Suspended warning */}
                {item.is_access_suspended && !isFullyPaid && (
                    <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 px-3 py-2">
                        <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-red-600 dark:text-red-400">
                            Akses dibekukan karena cicilan melewati jatuh tempo. Segera bayar cicilan berikutnya untuk memulihkan akses.
                        </p>
                    </div>
                )}

                {/* Action buttons */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                    {!isFullyPaid && item.next_unpaid_term && (
                        <Button
                            size="sm"
                            onClick={handlePayTerm}
                            disabled={isPayingTerm}
                            className="gap-2"
                            id={`btn-pay-term-${item.id}`}
                        >
                            <CreditCard className="h-4 w-4" />
                            {isPayingTerm ? 'Memproses...' : `Bayar Cicilan ke-${item.next_unpaid_term.installment_number} (${rupiahFormatter.format(item.next_unpaid_term.amount)})`}
                        </Button>
                    )}
                    {isFullyPaid && (
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Semua Cicilan Lunas
                        </Badge>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="ml-auto text-muted-foreground"
                    >
                        {isExpanded ? 'Sembunyikan' : 'Lihat Detail'}
                    </Button>
                </div>
            </div>

            {/* Expanded term details */}
            {isExpanded && (
                <div className="border-t border-border p-4 sm:p-5 bg-muted/20 space-y-2">
                    <p className="text-sm font-medium mb-3">Rincian Termin</p>
                    {item.terms.map((term) => (
                        <div key={term.id} className="flex items-center gap-3 rounded-lg bg-background border border-border p-3">
                            <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${term.status === 'paid' ? 'bg-green-500' : term.status === 'failed' ? 'bg-red-500' : 'bg-slate-400'}`}>
                                {term.installment_number}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium">Termin ke-{term.installment_number}</p>
                                    <TermStatusBadge status={term.status} />
                                </div>
                                {term.installment_due_date && (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Jatuh tempo: {format(parseISO(term.installment_due_date), 'dd MMMM yyyy', { locale: idLocale })}
                                    </p>
                                )}
                                {term.paid_at && (
                                    <p className="text-xs text-green-600 mt-0.5">
                                        Dibayar: {format(parseISO(term.paid_at), 'dd MMMM yyyy HH:mm', { locale: idLocale })}
                                    </p>
                                )}
                            </div>
                            <p className="font-semibold text-sm flex-shrink-0">{rupiahFormatter.format(term.amount)}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function Installments({ installments }: InstallmentsProps) {
    return (
        <UserLayout>
            <Head title="Cicilan Saya - Aksademy" />
            <ProfileLayout>
                <div className="space-y-6">
                    <Heading
                        title="Cicilan Saya"
                        description="Kelola semua pembayaran cicilan produk yang aktif"
                    />

                    {installments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 py-16 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
                                <Package className="h-7 w-7 text-muted-foreground" />
                            </div>
                            <h3 className="font-semibold text-foreground mb-1">Belum Ada Cicilan</h3>
                            <p className="text-sm text-muted-foreground max-w-xs">
                                Anda belum memiliki pembayaran cicilan aktif. Pilih produk yang mendukung cicilan untuk mulai.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {installments.map(item => (
                                <InstallmentCard key={item.id} item={item} />
                            ))}
                        </div>
                    )}
                </div>
            </ProfileLayout>
        </UserLayout>
    );
}
