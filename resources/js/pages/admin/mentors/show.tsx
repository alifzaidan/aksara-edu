import DeleteConfirmDialog from '@/components/delete-dialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminLayout from '@/layouts/admin-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Edit, Trash } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Earning } from '../earnings/columns';
import { Mentor } from './columns';
import EditAffiliate from './edit';
import ShowArticles from './show-articles';
import ShowBootcamps from './show-bootcamps';
import ShowCourse from './show-courses';
import MentorDetail from './show-details';
import AffiliateEarnings from './show-earnings';
import ShowWebinars from './show-webinars';

interface Course {
    id: number;
    title: string;
    description: string;
    thumbnail: string | null;
    price: number;
    status: string;
    level: string;
    category: {
        name: string;
    };
    duration: number;
    students_count: number;
    created_at: string;
}

interface Article {
    id: number;
    title: string;
    slug: string;
    thumbnail: string | null;
    category: {
        name: string;
    };
    excerpt: string;
    status: string;
    views: number;
    read_time: number;
    is_featured: boolean;
    published_at: string | null;
    created_at: string;
}

interface Webinar {
    id: number;
    title: string;
    slug: string;
    thumbnail: string;
    category: {
        name: string;
    };
    price: number;
    discount_price: number | null;
    quota: number;
    status: string;
    start_time: string;
    batch: string;
}

interface Bootcamp {
    id: number;
    title: string;
    slug: string;
    thumbnail: string;
    category: {
        name: string;
    };
    price: number;
    discount_price: number | null;
    batch: string;
    status: string;
    start_date: string;
    end_date: string;
}

interface Stats {
    total_products: number;
    total_commission: number;
    paid_commission: number;
    available_commission: number;
}

interface MentorProps {
    mentor: Mentor;
    earnings?: Earning[];
    courses?: Course[];
    articles?: Article[];
    webinars?: Webinar[];
    bootcamps?: Bootcamp[];
    stats: Stats;
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function ShowMentor({ mentor, earnings, courses, articles, webinars, bootcamps, stats, flash }: MentorProps) {
    const [open, setOpen] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Mentor',
            href: route('mentors.index'),
        },
        {
            title: mentor.name,
            href: route('mentors.show', { mentor: mentor.id }),
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
        router.delete(route('mentors.destroy', mentor.id));
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`Detail Mentor - ${mentor.name}`} />
            <div className="px-4 py-4 md:px-6">
                <h1 className="mb-4 text-2xl font-semibold">{`Detail ${mentor.name}`}</h1>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
                    <Tabs defaultValue="detail" className="lg:col-span-2">
                        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
                            <TabsTrigger value="detail">Detail</TabsTrigger>
                            <TabsTrigger value="courses">
                                Kelas
                                {courses && courses.length > 0 && (
                                    <span className="bg-primary/10 ml-1 rounded-full px-2 py-0.5 text-xs">{courses.length}</span>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="bootcamps">
                                Bootcamp
                                {bootcamps && bootcamps.length > 0 && (
                                    <span className="bg-primary/10 ml-1 rounded-full px-2 py-0.5 text-xs">{bootcamps.length}</span>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="webinars">
                                Webinar
                                {webinars && webinars.length > 0 && (
                                    <span className="bg-primary/10 ml-1 rounded-full px-2 py-0.5 text-xs">{webinars.length}</span>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="articles">
                                Artikel
                                {articles && articles.length > 0 && (
                                    <span className="bg-primary/10 ml-1 rounded-full px-2 py-0.5 text-xs">{articles.length}</span>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="transaksi">
                                Transaksi
                                {earnings && earnings.length > 0 && (
                                    <span className="bg-primary/10 ml-1 rounded-full px-2 py-0.5 text-xs">{earnings.length}</span>
                                )}
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="detail">
                            <MentorDetail mentor={mentor} />
                        </TabsContent>
                        <TabsContent value="courses">
                            <ShowCourse courses={courses ?? []} />
                        </TabsContent>
                        <TabsContent value="bootcamps">
                            <ShowBootcamps bootcamps={bootcamps ?? []} />
                        </TabsContent>
                        <TabsContent value="webinars">
                            <ShowWebinars webinars={webinars ?? []} />
                        </TabsContent>
                        <TabsContent value="articles">
                            <ShowArticles articles={articles ?? []} />
                        </TabsContent>
                        <TabsContent value="transaksi">
                            <AffiliateEarnings earnings={earnings ?? []} stats={stats} />
                        </TabsContent>
                    </Tabs>

                    <div>
                        <h2 className="my-2 text-lg font-medium">Edit & Kustom</h2>
                        <div className="space-y-4 rounded-lg border p-4">
                            <div className="space-y-2">
                                <Dialog open={open} onOpenChange={setOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="w-full" variant="secondary">
                                            <Edit />
                                            Edit
                                        </Button>
                                    </DialogTrigger>
                                    <EditAffiliate mentor={mentor} setOpen={setOpen} />
                                </Dialog>
                                <DeleteConfirmDialog
                                    trigger={
                                        <Button variant="destructive" className="w-full">
                                            <Trash /> Hapus
                                        </Button>
                                    }
                                    title="Apakah Anda yakin ingin menghapus mentor ini?"
                                    itemName={mentor.name}
                                    onConfirm={handleDelete}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-4 rounded-lg border p-4">
                    <h3 className="text-muted-foreground text-center text-sm">
                        Dibuat pada : {format(new Date(mentor.created_at), 'dd MMMM yyyy HH:mm', { locale: id })}
                    </h3>
                </div>
            </div>
        </AdminLayout>
    );
}
