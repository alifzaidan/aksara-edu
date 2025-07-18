'use client';

import { DataTableColumnHeader } from '@/components/data-table-column-header';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Link } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { CheckCircle, XCircle } from 'lucide-react';

interface User {
    name: string;
}

interface Course {
    title: string;
}
interface Bootcamp {
    title: string;
}
interface Webinar {
    title: string;
}
interface EnrollmentCourse {
    course: Course;
    price: number;
}
interface EnrollmentBootcamp {
    bootcamp: Bootcamp;
    price: number;
}
interface EnrollmentWebinar {
    webinar: Webinar;
    price: number;
}

interface Invoice {
    invoice_code: string;
    user: User;
    course_items: EnrollmentCourse[];
    bootcamp_items: EnrollmentBootcamp[];
    webinar_items: EnrollmentWebinar[];
}

export type Earning = {
    id: string;
    invoice: Invoice;
    amount: number;
    rate: number;
    status: 'pending' | 'approved' | 'paid' | 'rejected';
    created_at: string;
};

export const getColumns = (isAdmin: boolean): ColumnDef<Earning>[] => {
    const columns: ColumnDef<Earning>[] = [
        {
            id: 'items',
            header: 'Nama Produk',
            cell: ({ row }) => {
                const invoice = row.original.invoice;
                const courseTitles = invoice.course_items?.map((item) => item.course.title) || [];
                const bootcampTitles = invoice.bootcamp_items?.map((item) => item.bootcamp.title) || [];
                const webinarTitles = invoice.webinar_items?.map((item) => item.webinar.title) || [];
                const allTitles = [...courseTitles, ...bootcampTitles, ...webinarTitles];
                const fullTitleString = allTitles.join(', ');

                return (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="w-48 truncate">{fullTitleString}</div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{fullTitleString}</p>
                        </TooltipContent>
                    </Tooltip>
                );
            },
        },
        {
            id: 'price',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Harga" />,
            cell: ({ row }) => {
                const invoice = row.original.invoice;
                const coursePrices = invoice.course_items?.map((item) => item.price) || [];
                const bootcampPrices = invoice.bootcamp_items?.map((item) => item.price) || [];
                const webinarPrices = invoice.webinar_items?.map((item) => item.price) || [];
                const totalPrice = [...coursePrices, ...bootcampPrices, ...webinarPrices].reduce((sum, price) => sum + price, 0);

                // Format total harga sebagai mata uang Rupiah
                const formatted = new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                }).format(totalPrice);

                return <div className="font-medium">{formatted}</div>;
            },
        },
        {
            accessorKey: 'amount',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Komisi" />,
            cell: ({ row }) => {
                const formatted = new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                }).format(row.original.amount);
                return <div className="font-medium">{formatted}</div>;
            },
        },
        {
            accessorKey: 'rate',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Rate" />,
            cell: ({ row }) => <p>{row.original.rate}%</p>,
        },
        {
            accessorKey: 'status',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
            cell: ({ row }) => {
                const status = row.original.status;
                const statusText = status.charAt(0).toUpperCase() + status.slice(1);
                const statusClasses = {
                    paid: 'bg-blue-100 text-blue-800',
                    approved: 'bg-green-100 text-green-800',
                    pending: 'bg-yellow-100 text-yellow-800',
                    rejected: 'bg-red-100 text-red-800',
                };
                return <Badge className={`${statusClasses[status] || 'bg-gray-100'}`}>{statusText}</Badge>;
            },
        },
        {
            accessorKey: 'invoice.invoice_code',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Invoice" />,
        },
        {
            accessorKey: 'created_at',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal" />,
            cell: ({ row }) => <p>{format(new Date(row.original.created_at), 'dd MMM yyyy, HH:mm', { locale: id })}</p>,
        },
    ];

    // Jika pengguna adalah admin, tambahkan kolom Aksi di awal
    if (isAdmin) {
        columns.unshift({
            id: 'actions',
            header: () => <div className="text-center">Aksi</div>,
            cell: ({ row }) => {
                const earning = row.original;

                if (earning.status !== 'pending') {
                    return <div className="text-center">-</div>;
                }

                return (
                    <div className="flex items-center justify-center">
                        <AlertDialog>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-green-500 hover:text-green-600">
                                            <CheckCircle className="size-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Setujui Komisi</p>
                                </TooltipContent>
                            </Tooltip>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Setujui Komisi</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Anda yakin ingin menyetujui komisi sebesar{' '}
                                        <strong>
                                            {new Intl.NumberFormat('id-ID', {
                                                style: 'currency',
                                                currency: 'IDR',
                                                minimumFractionDigits: 0,
                                            }).format(earning.amount)}
                                        </strong>{' '}
                                        untuk invoice <strong>{earning.invoice.invoice_code}</strong>?
                                        <br />
                                        <br />
                                        Tindakan ini tidak dapat dibatalkan dan komisi akan langsung disetujui.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction asChild>
                                        <Link
                                            href={route('earnings.approve', earning.id)}
                                            method="post"
                                            as="button"
                                            className="bg-green-600 hover:bg-green-700"
                                        >
                                            Ya, Setujui
                                        </Link>
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                        <AlertDialog>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600">
                                            <XCircle className="size-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Tolak Komisi</p>
                                </TooltipContent>
                            </Tooltip>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Tolak Komisi</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Anda yakin ingin menolak komisi sebesar{' '}
                                        <strong>
                                            {new Intl.NumberFormat('id-ID', {
                                                style: 'currency',
                                                currency: 'IDR',
                                                minimumFractionDigits: 0,
                                            }).format(earning.amount)}
                                        </strong>{' '}
                                        untuk invoice <strong>{earning.invoice.invoice_code}</strong>?
                                        <br />
                                        <br />
                                        Tindakan ini tidak dapat dibatalkan dan komisi akan ditolak secara permanen.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction asChild>
                                        <Link
                                            href={route('earnings.reject', earning.id)}
                                            method="post"
                                            as="button"
                                            className="bg-red-600 hover:bg-red-700"
                                        >
                                            Ya, Tolak
                                        </Link>
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                );
            },
        });
    }

    return columns;
};
