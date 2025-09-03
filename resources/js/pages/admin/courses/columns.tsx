'use client';

import { DataTableColumnHeader } from '@/components/data-table-column-header';
import DeleteConfirmDialog from '@/components/delete-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { rupiahFormatter } from '@/lib/utils';
import { SharedData } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import type { Row } from '@tanstack/react-table';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Award, Folder, Trash } from 'lucide-react';

function CertificateCell({ row }: { row: Row<Course> }) {
    const { auth } = usePage<SharedData>().props;
    const role = auth.role[0];
    const isAdmin = role === 'admin';
    const isMentor = role === 'mentor';

    const certificate = row.original.certificate;

    if (isMentor) {
        if (certificate) {
            return (
                <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
                    <Award className="mr-1 h-3 w-3" />
                    Tersedia
                </Badge>
            );
        }

        return (
            <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-600">
                <Award className="mr-1 h-3 w-3" />
                Belum Ada
            </Badge>
        );
    }

    if (isAdmin) {
        if (certificate) {
            return (
                <div className="flex items-center gap-2">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href={route('certificates.show', { certificate: certificate.id })}>
                                    <Award className="h-4 w-4 text-green-600" />
                                    <Badge variant="outline" className="ml-1 border-green-200 bg-green-50 text-green-700">
                                        Tersedia
                                    </Badge>
                                </Link>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <div className="text-xs">
                                <p className="font-medium">{certificate.title}</p>
                                <p className="text-muted-foreground">
                                    Dibuat: {format(new Date(certificate.created_at), 'dd MMM yyyy', { locale: id })}
                                </p>
                                <p className="mt-1 text-blue-600">Klik untuk lihat detail</p>
                            </div>
                        </TooltipContent>
                    </Tooltip>
                </div>
            );
        }

        return (
            <div className="flex items-center gap-2">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" asChild>
                            <Link
                                href={route('certificates.create', {
                                    program_type: 'course',
                                    course_id: row.original.id,
                                })}
                            >
                                <Award className="h-4 w-4 text-gray-400" />
                                <Badge variant="outline" className="ml-1 border-gray-200 bg-gray-50 text-gray-600">
                                    Belum Ada
                                </Badge>
                            </Link>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p className="text-xs">Klik untuk membuat sertifikat</p>
                    </TooltipContent>
                </Tooltip>
            </div>
        );
    }

    return (
        <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-600">
            <Award className="mr-1 h-3 w-3" />-
        </Badge>
    );
}

export default function CourseActions({ course }: { course: Course }) {
    const { auth } = usePage<SharedData>().props;
    const isAffiliate = auth.role.includes('affiliate');

    const handleDelete = () => {
        router.delete(route('courses.destroy', course.id));
    };

    return (
        <div className="flex items-center justify-center gap-2">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="link" size="icon" className="size-8" asChild>
                        <Link href={route('courses.show', course.id)}>
                            <Folder />
                            <span className="sr-only">Detail Kelas</span>
                        </Link>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Lihat Kelas</p>
                </TooltipContent>
            </Tooltip>
            {!isAffiliate && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div>
                            <DeleteConfirmDialog
                                trigger={
                                    <Button variant="link" size="icon" className="size-8 text-red-500 hover:cursor-pointer">
                                        <Trash />
                                        <span className="sr-only">Hapus Kelas</span>
                                    </Button>
                                }
                                title="Apakah Anda yakin ingin menghapus kelas ini?"
                                itemName={course.title}
                                onConfirm={handleDelete}
                            />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Hapus Kelas</p>
                    </TooltipContent>
                </Tooltip>
            )}
        </div>
    );
}

export type Course = {
    id: string;
    category_id: string;
    category: {
        name: string;
    };
    user?: {
        name: string;
    };
    title: string;
    short_description: string | null;
    description: string | null;
    thumbnail: string | null;
    strikethrough_price: number;
    price: number;
    status: 'draft' | 'published' | 'archived';
    level: 'beginner' | 'intermediate' | 'advanced';
    created_at: string;
    certificate?: {
        id: string;
        title: string;
        certificate_number: string;
        created_at: string;
    } | null;
};

export const columns: ColumnDef<Course>[] = [
    {
        accessorKey: 'no',
        header: 'No',
        cell: ({ row }) => {
            const index = row.index + 1;

            return <div className="font-medium">{index}</div>;
        },
    },
    {
        accessorKey: 'title',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Judul" />,
        cell: ({ row }) => {
            return (
                <Link href={route('courses.show', row.original.id)} className="text-primary font-medium hover:underline">
                    {row.original.title}
                </Link>
            );
        },
    },
    {
        accessorKey: 'category.name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Kategori" />,
    },
    {
        accessorKey: 'user.name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Mentor" />,
    },
    {
        accessorKey: 'thumbnail',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Thumbnail" />,
        cell: ({ row }) => {
            const title = row.original.title;
            const thumbnail = row.original.thumbnail;
            const thumbnailUrl = thumbnail ? `/storage/${thumbnail}` : '/assets/images/placeholder.png';
            return <img src={thumbnailUrl} alt={title} className="h-16 w-16 rounded object-cover" />;
        },
    },
    {
        accessorKey: 'level',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Level" />,
        cell: ({ row }) => {
            const level = row.original.level;
            let color = 'bg-gray-200 text-gray-800';
            if (level === 'beginner') color = 'bg-green-100 text-green-800';
            if (level === 'intermediate') color = 'bg-yellow-100 text-yellow-800';
            if (level === 'advanced') color = 'bg-red-100 text-red-800';
            return <Badge className={`capitalize ${color} border-0`}>{level}</Badge>;
        },
    },
    {
        accessorKey: 'price',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Harga" />,
        cell: ({ row }) => {
            const strikethroughPrice = row.original.strikethrough_price;
            const price = row.original.price;
            if (price === 0) {
                return <div className="text-base font-semibold">Gratis</div>;
            }
            return (
                <div>
                    {strikethroughPrice > 0 && <div className="text-xs text-gray-500 line-through">{rupiahFormatter.format(strikethroughPrice)}</div>}
                    <div className="text-base font-semibold">{rupiahFormatter.format(price)}</div>
                </div>
            );
        },
    },
    {
        accessorKey: 'created_at',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal Dibuat" />,
        cell: ({ row }) => <p>{row.original.created_at ? format(new Date(row.original.created_at), 'dd MMMM yyyy', { locale: id }) : '-'}</p>,
    },
    {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => {
            const status = row.original.status;
            let color = 'bg-gray-200 text-gray-800';
            if (status === 'draft') color = 'bg-gray-200 text-gray-800';
            if (status === 'published') color = 'bg-blue-100 text-blue-800';
            if (status === 'archived') color = 'bg-zinc-300 text-zinc-700';
            return <Badge className={`capitalize ${color} border-0`}>{status}</Badge>;
        },
    },
    {
        accessorKey: 'certificate',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Sertifikat" />,
        cell: ({ row }) => <CertificateCell row={row} />,
        enableSorting: false,
    },
    {
        id: 'actions',
        header: () => <div className="text-center">Aksi</div>,
        cell: ({ row }) => <CourseActions course={row.original} />,
    },
];
