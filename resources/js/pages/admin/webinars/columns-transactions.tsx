'use client';

import { DataTableColumnHeader } from '@/components/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { CheckCircle, Clock, FileText, Image, MessageSquare, Star, User, UserCheck2 } from 'lucide-react';

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
    webinar_items: WebinarItem[];
}

export interface WebinarItem {
    id: string;
    webinar_id: string;
    progress: number;
    completed_at: string | null;
    attendance_proof: string | null;
    attendance_verified: boolean;
    review: string | null;
    rating: number | null;
    free_requirement: FreeRequirement | null;
}

function ProofModal({ requirement, userName }: { requirement: FreeRequirement; userName: string }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Image className="size-4" />
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
                                <Image className="mx-auto mb-2 size-8" />
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
                                <Image className="mx-auto mb-2 size-8" />
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
                                <Image className="mx-auto mb-2 size-8" />
                                <p className="text-sm">Tidak ada bukti</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-4 rounded-lg bg-gray-50 p-3">
                    <p className="text-sm text-gray-600">
                        <strong>Catatan:</strong> Bukti ini diupload saat pendaftaran webinar gratis. Pastikan semua bukti sesuai dengan persyaratan
                        yang ditetapkan.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function AttendanceModal({ webinarItem, userName }: { webinarItem: WebinarItem; userName: string }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <UserCheck2 className="size-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <User className="size-5" />
                        Bukti Kehadiran Webinar - {userName}
                        <span className="text-muted-foreground ml-auto text-sm font-normal">
                            {webinarItem.attendance_verified ? 'Terverifikasi' : 'Menunggu Verifikasi'}
                        </span>
                    </DialogTitle>
                </DialogHeader>

                <div className="mt-4 space-y-4">
                    {webinarItem.attendance_proof ? (
                        <div
                            className={`rounded-lg border p-4 ${
                                webinarItem.attendance_verified
                                    ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                                    : 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20'
                            }`}
                        >
                            <div className="mb-3 flex items-center gap-2">
                                {webinarItem.attendance_verified ? (
                                    <span className="flex items-center gap-1 text-sm text-green-600">
                                        <CheckCircle className="size-4" />
                                        Kehadiran Terverifikasi
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-sm text-yellow-600">
                                        <Clock className="size-4" />
                                        Menunggu Verifikasi
                                    </span>
                                )}
                            </div>

                            <div className="mt-3">
                                <p className="mb-2 text-sm font-medium">Bukti Kehadiran:</p>
                                <div className="overflow-hidden rounded-lg border">
                                    <img
                                        src={`/storage/${webinarItem.attendance_proof}`}
                                        alt="Bukti Kehadiran Webinar"
                                        className="h-auto max-h-96 w-full object-contain"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = '/placeholder-image.png';
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="py-8 text-center">
                            <UserCheck2 className="text-muted-foreground mx-auto mb-4 size-12" />
                            <p className="text-muted-foreground">Belum ada bukti kehadiran yang diupload</p>
                        </div>
                    )}
                </div>

                <div className="mt-4 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                        <strong>Status Kehadiran:</strong>{' '}
                        {webinarItem.attendance_verified
                            ? '✅ Kehadiran sudah terverifikasi dan peserta dapat mengakses sertifikat.'
                            : webinarItem.attendance_proof
                              ? '⏳ Bukti kehadiran sedang dalam proses verifikasi.'
                              : '❌ Peserta belum mengupload bukti kehadiran.'}
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function ReviewModal({ webinarItem, userName }: { webinarItem: WebinarItem; userName: string }) {
    const renderStars = (rating: number) => {
        return Array.from({ length: 5 }, (_, i) => (
            <Star key={i} className={`size-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
        ));
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <MessageSquare className="size-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MessageSquare className="size-5" />
                        Review & Rating - {userName}
                    </DialogTitle>
                </DialogHeader>

                <div className="mt-4 space-y-4">
                    {/* Rating Section */}
                    <div className="space-y-2">
                        <h4 className="text-sm font-semibold">Rating Webinar</h4>
                        {webinarItem.rating ? (
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">{renderStars(webinarItem.rating)}</div>
                                <span className="text-muted-foreground text-sm">({webinarItem.rating}/5)</span>
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-sm">Belum memberikan rating</p>
                        )}
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <h4 className="text-sm font-semibold">Review Webinar</h4>
                        {webinarItem.review ? (
                            <div className="rounded-lg border bg-gray-50 p-4 dark:bg-gray-800">
                                <p className="text-sm leading-relaxed">{webinarItem.review}</p>
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-sm">Belum memberikan review</p>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export const columns: ColumnDef<Invoice>[] = [
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
        id: 'rating',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Rating" />,
        cell: ({ row }) => {
            const webinarItem = row.original.webinar_items[0];
            if (!webinarItem?.rating) return <div className="text-gray-400">-</div>;

            return (
                <div className="flex items-center gap-1">
                    <Star className="size-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{webinarItem.rating}/5</span>
                </div>
            );
        },
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
        id: 'actions',
        header: () => <div className="text-center">Aksi</div>,
        cell: ({ row }) => {
            const invoice = row.original;
            const webinarItem = invoice.webinar_items[0];

            if (!webinarItem) return <div>-</div>;

            const hasProof =
                invoice.webinar_items[0].free_requirement &&
                (invoice.webinar_items[0].free_requirement.ig_follow_proof ||
                    invoice.webinar_items[0].free_requirement.tiktok_follow_proof ||
                    invoice.webinar_items[0].free_requirement.tag_friend_proof);

            return (
                <div className="flex items-center justify-center gap-1">
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

                    {hasProof && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div>
                                    <ProofModal requirement={invoice.webinar_items[0].free_requirement!} userName={invoice.user?.name || 'Unknown'} />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Lihat Bukti Follow & Tag</p>
                            </TooltipContent>
                        </Tooltip>
                    )}

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div>
                                <AttendanceModal webinarItem={webinarItem} userName={invoice.user?.name || 'Unknown'} />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Lihat Bukti Kehadiran</p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div>
                                <ReviewModal webinarItem={webinarItem} userName={invoice.user?.name || 'Unknown'} />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Lihat Review & Rating</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            );
        },
    },
];
