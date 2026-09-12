'use client';

import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { rupiahFormatter } from '@/lib/utils';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import axios from 'axios';
import { toast } from 'sonner';
import {
    AlertCircle,
    Calendar,
    CheckCircle2,
    Clock,
    Copy,
    ExternalLink,
    Loader2,
    MessageCircle,
    Send,
    ShieldAlert,
    ShieldCheck,
    Smartphone,
    User,
    Wallet,
} from 'lucide-react';

export interface InstallmentTermItem {
    id: string;
    installment_number: number;
    invoice_code: string;
    amount: number;
    status: 'paid' | 'pending' | 'failed';
    installment_due_date?: string | null;
    due_date?: string | null;
    paid_at?: string | null;
    invoice_url?: string | null;
}

export interface InstallmentInvoiceData {
    id: string;
    invoice_code: string;
    status: string;
    amount: number;
    nett_amount?: number;
    is_installment?: boolean;
    access_suspended_at?: string | null;
    created_at: string;
    user?: {
        id?: string;
        name: string;
        phone_number?: string | null;
        email?: string | null;
    } | null;
    installment_terms?: InstallmentTermItem[];
    installmentTerms?: InstallmentTermItem[];
    // Product associations if available
    course_items?: { course?: { title: string } }[];
    bootcamp_items?: { bootcamp?: { title: string } }[];
    webinar_items?: { webinar?: { title: string } }[];
    certification_program_items?: { certification_program?: { title: string } }[];
    bundle_enrollments?: { bundle?: { title: string } }[];
}

interface InstallmentMonitorModalProps {
    invoice: InstallmentInvoiceData;
    trigger?: React.ReactNode;
    productTitle?: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export default function InstallmentMonitorModal({
    invoice,
    trigger,
    productTitle,
    open: controlledOpen,
    onOpenChange: setControlledOpen,
}: InstallmentMonitorModalProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);

    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled ? setControlledOpen! : setInternalOpen;

    const terms = invoice.installment_terms || invoice.installmentTerms || [];
    const totalTerms = terms.length;
    const paidTerms = terms.filter((t) => t.status === 'paid');
    const paidCount = paidTerms.length;
    const percentPaid = totalTerms > 0 ? Math.round((paidCount / totalTerms) * 100) : 0;
    const totalAmount = invoice.amount || invoice.nett_amount || terms.reduce((acc, t) => acc + (t.amount || 0), 0);
    const paidAmount = paidTerms.reduce((acc, t) => acc + (t.amount || 0), 0);
    const remainingAmount = Math.max(0, totalAmount - paidAmount);

    const isSuspended = !!invoice.access_suspended_at;
    const isCompleted = totalTerms > 0 && paidCount === totalTerms;

    // Determine product title
    const resolvedProductTitle =
        productTitle ||
        invoice.course_items?.[0]?.course?.title ||
        invoice.bootcamp_items?.[0]?.bootcamp?.title ||
        invoice.webinar_items?.[0]?.webinar?.title ||
        invoice.certification_program_items?.[0]?.certification_program?.title ||
        invoice.bundle_enrollments?.[0]?.bundle?.title ||
        'Produk Program';

