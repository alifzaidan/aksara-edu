'use client';

import { DataTableColumnHeader } from '@/components/data-table-column-header';
import DeleteConfirmDialog from '@/components/delete-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Link, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { BookText, Calendar, Edit, Folder, MonitorPlay, Presentation, ShoppingBag, Trash } from 'lucide-react';
import { useState } from 'react';
import EditUser from './edit';

export type User = {
    id: string;
    name: string;
    email: string;
    phone_number: string;
    email_verified_at: string | null;
    created_at: string;
    courses_count: number;
    bootcamps_count: number;
    webinars_count: number;
    total_enrollments: number;
    program_types: string[];
    last_purchase_date: string | null;
    last_purchase_items: Array<{
        type: 'course' | 'bootcamp' | 'webinar';
        title: string;
        price: number;
    }>;
    last_purchase_total: number;
    has_enrollments: boolean;
};

export const columns: ColumnDef<User>[] = [
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
        accessorKey: 'no',
        header: 'No',
        cell: ({ row }) => {
            const index = row.index + 1;
            return <div className="font-medium">{index}</div>;
        },
    },
    {
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nama Pengguna" />,
        cell: ({ row }) => {
            return (
                <div className="flex flex-col">
                    <Link href={route('users.show', row.original.id)} className="text-primary font-medium hover:underline">
                        {row.original.name}
                    </Link>
                    <span className="text-xs text-gray-500">{row.original.email}</span>
                </div>
            );
        },
    },
    {
        accessorKey: 'phone_number',
        header: ({ column }) => <DataTableColumnHeader column={column} title="No. Telepon" />,
        cell: ({ row }) => {
            return <p className="text-sm">{row.original.phone_number || '-'}</p>;
        },
    },
    {
        accessorKey: 'total_enrollments',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Program" />,
        filterFn: (row, id, value) => {
            if (value.length === 0) return true;

            const programTypes = row.original.program_types || [];
            return value.some((v: string) => programTypes.includes(v));
        },
        cell: ({ row }) => {
            const user = row.original;
            const hasAnyEnrollment = user.courses_count > 0 || user.bootcamps_count > 0 || user.webinars_count > 0;

            return (
                <div className="flex flex-wrap gap-1">
                    {hasAnyEnrollment ? (
                        <>
                            {user.courses_count > 0 && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Badge variant="outline" className="flex items-center gap-1 text-xs">
                                            <BookText className="h-3 w-3 text-blue-600" />
                                            {user.courses_count}
                                        </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="text-xs">
                                            <span className="font-semibold">Kelas Online</span>
                                            <br />
                                            {user.courses_count} kelas online terdaftar
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            )}
                            {user.bootcamps_count > 0 && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Badge variant="outline" className="flex items-center gap-1 text-xs">
                                            <Presentation className="h-3 w-3 text-green-600" />
                                            {user.bootcamps_count}
                                        </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="text-xs">
                                            <span className="font-semibold">Bootcamp</span>
                                            <br />
                                            {user.bootcamps_count} bootcamp terdaftar
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            )}
                            {user.webinars_count > 0 && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Badge variant="outline" className="flex items-center gap-1 text-xs">
                                            <MonitorPlay className="h-3 w-3 text-purple-600" />
                                            {user.webinars_count}
                                        </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="text-xs">
                                            <span className="font-semibold">Webinar</span>
                                            <br />
                                            {user.webinars_count} webinar terdaftar
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            )}
                        </>
                    ) : (
                        <span className="text-sm text-gray-400">-</span>
                    )}
                </div>
            );
        },
    },
    {
        accessorKey: 'last_purchase_date',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Pembelian Terakhir" />,
        filterFn: (row, id, value) => {
            const hasPurchase = row.original.last_purchase_date !== null;
            if (value.length === 0) return true;

            const rowValue = hasPurchase ? 'true' : 'false';
            return value.includes(rowValue);
        },
        cell: ({ row }) => {
            const lastPurchase = row.original.last_purchase_date;
            const items = row.original.last_purchase_items || [];
            const total = row.original.last_purchase_total || 0;

            if (!lastPurchase) {
                return <span className="text-sm text-gray-400">Belum ada</span>;
            }

            const formatRupiah = (amount: number) => {
                return new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                }).format(amount);
            };

            const getTypeIcon = (type: string) => {
                switch (type) {
                    case 'course':
                        return <BookText className="h-3 w-3 text-blue-600" />;
                    case 'bootcamp':
                        return <Presentation className="h-3 w-3 text-green-600" />;
                    case 'webinar':
                        return <MonitorPlay className="h-3 w-3 text-purple-600" />;
                    default:
                        return null;
                }
            };

            const getTypeLabel = (type: string) => {
                switch (type) {
                    case 'course':
                        return 'Kelas Online';
                    case 'bootcamp':
                        return 'Bootcamp';
                    case 'webinar':
                        return 'Webinar';
                    default:
                        return type;
                }
            };

            return (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 text-sm">
                            <ShoppingBag className="h-3 w-3 text-green-600" />
                            <span>{format(new Date(lastPurchase), 'dd MMM yyyy', { locale: id })}</span>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                        <div className="space-y-2">
                            <p className="text-xs font-semibold">Detail Pembelian Terakhir</p>
                            <div className="space-y-1">
                                {items.map((item, index) => (
                                    <div key={index} className="flex items-start gap-2 text-xs">
                                        <div className="mt-0.5">{getTypeIcon(item.type)}</div>
                                        <div className="flex-1">
                                            <p className="font-medium">{item.title}</p>
                                            <p className="text-muted text-[10px]">
                                                {getTypeLabel(item.type)} • {formatRupiah(item.price)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t pt-1">
                                <div className="flex items-center justify-between text-xs font-semibold">
                                    <span>Total:</span>
                                    <span className="text-green-500">{formatRupiah(total)}</span>
                                </div>
                            </div>
                        </div>
                    </TooltipContent>
                </Tooltip>
            );
        },
    },
    {
        accessorKey: 'created_at',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Bergabung" />,
        cell: ({ row }) => (
            <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-3 w-3 text-gray-500" />
                <span>{format(new Date(row.original.created_at), 'dd MMM yyyy', { locale: id })}</span>
            </div>
        ),
    },
    {
        id: 'actions',
        header: () => <div className="text-center">Aksi</div>,
        cell: function Cell({ row }) {
            const [open, setOpen] = useState(false);
            const user = row.original;
            let whatsappUrl = '';

            if (user?.phone_number) {
                let phoneNumber = user.phone_number.replace(/\D/g, '');
                if (phoneNumber.startsWith('0')) {
                    phoneNumber = '62' + phoneNumber.substring(1);
                }
                whatsappUrl = `https://wa.me/${phoneNumber}`;
            }

            const handleDelete = () => {
                router.delete(route('users.destroy', user.id));
            };

            return (
                <div className="flex items-center justify-center gap-1">
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

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" asChild>
                                <Link href={`/admin/users/${user.id}`} className="text-blue-600 hover:text-blue-800">
                                    <Folder className="size-4" />
                                </Link>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Detail Pengguna</p>
                        </TooltipContent>
                    </Tooltip>

                    <Dialog open={open} onOpenChange={setOpen}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <Edit className="size-4" />
                                    </Button>
                                </DialogTrigger>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Edit Pengguna</p>
                            </TooltipContent>
                        </Tooltip>
                        <DialogContent>
                            <EditUser user={user} setOpen={setOpen} />
                        </DialogContent>
                    </Dialog>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div>
                                <DeleteConfirmDialog
                                    trigger={
                                        <Button variant="link" size="icon" className="size-8 text-red-500 hover:cursor-pointer">
                                            <Trash />
                                            <span className="sr-only">Hapus Pengguna</span>
                                        </Button>
                                    }
                                    title="Apakah Anda yakin ingin menghapus pengguna ini?"
                                    itemName={user.name}
                                    onConfirm={handleDelete}
                                />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Hapus Pengguna</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            );
        },
    },
];
