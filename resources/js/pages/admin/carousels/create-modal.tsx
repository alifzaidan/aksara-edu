import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useForm } from '@inertiajs/react';
import { AlertTriangle, Image as ImageIcon, Loader2, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export interface Carousel {
    id: string;
    title: string | null;
    image_path: string;
    target_url: string | null;
    order: number;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

interface CreateModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingCarousel?: Carousel | null;
}

export default function CreateCarouselModal({ open, onOpenChange, editingCarousel }: CreateModalProps) {
    const isEdit = !!editingCarousel;
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm<{
        title: string;
        image: File | null;
        target_url: string;
        order: number;
        is_active: boolean;
    }>({
        title: '',
        image: null,
        target_url: '',
        order: 0,
        is_active: true,
    });

    useEffect(() => {
        if (editingCarousel) {
            setData({
                title: editingCarousel.title || '',
                image: null,
                target_url: editingCarousel.target_url || '',
                order: editingCarousel.order || 0,
                is_active: editingCarousel.is_active,
            });
            setPreviewUrl(editingCarousel.image_path);
            setImageDimensions(null);
        } else {
            reset();
            setPreviewUrl(null);
            setImageDimensions(null);
        }
        clearErrors();
    }, [editingCarousel, open]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check file size (5MB = 5 * 1024 * 1024 = 5242880 bytes)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Ukuran file gambar tidak boleh melebihi 5 MB.');
            e.target.value = '';
            return;
        }

        // Check image dimensions for preview information
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                setImageDimensions({ width: img.width, height: img.height });
            };
            img.src = event.target?.result as string;
            setPreviewUrl(event.target?.result as string);
        };
        reader.readAsDataURL(file);

        setData('image', file);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isEdit && editingCarousel) {
            post(route('carousels.update', editingCarousel.id), {
                forceFormData: true,
                onSuccess: () => {
                    toast.success('Banner carousel berhasil diperbarui.');
                    onOpenChange(false);
                    reset();
                },
            });
        } else {
            post(route('carousels.store'), {
                forceFormData: true,
                onSuccess: () => {
                    toast.success('Banner carousel berhasil ditambahkan.');
                    onOpenChange(false);
                    reset();
                },
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Edit Banner Carousel' : 'Tambah Banner Carousel Baru'}</DialogTitle>
                    <DialogDescription>
                        Unggah dan kelola gambar banner slider yang akan ditampilkan di halaman utama beranda.
                    </DialogDescription>
                </DialogHeader>

                {/* Info & Rule Banner Box */}
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                        <div className="space-y-1 text-xs text-amber-800 dark:text-amber-300">
                            <p className="font-semibold text-sm">Persyaratan Gambar Carousel:</p>
                            <ul className="list-disc space-y-0.5 pl-4">
                                <li>
                                    Ukuran berkas <strong>TIDAK BOLEH melebihi 5 MB</strong>.
                                </li>
                                <li>
                                    Rekomendasi dimensi gambar: <strong>4084 x 1168 px</strong> (rasio ~3.5:1 untuk tampilan optimal).
                                </li>
                                <li>Format yang didukung: WEBP, PNG, JPG, JPEG.</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title">Judul Banner (Opsional)</Label>
                        <Input
                            id="title"
                            placeholder="Contoh: Promo Beasiswa Brevet Pajak Batch 85"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                        />
                        {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
                    </div>

                    {/* Image Upload */}
                    <div className="space-y-2">
                        <Label htmlFor="image">
                            Gambar Banner {isEdit ? '(Biarkan kosong jika tidak ingin mengganti)' : '<span className="text-red-500">*</span>'}
                        </Label>
                        <Input id="image" type="file" accept="image/webp,image/png,image/jpeg,image/jpg" onChange={handleFileChange} />
                        {errors.image && <p className="text-xs text-red-500">{errors.image}</p>}
                    </div>

                    {/* Live Image Preview */}
                    {previewUrl && (
                        <div className="space-y-2">
                            <Label className="text-muted-foreground text-xs">Preview Gambar</Label>
                            <div className="relative overflow-hidden rounded-lg border bg-zinc-100 dark:bg-zinc-900">
                                <img src={previewUrl} alt="Carousel Preview" className="h-auto w-full object-cover" />
                                {imageDimensions && (
                                    <span className="absolute right-2 bottom-2 rounded bg-zinc-800/80 px-2 py-1 font-mono text-xs font-medium text-white shadow backdrop-blur-sm">
                                        {imageDimensions.width} x {imageDimensions.height} px
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Target URL */}
                    <div className="space-y-2">
                        <Label htmlFor="target_url">Target Link / URL Tujuan (Opsional)</Label>
                        <Input
                            id="target_url"
                            placeholder="Contoh: /bootcamp atau https://sekolahpajak.id/certification-programs"
                            value={data.target_url}
                            onChange={(e) => setData('target_url', e.target.value)}
                        />
                        {errors.target_url && <p className="text-xs text-red-500">{errors.target_url}</p>}
                    </div>

                    {/* Order & Active Toggle */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="order">Urutan Tampilan</Label>
                            <Input
                                id="order"
                                type="number"
                                min={0}
                                value={data.order}
                                onChange={(e) => setData('order', parseInt(e.target.value) || 0)}
                            />
                            {errors.order && <p className="text-xs text-red-500">{errors.order}</p>}
                        </div>

                        <div className="flex flex-col justify-center space-y-2 pt-2">
                            <Label htmlFor="is_active" className="cursor-pointer">
                                Status Aktif
                            </Label>
                            <div className="flex items-center gap-2">
                                <Switch id="is_active" checked={data.is_active} onCheckedChange={(checked) => setData('is_active', checked)} />
                                <span className="text-muted-foreground text-xs">{data.is_active ? 'Tampilkan' : 'Sembunyikan'}</span>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEdit ? 'Simpan Perubahan' : 'Unggah Banner'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
