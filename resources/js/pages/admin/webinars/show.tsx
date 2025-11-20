import DeleteConfirmDialog from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminLayout from '@/layouts/admin-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { AlertTriangle, Award, CircleX, Copy, Plus, Send, SquarePen, Trash } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { WebinarParticipant } from './columns-participants';
import { WebinarRating } from './columns-ratings';
import { Invoice } from './columns-transactions';
import AddRecordingDialog from './create-recording-url';
import WebinarDetail from './show-details';
import WebinarParticipantSection from './show-participants';
import WebinarRatingComponent from './show-ratings';
import WebinarTransaction from './show-transactions';

interface Webinar {
    id: string;
    title: string;
    category?: { name: string };
    tools?: { name: string; description?: string | null; icon: string | null }[];
    batch?: string | null;
    strikethrough_price: number;
    price: number;
    quota: number;
    start_time: string | Date;
    end_time: string | Date;
    registration_deadline: string | Date;
    status: string;
    webinar_url: string;
    registration_url: string;
    recording_url?: string | null;
    thumbnail?: string | null;
    description?: string | null;
    benefits?: string | null;
    group_url?: string | null;
    created_at: string | Date;
    user?: {
        id: string;
        name: string;
        bio?: string;
        avatar?: string;
    };
}

interface Certificate {
    id: string;
    certificate_number: string;
    title: string;
    course_id?: string;
    bootcamp_id?: string;
    webinar_id?: string;
    created_at: string;
    updated_at: string;
}

interface WebinarProps {
    webinar: Webinar;
    transactions: Invoice[];
    participants: WebinarParticipant[];
    ratings: WebinarRating[];
    averageRating: number;
    certificate?: Certificate | null;
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function ShowWebinar({ webinar, transactions, participants, ratings, averageRating, certificate, flash }: WebinarProps) {
    const { auth } = usePage<SharedData>().props;
    const role = auth.role[0];
    const isAffiliate = role === 'affiliate';

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

    const handleDelete = () => {
        router.delete(route('webinars.destroy', webinar.id));
    };

    const webinarEndTime = new Date(webinar.end_time);
    const isWebinarEnded = new Date() > webinarEndTime;
    const needsRecording = isWebinarEnded && !webinar.recording_url;

    const paidTransactions = transactions.filter((t) => t.status === 'paid');

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`Detail Webinar - ${webinar.title}`} />
            <div className="px-4 py-4 md:px-6">
                <h1 className="mb-4 text-2xl font-semibold">{`Detail ${webinar.title}`}</h1>

