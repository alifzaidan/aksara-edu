'use client';

import { DataTableColumnHeader } from '@/components/data-table-column-header';
import DeleteConfirmDialog from '@/components/delete-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Link, router } from '@inertiajs/react';
import type { Row } from '@tanstack/react-table';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import InstallmentMonitorModal, { InstallmentInvoiceData, InstallmentTermItem } from '@/components/admin/installment-monitor-modal';
import { CheckCircle2, Clock, FileText, Trash } from 'lucide-react';
import { useState } from 'react';
import { usePermission } from '@/hooks/use-permission';

interface Referrer {
    id: string;
    name: string;
}

interface User {
    id: string;
    name: string;
    phone_number: string | null;
    email?: string | null;
    referrer: Referrer | null;
}

interface Course {
    id: string;
    title: string;
}
interface Bootcamp {
    id: string;
    title: string;
    batch?: string | null;
}
interface Webinar {
    id: string;
    title: string;
    batch?: string | null;
}
interface Bundle {
    id: string;
    title: string;
}
interface CertificationProgram {
    id: string;
    title: string;
    batch?: string | null;
}
interface PrivateClass {
    id: string;
    title: string;
}

interface EnrollmentCourse {
    course: Course;
}
interface EnrollmentBootcamp {
    bootcamp: Bootcamp;
}
interface EnrollmentWebinar {
    webinar: Webinar;
}
interface BundleEnrollment {
    bundle: Bundle;
}
interface CertificationProgramItem {
    certification_program?: CertificationProgram;
    certificationProgram?: CertificationProgram;
}
interface PrivateItem {
    id?: string;
    privateClass?: PrivateClass;
    private_class?: PrivateClass;
}

export interface Invoice {
    id: string;
    user: User;
    referral_user?: Referrer | null;
    referralUser?: Referrer | null;
    invoice_code: string;
    invoice_url: string | null;
    nett_amount: number;
    amount?: number;
    payment_method?: string | null;
    payment_channel?: string | null;
    status: 'paid' | 'pending' | 'failed' | 'installment_pending';
    is_installment?: boolean;
    installment_number?: number | null;
    parent_invoice_id?: string | null;
    parentInvoice?: Invoice | null;
    parent_invoice?: Invoice | null;
    access_suspended_at?: string | null;
    paid_at: string | null;
    course_items?: EnrollmentCourse[];
    courseItems?: EnrollmentCourse[];
    bootcamp_items?: EnrollmentBootcamp[];
    bootcampItems?: EnrollmentBootcamp[];
    webinar_items?: EnrollmentWebinar[];
    webinarItems?: EnrollmentWebinar[];
    bundle_enrollments?: BundleEnrollment[];
    bundleEnrollments?: BundleEnrollment[];
    certification_program_items?: CertificationProgramItem[];
    certificationProgramItems?: CertificationProgramItem[];
    private_items?: PrivateItem[];
    privateItems?: PrivateItem[];
    installment_terms?: InstallmentTermItem[];
    installmentTerms?: InstallmentTermItem[];
    created_at: string;
}

interface ProductLinkInfo {
    title: string;
    url: string;
}

function getProductLinks(invoice: Invoice): ProductLinkInfo[] {
    const target = invoice.parentInvoice || invoice.parent_invoice || invoice;
    const links: ProductLinkInfo[] = [];

    (target.courseItems || target.course_items || []).forEach((item) => {
        if (item.course?.title) {
            links.push({
                title: item.course.title,
                url: route('courses.show', item.course.id),
            });
        }
    });

    (target.bootcampItems || target.bootcamp_items || []).forEach((item) => {
        if (item.bootcamp?.title) {
            links.push({
                title: item.bootcamp.title,
                url: route('bootcamps.show', item.bootcamp.id),
            });
        }
    });

    (target.webinarItems || target.webinar_items || []).forEach((item) => {
        if (item.webinar?.title) {
            links.push({
                title: item.webinar.title,
                url: route('webinars.show', item.webinar.id),
            });
        }
    });

    (target.bundleEnrollments || target.bundle_enrollments || []).forEach((item) => {
        if (item.bundle?.title) {
            links.push({
                title: item.bundle.title,
                url: route('bundles.show', item.bundle.id),
            });
        }
    });

    (target.certificationProgramItems || target.certification_program_items || []).forEach((item) => {
        const program = item.certificationProgram || item.certification_program;
        if (program?.title) {
            links.push({
                title: program.title,
                url: route('certification-programs.show', program.id),
            });
        }
    });

    (target.privateItems || target.private_items || []).forEach((item) => {
        const pc = item.privateClass || item.private_class;
        if (pc?.title) {
            links.push({
                title: pc.title,
                url: route('privates.show', pc.id),
            });
        }
    });

    return links;
}

