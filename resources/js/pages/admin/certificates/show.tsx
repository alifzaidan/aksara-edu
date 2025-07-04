import DeleteConfirmDialog from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminLayout from '@/layouts/admin-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Download, SquarePen, Trash } from 'lucide-react';
import { useEffect } from 'react';
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
                                <Link href="#">
                                    <Download className="h-4 w-4" />
                                    Unduh Semua Sertifikat
                                </Link>
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
                            <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-12">
                                <div className="text-center">
                                    <div className="mb-2 text-gray-400">
                                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1}
                                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            />
                                        </svg>
                                    </div>
                                    <h3 className="text-sm font-medium text-gray-900">Preview Sertifikat</h3>
                                    <p className="text-sm text-gray-500">Preview sertifikat akan ditampilkan di sini setelah template dibuat</p>
                                </div>
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
