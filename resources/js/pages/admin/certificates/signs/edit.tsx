import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { CertificateSign } from './columns';

interface EditSignProps {
    sign: CertificateSign;
    setOpen: (open: boolean) => void;
}

export default function EditSign({ sign, setOpen }: EditSignProps) {
    const nameInput = useRef<HTMLInputElement>(null);
    const imageInput = useRef<HTMLInputElement>(null);

    const [preview, setPreview] = useState<string | null>(null);
    const [thumbnailError, setThumbnailError] = useState(false);

    const { data, setData, post, processing, reset, errors, clearErrors } = useForm({
        name: sign.name,
        position: sign.position || '',
        image: null as File | null,
        _method: 'PUT',
    });

    useEffect(() => {
        setData({
            name: sign.name,
            position: sign.position || '',
            image: null,
            _method: 'PUT',
        });
        clearErrors();
        setPreview(null);
    }, [sign, setData, clearErrors]);

    const updateSign: FormEventHandler = (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('position', data.position);
        formData.append('_method', 'PUT');
        if (data.image) formData.append('image', data.image);

        post(route('certificate-signs.update', sign.id), {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                reset();
                clearErrors();
                setPreview(null);
            },
            onError: () => nameInput.current?.focus(),
        });
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    };

    return (
        <>
            <DialogTitle>Edit Tanda Tangan</DialogTitle>
            <DialogDescription>Ubah nama, posisi, atau gambar tanda tangan.</DialogDescription>
            <form className="space-y-4" onSubmit={updateSign}>
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
                        />
                        <InputError message={errors.position} />
                    </div>

                    <div>
                        <Label htmlFor="image">Tanda Tangan</Label>

                        <div className="my-2 flex gap-4">
                            {sign.image && (
                                <div className="text-center">
                                    <img src={`/storage/${sign.image}`} alt="Current Signature" className="h-24 rounded border object-contain" />
                                    <p className="text-muted-foreground mt-1 text-xs">Gambar saat ini</p>
                                </div>
                            )}

                            {preview && (
                                <div className="text-center">
                                    <img src={preview} alt="Preview Signature" className="h-24 rounded border object-contain" />
                                    <p className="mt-1 text-xs text-green-600">Gambar baru</p>
                                </div>
                            )}

                            {!sign.image && !preview && (
                                <div className="text-center">
                                    <img src="/assets/images/placeholder.png" alt="Placeholder" className="h-24 rounded border object-cover" />
                                    <p className="text-muted-foreground mt-1 text-xs">Tidak ada gambar</p>
                                </div>
                            )}
                        </div>

                        <Input
                            id="image"
                            type="file"
                            name="image"
                            ref={imageInput}
                            accept="image/png, image/jpeg, image/jpg"
                            className={thumbnailError ? 'border-red-500 focus-visible:ring-red-500' : ''}
                            onChange={handleImageChange}
                        />
                        <p className="text-muted-foreground mt-1 text-xs">
                            Biarkan kosong jika tidak ingin mengubah gambar. Format: JPEG, PNG, JPG. Maksimal 2MB.
                        </p>
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
                        <button type="submit">{processing ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
                    </Button>
                </DialogFooter>
            </form>
        </>
    );
}
