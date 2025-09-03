import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import { toast } from 'sonner';
import { Promotion } from './columns';

interface CreatePromotionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    promotions: Promotion[];
}

export default function CreatePromotionModal({ open, onOpenChange, promotions }: CreatePromotionModalProps) {
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const hasActivePromotion = promotions.some((promotion) => promotion.is_active === true);

    const { data, setData, post, processing, errors, reset } = useForm({
        promotion_flyer: null as File | null,
        start_date: '',
        end_date: '',
        is_active: false as boolean,
        url_redirect: '',
    });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('promotion_flyer', file);

            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();

        if (!data.promotion_flyer) {
            toast.error('Gambar flyer wajib diupload');
            return;
        }

        // Check if trying to create active promotion when one already exists
        if (data.is_active && hasActivePromotion) {
            toast.error('Hanya boleh ada satu flyer promosi yang aktif. Nonaktifkan flyer yang aktif terlebih dahulu.');
            return;
        }

        post(route('promotions.store'), {
            onSuccess: () => {
                reset();
                setImagePreview(null);
                onOpenChange(false);
                toast.success('Flyer promosi berhasil dibuat');
            },
            onError: () => {
                toast.error('Gagal membuat flyer promosi');
            },
        });
    };

    const handleClose = () => {
        reset();
        setImagePreview(null);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="scrollbar-hide max-h-[90vh] max-w-2xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Tambah Flyer Promosi</DialogTitle>
                    <DialogDescription>Buat flyer promosi baru untuk produk Anda.</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Upload Flyer */}
                    <div className="space-y-2">
                        <Label htmlFor="promotion_flyer">Gambar Flyer *</Label>
                        <Input id="promotion_flyer" type="file" accept="image/*" onChange={handleImageChange} className="cursor-pointer" />
                        {errors.promotion_flyer && <p className="text-sm text-red-600">{errors.promotion_flyer}</p>}

                        {/* Image Preview */}
                        {imagePreview && (
                            <div className="mt-4">
                                <img src={imagePreview} alt="Preview flyer" className="max-h-64 w-full rounded-lg border object-contain" />
                            </div>
                        )}
                    </div>

                    {/* Start Date */}
                    <div className="space-y-2">
                        <Label htmlFor="start_date">Tanggal Mulai *</Label>
                        <Input id="start_date" type="date" value={data.start_date} onChange={(e) => setData('start_date', e.target.value)} required />
                        {errors.start_date && <p className="text-sm text-red-600">{errors.start_date}</p>}
                    </div>

                    {/* End Date */}
                    <div className="space-y-2">
                        <Label htmlFor="end_date">Tanggal Selesai *</Label>
                        <Input id="end_date" type="date" value={data.end_date} onChange={(e) => setData('end_date', e.target.value)} required />
                        {errors.end_date && <p className="text-sm text-red-600">{errors.end_date}</p>}
                    </div>

                    {/* URL Redirect */}
                    <div className="space-y-2">
                        <Label htmlFor="url_redirect">URL Redirect</Label>
                        <Input
                            id="url_redirect"
                            type="url"
                            placeholder="https://example.com"
                            value={data.url_redirect}
                            onChange={(e) => setData('url_redirect', e.target.value)}
                        />
                        <p className="text-muted-foreground text-xs">URL yang akan dibuka ketika flyer diklik (opsional)</p>
                        {errors.url_redirect && <p className="text-sm text-red-600">{errors.url_redirect}</p>}
                    </div>

                    {/* Status Active */}
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="is_active"
                                checked={data.is_active}
                                onCheckedChange={(checked) => {
                                    if (checked && hasActivePromotion) {
                                        toast.warning('Sudah ada flyer promosi yang aktif. Nonaktifkan flyer yang aktif terlebih dahulu.');
                                        return;
                                    }
                                    setData('is_active', checked);
                                }}
                            />
                            <Label htmlFor="is_active">{data.is_active ? 'Flyer Aktif' : 'Flyer Nonaktif'}</Label>
                        </div>
                        {hasActivePromotion && (
                            <p className="text-xs text-amber-600">⚠️ Sudah ada flyer promosi yang aktif. Hanya boleh ada satu flyer yang aktif.</p>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-2 pt-4">
                        <Button type="button" variant="outline" onClick={handleClose} disabled={processing}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Menyimpan...' : 'Simpan Flyer'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
