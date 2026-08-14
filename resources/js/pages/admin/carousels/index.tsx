import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import AdminLayout from '@/layouts/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { AlertCircle, ExternalLink, Image as ImageIcon, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import CreateCarouselModal, { Carousel } from './create-modal';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/admin/dashboard',
    },
    {
        title: 'Banner Carousel',
        href: '/admin/carousels',
    },
];

interface CarouselsProps {
    carousels: Carousel[];
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function CarouselsIndex({ carousels, flash }: CarouselsProps) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingCarousel, setEditingCarousel] = useState<Carousel | null>(null);

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const handleToggleStatus = (carousel: Carousel) => {
        router.patch(
            route('carousels.toggle-status', carousel.id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Status banner berhasil diperbarui.');
                },
            },
        );
    };

    const handleDelete = (carousel: Carousel) => {
        if (confirm(`Apakah Anda yakin ingin menghapus banner carousel "${carousel.title || 'Banner'}"?`)) {
            router.delete(route('carousels.destroy', carousel.id), {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Banner carousel berhasil dihapus.');
                },
            });
        }
    };

    const handleEdit = (carousel: Carousel) => {
        setEditingCarousel(carousel);
        setIsCreateOpen(true);
    };

    const handleAddNew = () => {
        setEditingCarousel(null);
        setIsCreateOpen(true);
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Banner Carousel" />

            <div className="px-4 py-4 md:px-6">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Banner Carousel Beranda</h1>
                        <p className="text-muted-foreground text-sm">
                            Kelola gambar banner slider yang tampil di halaman utama beranda pengguna.
                        </p>
                    </div>
                    <Button onClick={handleAddNew} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Tambah Banner
                    </Button>
                </div>

                {/* Info Notice Box */}
                <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-900/50 dark:bg-blue-950/30">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                        <div className="space-y-1 text-sm text-blue-900 dark:text-blue-200">
                            <p className="font-semibold">Ketentuan Pengunggahan Gambar Carousel:</p>
                            <ul className="list-disc space-y-1 pl-4 text-xs">
                                <li>
                                    Ukuran file gambar <strong>TIDAK BOLEH MELEBIHI 5 MB</strong> (5.120 KB).
                                </li>
                                <li>
                                    Rekomendasi dimensi resolusi piksel: <strong>4084 x 1168 piksel</strong> (rasio ~3.5:1 untuk hasil tampilan terbaik).
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Carousels List */}
                {carousels.length === 0 ? (
                    <Card className="p-8 text-center">
                        <CardContent className="flex flex-col items-center justify-center space-y-4 pt-6">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                                <ImageIcon className="h-8 w-8 text-zinc-400" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-semibold text-lg">Belum Ada Banner Carousel Custom</h3>
                                <p className="text-muted-foreground text-sm">
                                    Saat ini beranda menggunakan gambar default (carousel-1.webp, carousel-2.webp, carousel-3.webp).
                                </p>
                            </div>
                            <Button onClick={handleAddNew} variant="outline" className="gap-2">
                                <Plus className="h-4 w-4" />
                                Unggah Banner Pertama
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2">
                        {carousels.map((carousel, index) => (
                            <Card key={carousel.id} className="overflow-hidden">
                                <div className="relative aspect-[4084/1168] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900">
                                    <img
                                        src={carousel.image_path}
                                        alt={carousel.title || `Banner ${index + 1}`}
                                        className="h-full w-full object-cover transition-transform hover:scale-105"
                                    />
                                    <div className="absolute top-3 left-3 rounded-md bg-black/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md">
                                        Urutan #{carousel.order}
                                    </div>
                                    <div className="absolute top-3 right-3 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-medium backdrop-blur-md dark:bg-zinc-900/90">
                                        <Switch
                                            id={`active-${carousel.id}`}
                                            checked={carousel.is_active}
                                            onCheckedChange={() => handleToggleStatus(carousel)}
                                        />
                                        <span>{carousel.is_active ? 'Aktif' : 'Non-Aktif'}</span>
                                    </div>
                                </div>

                                <CardContent className="space-y-3 p-4">
                                    <div className="flex items-start justify-between gap-2">
                                        <h3 className="font-semibold text-base line-clamp-1">{carousel.title || 'Banner Carousel (Tanpa Judul)'}</h3>
                                    </div>

                                    {carousel.target_url && (
                                        <a
                                            href={carousel.target_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline dark:text-blue-400"
                                        >
                                            <ExternalLink className="h-3.5 w-3.5" />
                                            {carousel.target_url}
                                        </a>
                                    )}

                                    <div className="flex items-center justify-end gap-2 pt-2 border-t">
                                        <Button variant="outline" size="sm" onClick={() => handleEdit(carousel)} className="gap-1.5">
                                            <Pencil className="h-3.5 w-3.5" />
                                            Edit
                                        </Button>
                                        <Button variant="destructive" size="sm" onClick={() => handleDelete(carousel)} className="gap-1.5">
                                            <Trash2 className="h-3.5 w-3.5" />
                                            Hapus
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <CreateCarouselModal
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                editingCarousel={editingCarousel}
            />
        </AdminLayout>
    );
}
