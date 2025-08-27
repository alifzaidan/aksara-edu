import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useRef, useState } from 'react';
import { toast } from 'sonner';

interface CreateSignProps {
    setOpen: (open: boolean) => void;
}

export default function CreateSign({ setOpen }: CreateSignProps) {
    const nameInput = useRef<HTMLInputElement>(null);
    const imageInput = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [thumbnailError, setThumbnailError] = useState(false);

    const { data, setData, post, processing, reset, errors, clearErrors } = useForm({
        name: '',
        position: '',
        image: null as File | null,
    });

    const createSign: FormEventHandler = (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('position', data.position);
        if (data.image) formData.append('image', data.image);

        post(route('certificate-signs.store'), {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                reset();
                clearErrors();
                setPreview(null);
                if (imageInput.current) imageInput.current.value = '';
            },
            onError: () => nameInput.current?.focus(),
        });
    };

    return (
        <DialogContent className="max-w-md">
            <DialogTitle>Tambah Tanda Tangan</DialogTitle>
            <DialogDescription>Silakan masukkan data tanda tangan baru yang ingin Anda tambahkan.</DialogDescription>
            <form className="space-y-4" onSubmit={createSign}>
                <div className="grid gap-3">
                    <div>
                        <Label htmlFor="name">Nama</Label>
                        <Input
                            id="name"
                            type="text"
                            name="name"
                            ref={nameInput}
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="Masukkan nama"
                            autoComplete="off"
                            required
                        />
                        <InputError message={errors.name} />
                    </div>

                    <div>
                        <Label htmlFor="position">Posisi/Jabatan</Label>
                        <Input
                            id="position"
                            type="text"
                            name="position"
                            value={data.position}
                            onChange={(e) => setData('position', e.target.value)}
                            placeholder="Masukkan posisi/jabatan (opsional)"
                            autoComplete="off"
                        />
                        <InputError message={errors.position} />
                    </div>

                    <div>
                        <Label htmlFor="image">Tanda Tangan</Label>
                        <img
                            src={preview || '/assets/images/placeholder.png'}
                            alt="Preview Signature"
                            className="my-1 mt-2 h-24 rounded border object-contain"
                        />
                        <Input
                            id="image"
                            type="file"
                            name="image"
                            ref={imageInput}
                            accept="image/png, image/jpeg, image/jpg"
                            className={thumbnailError ? 'border-red-500 focus-visible:ring-red-500' : ''}
                            onChange={(e) => {
                                const file = e.target.files?.[0] ?? null;
                                if (file) {
                                    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
                                    if (!validTypes.includes(file.type)) {
                                        setThumbnailError(true);
                                        setData('image', null);
                                        toast('Gambar harus png, jpg, atau jpeg');
                                        return;
                                    }
                                    if (file.size > 2 * 1024 * 1024) {
                                        setThumbnailError(true);
                                        setData('image', null);
                                        toast('Ukuran file maksimal 2MB!');
                                        return;
                                    }
                                }
                                setThumbnailError(false);
                                setData('image', file);
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
                        <InputError message={errors.image} />
                    </div>
                </div>
                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="secondary" onClick={() => setOpen(false)} className="hover:cursor-pointer">
                            Batal
                        </Button>
                    </DialogClose>
                    <Button disabled={processing} asChild className="hover:cursor-pointer">
                        <button type="submit">{processing ? 'Menyimpan...' : 'Tambah Tanda Tangan'}</button>
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}
