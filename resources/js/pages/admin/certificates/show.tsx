import DeleteConfirmDialog from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminLayout from '@/layouts/admin-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Download, Eye, SquarePen, Trash } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import CertificateDetail from './show-details';
import CertificateParticipants from './show-participants';

interface CertificateParticipant {
    id: string;
    certificate_id: string;
    user_id: string;
    certificate_number: number;
    certificate_code: string;
    created_at: string;
    updated_at: string;
    user: {
        id: string;
        name: string;
        email: string;
        phone_number?: string;
    };
}

interface Certificate {
    id: string;
    certificate_number: string;
    title: string;
    description?: string | null;
    header_top?: string | null;
    header_bottom?: string | null;
    issued_date?: string | null;
    period?: string | null;
    design?: { id: string; name: string; image_1: string };
    sign?: { id: string; name: string; image: string };
    course?: { id: string; title: string };
    bootcamp?: { id: string; title: string };
    webinar?: { id: string; title: string };
    participants?: CertificateParticipant[];
    created_at: string;
    updated_at: string;
}

interface CertificateProps {
    certificate: Certificate;
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function ShowCertificate({ certificate, flash }: CertificateProps) {
    const [isLoading, setIsLoading] = useState(true);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Sertifikat',
            href: route('certificates.index'),
        },
        {
            title: certificate.title,
            href: route('certificates.show', { certificate: certificate.id }),
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

    const handleDelete = () => {
        router.delete(route('certificates.destroy', certificate.id));
    };

    const handleIframeLoad = () => {
        setIsLoading(false);
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`Detail Sertifikat - ${certificate.title}`} />
            <div className="px-4 py-4 md:px-6">
                <h1 className="mb-4 text-2xl font-semibold">{`Detail Sertifikat: ${certificate.title}`}</h1>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
                    <Tabs defaultValue="detail" className="lg:col-span-2">
                        <TabsList>
                            <TabsTrigger value="detail">Detail</TabsTrigger>
                            <TabsTrigger value="participants">Peserta ({certificate.participants?.length || 0})</TabsTrigger>
                        </TabsList>
                        <TabsContent value="detail">
                            <CertificateDetail certificate={certificate} />
                        </TabsContent>
                        <TabsContent value="participants">
                            <CertificateParticipants participants={certificate.participants || []} />
                        </TabsContent>
                    </Tabs>

                    <div>
                        <h2 className="my-2 text-lg font-medium">Aksi & Kelola</h2>
                        <div className="space-y-4 rounded-lg border p-4">
                            <Button asChild className="w-full" variant="default">
                                <a href={route('certificates.download.all', { certificate: certificate.id })} target="_blank">
                                    <Download className="h-4 w-4" />
                                    Unduh Semua Sertifikat
                                </a>
                            </Button>

                            <Separator />

                            <div className="space-y-2">
                                <Button asChild className="w-full" variant="secondary">
                                    <Link href={route('certificates.edit', { certificate: certificate.id })}>
                                        <SquarePen className="h-4 w-4" />
                                        Edit Sertifikat
                                    </Link>
                                </Button>

                                <DeleteConfirmDialog
                                    trigger={
                                        <Button variant="destructive" className="w-full">
                                            <Trash className="h-4 w-4" />
                                            Hapus
                                        </Button>
                                    }
                                    title="Apakah Anda yakin ingin menghapus sertifikat ini?"
                                    itemName={certificate.title}
                                    onConfirm={handleDelete}
                                />
                            </div>
                        </div>

                        <div className="mt-4 space-y-4 rounded-lg border p-4">
                            <h2 className="text-lg font-medium">Preview Sertifikat</h2>
                            <div className="space-y-3">
                                <Button asChild className="w-full" variant="outline">
                                    <a href={route('certificates.preview', { certificate: certificate.id })} target="_blank">
                                        <Eye className="h-4 w-4" />
                                        Lihat Contoh Sertifikat
                                    </a>
                                </Button>

                                <div className="text-center">
                                    {isLoading && (
                                        <div className="space-y-3">
                                            <Skeleton className="h-[250px] w-full rounded-lg" />
                                            <div className="space-y-2">
                                                <Skeleton className="mx-auto h-3 w-3/4" />
                                                <Skeleton className="mx-auto h-3 w-1/2" />
                                            </div>
                                        </div>
                                    )}
                                    <iframe
                                        src={`${route('certificates.preview', { certificate: certificate.id })}#toolbar=0`}
                                        className={`h-[250px] w-full rounded-lg border ${isLoading ? 'absolute opacity-0' : 'opacity-100'}`}
                                        title="Preview Sertifikat"
                                        onLoad={handleIframeLoad}
                                    />
                                </div>

                                <p className={`text-center text-xs text-gray-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
                                    Preview menggunakan data dummy untuk tampilan. Data sebenarnya akan digunakan saat mengunduh sertifikat peserta.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-4 rounded-lg border p-4">
                    <h3 className="text-muted-foreground text-center text-sm">
                        Dibuat pada : {format(new Date(certificate.created_at), 'dd MMMM yyyy HH:mm', { locale: id })}
                    </h3>
                </div>
            </div>
        </AdminLayout>
    );
}
