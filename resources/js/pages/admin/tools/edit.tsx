import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect, useRef } from 'react';

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
    const descInput = useRef<HTMLInputElement>(null);
    const iconInput = useRef<HTMLInputElement>(null);

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
                    <Input
                        id="description"
                        type="text"
                        name="description"
                        ref={descInput}
                        value={data.description || ''}
                        onChange={(e) => setData('description', e.target.value)}
                        placeholder="Deskripsi (opsional)"
                        autoComplete="off"
                    />
                    <InputError message={errors.description} />

                    <Label htmlFor="icon" className="sr-only">
                        Icon
                    </Label>
                    <Input
                        id="icon"
                        type="file"
                        name="icon"
                        ref={iconInput}
                        onChange={(e) => setData('icon', e.target.files?.[0] ?? null)}
                        placeholder="Icon (opsional)"
                    />
                    <InputError message={errors.icon} />
                </div>
                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="secondary" onClick={() => setOpen(false)}>
                            Batal
                        </Button>
                    </DialogClose>
                    <Button disabled={processing} asChild>
                        <button type="submit">Simpan Perubahan</button>
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}
