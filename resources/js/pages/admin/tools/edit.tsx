import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface EditToolProps {
    tool: {
        id: string;
        name: string;
        slug: string;
        description: string | null;
        icon: string | null;
    };
    setOpen: (open: boolean) => void;
}

export default function EditTool({ tool, setOpen }: EditToolProps) {
    const nameInput = useRef<HTMLInputElement>(null);
    const descInput = useRef<HTMLTextAreaElement>(null);
    const iconInput = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(tool.icon ? `/storage/${tool.icon}` : null);
    const [thumbnailError, setThumbnailError] = useState(false);

    const { data, setData, post, processing, reset, errors, clearErrors } = useForm<
        Required<{ name: string; slug: string; description: string | null; icon: File | null }>
    >({
        name: tool.name,
        slug: tool.slug,
        description: tool.description,
        icon: null,
    });

    useEffect(() => {
        setData({
            name: tool.name,
            slug: tool.slug,
            description: tool.description,
            icon: null,
        });
        clearErrors();
    }, [tool, setData, clearErrors]);

    const slugify = (text: string) =>
        text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

    const updateTool: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('tools.update', tool.id), {
            method: 'put',
            ...data,
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                setOpen(false);
                reset();
                clearErrors();
            },
            onError: () => nameInput.current?.focus(),
        });
    };

    return (
        <DialogContent>
            <DialogTitle>Edit Tool</DialogTitle>
            <DialogDescription>Ubah nama atau slug tool.</DialogDescription>
            <form className="space-y-6" onSubmit={updateTool}>
                <div className="grid gap-2">
                    <Label htmlFor="name" className="sr-only">
                        Nama Tool
                    </Label>
                    <Input
                        id="name"
                        type="text"
                        name="name"
                        ref={nameInput}
                        value={data.name}
                        onChange={(e) => {
                            setData('name', e.target.value);
                            setData('slug', slugify(e.target.value));
                        }}
                        placeholder="Nama Kategori"
                        autoComplete="off"
                    />
                    <InputError message={errors.name} />

                    <Label htmlFor="slug" className="sr-only">
                        Slug
                    </Label>
                    <Input
                        id="slug"
                        type="text"
                        name="slug"
                        value={data.slug}
                        onChange={(e) => setData('slug', e.target.value)}
                        placeholder="Slug"
                        autoComplete="off"
                        disabled
                    />
                    <InputError message={errors.slug} />

                    <Label htmlFor="description" className="sr-only">
                        Deskripsi
                    </Label>
                    <Textarea
                        id="description"
                        name="description"
                        ref={descInput}
                        value={data.description ?? ''}
                        onChange={(e) => setData('description', e.target.value)}
                        placeholder="Deskripsi (opsional)"
                        className="resize-none"
                    />
                    <InputError message={errors.description} />

                    <Label htmlFor="icon" className="sr-only">
                        Icon
                    </Label>
                    <img
                        src={preview || '/assets/images/placeholder.png'}
                        alt="Preview Icon"
                        className="my-1 mt-2 h-24 w-24 rounded border object-cover"
                    />
                    <Input
                        id="icon"
                        type="file"
                        name="icon"
                        ref={iconInput}
                        accept="image/png, image/jpeg, image/jpg"
                        className={thumbnailError ? 'border-red-500 focus-visible:ring-red-500' : ''}
                        onChange={(e) => {
                            const file = e.target.files?.[0] ?? null;
                            if (file) {
                                const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
                                if (!validTypes.includes(file.type)) {
                                    setThumbnailError(true);
                                    setData('icon', null);
                                    toast('Gambar harus png, jpg, atau jpeg');
                                    return;
                                }
                                if (file.size > 2 * 1024 * 1024) {
                                    setThumbnailError(true);
                                    setData('icon', null);
                                    toast('Ukuran file maksimal 2MB!');
                                    return;
                                }
                            }
                            setThumbnailError(false);
                            setData('icon', file);
                            if (file) {
                                const reader = new FileReader();
                                reader.onload = (ev) => setPreview(ev.target?.result as string);
                                reader.readAsDataURL(file);
                            } else {
                                setPreview(tool.icon ? `/storage/${tool.icon}` : null);
                            }
                        }}
                        placeholder="Icon (opsional)"
                    />
                    <InputError message={errors.icon} />
                </div>
                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="secondary" onClick={() => setOpen(false)} className="hover:cursor-pointer">
                            Batal
                        </Button>
                    </DialogClose>
                    <Button disabled={processing} asChild className="hover:cursor-pointer">
                        <button type="submit">Simpan Perubahan</button>
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}
