import DeleteConfirmDialog from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminLayout from '@/layouts/admin-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Award, CircleX, Copy, EyeOff, Plus, Send, SquarePen, Trash } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Participant } from './columns-participants';
import { BootcampRating } from './columns-ratings';
import { Invoice } from './columns-transactions';
import BootcampDetail from './show-details';
import BootcampParticipant from './show-participants';
import BootcampRatingComponent from './show-ratings';
import BootcampTransaction from './show-transactions';

interface BootcampSchedule {
    id: string;
    schedule_date: string;
    day: string;
    start_time: string;
    end_time: string;
    recording_url?: string | null;
}

interface Bootcamp {
    id: string;
    title: string;
    category?: { name: string };
    schedules?: BootcampSchedule[];
    tools?: { name: string; description?: string | null; icon: string | null }[];
    batch?: string | null;
    strikethrough_price: number;
    price: number;
    quota: number;
    start_date: string | Date;
    end_date: string | Date;
    registration_deadline: string | Date;
    status: string;
    bootcamp_url: string;
    registration_url: string;
    thumbnail?: string | null;
    description?: string | null;
    benefits?: string | null;
    group_url?: string | null;
    requirements?: string | null;
    curriculum?: string | null;
    user?: {
        id: string;
        name: string;
        bio?: string;
        avatar?: string;
    };
    has_submission_link?: boolean;
    created_at: string | Date;
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

interface BootcampProps {
    bootcamp: Bootcamp;
    transactions: Invoice[];
    participants: Participant[];
    ratings: BootcampRating[];
    averageRating: number;
    certificate?: Certificate | null;
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function ShowBootcamp({ bootcamp, transactions, participants, ratings, averageRating, certificate, flash }: BootcampProps) {
    const { auth } = usePage<SharedData>().props;
    const role = auth.role[0];
    const isAffiliate = role === 'affiliate';

    const totalSchedules = bootcamp.schedules?.length || 0;
    const paidTransactions = transactions.filter((t) => t.status === 'paid');

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Bootcamp',
            href: route('bootcamps.index'),
        },
        {
            title: bootcamp.title,
            href: route('bootcamps.show', { bootcamp: bootcamp.id }),
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
        router.delete(route('bootcamps.destroy', bootcamp.id));
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`Detail Bootcamp - ${bootcamp.title}`} />
            <div className="px-4 py-4 md:px-6">
                <h1 className="mb-4 text-2xl font-semibold">{`Detail ${bootcamp.title}`}</h1>
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
                        <TabsContent value="peserta">
                            <BootcampParticipant participants={participants} totalSchedules={totalSchedules} />
                        </TabsContent>
                        <TabsContent value="detail">
                            <BootcampDetail bootcamp={bootcamp} />
                        </TabsContent>
                        <TabsContent value="transaksi">
                            <BootcampTransaction transactions={transactions} />
                        </TabsContent>
                        <TabsContent value="rating">
                            <BootcampRatingComponent ratings={ratings} averageRating={averageRating} />
                        </TabsContent>
                    </Tabs>

                    {!isAffiliate && (
                        <div>
                            <h2 className="my-2 text-lg font-medium">Edit & Kustom</h2>
                            <div className="space-y-4 rounded-lg border p-4">
                                {(bootcamp.status === 'draft' || bootcamp.status === 'archived' || bootcamp.status === 'hidden') && (
                                    <>
                                        {!certificate && (
                                            <div className="mb-4 rounded-lg bg-red-50 p-3 text-center text-sm text-red-700">
                                                Sertifikat belum dibuat. Silakan buat sertifikat terlebih dahulu sebelum menerbitkan bootcamp.
                                            </div>
                                        )}
                                        <Button asChild className="w-full" disabled={!certificate}>
                                            <Link method="post" href={route('bootcamps.publish', { bootcamp: bootcamp.id })}>
                                                <Send />
                                                Terbitkan
                                            </Link>
                                        </Button>
                                    </>
                                )}
                                {bootcamp.status === 'published' && (
                                    <Button asChild className="w-full">
                                        <Link method="post" href={route('bootcamps.hidden', { bootcamp: bootcamp.id })}>
                                            <EyeOff />
                                            Sembunyikan
                                        </Link>
                                    </Button>
                                )}
                                {(bootcamp.status === 'published' || bootcamp.status === 'hidden') && (
                                    <Button asChild className="w-full">
                                        <Link method="post" href={route('bootcamps.archive', { bootcamp: bootcamp.id })}>
                                            <CircleX />
                                            Tutup
                                        </Link>
                                    </Button>
                                )}
                                <Separator />
                                <div className="space-y-2">
                                    <Button asChild className="w-full" variant="secondary">
                                        <Link href={route('bootcamps.edit', { bootcamp: bootcamp.id })}>
                                            <SquarePen /> Edit
                                        </Link>
                                    </Button>
                                    <Button asChild className="w-full" variant="secondary">
                                        <Link method="post" href={route('bootcamps.duplicate', { bootcamp: bootcamp.id })}>
                                            <Copy /> Duplicate
                                        </Link>
                                    </Button>
                                    <Button asChild className="w-full" variant="secondary" disabled={bootcamp.status === 'archived'}>
                                        <Link method="post" href={route('bootcamps.archive', { bootcamp: bootcamp.id })}>
                                            <CircleX /> Tutup
                                        </Link>
                                    </Button>
                                    <DeleteConfirmDialog
                                        trigger={
                                            <Button variant="destructive" className="w-full">
                                                <Trash /> Hapus
                                            </Button>
                                        }
                                        title="Apakah Anda yakin ingin menghapus bootcamp ini?"
                                        itemName={bootcamp.title}
                                        onConfirm={handleDelete}
                                    />
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
                                                    program_type: 'bootcamp',
                                                    bootcamp_id: bootcamp.id,
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
                                            <p>Belum ada sertifikat untuk bootcamp ini.</p>
                                            <p className="mt-1 text-xs">
                                                Buat sertifikat untuk memberikan penghargaan kepada peserta yang menyelesaikan bootcamp.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="mt-4 rounded-lg border p-4">
                    <h3 className="text-muted-foreground text-center text-sm">
                        Dibuat pada : {format(new Date(bootcamp.created_at), 'dd MMMM yyyy HH:mm', { locale: id })}
                    </h3>
                </div>
            </div>
        </AdminLayout>
    );
}
