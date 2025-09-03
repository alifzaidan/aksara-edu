import { Button } from '@/components/ui/button';
import AdminLayout from '@/layouts/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getColumns, Promotion } from './columns';
import CreatePromotionModal from './create';
import { DataTable } from './data-table';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/admin/dashboard',
    },
    {
        title: 'Flyer Promosi',
        href: '/admin/promotions',
    },
];

interface PromotionsProps {
    promotions: Promotion[];
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function Promotions({ promotions, flash }: any) {
    const [createModalOpen, setCreateModalOpen] = useState(false);
    
    // Generate columns with promotions data
    const columns = getColumns(promotions);

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
            <Head title="Flyer Promosi" />
            <div className="px-4 py-4 md:px-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold">Flyer Promosi</h1>
                        <p className="text-muted-foreground text-sm">Kelola flyer promosi untuk produk Anda.</p>
                    </div>
                    <Button className="hover:cursor-pointer" onClick={() => setCreateModalOpen(true)}>
                        Tambah Flyer
                        <Plus />
                    </Button>
                </div>
                <DataTable columns={columns} data={promotions} />
                
                <CreatePromotionModal 
                    open={createModalOpen} 
                    onOpenChange={setCreateModalOpen} 
                    promotions={promotions}
                />
            </div>
        </AdminLayout>
    );
}