                {!isAffiliate && needsRecording && (
                    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-amber-800 dark:text-amber-200">Webinar Sudah Selesai - Rekaman Belum Diupload</h3>
                                <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                                    Webinar ini telah berakhir pada{' '}
                                    <span className="font-medium">{format(webinarEndTime, 'dd MMMM yyyy HH:mm', { locale: id })}</span>. Silakan
                                    upload link rekaman untuk memberikan akses kepada peserta yang telah terdaftar.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className={`${!isAffiliate ? 'lg:grid-cols-3' : ''} grid grid-cols-1 gap-4 lg:gap-6`}>
                    <Tabs defaultValue="detail" className="lg:col-span-2">
                        <TabsList>
                            <TabsTrigger value="detail">Detail</TabsTrigger>
                            {!isAffiliate && (
                                <>
                                    <TabsTrigger value="peserta">
                                        Peserta
                                        {participants.length > 0 && (
                                            <span className="bg-primary/10 ml-1 rounded-full px-2 py-0.5 text-xs">{participants.length}</span>
                                        )}
                                    </TabsTrigger>
                                    <TabsTrigger value="transaksi">
                                        Transaksi
                                        {transactions.length > 0 && (
                                            <span className="bg-primary/10 ml-1 rounded-full px-2 py-0.5 text-xs">{paidTransactions.length}</span>
                                        )}
                                    </TabsTrigger>
                                    <TabsTrigger value="rating">
                                        Rating & Ulasan
                                        {ratings.length > 0 && (
                                            <span className="bg-primary/10 ml-1 rounded-full px-2 py-0.5 text-xs">{ratings.length}</span>
                                        )}
                                    </TabsTrigger>
                                </>
                            )}
                        </TabsList>
                        <TabsContent value="detail">
                            <WebinarDetail webinar={webinar} />
                        </TabsContent>
                        <TabsContent value="peserta">
                            <WebinarParticipantSection participants={participants} />
                        </TabsContent>
                        <TabsContent value="transaksi">
                            <WebinarTransaction transactions={transactions} />
                        </TabsContent>
                        <TabsContent value="rating">
                            <WebinarRatingComponent ratings={ratings} averageRating={averageRating} />
                        </TabsContent>
                    </Tabs>

                    {/* Sidebar remains the same */}
                    {!isAffiliate && (
                        <div>
                            <h2 className="my-2 text-lg font-medium">Edit & Kustom</h2>
                            <div className="space-y-4 rounded-lg border p-4">
                                {(webinar.status === 'draft' || webinar.status === 'archived') && (
                                    <>
                                        {!certificate && (
                                            <div className="mb-4 rounded-lg bg-red-50 p-3 text-center text-sm text-red-700">
                                                Sertifikat belum dibuat. Silakan buat sertifikat terlebih dahulu sebelum menerbitkan webinar.
                                            </div>
                                        )}
                                        <Button asChild className="w-full" disabled={!certificate}>
                                            <Link method="post" href={route('webinars.publish', { webinar: webinar.id })}>
                                                <Send />
                                                Terbitkan
                                            </Link>
                                        </Button>
                                    </>
                                )}
                                {webinar.status === 'published' && (
                                    <Button asChild className="w-full">
                                        <Link method="post" href={route('webinars.archive', { webinar: webinar.id })}>
                                            <CircleX />
                                            Tutup
                                        </Link>
                                    </Button>
                                )}
                                <Separator />
                                <div className="space-y-2">
                                    <Button asChild className="w-full" variant="secondary">
                                        <Link href={route('webinars.edit', { webinar: webinar.id })}>
                                            <SquarePen /> Edit
                                        </Link>
                                    </Button>
                                    <Button asChild className="w-full" variant="secondary">
                                        <Link method="post" href={route('webinars.duplicate', { webinar: webinar.id })}>
                                            <Copy /> Duplicate
                                        </Link>
                                    </Button>
                                    <Button asChild className="w-full" variant="secondary" disabled={webinar.status === 'archived'}>
                                        <Link method="post" href={route('webinars.archive', { webinar: webinar.id })}>
                                            <CircleX /> Tutup
                                        </Link>
                                    </Button>
                                    <DeleteConfirmDialog
                                        trigger={
                                            <Button variant="destructive" className="w-full">
                                                <Trash /> Hapus
                                            </Button>
                                        }
                                        title="Apakah Anda yakin ingin menghapus webinar ini?"
                                        itemName={webinar.title}
                                        onConfirm={handleDelete}
                                    />
                                </div>
                                <Separator />
                                <AddRecordingDialog webinarId={webinar.id} currentRecordingUrl={webinar.recording_url} />

                                <Separator />
                                {certificate ? (
                                    <Button asChild className="w-full" variant="outline">
                                        <Link href={route('certificates.show', { certificate: certificate.id })}>
                                            <Award />
                                            Lihat Data Sertifikat
                                        </Link>
                                    </Button>
                                ) : (
                                    <Button asChild className="w-full" variant="outline">
                                        <Link
                                            href={route('certificates.create', {
                                                program_type: 'webinar',
                                                webinar_id: webinar.id,
                                            })}
                                        >
                                            <Plus />
                                            Buat Sertifikat
                                        </Link>
                                    </Button>
                                )}
                            </div>
                            <div className="mt-4 space-y-4 rounded-lg border p-4">
                                <h3 className="text-sm font-medium">Informasi Sertifikat</h3>
                                {certificate ? (
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Status:</span>
                                            <span className="flex items-center gap-1 text-green-600">
                                                <Award className="h-3 w-3" />
                                                Tersedia
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Judul:</span>
                                            <span className="text-right font-medium">{certificate.title}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Nomor:</span>
                                            <code className="rounded bg-gray-100 px-1 py-0.5 text-right text-xs">
                                                {certificate.certificate_number}
                                            </code>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Dibuat:</span>
                                            <span className="text-right text-xs">
                                                {format(new Date(certificate.created_at), 'dd MMM yyyy', { locale: id })}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-muted-foreground text-center text-sm">
                                        <Award className="mx-auto mb-2 h-8 w-8 opacity-50" />
                                        <p>Belum ada sertifikat untuk webinar ini.</p>
                                        <p className="mt-1 text-xs">
                                            Buat sertifikat untuk memberikan penghargaan kepada peserta yang mengikuti webinar.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
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
