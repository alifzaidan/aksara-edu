import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { router } from '@inertiajs/react';
import { Edit, Power, PowerOff, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import EditPromotionModal from './edit';

interface Promotion {
    id: string;
    promotion_flyer: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
    url_redirect: string;
}

interface ActionCellProps {
    promotion: Promotion;
    promotions: Promotion[];
}

export default function ActionCell({ promotion, promotions }: ActionCellProps) {
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [toggleLoading, setToggleLoading] = useState(false);

    const hasActivePromotion = promotions.some((p) => p.is_active && p.id !== promotion.id);

    const handleDelete = () => {
        setDeleteLoading(true);

        router.delete(route('promotions.destroy', promotion.id), {
            onSuccess: () => {
                toast.success('Flyer promosi berhasil dihapus');
                setDeleteLoading(false);
            },
            onError: () => {
                toast.error('Gagal menghapus flyer promosi');
                setDeleteLoading(false);
            },
        });
    };

    const handleToggleStatus = () => {
        if (!promotion.is_active && hasActivePromotion) {
            toast.error('Hanya boleh ada satu flyer promosi yang aktif. Nonaktifkan flyer yang aktif terlebih dahulu.');
            return;
        }

        setToggleLoading(true);

        router.patch(
            route('promotions.toggle-status', promotion.id),
            {},
            {
                onSuccess: () => {
                    const status = promotion.is_active ? 'dinonaktifkan' : 'diaktifkan';
                    toast.success(`Flyer promosi berhasil ${status}`);
                    setToggleLoading(false);
                },
                onError: () => {
                    toast.error('Gagal mengubah status flyer promosi');
                    setToggleLoading(false);
                },
            },
        );
    };

    return (
        <div className="flex items-center gap-1">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleToggleStatus}
                        disabled={toggleLoading || (!promotion.is_active && hasActivePromotion)}
                        className={`h-8 px-2 ${
                            promotion.is_active
                                ? 'text-red-600 hover:bg-red-50 hover:text-red-700'
                                : 'text-green-600 hover:bg-green-50 hover:text-green-700'
                        }`}
                    >
                        {toggleLoading ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : promotion.is_active ? (
                            <PowerOff className="h-4 w-4" />
                        ) : (
                            <Power className="h-4 w-4" />
                        )}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    {!promotion.is_active && hasActivePromotion
                        ? 'Sudah ada flyer aktif'
                        : promotion.is_active
                          ? 'Nonaktifkan Flyer'
                          : 'Aktifkan Flyer'}
                </TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={() => setEditModalOpen(true)} className="h-8 px-2">
                        <Edit className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>Edit Flyer</TooltipContent>
            </Tooltip>

            <AlertDialog>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-red-600 hover:bg-red-50 hover:text-red-700">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Hapus Flyer</TooltipContent>
                </Tooltip>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus flyer promosi ini? Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={deleteLoading} className="bg-red-600 hover:bg-red-700">
                            {deleteLoading ? 'Menghapus...' : 'Hapus'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Edit Modal */}
            <EditPromotionModal promotion={promotion} open={editModalOpen} onOpenChange={setEditModalOpen} promotions={promotions} />
        </div>
    );
}
