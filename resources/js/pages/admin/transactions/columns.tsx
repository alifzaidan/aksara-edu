'use client';

import { DataTableColumnHeader } from '@/components/data-table-column-header';
import DeleteConfirmDialog from '@/components/delete-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { router } from '@inertiajs/react';
import type { Row } from '@tanstack/react-table';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { FileText, Trash } from 'lucide-react';
import { useState } from 'react';

interface Referrer {
    id: string;
    name: string;
}

interface User {
    id: string;
    name: string;
    phone_number: string | null;
    referrer: Referrer | null;
}

interface Course {
    id: string;
    title: string;
}
interface Bootcamp {
    id: string;
    title: string;
}
interface Webinar {
    id: string;
    title: string;
}

interface Bundle {
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

export interface Invoice {
    id: string;
    user: User;
    invoice_code: string;
    invoice_url: string | null;
    nett_amount: number;
    status: 'paid' | 'pending' | 'failed';
    paid_at: string | null;
    course_items: EnrollmentCourse[];
    bootcamp_items: EnrollmentBootcamp[];
    webinar_items: EnrollmentWebinar[];
    bundle_enrollments: BundleEnrollment[];
    created_at: string;
}

function ActionsCell({ row }: { row: Row<Invoice> }) {
    const invoice = row.original;
    const user = invoice.user;
    let whatsappUrl = '';

    if (user?.phone_number) {
        let phoneNumber = user.phone_number.replace(/\D/g, '');
        if (phoneNumber.startsWith('0')) {
            phoneNumber = '62' + phoneNumber.substring(1);
        }
        whatsappUrl = `https://wa.me/${phoneNumber}`;
    }

    const [loading, setLoading] = useState(false);

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

    return (
        <div className="flex items-center justify-center gap-2">
            {invoice.status === 'paid' && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" asChild>
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

            {whatsappUrl && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" asChild>
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

            {invoice.status === 'pending' && (
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
            if (row.course_items && row.course_items.length > 0) return 'course';
            if (row.bootcamp_items && row.bootcamp_items.length > 0) return 'bootcamp';
            if (row.webinar_items && row.webinar_items.length > 0) return 'webinar';
            if (row.bundle_enrollments && row.bundle_enrollments.length > 0) return 'bundle';
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
        cell: ({ row }) => <div className="font-medium">{row.original.user?.name || '-'}</div>,
    },
    {
        accessorKey: 'invoice_code',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Kode Invoice" />,
    },
    {
        accessorKey: 'items',
        header: 'Nama Produk',
        cell: ({ row }) => {
            const invoice = row.original;
            const courseTitles = invoice.course_items?.map((item) => item.course.title) || [];
            const bootcampTitles = invoice.bootcamp_items?.map((item) => item.bootcamp.title) || [];
            const webinarTitles = invoice.webinar_items?.map((item) => item.webinar.title) || [];
            const bundleTitles = invoice.bundle_enrollments?.map((item) => item.bundle.title) || [];

            const allTitles = [...courseTitles, ...bootcampTitles, ...webinarTitles, ...bundleTitles];
            const fullTitleString = allTitles.join(', ');

            return (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="w-40 truncate">{fullTitleString}</div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{fullTitleString}</p>
                    </TooltipContent>
                </Tooltip>
            );
        },
    },
    {
        accessorKey: 'nett_amount',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Harga" />,
        cell: ({ row }) => {
            const formatted = new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
            }).format(row.original.nett_amount);
            return <div className="font-medium">{formatted}</div>;
        },
    },
    {
        accessorKey: 'user.referrer.name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Afiliasi" />,
        cell: ({ row }) => <p>{row.original.user.referrer?.name || '-'}</p>,
    },
    {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => {
            const status = row.original.status;
            const statusText = status.charAt(0).toUpperCase() + status.slice(1);
            const statusClasses = {
                paid: 'bg-green-100 text-green-800',
                completed: 'bg-green-100 text-green-800',
                pending: 'bg-yellow-100 text-yellow-800',
                failed: 'bg-red-100 text-red-800',
                expired: 'bg-gray-100 text-gray-800',
            };
            return <Badge className={`${statusClasses[status] || statusClasses.expired}`}>{statusText}</Badge>;
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
