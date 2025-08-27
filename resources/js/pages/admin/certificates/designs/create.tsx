import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import { FormEventHandler, useRef, useState } from 'react';

interface CreateDesignProps {
    setOpen: (open: boolean) => void;
}

export default function CreateDesign({ setOpen }: CreateDesignProps) {
    const nameInput = useRef<HTMLInputElement>(null);
    const image1Input = useRef<HTMLInputElement>(null);
    const image2Input = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [preview2, setPreview2] = useState<string | null>(null);
    const [thumbnailError, setThumbnailError] = useState(false);
    const [thumbnailError2, setThumbnailError2] = useState(false);

    const { data, setData, post, processing, reset, errors, clearErrors } = useForm({
        name: '',
        image_1: null as File | null,
        image_2: null as File | null,
    });

    const createDesign: FormEventHandler = (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('name', data.name);
        if (data.image_1) formData.append('image_1', data.image_1);
        if (data.image_2) formData.append('image_2', data.image_2);

        post(route('certificate-designs.store'), {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                reset();
                clearErrors();
                setPreview(null);
                setPreview2(null);
            },
            onError: () => nameInput.current?.focus(),
        });
    };

    return (
        <DialogContent className="max-w-md">
            <DialogTitle>Tambah Desain Sertifikat</DialogTitle>
            <DialogDescription>Silakan masukkan data desain sertifikat baru yang ingin Anda tambahkan.</DialogDescription>
            <form className="space-y-4" onSubmit={createDesign}>
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
                        <img
                            src={preview || '/assets/images/placeholder.png'}
                            alt="Preview Icon"
                            className="my-1 mt-2 h-24 rounded border object-cover"
                        />
                        <Input
                            id="image_1"
                            type="file"
                            name="image_1"
                            ref={image1Input}
                            accept="image/png, image/jpeg, image/jpg"
                            className={thumbnailError ? 'border-red-500 focus-visible:ring-red-500' : ''}
                            onChange={(e) => {
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
                                    reader.onload = (ev) => setPreview(ev.target?.result as string);
                                    reader.readAsDataURL(file);
                                } else {
                                    setPreview(null);
                                }
                            }}
                        />
                        <p className="text-muted-foreground mt-1 text-xs">Format: JPEG, PNG, JPG. Maksimal 2MB.</p>
                        <InputError message={errors.image_1} />
                    </div>

                    <div>
                        <Label htmlFor="image_2">Gambar 2 (Opsional)</Label>
                        <img
                            src={preview2 || '/assets/images/placeholder.png'}
                            alt="Preview Icon"
                            className="my-1 mt-2 h-24 rounded border object-cover"
                        />
                        <Input
                            id="image_2"
                            type="file"
                            name="image_2"
                            ref={image2Input}
                            accept="image/png, image/jpeg, image/jpg"
                            className={thumbnailError2 ? 'border-red-500 focus-visible:ring-red-500' : ''}
                            onChange={(e) => {
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
                            }}
                        />
                        <p className="text-muted-foreground mt-1 text-xs">Format: JPEG, PNG, JPG. Maksimal 2MB.</p>
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
                        <button type="submit">{processing ? 'Menyimpan...' : 'Tambah Desain'}</button>
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}
