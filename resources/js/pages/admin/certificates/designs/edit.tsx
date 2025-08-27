import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { CertificateDesign } from './columns';

interface EditDesignProps {
    design: CertificateDesign;
    setOpen: (open: boolean) => void;
}

export default function EditDesign({ design, setOpen }: EditDesignProps) {
    const nameInput = useRef<HTMLInputElement>(null);
    const image1Input = useRef<HTMLInputElement>(null);
    const image2Input = useRef<HTMLInputElement>(null);

    // State untuk preview gambar baru
    const [preview1, setPreview1] = useState<string | null>(null);
    const [preview2, setPreview2] = useState<string | null>(null);
    const [thumbnailError, setThumbnailError] = useState(false);
    const [thumbnailError2, setThumbnailError2] = useState(false);

    const { data, setData, post, processing, reset, errors, clearErrors } = useForm({
        name: design.name,
        image_1: null as File | null,
        image_2: null as File | null,
        _method: 'PUT',
    });

    useEffect(() => {
        setData({
            name: design.name,
            image_1: null,
            image_2: null,
            _method: 'PUT',
        });
        clearErrors();
        // Reset preview saat design berubah
        setPreview1(null);
        setPreview2(null);
    }, [design, setData, clearErrors]);

    const updateDesign: FormEventHandler = (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('_method', 'PUT');
        if (data.image_1) formData.append('image_1', data.image_1);
        if (data.image_2) formData.append('image_2', data.image_2);

        post(route('certificate-designs.update', design.id), {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                reset();
                clearErrors();
                setPreview1(null);
                setPreview2(null);
            },
            onError: () => nameInput.current?.focus(),
        });
    };

    // Handler untuk gambar 1
    const handleImage1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        if (file) {
            const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
            if (!validTypes.includes(file.type)) {
                setThumbnailError(true);
                setData('image_1', null);
                toast('Gambar harus png, jpg, atau jpeg');
                return;
            }
            if (file.size > 2 * 1024 * 1024) {
                setThumbnailError(true);
                setData('image_1', null);
                toast('Ukuran file maksimal 2MB!');
                return;
            }
        }
        setThumbnailError(false);
        setData('image_1', file);
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => setPreview1(ev.target?.result as string);
            reader.readAsDataURL(file);
        } else {
            setPreview1(null);
        }
    };

    // Handler untuk gambar 2
    const handleImage2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        if (file) {
            const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
            if (!validTypes.includes(file.type)) {
                setThumbnailError2(true);
                setData('image_2', null);
                toast('Gambar harus png, jpg, atau jpeg');
                return;
            }
            if (file.size > 2 * 1024 * 1024) {
                setThumbnailError2(true);
                setData('image_2', null);
                toast('Ukuran file maksimal 2MB!');
                return;
            }
        }
        setThumbnailError2(false);
        setData('image_2', file);
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => setPreview2(ev.target?.result as string);
            reader.readAsDataURL(file);
        } else {
            setPreview2(null);
        }
    };

    return (
        <>
            <DialogTitle>Edit Desain Sertifikat</DialogTitle>
            <DialogDescription>Ubah nama atau gambar desain sertifikat.</DialogDescription>
            <form className="space-y-4" onSubmit={updateDesign}>
                <div className="grid gap-3">
                    <div>
                        <Label htmlFor="name">Nama Desain</Label>
                        <Input
                            id="name"
                            type="text"
                            name="name"
                            ref={nameInput}
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="Masukkan nama desain"
                            autoComplete="off"
                            required
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div>
                        <Label htmlFor="image_1">Gambar 1</Label>

                        <div className="my-2 flex gap-4">
                            {design.image_1 && (
                                <div className="text-center">
                                    <img src={`/storage/${design.image_1}`} alt="Current Image 1" className="h-24 rounded border object-cover" />
                                    <p className="text-muted-foreground mt-1 text-xs">Gambar saat ini</p>
                                </div>
                            )}

                            {preview1 && (
                                <div className="text-center">
                                    <img src={preview1} alt="Preview Image 1" className="h-24 rounded border object-cover" />
                                    <p className="mt-1 text-xs text-green-600">Gambar baru</p>
                                </div>
                            )}

                            {!design.image_1 && !preview1 && (
                                <div className="text-center">
                                    <img src="/assets/images/placeholder.png" alt="Placeholder" className="h-24 rounded border object-cover" />
                                    <p className="text-muted-foreground mt-1 text-xs">Tidak ada gambar</p>
                                </div>
                            )}
                        </div>

                        <Input
                            id="image_1"
                            type="file"
                            name="image_1"
                            ref={image1Input}
                            accept="image/png, image/jpeg, image/jpg"
                            className={thumbnailError ? 'border-red-500 focus-visible:ring-red-500' : ''}
                            onChange={handleImage1Change}
                        />
                        <p className="text-muted-foreground mt-1 text-xs">
                            Biarkan kosong jika tidak ingin mengubah gambar. Format: JPEG, PNG, JPG. Maksimal 2MB.
                        </p>
                        <InputError message={errors.image_1} />
                    </div>

                    <div>
                        <Label htmlFor="image_2">Gambar 2 (Opsional)</Label>

                        <div className="my-2 flex gap-4">
                            {design.image_2 && (
                                <div className="text-center">
                                    <img src={`/storage/${design.image_2}`} alt="Current Image 2" className="h-24 rounded border object-cover" />
                                    <p className="text-muted-foreground mt-1 text-xs">Gambar saat ini</p>
                                </div>
                            )}

                            {preview2 && (
                                <div className="text-center">
                                    <img src={preview2} alt="Preview Image 2" className="h-24 rounded border object-cover" />
                                    <p className="mt-1 text-xs text-green-600">Gambar baru</p>
                                </div>
                            )}

                            {!design.image_2 && !preview2 && (
                                <div className="text-center">
                                    <img src="/assets/images/placeholder.png" alt="Placeholder" className="h-24 rounded border object-cover" />
                                    <p className="text-muted-foreground mt-1 text-xs">Tidak ada gambar</p>
                                </div>
                            )}
                        </div>

                        <Input
                            id="image_2"
                            type="file"
                            name="image_2"
                            ref={image2Input}
                            accept="image/png, image/jpeg, image/jpg"
                            className={thumbnailError2 ? 'border-red-500 focus-visible:ring-red-500' : ''}
                            onChange={handleImage2Change}
                        />
                        <p className="text-muted-foreground mt-1 text-xs">
                            Biarkan kosong jika tidak ingin mengubah gambar. Format: JPEG, PNG, JPG. Maksimal 2MB.
                        </p>
                        <InputError message={errors.image_2} />
                    </div>
                </div>
                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="secondary" onClick={() => setOpen(false)} className="hover:cursor-pointer">
                            Batal
                        </Button>
                    </DialogClose>
                    <Button disabled={processing} asChild className="hover:cursor-pointer">
                        <button type="submit">{processing ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
                    </Button>
                </DialogFooter>
            </form>
        </>
    );
}