function getProductBatch(invoice: Invoice): string {
    const target = (invoice.parentInvoice || (invoice as any).parent_invoice || invoice) as any;
    const batches: string[] = [];

    (target.bootcampItems || target.bootcamp_items || []).forEach((item: any) => {
        if (item.bootcamp?.batch) {
            batches.push(String(item.bootcamp.batch));
        }
    });

    (target.webinarItems || target.webinar_items || []).forEach((item: any) => {
        if (item.webinar?.batch) {
            batches.push(String(item.webinar.batch));
        }
    });

    (target.certificationProgramItems || target.certification_program_items || []).forEach((item: any) => {
        const program = item.certificationProgram || item.certification_program;
        if (program?.batch) {
            batches.push(String(program.batch));
        }
    });

    return batches.length > 0 ? Array.from(new Set(batches)).join(', ') : '-';
}

function getMonitorInvoice(invoice: Invoice): InstallmentInvoiceData | null {
    const parent = invoice.parentInvoice || invoice.parent_invoice;
    if (parent) {
        return {
            ...parent,
            user: parent.user || invoice.user,
            installment_terms: parent.installment_terms || parent.installmentTerms || [],
            course_items: parent.course_items || parent.courseItems,
            bootcamp_items: parent.bootcamp_items || parent.bootcampItems,
            webinar_items: parent.webinar_items || parent.webinarItems,
            certification_program_items: parent.certification_program_items || parent.certificationProgramItems,
            bundle_enrollments: parent.bundle_enrollments || parent.bundleEnrollments,
        } as InstallmentInvoiceData;
    }
    const terms = invoice.installment_terms || invoice.installmentTerms || [];
    if (invoice.is_installment || invoice.status === 'installment_pending' || terms.length > 0 || invoice.installment_number) {
        return {
            ...invoice,
            installment_terms: terms,
        } as InstallmentInvoiceData;
    }
    return null;
}

function PriceCell({ row }: { row: Row<Invoice> }) {
    const { roles, isAdmin } = usePermission();
    const isStaff = roles.includes('staff') && !isAdmin;

    if (isStaff) {
        return <div className="font-medium text-muted-foreground">Rp ***</div>;
    }

    const formatted = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(row.original.nett_amount);
    return <div className="font-medium">{formatted}</div>;
}

