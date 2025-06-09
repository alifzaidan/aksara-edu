import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import AdminLayout from '@/layouts/admin-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { CircleX, Copy, LinkIcon, Send, SquarePen, Trash } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';

interface Webinar {
    id: string;
    title: string;
    category?: { name: string };
    batch?: string | null;
    price: number;
    quota: number;
    start_time: string | Date;
    end_time: string | Date;
    registration_deadline: string | Date;
    status: string;
    webinar_url: string;
    registration_url: string;
    thumbnail?: string | null;
    description?: string | null;
    benefits?: string | null;
    instructions?: string | null;
    host_name?: string | null;
    host_description?: string | null;
    created_at: string | Date;
}

interface WebinarProps {
    webinar: Webinar;
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function ShowWebinar({ webinar, flash }: WebinarProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Webinar',
            href: route('webinars.index'),
        },
        {
            title: webinar.title,
            href: route('webinars.show', { webinar: webinar.id }),
        },
    ];

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`Detail Webinar - ${webinar.title}`} />
            <div className="px-4 py-4 md:px-6">
                <h1 className="mb-4 text-2xl font-semibold">{`Detail ${webinar.title}`}</h1>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="space-y-6 rounded-lg border p-4 lg:col-span-2">
                        <h2 className="text-lg font-medium">Share Link untuk Menerima Pendaftaran</h2>
                        <div className="flex gap-2">
                            <div className="flex-1 space-y-2">
                                <Input
                                    type="text"
                                    value={webinar.registration_url}
                                    readOnly
                                    className="rounded border p-2"
                                    placeholder="Link Pendaftaran"
                                />
                                <Button onClick={() => navigator.clipboard.writeText(webinar.registration_url)} className="w-full">
                                    Salin Link Pendaftaran <LinkIcon />
                                </Button>
                            </div>
                            <div className="flex-1 space-y-2">
                                <Input type="text" value={webinar.webinar_url} readOnly className="rounded border p-2" placeholder="Link Webinar" />
                                <Button onClick={() => navigator.clipboard.writeText(webinar.webinar_url)} className="w-full">
                                    Salin Link Webinar <LinkIcon />
                                </Button>
                            </div>
                        </div>
                        <p className="text-muted-foreground text-center text-sm">
                            Share link diatas ke sosial media, whatsapp, tiktok, landing page, email ataupun channel penjualan lainnya untuk menerima
                            order dan pembayaran
                        </p>

                        <Table>
                            <TableBody>
                                <TableRow>
                                    <TableCell>Status</TableCell>
                                    <TableCell>
                                        <Badge variant={webinar.status === 'active' ? 'default' : 'outline'} className="capitalize">
                                            {webinar.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Kategori</TableCell>
                                    <TableCell>{webinar.category?.name}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Nama Webinar</TableCell>
                                    <TableCell>{webinar.title}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Harga</TableCell>
                                    <TableCell>{webinar.price === 0 ? 'Gratis' : `Rp${webinar.price.toLocaleString('id-ID')}`}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Deskripsi</TableCell>
                                    <TableCell>
                                        <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: webinar.description ?? '-' }} />
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Benefit</TableCell>
                                    <TableCell>
                                        <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: webinar.benefits ?? '-' }} />
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Batch</TableCell>
                                    <TableCell>{webinar.batch ?? '-'}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Kuota</TableCell>
                                    <TableCell>{webinar.quota === 0 ? 'Tak terbatas' : webinar.quota}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Waktu Pelaksanaan</TableCell>
                                    <TableCell>
                                        {format(new Date(webinar.start_time), 'dd MMMM yyyy', { locale: id })}{' '}
                                        {format(new Date(webinar.start_time), 'HH:mm', { locale: id })} -{' '}
                                        {format(new Date(webinar.end_time), 'dd MMMM yyyy', { locale: id })}{' '}
                                        {format(new Date(webinar.end_time), 'HH:mm', { locale: id })}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Deadline Pendaftaran</TableCell>
                                    <TableCell>{format(new Date(webinar.registration_deadline), 'dd MMMM yyyy HH:mm', { locale: id })}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Instruksi Peserta</TableCell>
                                    <TableCell>{webinar.instructions ?? '-'}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Pemateri</TableCell>
                                    <TableCell>
                                        <div>{webinar.host_name ?? '-'}</div>
                                        <div className="text-muted-foreground text-xs">{webinar.host_description ?? ''}</div>
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                        <div>
                            <span className="font-semibold">Thumbnail:</span>
                            <img
                                src={webinar.thumbnail ? `/storage/${webinar.thumbnail}` : '/assets/images/placeholder.png'}
                                alt={webinar.title}
                                className="my-1 mt-2 h-40 w-64 rounded border object-cover"
                            />
                            {webinar.thumbnail ? <></> : <span className="text-muted-foreground text-sm">Thumbnail belum diunggah.</span>}
                        </div>
                    </div>
                    <div className="space-y-4 rounded-lg border p-4">
                        <h2 className="text-lg font-medium">Edit & Kustom</h2>
                        {(webinar.status === 'draft' || webinar.status === 'archived') && (
                            <Button asChild className="w-full hover:cursor-pointer">
                                <Link method="post" href={route('webinars.publish', { webinar: webinar.id })}>
                                    <Send />
                                    Terbitkan
                                </Link>
                            </Button>
                        )}
                        {webinar.status === 'published' && (
                            <Button asChild className="w-full hover:cursor-pointer">
                                <Link method="post" href={route('webinars.archive', { webinar: webinar.id })}>
                                    <CircleX />
                                    Tutup
                                </Link>
                            </Button>
                        )}
                        <Separator />
                        <div className="space-y-2">
                            <Button
                                asChild
                                className="w-full border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
                                variant="secondary"
                            >
                                <Link href={route('webinars.edit', { webinar: webinar.id })}>
                                    <SquarePen /> Edit
                                </Link>
                            </Button>
                            <Button
                                asChild
                                className="border-primary hover:bg-primary hover:text-secondary w-full border hover:cursor-pointer"
                                variant="secondary"
                            >
                                <Link method="post" href={route('webinars.duplicate', { webinar: webinar.id })}>
                                    <Copy /> Duplicate
                                </Link>
                            </Button>
                            <Button
                                asChild
                                className="border-destructive text-destructive hover:bg-destructive w-full border hover:cursor-pointer hover:text-white"
                                variant="secondary"
                                disabled={webinar.status === 'archived'}
                            >
                                <Link method="post" href={route('webinars.archive', { webinar: webinar.id })}>
                                    <CircleX /> Tutup
                                </Link>
                            </Button>
                            <Button asChild className="w-full hover:cursor-pointer" variant="destructive">
                                <Link method="delete" href={route('webinars.destroy', webinar.id)}>
                                    <Trash /> Hapus
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
                <div className="mt-4 rounded-lg border p-4">
                    <h3 className="text-muted-foreground text-center text-sm">
                        Dibuat pada : {format(new Date(webinar.created_at), 'dd MMMM yyyy HH:mm', { locale: id })}
                    </h3>
                </div>
            </div>
        </AdminLayout>
    );
}
