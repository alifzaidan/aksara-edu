import DeleteConfirmDialog from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminLayout from '@/layouts/admin-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Award, CircleX, Copy, Plus, Send, SquarePen, Trash } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { CourseRating } from './columns-ratings';
import { Invoice } from './columns-transactions';
import CourseDetail from './show-details';
import ShowModules from './show-modules';
import CourseRatingComponent from './show-ratings';
import CourseTransaction from './show-transactions';

interface Course {
    id: string;
    title: string;
    category?: { name: string };
    tools?: { name: string; description?: string | null; icon: string | null }[];
    images?: { image_url: string }[];
    short_description?: string | null;
    description?: string | null;
    key_points?: string | null;
    strikethrough_price: number;
    price: number;
    thumbnail?: string | null;
    course_url: string;
    registration_url: string;
    status: string;
    level: string;
    created_at: string | Date;
    modules?: {
        title: string;
        description?: string | null;
        lessons?: {
            title: string;
            description?: string | null;
            type: 'text' | 'video' | 'file' | 'quiz';
            attachment?: string | null;
            video_url?: string | null;
            is_free?: boolean;
        }[];
    }[];
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

interface CourseProps {
    course: Course;
    transactions: Invoice[];
    ratings: CourseRating[];
    certificate?: Certificate | null;
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function ShowCourse({ course, transactions, ratings, certificate, flash }: CourseProps) {
    const { auth } = usePage<SharedData>().props;
    const role = auth.role[0];
    const isAdmin = role === 'admin';
    const isMentor = role === 'mentor';
    const isAffiliate = role === 'affiliate';

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Kelas Online',
            href: route('courses.index'),
        },
        {
            title: course.title,
            href: route('courses.show', { course: course.id }),
        },
    ];

    const approvedRatings = ratings.filter((rating) => rating.status === 'approved');
    const averageRating = approvedRatings.length > 0 ? approvedRatings.reduce((sum, rating) => sum + rating.rating, 0) / approvedRatings.length : 0;

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const handleDelete = () => {
        router.delete(route('courses.destroy', course.id));
    };

    const canPublish = () => {
        if (isAdmin) {
            return !!certificate;
        }
        return course.status !== 'draft';
    };

    const renderPublishMessage = () => {
        if (course.status === 'draft') {
            if (isMentor) {
                return (
                    <div className="mb-4 rounded-lg bg-blue-50 p-3 text-center text-sm text-blue-700">
                        Silakan tunggu admin untuk mempublikasikan kelas Anda.
                    </div>
                );
            } else if (isAdmin && !certificate) {
                return (
                    <div className="mb-4 rounded-lg bg-red-50 p-3 text-center text-sm text-red-700">
                        Sertifikat belum dibuat. Silakan buat sertifikat terlebih dahulu sebelum menerbitkan kelas.
                    </div>
                );
            }
        }
        return null;
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`Detail Course - ${course.title}`} />
            <div className="px-4 py-4 md:px-6">
                <h1 className="mb-4 text-2xl font-semibold">{`Detail ${course.title}`}</h1>

                <div className={`${!isAffiliate ? 'lg:grid-cols-3' : ''} grid grid-cols-1 gap-4 lg:gap-6`}>
                    <Tabs defaultValue="detail" className="lg:col-span-2">
                        <TabsList>
                            <TabsTrigger value="detail">Detail</TabsTrigger>
                            {!isAffiliate && (
                                <TabsTrigger value="transaksi">
                                    Transaksi
                                    {transactions.length > 0 && (
                                        <span className="bg-primary/10 ml-1 rounded-full px-2 py-0.5 text-xs">{transactions.length}</span>
                                    )}
                                </TabsTrigger>
                            )}
                            {isAdmin && (
                                <TabsTrigger value="rating">
                                    Rating
                                    {ratings.length > 0 && (
                                        <span className="ml-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800">{ratings.length}</span>
                                    )}
                                    {ratings.filter((r) => r.status === 'pending').length > 0 && (
                                        <span className="ml-1 rounded-full bg-red-500 px-1.5 py-0.5 text-xs text-white">
                                            {ratings.filter((r) => r.status === 'pending').length}
                                        </span>
                                    )}
                                </TabsTrigger>
                            )}
                        </TabsList>
                        <TabsContent value="detail">
                            <CourseDetail course={course} averageRating={averageRating} />
                            <ShowModules modules={course.modules} courseId={course.id} />
                        </TabsContent>
                        <TabsContent value="transaksi">
                            <CourseTransaction transactions={transactions} />
                        </TabsContent>
                        {isAdmin && (
                            <TabsContent value="rating">
                                <CourseRatingComponent ratings={ratings} averageRating={averageRating} />
                            </TabsContent>
                        )}
                    </Tabs>

                    {!isAffiliate && (
                        <div>
                            <h2 className="my-2 text-lg font-medium">Edit & Kustom</h2>
                            <div className="space-y-4 rounded-lg border p-4">
                                {(course.status === 'draft' || course.status === 'archived') && (
                                    <>
                                        {renderPublishMessage()}
                                        <Button asChild className="w-full" disabled={!canPublish()}>
                                            <Link method="post" href={route('courses.publish', { course: course.id })}>
                                                <Send />
                                                {course.status === 'draft' ? 'Terbitkan' : 'Aktifkan Kembali'}
                                            </Link>
                                        </Button>
                                    </>
                                )}
                                {course.status === 'published' && (
                                    <Button asChild className="w-full">
                                        <Link method="post" href={route('courses.archive', { course: course.id })}>
                                            <CircleX />
                                            Arsipkan
                                        </Link>
                                    </Button>
                                )}
                                <Separator />
                                <div className="space-y-2">
                                    <Button asChild className="w-full" variant="secondary">
                                        <Link href={route('courses.edit', { course: course.id })}>
                                            <SquarePen /> Edit Kelas
                                        </Link>
                                    </Button>
                                    <Button asChild className="w-full" variant="secondary">
                                        <Link method="post" href={route('courses.duplicate', { course: course.id })}>
                                            <Copy /> Duplicate
                                        </Link>
                                    </Button>
                                    <Button asChild className="w-full" variant="secondary" disabled={course.status === 'archived'}>
                                        <Link method="post" href={route('courses.archive', { course: course.id })}>
                                            <CircleX /> Arsipkan
                                        </Link>
                                    </Button>
                                    <DeleteConfirmDialog
                                        trigger={
                                            <Button variant="destructive" className="w-full">
                                                <Trash /> Hapus
                                            </Button>
                                        }
                                        title="Apakah Anda yakin ingin menghapus kelas ini?"
                                        itemName={course.title}
                                        onConfirm={handleDelete}
                                    />
                                </div>
                                {isAdmin && (
                                    <>
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
                                                        program_type: 'course',
                                                        course_id: course.id,
                                                    })}
                                                >
                                                    <Plus />
                                                    Buat Sertifikat
                                                </Link>
                                            </Button>
                                        )}
                                    </>
                                )}
                            </div>

                            {isAdmin && (
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
                                            <p>Belum ada sertifikat untuk kelas ini.</p>
                                            <p className="mt-1 text-xs">
                                                Buat sertifikat untuk memberikan penghargaan kepada peserta yang menyelesaikan kelas.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div className="mt-4 rounded-lg border p-4">
                    <h3 className="text-muted-foreground text-center text-sm">
                        Dibuat pada : {format(new Date(course.created_at), 'dd MMMM yyyy HH:mm', { locale: id })}
                    </h3>
                </div>
            </div>
        </AdminLayout>
    );
}
