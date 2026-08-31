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
    private_items?: { privateClass?: { title: string } }[];
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
        invoice.bootcamp_items?.[0]?.bootcamp?.title ||
        invoice.certification_program_items?.[0]?.certification_program?.title ||
        invoice.course_items?.[0]?.course?.title ||
        invoice.webinar_items?.[0]?.webinar?.title ||
        invoice.bundle_enrollments?.[0]?.bundle?.title ||
        invoice.private_items?.[0]?.privateClass?.title ||
        'Produk Aksademy';

    // Format phone number for WhatsApp
    const rawPhone = invoice.user?.phone_number || '';
    let cleanPhone = rawPhone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
        cleanPhone = '62' + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith('8')) {
        cleanPhone = '62' + cleanPhone;
    }

    // Build WA message template for a term
    const generateWaMessage = (term: InstallmentTermItem) => {
        const userName = invoice.user?.name || 'Peserta';
        const dueDateStr = term.installment_due_date || term.due_date;
        const formattedDate = dueDateStr ? format(new Date(dueDateStr), 'dd MMMM yyyy', { locale: id }) : '-';
        const nominalStr = rupiahFormatter.format(term.amount);
        const payUrl = term.invoice_url || `${window.location.origin}/profile/installments`;

        return `*[Aksademy - Pengingat Pembayaran Cicilan]*\n\nHalo *${userName}*,\n\nKami mengingatkan tagihan cicilan untuk program *${resolvedProductTitle}*:\n• *Termin:* Ke-${term.installment_number} dari ${totalTerms}\n• *Nominal:* ${nominalStr}\n• *Jatuh Tempo:* ${formattedDate}\n\nSilakan lakukan pembayaran melalui tautan berikut:\n🔗 ${payUrl}\n\nPastikan pembayaran dilakukan sebelum jatuh tempo agar akses belajar Anda tetap aktif.\n\nTerima kasih!\n*Aksademy Support*`;
    };

    // Send automatic WA reminder via backend
    const handleSendAutomatedReminder = async (term: InstallmentTermItem) => {
        setSendingReminderId(term.id);
        try {
            const res = await axios.post(`/admin/installments/${term.id}/send-reminder`);
            if (res.data.success) {
                toast.success(res.data.message || 'Pengingat berhasil dikirim via WhatsApp!');
            } else {
                toast.error(res.data.message || 'Gagal mengirim pengingat.');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Terjadi kesalahan saat mengirim pengingat.');
        } finally {
            setSendingReminderId(null);
        }
    };

    // Open WhatsApp web with formatted message
    const handleOpenWaWeb = (term: InstallmentTermItem) => {
        if (!cleanPhone) {
            toast.error('Nomor WhatsApp peserta tidak tersedia.');
            return;
        }
        const message = generateWaMessage(term);
        const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    // Copy payment URL
    const handleCopyUrl = (url?: string | null) => {
        const linkToCopy = url || `${window.location.origin}/profile/installments`;
        navigator.clipboard.writeText(linkToCopy);
        toast.success('Link pembayaran berhasil disalin!');
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger ? (
                <DialogTrigger asChild>{trigger}</DialogTrigger>
            ) : (
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                        <Clock className="size-3.5 text-primary" />
                        <span>Monitor Cicilan</span>
                    </Button>
                </DialogTrigger>
            )}

            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="pb-2 border-b">
                    <div className="flex items-center justify-between gap-2 pr-4">
                        <div className="flex items-center gap-2">
                            <Wallet className="size-5 text-primary" />
                            <DialogTitle className="text-lg font-semibold">Monitor Cicilan Peserta</DialogTitle>
                        </div>
                        {isCompleted ? (
                            <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">Cicilan Lunas</Badge>
                        ) : isSuspended ? (
                            <Badge variant="destructive" className="flex items-center gap-1">
                                <ShieldAlert className="size-3" /> Akses Dibekukan
                            </Badge>
                        ) : (
                            <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                Cicilan Berjalan
                            </Badge>
                        )}
                    </div>
                    <DialogDescription className="text-xs text-muted-foreground">
                        Invoice Induk: <span className="font-mono font-medium text-foreground">{invoice.invoice_code}</span> • {resolvedProductTitle}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* User Details Card */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg border bg-muted/30">
                        <div className="flex items-start gap-2.5">
                            <div className="p-2 rounded-md bg-primary/10 text-primary mt-0.5">
                                <User className="size-4" />
                            </div>
                            <div className="space-y-0.5 text-xs">
                                <p className="font-medium text-foreground text-sm">{invoice.user?.name || '-'}</p>
                                <p className="text-muted-foreground">{invoice.user?.email || '-'}</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-2 text-xs">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Smartphone className="size-4 text-emerald-600" />
                                <span className="font-mono">{invoice.user?.phone_number || '-'}</span>
                            </div>
                            {cleanPhone && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 px-2 text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950/30 text-xs gap-1"
                                            onClick={() => window.open(`https://wa.me/${cleanPhone}`, '_blank')}
                                        >
                                            <MessageCircle className="size-3.5 fill-emerald-600 text-white" />
                                            <span>Chat WA</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Buka WhatsApp Peserta</TooltipContent>
                                </Tooltip>
                            )}
                        </div>
                    </div>

                    {/* Progress & Summary Card */}
                    <div className="p-3.5 rounded-lg border space-y-3 bg-card">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-foreground">Progres Pembayaran Cicilan</span>
                            <span className="font-bold text-primary">
                                {paidCount} dari {totalTerms} Termin ({percentPaid}%)
                            </span>
                        </div>
                        <Progress value={percentPaid} className="h-2" />

                        <div className="grid grid-cols-3 gap-2 pt-1 border-t text-center text-xs">
                            <div>
                                <p className="text-muted-foreground text-[11px]">Total Tagihan</p>
                                <p className="font-semibold text-foreground">{rupiahFormatter.format(totalAmount)}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-[11px]">Sudah Dibayar</p>
                                <p className="font-semibold text-emerald-600">{rupiahFormatter.format(paidAmount)}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-[11px]">Sisa Tagihan</p>
                                <p className="font-semibold text-amber-600">{rupiahFormatter.format(remainingAmount)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Access Status Banner */}
                    {isSuspended ? (
                        <div className="flex items-center gap-2.5 p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300 text-xs">
                            <ShieldAlert className="size-4 shrink-0 text-red-600" />
                            <div className="flex-1">
                                <p className="font-semibold">Akses Belajar Sedang Dibekukan</p>
                                <p className="text-[11px] text-red-700 dark:text-red-400">
                                    Peserta memiliki termin yang melewati batas jatuh tempo. Kirimkan pengingat WhatsApp agar peserta segera melunasi.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2.5 p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-300 text-xs">
                            <ShieldCheck className="size-4 shrink-0 text-emerald-600" />
                            <p className="text-[11px]">
                                Akses belajar peserta <span className="font-semibold text-emerald-700 dark:text-emerald-300">Aktif</span>.
                            </p>
                        </div>
                    )}

                    {/* Terms Breakdown List */}
                    <div className="space-y-2.5">
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Jadwal & Status Tiap Termin
                        </h4>

                        {terms.length === 0 ? (
                            <p className="text-xs text-muted-foreground py-3 text-center border rounded-lg">
                                Data termin cicilan tidak ditemukan.
                            </p>
                        ) : (
                            <div className="space-y-2">
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
                                                    ? 'bg-emerald-50/30 border-emerald-200 dark:border-emerald-900/40 dark:bg-emerald-950/10'
                                                    : isOverdue
                                                    ? 'bg-red-50/30 border-red-200 dark:border-red-900/40 dark:bg-red-950/10'
                                                    : 'bg-card border-border'
                                            }`}
                                        >
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-sm text-foreground">
                                                        Termin {term.installment_number} {term.installment_number === 1 ? '(DP)' : ''}
                                                    </span>
                                                    {isPaid ? (
                                                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-300 text-[10px] px-1.5 py-0">
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
