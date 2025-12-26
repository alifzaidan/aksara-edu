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
import { ReactNode } from 'react';

interface DeleteConfirmDialogProps {
    trigger: ReactNode;
    title?: string;
    description?: string;
    itemName?: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
}

export default function DeleteConfirmDialog({
    trigger,
    title = 'Apakah Anda yakin ingin menghapus item ini?',
    description = 'Tindakan ini tidak dapat dibatalkan. Item akan dihapus secara permanen dari sistem dan semua data terkait akan hilang.',
    itemName,
    onConfirm,
    confirmText = 'Ya, Hapus',
    cancelText = 'Batal',
}: DeleteConfirmDialogProps) {
    const finalDescription =
        description !== undefined
            ? description
            : itemName
              ? `Tindakan ini tidak dapat dibatalkan. "${itemName}" akan dihapus secara permanen dari sistem dan semua data terkait akan hilang.`
              : undefined;

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{finalDescription}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{cancelText}</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm}>{confirmText}</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
