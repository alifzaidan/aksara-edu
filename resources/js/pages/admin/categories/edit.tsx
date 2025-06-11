import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect, useRef } from 'react';

interface EditCategoryProps {
    category: {
        id: string;
        name: string;
        slug: string;
    };
    setOpen: (open: boolean) => void;
}

export default function EditCategory({ category, setOpen }: EditCategoryProps) {
    const nameInput = useRef<HTMLInputElement>(null);

    const { data, setData, put, processing, reset, errors, clearErrors } = useForm<Required<{ name: string; slug: string }>>({
        name: category.name,
        slug: category.slug,
    });

    useEffect(() => {
        setData({
            name: category.name,
            slug: category.slug,
        });
        clearErrors();
    }, [category, setData, clearErrors]);

    const slugify = (text: string) =>
        text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');

    const updateCategory: FormEventHandler = (e) => {
        e.preventDefault();

        put(route('categories.update', category.id), {
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
            <DialogTitle>Edit Kategori</DialogTitle>
            <DialogDescription>Ubah nama atau slug kategori.</DialogDescription>
            <form className="space-y-6" onSubmit={updateCategory}>
                <div className="grid gap-2">
                    <Label htmlFor="name" className="sr-only">
                        Nama Kategori
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
