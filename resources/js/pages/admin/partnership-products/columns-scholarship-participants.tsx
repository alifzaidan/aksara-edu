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
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { ExternalLink } from 'lucide-react';
import { useState } from 'react';

export interface ScholarshipParticipant {
    id: string;
    name: string;
    email: string;
    phone: string;
    nim: string;
    university: string;
    major: string;
    semester: number;
    ktm_photo: string;
    transcript_photo: string;
    instagram_proof_photo: string;
    instagram_tag_proof_photo: string;
    is_accepted?: boolean;
    accepted_at?: string | null;
    created_at?: string | null;
}

function storageUrl(path: string) {
    if (!path) return '#';
    return `/storage/${path}`;
}

function AcceptParticipantDialogButton({
    partnershipProductId,
    participantId,
    participantName,
}: {
    partnershipProductId: string;
    participantId: string;
    participantName: string;
}) {
    const [open, setOpen] = useState(false);

    const onAccept = () => {
        router.post(
            route('partnership-products.scholarship-participants.accept', {
                id: partnershipProductId,
                scholarshipId: participantId,
            }),
            {},
            {
                preserveScroll: true,
                onFinish: () => setOpen(false),
            },
        );
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <Button type="button" size="sm" onClick={() => setOpen(true)}>
                Terima
            </Button>

            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Konfirmasi Terima Peserta</AlertDialogTitle>
                    <AlertDialogDescription>
                        Terima peserta <span className="font-medium">{participantName}</span>? Pesan WhatsApp akan dikirim otomatis.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={onAccept}>Ya, Terima</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export const getColumns = (partnershipProductId: string): ColumnDef<ScholarshipParticipant>[] => [
    {
        id: 'accept',
        header: () => <div className="text-center">Aksi</div>,
        cell: ({ row }) => {
            const p = row.original;

            if (p.is_accepted) {
                return (
                    <div className="flex items-center justify-center">
                        <Badge variant="outline">✓</Badge>
                    </div>
                );
            }

            return (
                <div className="flex items-center justify-center">
                    <AcceptParticipantDialogButton partnershipProductId={partnershipProductId} participantId={p.id} participantName={p.name} />
                </div>
            );
        },
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: 'no',
        header: 'No',
        cell: ({ row }) => <div className="font-medium">{row.index + 1}</div>,
    },
    {
        accessorKey: 'is_accepted',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => {
            const isAccepted = !!row.original.is_accepted;
            return isAccepted ? (
                <Badge className="bg-green-100 text-green-700">Diterima</Badge>
            ) : (
                <Badge variant="outline" className="text-muted-foreground">
                    Belum
                </Badge>
            );
        },
    },
    {
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nama" />,
        cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
    },
    {
        accessorKey: 'email',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    },
    {
        accessorKey: 'phone',
        header: ({ column }) => <DataTableColumnHeader column={column} title="No. HP" />,
    },
    {
        accessorKey: 'nim',
        header: ({ column }) => <DataTableColumnHeader column={column} title="NIM" />,
        cell: ({ row }) => <Badge variant="outline">{row.original.nim}</Badge>,
    },
    {
        accessorKey: 'university',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Universitas" />,
    },
    {
        accessorKey: 'major',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Prodi" />,
    },
    {
        accessorKey: 'semester',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Semester" />,
        cell: ({ row }) => <span>{row.original.semester}</span>,
    },
    {
        accessorKey: 'created_at',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tgl. Daftar" />,
        cell: ({ row }) => {
            const createdAt = row.original.created_at;
            if (!createdAt) return <span className="text-muted-foreground">-</span>;
            return <span>{format(new Date(createdAt), 'dd MMM yyyy, HH:mm', { locale: id })}</span>;
        },
    },
    {
        id: 'documents',
        header: () => <div className="text-center">Dokumen</div>,
        cell: ({ row }) => {
            const p = row.original;

            const docs = [
                { label: 'KTM', href: storageUrl(p.ktm_photo) },
                { label: 'Transkrip', href: storageUrl(p.transcript_photo) },
                { label: 'Follow IG', href: storageUrl(p.instagram_proof_photo) },
                { label: 'Tag IG', href: storageUrl(p.instagram_tag_proof_photo) },
            ];

            return (
                <div className="flex items-center justify-center gap-1">
                    {docs.map((doc) => (
                        <Button key={doc.label} variant="ghost" size="sm" asChild>
                            <a href={doc.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1">
                                <ExternalLink className="h-3 w-3" />
                                {doc.label}
                            </a>
                        </Button>
                    ))}
                </div>
            );
        },
    },
];
