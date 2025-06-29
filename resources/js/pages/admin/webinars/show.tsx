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
import AddRecordingDialog from './create-recording-url';
import WebinarDetail from './show-details';
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
    host_name?: string | null;
    host_description?: string | null;
    created_at: string | Date;
}

interface WebinarProps {
    webinar: Webinar;
    transactions: Invoice[];
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function ShowWebinar({ webinar, transactions, flash }: WebinarProps) {
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
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
                    <Tabs defaultValue="detail" className="lg:col-span-2">
                        <TabsList>
                            <TabsTrigger value="detail">Detail</TabsTrigger>
                            <TabsTrigger value="transaksi">Transaksi</TabsTrigger>
                        </TabsList>
                        <TabsContent value="detail">
                            <WebinarDetail webinar={webinar} />
                        </TabsContent>
                        <TabsContent value="transaksi">
                            <WebinarTransaction transactions={transactions} />
                        </TabsContent>
                    </Tabs>

                    <div>
                        <h2 className="my-2 text-lg font-medium">Edit & Kustom</h2>
                        <div className="space-y-4 rounded-lg border p-4">
                            {(webinar.status === 'draft' || webinar.status === 'archived') && (
                                <Button asChild className="w-full">
                                    <Link method="post" href={route('webinars.publish', { webinar: webinar.id })}>
                                        <Send />
                                        Terbitkan
                                    </Link>
                                </Button>
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
                                <Button asChild className="w-full" variant="destructive">
                                    <Link method="delete" href={route('webinars.destroy', webinar.id)}>
                                        <Trash /> Hapus
                                    </Link>
                                </Button>
                            </div>
                            <Separator />
                            <AddRecordingDialog webinarId={webinar.id} currentRecordingUrl={webinar.recording_url} />
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
