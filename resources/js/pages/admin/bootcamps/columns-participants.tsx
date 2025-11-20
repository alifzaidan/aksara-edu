'use client';

import { DataTableColumnHeader } from '@/components/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { CheckCircle, Clock, ExternalLink, Image, User, UserCheck2 } from 'lucide-react';

interface User {
    id: string;
    name: string;
    email: string;
    phone_number: string | null;
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

interface BootcampItem {
    id: string;
    bootcamp_id: string;
    submission_link?: string | null;
    progress: number;
    completed_at: string | null;
    attendances: BootcampAttendance[];
}

export interface Participant {
    id: string;
    user: User;
    bootcamp_item: BootcampItem;
}

interface AttendanceModalProps {
    attendances: BootcampAttendance[];
    userName: string;
    totalSchedules: number;
}

function AttendanceModal({ attendances, userName, totalSchedules }: AttendanceModalProps) {
    const verifiedCount = attendances.filter((att) => att.verified).length;

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                    <UserCheck2 className="mr-2 h-4 w-4" />
                    Lihat Kehadiran ({verifiedCount}/{totalSchedules})
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] max-w-6xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
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
                                                <Clock className="h-4 w-4" />
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
                                                    <CheckCircle className="h-4 w-4" />
                                                    Terverifikasi
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-sm text-yellow-600">
                                                    <Clock className="h-4 w-4" />
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
                            <Image className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
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

export const createParticipantColumns = (totalSchedules: number): ColumnDef<Participant>[] => [
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
        id: 'attendance_progress',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Kehadiran" />,
        cell: ({ row }) => {
            const bootcampItem = row.original.bootcamp_item;
            const verifiedAttendances = bootcampItem.attendances?.filter((att) => att.verified).length || 0;
            const progress = totalSchedules > 0 ? (verifiedAttendances / totalSchedules) * 100 : 0;

            return (
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Progress value={progress} className="h-2 w-24" />
                        <span className="text-sm font-medium">{Math.round(progress)}%</span>
                    </div>
                    <p className="text-muted-foreground text-xs">
                        {verifiedAttendances}/{totalSchedules} pertemuan
                    </p>
                </div>
            );
        },
    },
    {
        id: 'submission_link',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Link Submission" />,
        cell: ({ row }) => {
            const submissionLink = row.original.bootcamp_item.submission_link;

            if (!submissionLink) {
                return <Badge variant="secondary">Belum Upload</Badge>;
            }

            return (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" asChild>
                            <a href={submissionLink} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-2 h-3 w-3" />
                                Lihat
                            </a>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p className="max-w-xs text-xs break-all">{submissionLink}</p>
                    </TooltipContent>
                </Tooltip>
            );
        },
    },
    {
        id: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => {
            const bootcampItem = row.original.bootcamp_item;
            const isCompleted = bootcampItem.completed_at !== null;

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
            const bootcampItem = row.original.bootcamp_item;

            return (
                <div className="flex items-center justify-center">
                    <AttendanceModal attendances={bootcampItem.attendances || []} userName={row.original.user.name} totalSchedules={totalSchedules} />
                </div>
            );
        },
    },
];

export const participantColumns = (totalSchedules: number = 0) => createParticipantColumns(totalSchedules);
