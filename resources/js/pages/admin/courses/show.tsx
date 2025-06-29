import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminLayout from '@/layouts/admin-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { CircleX, Copy, Send, SquarePen, Trash } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Invoice } from './columns-transactions';
import CourseDetail from './show-details';
import ShowModules from './show-modules';
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

interface CourseProps {
    course: Course;
    transactions: Invoice[];
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function ShowCourse({ course, transactions, flash }: CourseProps) {
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
            <Head title={`Detail Course - ${course.title}`} />
            <div className="px-4 py-4 md:px-6">
                <h1 className="mb-4 text-2xl font-semibold">{`Detail ${course.title}`}</h1>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
                    <Tabs defaultValue="detail" className="lg:col-span-2">
                        <TabsList>
                            <TabsTrigger value="detail">Detail</TabsTrigger>
                            <TabsTrigger value="transaksi">Transaksi</TabsTrigger>
                        </TabsList>
                        <TabsContent value="detail">
                            <CourseDetail course={course} />
                            <ShowModules modules={course.modules} courseId={course.id} />
                        </TabsContent>
                        <TabsContent value="transaksi">
                            <CourseTransaction transactions={transactions} />
                        </TabsContent>
                    </Tabs>

                    <div>
                        <h2 className="my-2 text-lg font-medium">Edit & Kustom</h2>
                        <div className="space-y-4 rounded-lg border p-4">
                            {(course.status === 'draft' || course.status === 'archived') && (
                                <Button asChild className="w-full">
                                    <Link method="post" href={route('courses.publish', { course: course.id })}>
                                        <Send />
                                        Terbitkan
                                    </Link>
                                </Button>
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
                                <Button asChild className="w-full" variant="destructive">
                                    <Link method="delete" href={route('courses.destroy', course.id)}>
                                        <Trash /> Hapus
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
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
