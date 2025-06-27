'use client';

import { DataTableColumnHeader } from '@/components/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Eye } from 'lucide-react';

// --- Type Definitions ---
interface User {
    id: string;
    name: string;
    phone_number: string | null;
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

interface EnrollmentCourse {
    course: Course;
}
interface EnrollmentBootcamp {
    bootcamp: Bootcamp;
}
interface EnrollmentWebinar {
    webinar: Webinar;
}

export interface Invoice {
    id: string;
    user: User;
    affiliate: string | null;
    invoice_code: string;
    invoice_url: string | null;
    amount: number;
    status: 'paid' | 'pending' | 'expired' | 'failed' | 'completed';
    paid_at: string | null;
    course_items: EnrollmentCourse[];
    bootcamp_items: EnrollmentBootcamp[];
    webinar_items: EnrollmentWebinar[];
    created_at: string;
}

// --- Kolom Tabel ---
export const columns: ColumnDef<Invoice>[] = [
    {
        id: 'select',
        header: ({ table }) => (
            <Checkbox
                checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Select row" />
        ),
        enableSorting: false,
        enableHiding: false,
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
        accessorKey: 'amount',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Harga" />,
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
        accessorKey: 'affiliate',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Afiliasi" />,
        cell: ({ row }) => <p>{row.original.affiliate || '-'}</p>,
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
        cell: ({ row }) => <p>{format(new Date(row.original.created_at), 'dd MMM yyyy HH:mm', { locale: id })}</p>,
    },
    {
        accessorKey: 'paid_at',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tgl. Pembayaran" />,
        cell: ({ row }) => <p>{row.original.paid_at ? format(new Date(row.original.paid_at), 'dd MMM yyyy HH:mm', { locale: id }) : '-'}</p>,
    },
    {
        id: 'actions',
        header: () => <div className="text-center">Aksi</div>,
        cell: ({ row }) => {
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

            return (
                <div className="flex items-center justify-center">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" asChild>
                                <a href={invoice.invoice_url ?? '#'} target="_blank" rel="noopener noreferrer">
                                    <Eye className="size-4" />
                                </a>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Lihat Invoice</p>
                        </TooltipContent>
                    </Tooltip>

                    {whatsappUrl && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" asChild>
                                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                                        <img src="/assets/images/whatsapp.svg" alt="Hubungi via WhatsApp" className="w-3" />
                                    </a>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Hubungi via WhatsApp</p>
                            </TooltipContent>
                        </Tooltip>
                    )}
                </div>
            );
        },
    },
];
