import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useRef } from 'react';

interface CreateToolProps {
    setOpen: (open: boolean) => void;
}

export default function CreateTool({ setOpen }: CreateToolProps) {
    const nameInput = useRef<HTMLInputElement>(null);
    const descInput = useRef<HTMLTextAreaElement>(null);
    const iconInput = useRef<HTMLInputElement>(null);

    const {
        data,
        setData,
        submit: create,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm<Required<{ name: string; slug: string; description: string | null; icon: File | null }>>({
        name: '',
        slug: '',
        description: null,
        icon: null,
    });

    const slugify = (text: string) =>
        text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

    const createTool: FormEventHandler = (e) => {
        e.preventDefault();

        create('post', route('tools.store'), {
            preserveScroll: true,
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
            <DialogTitle>Tambah Tool Baru</DialogTitle>
            <DialogDescription>Silakan masukkan nama tool baru yang ingin Anda tambahkan.</DialogDescription>
            <form className="space-y-6" onSubmit={createTool}>
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
                        placeholder="Nama Tool"
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
                        Unggah Icon
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
                    <p className="text-muted-foreground ms-1 text-xs">Upload Icon. Format: PNG atau JPG</p>
                </div>
                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="secondary" onClick={() => setOpen(false)}>
                            Batal
                        </Button>
                    </DialogClose>
                    <Button disabled={processing} asChild>
                        <button type="submit">Tambah Tool</button>
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}
