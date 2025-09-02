import { Button } from '@/components/ui/button';
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
import { router } from '@inertiajs/react';
import { Edit, Trash2 } from 'lucide-react';
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
    promotions: Promotion[]; // Add promotions array
}

export default function ActionCell({ promotion, promotions }: ActionCellProps) {
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

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

    return (
        <div className="flex items-center gap-2">
            {/* Edit Button */}
            <Button
                variant="outline"
                size="sm"
                onClick={() => setEditModalOpen(true)}
                className="h-8 px-2"
            >
                <Edit className="h-4 w-4" />
            </Button>

            {/* Delete Button with Confirmation */}
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus flyer promosi ini? 
                            Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleDelete}
                            disabled={deleteLoading}
                            className="bg-primary"
                        >
                            {deleteLoading ? 'Menghapus...' : 'Hapus'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Edit Modal */}
            <EditPromotionModal 
                promotion={promotion}
                open={editModalOpen}
                onOpenChange={setEditModalOpen}
                promotions={promotions}
            />
        </div>
    );
}
