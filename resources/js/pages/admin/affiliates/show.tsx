import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminLayout from '@/layouts/admin-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { CirclePower, Edit, Trash } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Affiliate } from '../affiliates/columns';
import { Earning } from '../earnings/columns';
import EditAffiliate from './edit';
import AffiliateDetail from './show-details';
import AffiliateEarnings from './show-earnings';

interface Stats {
    total_products: number;
    total_commission: number;
    paid_commission: number;
    available_commission: number;
}

interface AffiliateProps {
    affiliate: Affiliate;
    earnings?: Earning[];
    stats: Stats;
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function ShowAffiliate({ affiliate, earnings, stats, flash }: AffiliateProps) {
    const [open, setOpen] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Afiliasi',
            href: route('affiliates.index'),
        },
        {
            title: affiliate.name,
            href: route('affiliates.show', { affiliate: affiliate.id }),
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
            <Head title={`Detail Afiliasi - ${affiliate.name}`} />
            <div className="px-4 py-4 md:px-6">
                <h1 className="mb-4 text-2xl font-semibold">{`Detail ${affiliate.name}`}</h1>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
                    <Tabs defaultValue="detail" className="lg:col-span-2">
                        <TabsList>
                            <TabsTrigger value="detail">Detail</TabsTrigger>
                            <TabsTrigger value="transaksi">Transaksi</TabsTrigger>
                        </TabsList>
                        <TabsContent value="detail">
                            <AffiliateDetail affiliate={affiliate} />
                        </TabsContent>
                        <TabsContent value="transaksi">
                            <AffiliateEarnings earnings={earnings ?? []} stats={stats} />
                        </TabsContent>
                    </Tabs>

                    <div>
                        <h2 className="my-2 text-lg font-medium">Edit & Kustom</h2>
                        <div className="space-y-4 rounded-lg border p-4">
                            <Button asChild className="w-full">
                                <Link method="post" href={route('affiliates.toggleStatus', { affiliate: affiliate.id })}>
                                    <CirclePower />
                                    {affiliate.affiliate_status === 'Active' ? <span>Non Aktifkan Afiliasi</span> : <span>Aktifkan Afiliasi</span>}
                                </Link>
                            </Button>
                            <Separator />
                            <div className="space-y-2">
                                <Dialog open={open} onOpenChange={setOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="w-full" variant="secondary">
                                            <Edit />
                                            Edit
                                        </Button>
                                    </DialogTrigger>
                                    <EditAffiliate affiliate={affiliate} setOpen={setOpen} />
                                </Dialog>
                                <Button asChild className="w-full" variant="destructive">
                                    <Link method="delete" href={route('affiliates.destroy', affiliate.id)}>
                                        <Trash /> Hapus
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-4 rounded-lg border p-4">
                    <h3 className="text-muted-foreground text-center text-sm">
                        Dibuat pada : {format(new Date(affiliate.created_at), 'dd MMMM yyyy HH:mm', { locale: id })}
                    </h3>
                </div>
            </div>
        </AdminLayout>
    );
}
