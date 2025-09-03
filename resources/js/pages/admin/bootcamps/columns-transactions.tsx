'use client';

import { DataTableColumnHeader } from '@/components/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { CheckCircle, Clock, FileText, Image, User, UserCheck2 } from 'lucide-react';

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

interface BootcampSchedule {
    id: string;
    schedule_date: string;
    day: string;
    start_time: string;
    end_time: string;
}

interface BootcampAttendance {
    id: string;
    enrollment_bootcamp_id: string;
    bootcamp_schedule_id: string;
    attendance_proof: string;
    verified: boolean;
    notes?: string;
    created_at: string;
    bootcamp_schedule: BootcampSchedule;
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
    bootcamp_items: BootcampItem[];
}

export interface BootcampItem {
    id: string;
    bootcamp_id: string;
    free_requirement: FreeRequirement | null;
    progress: number;
    completed_at: string | null;
    attendances: BootcampAttendance[];
}

// Add interface for bootcamp schedules count
interface AttendanceModalProps {
    attendances: BootcampAttendance[];
    userName: string;
    totalSchedules: number; // Add this prop
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
                        <strong>Catatan:</strong> Bukti ini diupload saat pendaftaran bootcamp gratis. Pastikan semua bukti sesuai dengan persyaratan
                        yang ditetapkan.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function AttendanceModal({ attendances, userName, totalSchedules }: AttendanceModalProps) {
    const verifiedCount = attendances.filter((att) => att.verified).length;

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <UserCheck2 className="size-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] max-w-6xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <User className="size-5" />
                        Bukti Kehadiran - {userName}
                        <span className="text-muted-foreground ml-auto text-sm font-normal">
                            {verifiedCount}/{totalSchedules} Terverifikasi
                        </span>
                    </DialogTitle>
                </DialogHeader>

                <div className="mt-4 space-y-4">
                    {attendances.length > 0 ? (
                        attendances.map((attendance, idx) => (
                            <div
                                key={attendance.id}
                                className={`rounded-lg border p-4 ${
                                    attendance.verified
                                        ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                                        : 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20'
                                }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="mb-2 flex items-center gap-3">
                                            <h4 className="font-semibold">Pertemuan {idx + 1}</h4>
                                            <div className="text-muted-foreground flex items-center gap-1 text-sm">
                                                <Clock className="size-4" />
                                                {new Date(attendance.bootcamp_schedule.schedule_date).toLocaleDateString('id-ID', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}{' '}
                                                | {attendance.bootcamp_schedule.start_time.slice(0, 5)} -{' '}
                                                {attendance.bootcamp_schedule.end_time.slice(0, 5)} WIB
                                            </div>
                                        </div>

                                        <div className="mb-3 flex items-center gap-2">
                                            {attendance.verified ? (
                                                <span className="flex items-center gap-1 text-sm text-green-600">
                                                    <CheckCircle className="size-4" />
                                                    Terverifikasi
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-sm text-yellow-600">
                                                    <Clock className="size-4" />
                                                    Menunggu Verifikasi
                                                </span>
                                            )}
                                            <span className="text-muted-foreground text-xs">
                                                Upload: {format(new Date(attendance.created_at), 'dd MMM yyyy HH:mm', { locale: id })}
                                            </span>
                                        </div>

                                        {attendance.notes && (
                                            <div className="mb-3">
                                                <p className="text-muted-foreground mb-1 text-sm">Catatan:</p>
                                                <p className="rounded border bg-white p-2 text-sm dark:bg-gray-800">{attendance.notes}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-3">
                                    <p className="mb-2 text-sm font-medium">Bukti Kehadiran:</p>
                                    <div className="overflow-hidden rounded-lg border">
                                        <img
                                            src={`/storage/${attendance.attendance_proof}`}
                                            alt={`Bukti Kehadiran Pertemuan ${idx + 1}`}
                                            className="h-auto max-h-64 w-full object-contain"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = '/placeholder-image.png';
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-8 text-center">
                            <Image className="text-muted-foreground mx-auto mb-4 size-12" />
                            <p className="text-muted-foreground">Belum ada bukti kehadiran yang diupload</p>
                        </div>
                    )}
                </div>

                <div className="mt-4 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                        <strong>Progress Kehadiran:</strong> {verifiedCount} dari {totalSchedules} pertemuan telah terverifikasi.
                        {verifiedCount === totalSchedules && totalSchedules > 0 && (
                            <span className="ml-2 font-medium text-green-600">✅ Semua kehadiran lengkap!</span>
                        )}
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// Update ColumnDef to accept bootcamp data
export const createColumns = (totalSchedules: number): ColumnDef<Invoice>[] => [
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
        id: 'progress',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Progress" />,
        cell: ({ row }) => {
            const bootcampItem = row.original.bootcamp_items[0];
            if (!bootcampItem) return <div>-</div>;

            const verifiedAttendances = bootcampItem.attendances?.filter((att) => att.verified).length || 0;
            const progress = (verifiedAttendances / totalSchedules) * 100;

            return (
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="h-2 max-w-[80px] flex-1 rounded-full bg-gray-200">
                            <div className="h-2 rounded-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-xs font-medium">{progress}%</span>
                    </div>
                    <p className="text-muted-foreground text-xs">
                        Kehadiran: {verifiedAttendances}/{totalSchedules}
                    </p>
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
            const bootcampItem = invoice.bootcamp_items[0];
            const hasProof =
                invoice.bootcamp_items[0].free_requirement &&
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

                    {bootcampItem && (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div>
                                    <AttendanceModal
                                        attendances={bootcampItem.attendances || []}
                                        userName={invoice.user?.name || 'Unknown'}
                                        totalSchedules={totalSchedules}
                                    />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Lihat Bukti Kehadiran</p>
                            </TooltipContent>
                        </Tooltip>
                    )}
                </div>
            );
        },
    },
];

// Keep the old export for backward compatibility, but make it accept totalSchedules
export const columns = (totalSchedules: number = 0) => createColumns(totalSchedules);