    // Kirim Reminder Otomatis via Gateway Backend
    async function handleSendAutomatedReminder(term: InstallmentTermItem, customMessage?: string) {
        setSendingReminderId(term.id);
        try {
            const res = await axios.post(
                `/admin/installments/${term.id}/send-reminder`,
                { custom_message: customMessage || undefined }
            );

            if (res.data.success) {
                toast.success(res.data.message || 'Pesan pengingat WhatsApp berhasil dikirim.');
            } else {
                toast.error(res.data.message || 'Gagal mengirim pesan pengingat.');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Terjadi kesalahan saat mengirim pengingat.');
        } finally {
            setSendingReminderId(null);
        }
    }

    // Buat direct link ke WhatsApp Web
    function handleOpenWaWeb(term: InstallmentTermItem) {
        const user = invoice.user;
        if (!user?.phone_number) {
            toast.error('Nomor WhatsApp peserta tidak tersedia.');
            return;
        }

        let phone = user.phone_number.replace(/[^0-9]/g, '');
        if (phone.startsWith('0')) {
            phone = '62' + phone.substring(1);
        } else if (!phone.startsWith('62')) {
            phone = '62' + phone;
        }

        const dueDateStr = term.installment_due_date || term.due_date;
        const formattedDueDate = dueDateStr
            ? format(new Date(dueDateStr), 'dd MMMM yyyy', { locale: id })
            : '-';
        const formattedAmount = rupiahFormatter.format(term.amount);
        const payUrl = term.invoice_url || `${window.location.origin}/profile/installments`;

        const message =
            `*[Kompeten - Pengingat Pembayaran Cicilan]*\n\n` +
            `Halo *${user.name}*,\n\n` +
            `Kami mengingatkan tagihan cicilan untuk program *${resolvedProductTitle}*:\n` +
            `• *Termin:* Ke-${term.installment_number} dari ${totalTerms}\n` +
            `• *Nominal:* ${formattedAmount}\n` +
            `• *Jatuh Tempo:* ${formattedDueDate}\n\n` +
            `Silakan lakukan pembayaran melalui tautan berikut:\n` +
            `🔗 ${payUrl}\n\n` +
            `Pastikan pembayaran dilakukan sebelum jatuh tempo agar akses belajar Anda tetap aktif.\n\n` +
            `Terima kasih!\n*Kompeten Support*`;

        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
    }

    function handleCopyUrl(url?: string | null) {
        if (!url) {
            toast.error('Tautan pembayaran belum tersedia.');
            return;
        }
        navigator.clipboard.writeText(url);
        toast.success('Tautan pembayaran berhasil disalin ke clipboard.');
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                <DialogHeader className="pb-2 border-b border-border">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <DialogTitle className="text-lg font-bold flex items-center gap-2">
                            <Clock className="size-5 text-primary" />
                            Monitoring Cicilan & Tagihan
                        </DialogTitle>
                        <Badge
                            variant={isCompleted ? 'default' : isSuspended ? 'destructive' : 'secondary'}
                            className="text-xs capitalize"
                        >
                            {isCompleted
                                ? 'Semua Termin Lunas'
                                : isSuspended
                                ? 'Akses Dibekukan'
                                : `${paidCount} dari ${totalTerms} Termin Lunas`}
                        </Badge>
                    </div>
                    <DialogDescription className="text-xs text-muted-foreground pt-1">
                        Invoice Utama: <span className="font-mono font-semibold text-foreground">{invoice.invoice_code}</span> • {resolvedProductTitle}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 pt-2">
                    {/* User info card */}
                    <div className="rounded-lg bg-muted/40 border border-border p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-3">
                            <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                <User className="size-4" />
                            </div>
                            <div>
                                <p className="font-semibold text-foreground text-sm">{invoice.user?.name || '-'}</p>
                                <p className="text-muted-foreground">{invoice.user?.email || '-'}</p>
                            </div>
                        </div>
                        {invoice.user?.phone_number && (
                            <div className="flex items-center gap-2 font-mono text-muted-foreground bg-background px-2.5 py-1 rounded border border-border">
                                <Smartphone className="size-3.5 text-emerald-600" />
                                <span>{invoice.user.phone_number}</span>
                            </div>
                        )}
                    </div>

                    {/* Financial Summary & Progress */}
                    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
                        <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="p-2 rounded bg-muted/30">
                                <p className="text-[11px] text-muted-foreground">Total Tagihan</p>
                                <p className="font-bold text-foreground text-sm sm:text-base mt-0.5">
                                    {rupiahFormatter.format(totalAmount)}
                                </p>
                            </div>
                            <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">Sudah Dibayar</p>
                                <p className="font-bold text-emerald-700 dark:text-emerald-400 text-sm sm:text-base mt-0.5">
                                    {rupiahFormatter.format(paidAmount)}
                                </p>
                            </div>
                            <div className="p-2 rounded bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                                <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">Sisa Tagihan</p>
                                <p className="font-bold text-amber-700 dark:text-amber-400 text-sm sm:text-base mt-0.5">
                                    {rupiahFormatter.format(remainingAmount)}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-1.5 pt-2">
                            <div className="flex justify-between text-xs font-medium">
                                <span className="text-muted-foreground">Progres Pembayaran</span>
                                <span className="text-foreground">{percentPaid}% Selesai</span>
                            </div>
                            <Progress value={percentPaid} className="h-2" />
                        </div>

                        {/* Status Akses Peserta */}
                        <div className="pt-2 flex items-center justify-between border-t border-border text-xs">
                            <span className="text-muted-foreground">Status Akses Belajar:</span>
                            {isSuspended ? (
                                <span className="inline-flex items-center gap-1 font-semibold text-destructive">
                                    <ShieldAlert className="size-4" /> Akses Dibekukan (Jatuh Tempo Terlewati)
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                                    <ShieldCheck className="size-4" /> Akses Aktif & Lancar
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Daftar Termin Cicilan */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                                <Wallet className="size-4 text-primary" />
                                Rincian Jadwal & Status Termin
                            </h4>
                            <span className="text-xs text-muted-foreground">Total {totalTerms} Termin</span>
                        </div>

                        {terms.length === 0 ? (
                            <div className="text-center py-6 text-xs text-muted-foreground border border-dashed rounded-lg">
                                Data termin cicilan tidak ditemukan.
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {terms.map((term) => {
                                    const isPaid = term.status === 'paid';
                                    const dueDateStr = term.installment_due_date || term.due_date;
                                    const dueDateObj = dueDateStr ? new Date(dueDateStr) : null;
                                    const isOverdue = !isPaid && dueDateObj && new Date() > dueDateObj;
                                    const isSending = sendingReminderId === term.id;

                                    return (
                                        <div
                                            key={term.id || term.installment_number}
                                            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border transition-colors ${
                                                isPaid
                                                    ? 'bg-emerald-500/5 border-emerald-500/20'
                                                    : isOverdue
                                                    ? 'bg-destructive/5 border-destructive/20'
                                                    : 'bg-card border-border'
                                            }`}
                                        >
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                                                        {term.installment_number}
                                                    </span>
                                                    <span className="text-xs font-semibold text-foreground">
                                                        Termin ke-{term.installment_number} {term.installment_number === 1 ? '(DP)' : ''}
                                                    </span>
                                                    <span className="font-mono text-[11px] text-muted-foreground">
                                                        ({term.invoice_code})
                                                    </span>
                                                    {isPaid ? (
                                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
                                                            <CheckCircle2 className="size-3 mr-1" /> Lunas
                                                        </Badge>
                                                    ) : isOverdue ? (
                                                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                                            <AlertCircle className="size-3 mr-1" /> Terlambat
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                                            <Clock className="size-3 mr-1" /> Menunggu
                                                        </Badge>
                                                    )}
                                                </div>

                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                                    <span className="font-semibold text-foreground text-sm">
                                                        {rupiahFormatter.format(term.amount)}
                                                    </span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="size-3" />
                                                        Jatuh Tempo:{' '}
                                                        {dueDateObj
                                                            ? format(dueDateObj, 'dd MMM yyyy', { locale: id })
                                                            : '-'}
                                                    </span>
                                                    {isPaid && term.paid_at && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="text-emerald-600 dark:text-emerald-400">
                                                                Dibayar: {format(new Date(term.paid_at), 'dd MMM yyyy, HH:mm', { locale: id })}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action Buttons for Pending Terms */}
                                            {!isPaid && (
                                                <div className="flex items-center gap-1.5 self-end sm:self-center">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8 px-2 text-xs"
                                                                onClick={() => handleCopyUrl(term.invoice_url)}
                                                            >
                                                                <Copy className="size-3.5" />
                                                                <span className="sr-only">Salin Link</span>
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Salin Link Tagihan Termin</TooltipContent>
                                                    </Tooltip>

                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="default"
                                                                size="sm"
                                                                disabled={isSending}
                                                                className="h-8 px-2.5 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                                                            >
                                                                {isSending ? (
                                                                    <Loader2 className="size-3.5 animate-spin" />
                                                                ) : (
                                                                    <MessageCircle className="size-3.5 fill-white" />
                                                                )}
                                                                <span>Reminder WA</span>
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-56 text-xs">
                                                            <DropdownMenuItem
                                                                onClick={() => handleSendAutomatedReminder(term)}
                                                                className="cursor-pointer gap-2 py-2"
                                                            >
                                                                <Send className="size-3.5 text-primary" />
                                                                <div>
                                                                    <p className="font-medium text-foreground">Kirim Otomatis (Sistem)</p>
                                                                    <p className="text-[10px] text-muted-foreground">Kirim langsung via WA Gateway</p>
                                                                </div>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={() => handleOpenWaWeb(term)}
                                                                className="cursor-pointer gap-2 py-2"
                                                            >
                                                                <ExternalLink className="size-3.5 text-emerald-600" />
                                                                <div>
                                                                    <p className="font-medium text-foreground">Buka WhatsApp Web</p>
                                                                    <p className="text-[10px] text-muted-foreground">Buka chat dengan template siap kirim</p>
                                                                </div>
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