function ActionsCell({ row }: { row: Row<Invoice> }) {
    const { canManage, roles, isAdmin } = usePermission();
    const canManageTransaction = canManage('transactions');
    const isStaff = roles.includes('staff') && !isAdmin;
    const invoice = row.original;
    const user = invoice.user || (invoice.parentInvoice || invoice.parent_invoice)?.user;
    const monitorInvoice = getMonitorInvoice(invoice);
    let whatsappUrl = '';

    if (user?.phone_number) {
        let phoneNumber = user.phone_number.replace(/\D/g, '');
        if (phoneNumber.startsWith('0')) {
            phoneNumber = '62' + phoneNumber.substring(1);
        }
        whatsappUrl = `https://wa.me/${phoneNumber}`;
    }

    const [loading, setLoading] = useState(false);
    const [approveDialogOpen, setApproveDialogOpen] = useState(false);

    const handleDelete = async () => {
        setLoading(true);
        router.post(
            route('invoice.cancel', { id: invoice.id }),
            {},
            {
                onFinish: () => setLoading(false),
            },
        );
    };

    const handleApprove = () => {
        setLoading(true);
        router.post(
            route('transactions.approve', { id: invoice.id }),
            {},
            {
                onFinish: () => {
                    setLoading(false);
                    setApproveDialogOpen(false);
                },
            },
        );
    };

    return (
        <div className="flex items-center justify-center gap-2">
            {invoice.status === 'paid' && !isStaff && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8" asChild>
                            <a href={route('invoice.pdf', { id: invoice.id })} target="_blank" rel="noopener noreferrer">
                                <FileText className="size-4" />
                            </a>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Lihat Invoice</p>
                    </TooltipContent>
                </Tooltip>
            )}

            {monitorInvoice && (
                <InstallmentMonitorModal
                    invoice={monitorInvoice}
                    trigger={
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8 text-primary hover:text-primary hover:bg-primary/10">
                                    <Clock className="size-4" />
                                    <span className="sr-only">Monitor Cicilan & Reminder WA</span>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Monitor Cicilan & Reminder WA</p>
                            </TooltipContent>
                        </Tooltip>
                    }
                />
            )}

            {whatsappUrl && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8" asChild>
                            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                                <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-4 fill-[#25D366]">
                                    <title>WhatsApp</title>
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                </svg>
                            </a>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Hubungi via WhatsApp</p>
                    </TooltipContent>
                </Tooltip>
            )}

            {invoice.status === 'pending' && canManageTransaction && (
                <>
                    {/* Approve Button */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                disabled={loading}
                                onClick={() => setApproveDialogOpen(true)}
                            >
                                <CheckCircle2 className="size-4" />
                                <span className="sr-only">Approve Transaksi</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Approve Transaksi</p>
                        </TooltipContent>
                    </Tooltip>

                    {/* Approve Confirmation Dialog */}
                    <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Approve Transaksi?</DialogTitle>
                                <DialogDescription>
                                    Transaksi <strong>{invoice.invoice_code}</strong> akan diubah menjadi{' '}
                                    <strong>Paid</strong> dengan metode pembayaran <strong>DOKU</strong>.
                                    <br />
                                    <br />
                                    Tgl. Pembayaran akan otomatis tercatat pada saat ini, dan komisi afiliasi
                                    akan dicatat sesuai data transaksi. Tindakan ini tidak dapat dibatalkan.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setApproveDialogOpen(false)}
                                    disabled={loading}
                                >
                                    Batal
                                </Button>
                                <Button
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                    onClick={handleApprove}
                                    disabled={loading}
                                >
                                    {loading ? 'Memproses...' : 'Ya, Approve'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Cancel / Gagalkan Button */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div>
                                <DeleteConfirmDialog
                                    trigger={
                                        <Button variant="link" size="icon" className="size-8 text-red-500 hover:cursor-pointer" disabled={loading}>
                                            <Trash />
                                            <span className="sr-only">Gagalkan Transaksi</span>
                                        </Button>
                                    }
                                    title="Apakah Anda yakin ingin menggagalkan transaksi ini?"
                                    description="Transaksi yang digagalkan tidak dapat dikembalikan."
                                    itemName={invoice.invoice_code}
                                    onConfirm={handleDelete}
                                    confirmText="Ya, Gagalkan"
                                />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Batalkan Transaksi</p>
                        </TooltipContent>
                    </Tooltip>
                </>
            )}
        </div>
    );
}

