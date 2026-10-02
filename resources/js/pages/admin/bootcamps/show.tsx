import { Badge } from '@/components/ui/badge';
import DeleteConfirmDialog from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminLayout from '@/layouts/admin-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
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
import { usePermission } from '@/hooks/use-permission';

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
    has_certificate?: boolean;
    requires_review?: boolean;
    next_step_type?: string | null;
    next_step_id?: string | null;
    next_step_product?: {
        id: string;
        title: string;
        slug: string;
        batch?: string | null;
        thumbnail?: string | null;
        price: number;
        strikethrough_price: number;
        type: string;
        type_label: string;
        url?: string | null;
        admin_url?: string | null;
    } | null;
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
    const { canManage, canView, roles } = usePermission();
    const isAffiliate = roles.includes('affiliate');
    const canManageBootcamps = canManage('bootcamps');
    const canViewTransactions = canView('transactions') || canManageBootcamps;

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

    const certificateRequired = bootcamp.has_certificate !== false && (bootcamp.has_certificate as any) !== 0;
    const canPublish = !certificateRequired || Boolean(certificate);

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
                                    {canViewTransactions && (
                                        <TabsTrigger value="transaksi">
                                            Transaksi
                                            {transactions.length > 0 && (
                                                <span className="bg-primary/10 ml-1 rounded-full px-2 py-0.5 text-xs">{paidTransactions.length}</span>
                                            )}
                                        </TabsTrigger>
                                    )}
                                    {canManageBootcamps && (
                                        <TabsTrigger value="rating">
                                            Rating & Ulasan
                                            {ratings.length > 0 && (
                                                <span className="bg-primary/10 ml-1 rounded-full px-2 py-0.5 text-xs">{ratings.length}</span>
                                            )}
                                        </TabsTrigger>
                                    )}
                                </>
                            )}
                        </TabsList>
                        <TabsContent value="peserta">
                            <BootcampParticipant participants={participants} totalSchedules={totalSchedules} />
                        </TabsContent>
                        <TabsContent value="detail">
                            <BootcampDetail bootcamp={bootcamp} />
                        </TabsContent>
                        {canViewTransactions && (
                            <TabsContent value="transaksi">
                                <BootcampTransaction transactions={transactions} bootcampId={bootcamp.id} />
                            </TabsContent>
                        )}
                        {canManageBootcamps && (
                            <TabsContent value="rating">
                                <BootcampRatingComponent ratings={ratings} averageRating={averageRating} />
                            </TabsContent>
                        )}
                    </Tabs>

                    {canManageBootcamps && (
                        <div>
                            <h2 className="my-2 text-lg font-medium">Edit & Kustom</h2>
                            <div className="space-y-4 rounded-lg border p-4">
                                {(bootcamp.status === 'draft' || bootcamp.status === 'archived' || bootcamp.status === 'hidden') && (
                                    <>
                                        {certificateRequired && !certificate && (
                                            <div className="mb-4 rounded-lg bg-red-50 p-3 text-center text-sm text-red-700">
                                                Sertifikat belum dibuat. Silakan buat sertifikat terlebih dahulu sebelum menerbitkan bootcamp.
                                            </div>
                                        )}
                                        {canPublish ? (
                                            <Button asChild className="w-full">
                                                <Link method="post" href={route('bootcamps.publish', { bootcamp: bootcamp.id })}>
                                                    <Send />
                                                    Terbitkan
                                                </Link>
                                            </Button>
                                        ) : (
                                            <Button disabled className="w-full">
                                                <Send />
                                                Terbitkan
                                            </Button>
                                        )}
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
                                    {certificateRequired ? (
                                        certificate ? (
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
                                        )
                                    ) : (
                                        <div className="rounded-md border border-dashed p-2.5 text-center text-xs text-muted-foreground">
                                            Bootcamp ini diatur tanpa sertifikat
                                        </div>
                                    )}
                                </div>
                                <div className="mt-4 space-y-4 rounded-lg border p-4">
                                    <h3 className="text-sm font-medium">Informasi Sertifikat & Pelatihan</h3>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Sertifikat:</span>
                                            {certificateRequired ? (
                                                certificate ? (
                                                    <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700 flex items-center gap-1">
                                                        <Award className="h-3 w-3" />
                                                        Tersedia
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                                                        Belum Dibuat
                                                    </Badge>
                                                )
                                            ) : (
                                                <Badge variant="secondary" className="text-xs">
                                                    Tanpa Sertifikat
                                                </Badge>
                                            )}
                                        </div>

                                        {certificateRequired && certificate && (
                                            <>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-muted-foreground">Judul Sertifikat:</span>
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
                                            </>
                                        )}

                                        <Separator />

                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Review & Absensi:</span>
                                            {!certificateRequired || bootcamp.requires_review === false ? (
                                                <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-700 text-xs">
                                                    Tanpa Review (Otomatis)
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 text-xs">
                                                    Wajib Review & Absensi
                                                </Badge>
                                            )}
                                        </div>

                                        {bootcamp.next_step_product && (
                                            <div className="pt-2">
                                                <span className="text-xs text-muted-foreground block mb-1.5">Langkah Pelatihan Selanjutnya:</span>
                                                <div className="rounded-lg border bg-muted/40 p-2.5 text-xs">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <Badge variant="secondary" className="text-[10px] uppercase font-semibold">
                                                            {bootcamp.next_step_product.type_label}
                                                        </Badge>
                                                        {bootcamp.next_step_product.batch && (
                                                            <span className="text-muted-foreground text-[11px]">
                                                                Batch {bootcamp.next_step_product.batch}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="font-medium text-foreground line-clamp-2">
                                                        {bootcamp.next_step_product.title}
                                                    </div>
                                                    {bootcamp.next_step_product.admin_url && (
                                                        <div className="mt-2 text-right">
                                                            <Link
                                                                href={bootcamp.next_step_product.admin_url}
                                                                className="text-primary hover:underline text-[11px] inline-flex items-center gap-0.5"
                                                            >
                                                                Lihat Program →
                                                            </Link>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
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
