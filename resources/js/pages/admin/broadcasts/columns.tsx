'use client';

import { DataTableColumnHeader } from '@/components/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Edit, Eye, Send, Trash } from 'lucide-react';
import { Link, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
    AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export type Broadcast = {
    id: string;
    title: string;
    message: string;
    total_sent: number;
    last_sent_at: string | null;
    created_at: string;
};

export const columns: ColumnDef<Broadcast>[] = [
    {
        id: 'no',
        header: 'No',
        cell: ({ row }) => <span className="font-medium">{row.index + 1}</span>,
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: 'title',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Judul" />,
        cell: ({ row }) => (
            <Link href={route('broadcasts.show', row.original.id)} className="text-primary font-medium hover:underline">
                {row.getValue('title')}
            </Link>
        ),
    },
    {
        accessorKey: 'total_sent',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Terkirim" />,
        cell: ({ row }) => {
            const total = row.getValue('total_sent') as number;
            return (
                <Badge variant={total > 0 ? 'default' : 'secondary'} className="text-xs">
                    <Send className="mr-1 h-3 w-3" /> {total}
                </Badge>
            );
        },
    },
    {
        accessorKey: 'last_sent_at',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Terakhir Kirim" />,
        cell: ({ row }) => {
            const lastSent = row.getValue('last_sent_at') as string | null;
            return (
                <span className="text-sm">
                    {lastSent
                        ? format(new Date(lastSent), 'dd MMM yyyy HH:mm', { locale: idLocale })
                        : <span className="text-muted-foreground">-</span>}
                </span>
            );
        },
    },
    {
        accessorKey: 'created_at',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Dibuat" />,
        cell: ({ row }) => {
            const createdAt = row.getValue('created_at') as string;
            return (
                <span className="text-sm">
                    {format(new Date(createdAt), 'dd MMM yyyy', { locale: idLocale })}
                </span>
            );
        },
    },
    {
        id: 'actions',
        header: () => <div className="text-center">Aksi</div>,
        cell: ({ row }) => {
            const bc = row.original;
            return (
                <div className="flex items-center justify-center gap-1">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" asChild>
                                <Link href={route('broadcasts.show', bc.id)}>
                                    <Eye className="h-4 w-4 text-blue-600" />
                                </Link>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Kirim Broadcast</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" asChild>
                                <Link href={route('broadcasts.edit', bc.id)}>
                                    <Edit className="h-4 w-4" />
                                </Link>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="link" size="icon" className="text-red-500 hover:cursor-pointer">
                                            <Trash className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Hapus broadcast ini?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Template &quot;{bc.title}&quot; akan dihapus permanen.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Batal</AlertDialogCancel>
                                            <AlertDialogAction
                                                className="bg-red-600 hover:bg-red-700"
                                                onClick={() => router.delete(route('broadcasts.destroy', bc.id))}
                                            >
                                                Hapus
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>Hapus</TooltipContent>
                    </Tooltip>
                </div>
            );
        },
    },
];
