'use client';

import { DataTableColumnHeader } from '@/components/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ColumnDef } from '@tanstack/react-table';
import { CheckCircle, Clock, User, UserCheck2 } from 'lucide-react';

interface User {
    id: string;
    name: string;
    email: string;
    phone_number: string | null;
}

interface WebinarItem {
    id: string;
    webinar_id: string;
    attendance_proof: string | null;
    attendance_verified: boolean;
    progress: number;
    completed_at: string | null;
}

export interface WebinarParticipant {
    id: string;
    user: User;
    webinar_item: WebinarItem;
}

interface AttendanceModalProps {
    webinarItem: WebinarItem;
    userName: string;
}

function AttendanceModal({ webinarItem, userName }: AttendanceModalProps) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                    <UserCheck2 className="mr-2 h-4 w-4" />
                    {webinarItem.attendance_proof ? 'Lihat Bukti' : 'Belum Upload'}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
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
                                        <CheckCircle className="h-4 w-4" />
                                        Kehadiran Terverifikasi
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-sm text-yellow-600">
                                        <Clock className="h-4 w-4" />
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
                            <UserCheck2 className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
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

export const createWebinarParticipantColumns = (): ColumnDef<WebinarParticipant>[] => [
    {
        accessorKey: 'user.name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nama Peserta" />,
        cell: ({ row }) => (
            <div>
                <p className="font-medium">{row.original.user.name}</p>
                <p className="text-muted-foreground text-xs">{row.original.user.email}</p>
            </div>
        ),
    },
    {
        accessorKey: 'user.phone_number',
        header: ({ column }) => <DataTableColumnHeader column={column} title="No. HP" />,
        cell: ({ row }) => <p className="text-sm">{row.original.user.phone_number || '-'}</p>,
    },
    {
        id: 'attendance_status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status Kehadiran" />,
        cell: ({ row }) => {
            const webinarItem = row.original.webinar_item;

            if (!webinarItem.attendance_proof) {
                return (
                    <Badge variant="secondary" className="gap-1">
                        <Clock className="h-3 w-3" />
                        Belum Upload
                    </Badge>
                );
            }

            if (webinarItem.attendance_verified) {
                return (
                    <Badge className="gap-1 bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3" />
                        Terverifikasi
                    </Badge>
                );
            }

            return (
                <Badge variant="outline" className="gap-1 border-yellow-300 bg-yellow-50 text-yellow-700">
                    <Clock className="h-3 w-3" />
                    Menunggu Verifikasi
                </Badge>
            );
        },
    },
    {
        id: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status Peserta" />,
        cell: ({ row }) => {
            const webinarItem = row.original.webinar_item;
            const isCompleted = webinarItem.completed_at !== null;

            return isCompleted ? (
                <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Selesai
                </Badge>
            ) : (
                <Badge variant="secondary">
                    <Clock className="mr-1 h-3 w-3" />
                    Aktif
                </Badge>
            );
        },
    },
    {
        id: 'actions',
        header: () => <div className="text-center">Aksi</div>,
        cell: ({ row }) => {
            const webinarItem = row.original.webinar_item;

            return (
                <div className="flex items-center justify-center">
                    <AttendanceModal webinarItem={webinarItem} userName={row.original.user.name} />
                </div>
            );
        },
    },
];

export const webinarParticipantColumns = createWebinarParticipantColumns();
