'use client';

import { DataTableColumnHeader } from '@/components/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { FileText, Image } from 'lucide-react';

interface User {
    id: string;
    name: string;
    phone_number: string | null;
    referrer: { id: string; name: string } | null;
}

interface FreeRequirement {
    id: string;
    ig_follow_proof: string | null;
    tiktok_follow_proof: string | null;
    tag_friend_proof: string | null;
}

export interface Invoice {
    id: string;
    user: User;
    invoice_code: string;
    invoice_url: string | null;
    amount: number;
    status: 'paid' | 'pending' | 'failed';
    paid_at: string | null;
    created_at: string;
    bootcamp_items: {
        id: string;
        bootcamp_id: string;
        free_requirement: FreeRequirement | null;
    }[];
}

function ProofModal({ requirement, userName }: { requirement: FreeRequirement; userName: string }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Image className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Bukti Follow & Tag - {userName}</DialogTitle>
                </DialogHeader>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                        <h4 className="text-sm font-semibold">Bukti Follow Instagram</h4>
                        {requirement.ig_follow_proof ? (
                            <div className="overflow-hidden rounded-lg border">
                                <img
                                    src={`/storage/${requirement.ig_follow_proof}`}
                                    alt="Bukti Follow Instagram"
                                    className="h-auto max-h-64 w-full object-contain"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = '/placeholder-image.png';
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="rounded-lg border p-4 text-center text-gray-500">
                                <Image className="mx-auto mb-2 h-8 w-8" />
                                <p className="text-sm">Tidak ada bukti</p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <h4 className="text-sm font-semibold">Bukti Follow TikTok</h4>
                        {requirement.tiktok_follow_proof ? (
                            <div className="overflow-hidden rounded-lg border">
                                <img
                                    src={`/storage/${requirement.tiktok_follow_proof}`}
                                    alt="Bukti Follow TikTok"
                                    className="h-auto max-h-64 w-full object-contain"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = '/placeholder-image.png';
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="rounded-lg border p-4 text-center text-gray-500">
                                <Image className="mx-auto mb-2 h-8 w-8" />
                                <p className="text-sm">Tidak ada bukti</p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <h4 className="text-sm font-semibold">Bukti Tag 3 Teman</h4>
                        {requirement.tag_friend_proof ? (
                            <div className="overflow-hidden rounded-lg border">
                                <img
                                    src={`/storage/${requirement.tag_friend_proof}`}
                                    alt="Bukti Tag 3 Teman"
                                    className="h-auto max-h-64 w-full object-contain"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = '/placeholder-image.png';
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="rounded-lg border p-4 text-center text-gray-500">
                                <Image className="mx-auto mb-2 h-8 w-8" />
                                <p className="text-sm">Tidak ada bukti</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-4 rounded-lg bg-gray-50 p-3">
                    <p className="text-sm text-gray-600">
                        <strong>Catatan:</strong> Bukti ini diupload saat pendaftaran bootcamp gratis. Pastikan semua bukti sesuai dengan persyaratan
                        yang ditetapkan.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export const transactionColumns: ColumnDef<Invoice>[] = [
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
                pending: 'bg-yellow-100 text-yellow-800',
                failed: 'bg-red-100 text-red-800',
            };
            return <Badge className={`${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>{statusText}</Badge>;
        },
    },
    {
        accessorKey: 'created_at',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tgl. Pembelian" />,
        cell: ({ row }) => <p>{format(new Date(row.original.created_at), 'dd MMM yyyy, HH:mm', { locale: id })}</p>,
    },
    {
        id: 'actions',
        header: () => <div className="text-center">Aksi</div>,
        cell: ({ row }) => {
            const invoice = row.original;
            const hasProof =
                invoice.bootcamp_items[0]?.free_requirement &&
                (invoice.bootcamp_items[0].free_requirement.ig_follow_proof ||
                    invoice.bootcamp_items[0].free_requirement.tiktok_follow_proof ||
                    invoice.bootcamp_items[0].free_requirement.tag_friend_proof);

            return (
                <div className="flex items-center justify-center gap-1">
                    {invoice.status === 'paid' && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" asChild>
                                    <a href={route('invoice.pdf', { id: invoice.id })} target="_blank" rel="noopener noreferrer">
                                        <FileText className="h-4 w-4" />
                                    </a>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Lihat Invoice</p>
                            </TooltipContent>
                        </Tooltip>
                    )}

                    {hasProof && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div>
                                    <ProofModal
                                        requirement={invoice.bootcamp_items[0].free_requirement!}
                                        userName={invoice.user?.name || 'Unknown'}
                                    />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Lihat Bukti Follow & Tag</p>
                            </TooltipContent>
                        </Tooltip>
                    )}
                </div>
            );
        },
    },
];
