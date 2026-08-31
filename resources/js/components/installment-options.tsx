import axios from 'axios';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { rupiahFormatter } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { CheckCircle2, Clock, CreditCard } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export interface InstallmentTermOption {
    term_number: number;
    amount: number;
    due_date: string;
}

interface InstallmentOptionsProps {
    productType: string;
    productId: string;
    productPrice: number;
    terms: InstallmentTermOption[];
    privateClassScheduleId?: string;
    termsAccepted?: boolean;
    onTermsAcceptedChange?: (accepted: boolean) => void;
}

export default function InstallmentOptions({
    productType,
    productId,
    terms,
    privateClassScheduleId,
    termsAccepted,
    onTermsAcceptedChange,
}: InstallmentOptionsProps) {
    const [isLoading, setIsLoading] = useState(false);

    const totalAmount = terms.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const dpAmount = terms[0]?.amount ?? 0;

    async function handlePayInstallment() {
        if (termsAccepted !== undefined && !termsAccepted) {
            toast.error('Silakan setujui syarat dan ketentuan terlebih dahulu.');
            return;
        }

        setIsLoading(true);
        try {
            const payload: Record<string, unknown> = {
                type: productType,
                id: productId,
            };
            if (privateClassScheduleId) {
                payload.private_class_schedule_id = privateClassScheduleId;
            }

            const res = await axios.post('/invoice/installment', payload);

            if (res.data.success && res.data.payment_url) {
                window.location.href = res.data.payment_url;
            } else {
                toast.error(res.data.message || 'Gagal membuat tagihan cicilan');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Terjadi kesalahan saat memproses pembayaran cicilan.');
        } finally {
            setIsLoading(false);
        }
    }

    if (terms.length === 0) return null;

    return (
        <div className="space-y-4">
            {/* Summary DP & Total */}
            <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-card border border-border p-3.5 shadow-sm">
                    <p className="text-xs text-muted-foreground mb-1">Bayar Sekarang (DP)</p>
                    <p className="font-bold text-primary text-xl">{rupiahFormatter.format(dpAmount)}</p>
                </div>
                <div className="rounded-lg bg-card border border-border p-3.5 shadow-sm">
                    <p className="text-xs text-muted-foreground mb-1">Total Keseluruhan</p>
                    <p className="font-bold text-foreground text-xl">{rupiahFormatter.format(totalAmount)}</p>
                </div>
            </div>

            {/* Jadwal Pembayaran */}
            <div className="space-y-2.5 rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between pb-1 border-b border-border">
                    <span className="text-xs font-semibold text-foreground">Jadwal Pembayaran Cicilan</span>
                    <Badge variant="outline" className="text-[11px] bg-primary/10 text-primary border-primary/20">
                        {terms.length}x Termin
                    </Badge>
                </div>

                <div className="space-y-2 pt-1">
                    {terms.map((term, i) => (
                        <div key={i} className="flex items-center justify-between gap-3 rounded-md bg-muted/40 p-2.5 text-xs">
                            <div className="flex items-center gap-2.5">
                                <div className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${i === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/20 text-muted-foreground'}`}>
                                    {term.term_number}
                                </div>
                                <div>
                                    <p className="font-medium text-foreground">{i === 0 ? 'Termin 1 (DP)' : `Termin ke-${term.term_number}`}</p>
                                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                        <Clock className="h-3 w-3" />
                                        {format(parseISO(term.due_date), 'dd MMMM yyyy', { locale: id })}
                                    </p>
                                </div>
                            </div>
                            <span className="font-semibold text-foreground">{rupiahFormatter.format(term.amount)}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Ketentuan Cicilan */}
            <div className="rounded-lg bg-muted/30 border border-border p-3 space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Akses materi/program langsung aktif segera setelah DP dibayar.</span>
                </div>
                <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Voucher promo dan poin reward tidak dapat digunakan pada pembayaran cicilan.</span>
                </div>
                <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <span>Akses akan ditangguhkan jika cicilan melewati tanggal jatuh tempo.</span>
                </div>
            </div>

            {/* Checkbox Syarat & Ketentuan */}
            {onTermsAcceptedChange && (
                <div className="flex items-center gap-3 pt-1">
                    <Checkbox
                        id="installment-terms-checkbox"
                        checked={termsAccepted}
                        onCheckedChange={(checked) => onTermsAcceptedChange(checked === true)}
                    />
                    <Label htmlFor="installment-terms-checkbox" className="text-xs cursor-pointer">
                        Saya menyetujui{' '}
                        <a
                            href="/terms-and-conditions"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                        >
                            syarat dan ketentuan cicilan
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
                disabled={isLoading || (termsAccepted !== undefined && !termsAccepted)}
                id="btn-pay-installment"
            >
                <CreditCard className="h-4 w-4" />
                {isLoading ? 'Memproses...' : `Bayar DP ${rupiahFormatter.format(dpAmount)}`}
            </Button>
        </div>
    );
}