export const columns: ColumnDef<Invoice>[] = [
    {
        id: 'payment_type',
        accessorFn: (row) => (row.nett_amount === 0 ? 'free' : 'paid'),
        header: () => null,
        cell: () => null,
        enableHiding: true,
        meta: {
            isVirtual: true,
        },
    },
    {
        id: 'product_type',
        accessorFn: (row) => {
            const target = row.parentInvoice || row.parent_invoice || row;
            if ((target.course_items && target.course_items.length > 0) || (target.courseItems && target.courseItems.length > 0)) return 'course';
            if ((target.bootcamp_items && target.bootcamp_items.length > 0) || (target.bootcampItems && target.bootcampItems.length > 0)) return 'bootcamp';
            if ((target.webinar_items && target.webinar_items.length > 0) || (target.webinarItems && target.webinarItems.length > 0)) return 'webinar';
            if ((target.bundle_enrollments && target.bundle_enrollments.length > 0) || (target.bundleEnrollments && target.bundleEnrollments.length > 0)) return 'bundle';
            if ((target.certification_program_items && target.certification_program_items.length > 0) || (target.certificationProgramItems && target.certificationProgramItems.length > 0)) return 'certification_program';
            if ((target.private_items && target.private_items.length > 0) || (target.privateItems && target.privateItems.length > 0)) return 'private';
            return 'unknown';
        },
        header: () => null,
        cell: () => null,
        enableHiding: true,
        meta: {
            isVirtual: true,
        },
    },
    {
        accessorKey: 'user.name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nama Pembeli" />,
        cell: ({ row }) => {
            const user = row.original.user || (row.original.parentInvoice || row.original.parent_invoice)?.user;
            if (!user) return <div className="font-medium">-</div>;
            return (
                <Link
                    href={route('users.show', user.id)}
                    className="font-medium text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                >
                    {user.name}
                </Link>
            );
        },
    },
    {
        accessorKey: 'invoice_code',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Kode Invoice" />,
    },
    {
        accessorKey: 'items',
        header: 'Nama Produk',
        filterFn: (row, _columnId, filterValue) => {
            const invoice = row.original;
            const target = invoice.parentInvoice || invoice.parent_invoice || invoice;
            const courseTitles = (target.courseItems || target.course_items || []).map((item) => item.course?.title || '');
            const bootcampTitles = (target.bootcampItems || target.bootcamp_items || []).map((item) => item.bootcamp?.title || '');
            const webinarTitles = (target.webinarItems || target.webinar_items || []).map((item) => item.webinar?.title || '');
            const bundleTitles = (target.bundleEnrollments || target.bundle_enrollments || []).map((item) => item.bundle?.title || '');
            const certTitles = (target.certificationProgramItems || target.certification_program_items || []).map(
                (item) => item.certificationProgram?.title || item.certification_program?.title || '',
            );
            const privateTitles = (target.privateItems || target.private_items || []).map(
                (item) => item.privateClass?.title || item.private_class?.title || '',
            );

            const allTitles = [...courseTitles, ...bootcampTitles, ...webinarTitles, ...bundleTitles, ...certTitles, ...privateTitles].filter(Boolean);
            return allTitles.some((title) =>
                title.toLowerCase().includes(String(filterValue).toLowerCase()),
            );
        },
        cell: ({ row }) => {
            const links = getProductLinks(row.original);
            if (links.length === 0) {
                return <span>-</span>;
            }

            const fullTitleString = links.map((l) => l.title).join(', ');

            return (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="w-44 truncate">
                            {links.map((link, idx) => (
                                <span key={idx}>
                                    {idx > 0 && ', '}
                                    <Link
                                        href={link.url}
                                        className="text-primary hover:underline font-medium"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {link.title}
                                    </Link>
                                </span>
                            ))}
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{fullTitleString}</p>
                    </TooltipContent>
                </Tooltip>
            );
        },
    },
    {
        id: 'batch',
        accessorFn: (row) => getProductBatch(row),
        header: ({ column }) => <DataTableColumnHeader column={column} title="Kode Batch" />,
        cell: ({ row }) => {
            const batch = getProductBatch(row.original);
            return <div className="font-medium">{batch}</div>;
        },
    },
    {
        accessorKey: 'nett_amount',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Harga" />,
        cell: ({ row }) => <PriceCell row={row} />,
    },
    {
        id: 'payment_channel',
        accessorFn: (row) => {
            const target = (row.parentInvoice || (row as any).parent_invoice || row) as any;
            if (row.nett_amount === 0) return 'Gratis';
            return row.payment_channel || row.payment_method || target.payment_channel || target.payment_method || '-';
        },
        header: ({ column }) => <DataTableColumnHeader column={column} title="Metode" />,
        cell: ({ row }) => {
            const invoice = row.original;
            const target = (invoice.parentInvoice || (invoice as any).parent_invoice || invoice) as any;
            if (invoice.nett_amount === 0) {
                return <span className="font-medium text-emerald-600 dark:text-emerald-400">Gratis</span>;
            }
            const channel = invoice.payment_channel || invoice.payment_method || target.payment_channel || target.payment_method;
            if (!channel) return <span className="text-muted-foreground">-</span>;
            return <div className="font-medium uppercase">{channel.replace(/_/g, ' ')}</div>;
        },
    },
    {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => {
            const invoice = row.original;
            const monitorInvoice = getMonitorInvoice(invoice);
            const isChildTerm = invoice.installment_number != null;

            if (monitorInvoice && isChildTerm) {
                const termNum = invoice.installment_number;
                const isPaid = invoice.status === 'paid';
                const isSuspended = !!(invoice.access_suspended_at || (invoice.parentInvoice || invoice.parent_invoice)?.access_suspended_at);

                return (
                    <InstallmentMonitorModal
                        invoice={monitorInvoice}
                        trigger={
                            <div className="flex flex-col gap-1 items-start cursor-pointer hover:opacity-80 transition-opacity" title="Klik untuk monitor cicilan">
                                {isPaid ? (
                                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 cursor-pointer">
                                        Cicilan {termNum} Lunas
                                    </Badge>
                                ) : isSuspended ? (
                                    <Badge variant="destructive" className="cursor-pointer">
                                        Akses Dibekukan
                                    </Badge>
                                ) : (
                                    <Badge className="bg-amber-100 text-amber-800 border-amber-300 cursor-pointer">
                                        Cicilan {termNum} Pending
                                    </Badge>
                                )}
                            </div>
                        }
                    />
                );
            }

            const terms = invoice.installment_terms || invoice.installmentTerms || [];
            const isInstallment = invoice.is_installment || invoice.status === 'installment_pending' || terms.length > 0;

            if (isInstallment && monitorInvoice) {
                const paidCount = terms.filter((t) => t.status === 'paid').length;
                const totalCount = terms.length;
                const isFullyPaid = totalCount > 0 && paidCount === totalCount;
                const isSuspended = !!invoice.access_suspended_at;

                return (
                    <InstallmentMonitorModal
                        invoice={monitorInvoice}
                        trigger={
                            <div className="flex flex-col gap-1 items-start cursor-pointer hover:opacity-80 transition-opacity" title="Klik untuk monitor cicilan">
                                {isFullyPaid ? (
                                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 cursor-pointer">
                                        Cicilan Lunas
                                    </Badge>
                                ) : isSuspended ? (
                                    <Badge variant="destructive" className="cursor-pointer">
                                        Akses Dibekukan
                                    </Badge>
                                ) : (
                                    <Badge className="bg-amber-100 text-amber-800 border-amber-300 cursor-pointer">
                                        Cicilan ({paidCount}/{totalCount || '?'})
                                    </Badge>
                                )}
                            </div>
                        }
                    />
                );
            }

            const status = invoice.status;
            const statusText = status.charAt(0).toUpperCase() + status.slice(1);
            const statusClasses: Record<string, string> = {
                paid: 'bg-green-100 text-green-800',
                completed: 'bg-green-100 text-green-800',
                pending: 'bg-yellow-100 text-yellow-800',
                failed: 'bg-red-100 text-red-800',
                expired: 'bg-gray-100 text-gray-800',
                installment_pending: 'bg-amber-100 text-amber-800',
            };
            return <Badge className={`${statusClasses[status] || statusClasses.expired}`}>{statusText}</Badge>;
        },
    },
    {
        id: 'referral_user',
        accessorFn: (row) => (row.user?.referrer ?? (row.parentInvoice || row.parent_invoice)?.user?.referrer ?? row.referral_user ?? row.referralUser)?.name ?? null,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Afiliasi" />,
        cell: ({ row }) => {
            const referrer = row.original.user?.referrer ?? (row.original.parentInvoice || row.original.parent_invoice)?.user?.referrer ?? row.original.referral_user ?? row.original.referralUser;
            return <p>{referrer?.name || '-'}</p>;
        },
    },
    {
        accessorKey: 'created_at',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tgl. Pembelian" />,
        cell: ({ row }) => <p>{format(new Date(row.original.created_at), 'dd MMM yyyy, HH:mm', { locale: id })}</p>,
    },
    {
        accessorKey: 'paid_at',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tgl. Pembayaran" />,
        cell: ({ row }) => <p>{row.original.paid_at ? format(new Date(row.original.paid_at), 'dd MMM yyyy, HH:mm', { locale: id }) : '-'}</p>,
    },
    {
        id: 'actions',
        header: () => <div className="text-center">Aksi</div>,
        cell: ({ row }) => <ActionsCell row={row} />,
    },
];
