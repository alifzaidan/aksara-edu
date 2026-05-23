import { Button } from '@/components/ui/button';
import AdminLayout from '@/layouts/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Megaphone, Plus } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Broadcast, columns } from './columns';
import { DataTable } from './data-table';

interface Props {
    broadcasts: Broadcast[];
    flash?: { success?: string; error?: string };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Pengguna', href: '/admin/users' },
    { title: 'Broadcast', href: '/admin/broadcasts' },
];

export default function BroadcastIndex({ broadcasts, flash }: Props) {
    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Broadcast" />
            <div className="px-4 py-4 md:px-6">
                <div className="mb-6 flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold">Broadcast</h1>
                        <p className="text-muted-foreground text-sm">Kelola template pesan broadcast WhatsApp.</p>
                    </div>
                    <Button asChild className="hover:cursor-pointer">
                        <Link href={route('broadcasts.create')}>
                            <Plus className="mr-1 h-4 w-4" /> Buat Broadcast
                        </Link>
                    </Button>
                </div>

                {broadcasts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-16">
                        <Megaphone className="text-muted-foreground mb-4 h-12 w-12" />
                        <p className="text-muted-foreground mb-2 text-sm">Belum ada template broadcast.</p>
                        <Button asChild size="sm" variant="outline">
                            <Link href={route('broadcasts.create')}>
                                <Plus className="mr-1 h-3 w-3" /> Buat Template Pertama
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <DataTable columns={columns} data={broadcasts} />
                )}
            </div>
        </AdminLayout>
    );
}
