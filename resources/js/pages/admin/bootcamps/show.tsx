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
import BootcampDetail from './show-details';
import BootcampTransaction from './show-transactions';

interface Bootcamp {
    id: string;
    title: string;
    category?: { name: string };
    schedules?: { day: string; start_time: string; end_time: string }[];
    tools?: { name: string; description?: string | null; icon: string | null }[];
    batch?: string | null;
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
    host_name?: string | null;
    host_description?: string | null;
    created_at: string | Date;
}

interface BootcampProps {
    bootcamp: Bootcamp;
    transactions: Invoice[];
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function ShowBootcamp({ bootcamp, transactions, flash }: BootcampProps) {
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

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`Detail Bootcamp - ${bootcamp.title}`} />
            <div className="px-4 py-4 md:px-6">
                <h1 className="mb-4 text-2xl font-semibold">{`Detail ${bootcamp.title}`}</h1>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
                    <Tabs defaultValue="detail" className="lg:col-span-2">
                        <TabsList>
                            <TabsTrigger value="detail">Detail</TabsTrigger>
                            <TabsTrigger value="transaksi">Transaksi</TabsTrigger>
                        </TabsList>
                        <TabsContent value="detail">
                            <BootcampDetail bootcamp={bootcamp} />
                        </TabsContent>
                        <TabsContent value="transaksi">
                            <BootcampTransaction transactions={transactions} />
                        </TabsContent>
                    </Tabs>

                    <div>
                        <h2 className="my-2 text-lg font-medium">Edit & Kustom</h2>
                        <div className="space-y-4 rounded-lg border p-4">
                            {(bootcamp.status === 'draft' || bootcamp.status === 'archived') && (
                                <Button asChild className="w-full">
                                    <Link method="post" href={route('bootcamps.publish', { bootcamp: bootcamp.id })}>
                                        <Send />
                                        Terbitkan
                                    </Link>
                                </Button>
                            )}
                            {bootcamp.status === 'published' && (
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
                                <Button asChild className="w-full" variant="destructive">
                                    <Link method="delete" href={route('bootcamps.destroy', bootcamp.id)}>
                                        <Trash /> Hapus
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
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
