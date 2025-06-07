import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect, useRef } from 'react';

interface EditCourseProps {
    course: {
        id: string;
        title: string;
        category_id: string;
        short_description: string | null;
        description: string | null;
        thumbnail: string | null;
        price: number;
        level: string;
    };
    setOpen: (open: boolean) => void;
}

export default function EditCourse({ course, setOpen }: EditCourseProps) {
    const titleInput = useRef<HTMLInputElement>(null);
    const categoryInput = useRef<HTMLInputElement>(null);
    const shortDescriptionInput = useRef<HTMLInputElement>(null);
    const descriptionInput = useRef<HTMLTextAreaElement>(null);
    const thumbnailInput = useRef<HTMLInputElement>(null);
    const priceInput = useRef<HTMLInputElement>(null);
    const levelInput = useRef<HTMLInputElement>(null);
    const { data, setData, put, processing, reset, errors, clearErrors } = useForm<
        Required<{
            title: string;
            category_id: string;
            short_description: string;
            description: string;
            thumbnail: File | null;
            price: number;
            level: string;
        }>
    >({
        title: course.title,
        category_id: course.category_id,
        short_description: course.short_description ?? '',
        description: course.description ?? '',
        thumbnail: course.thumbnail ? new File([course.thumbnail], 'thumbnail') : null,
        price: course.price,
        level: course.level,
    });

    useEffect(() => {
        setData({
            title: course.title,
            category_id: course.category_id,
            short_description: course.short_description ?? '',
            description: course.description ?? '',
            thumbnail: null,
            price: course.price,
            level: course.level,
        });
        clearErrors();
    }, [course, setData, clearErrors]);

    const updateCourse: FormEventHandler = (e) => {
        e.preventDefault();

        put(route('courses.update', course.id), {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                reset();
                clearErrors();
            },
            onError: () => titleInput.current?.focus(),
        });
    };

    return (
        <DialogContent>
            <DialogTitle>Edit Kursus</DialogTitle>
            <DialogDescription>Ubah data kursus sesuai kebutuhan.</DialogDescription>
            <form className="space-y-6" onSubmit={updateCourse}>
                <div className="grid gap-2">
                    <Label htmlFor="title" className="sr-only">
                        Judul Kursus
                    </Label>
                    <Input
                        id="title"
                        type="text"
                        name="title"
                        ref={titleInput}
                        value={data.title}
                        onChange={(e) => setData('title', e.target.value)}
                        placeholder="Judul Kursus"
                        autoComplete="off"
                    />
                    <InputError message={errors.title} />

                    <Label htmlFor="category" className="sr-only">
                        Kategori
                    </Label>
                    <Input
                        id="category"
                        type="text"
                        name="category"
                        ref={categoryInput}
                        value={data.category_id}
                        onChange={(e) => setData('category_id', e.target.value)}
                        placeholder="Kategori"
                        autoComplete="off"
                    />
                    <InputError message={errors.category_id} />

                    <Label htmlFor="short_description" className="sr-only">
                        Deskripsi Singkat
                    </Label>
                    <Input
                        id="short_description"
                        type="text"
                        name="short_description"
                        ref={shortDescriptionInput}
                        value={data.short_description || ''}
                        onChange={(e) => setData('short_description', e.target.value)}
                        placeholder="Deskripsi Singkat (opsional)"
                        autoComplete="off"
                    />
                    <InputError message={errors.short_description} />

                    <Label htmlFor="description" className="sr-only">
                        Deskripsi
                    </Label>
                    <Textarea
                        id="description"
                        name="description"
                        ref={descriptionInput}
                        value={data.description ?? ''}
                        onChange={(e) => setData('description', e.target.value)}
                        placeholder="Deskripsi (opsional)"
                        className="resize-none"
                    />
                    <InputError message={errors.description} />

                    <Label htmlFor="thumbnail" className="sr-only">
                        Thumbnail
                    </Label>
                    <Input
                        id="thumbnail"
                        type="file"
                        name="thumbnail"
                        ref={thumbnailInput}
                        onChange={(e) => setData('thumbnail', e.target.files?.[0] ?? null)}
                        placeholder="Thumbnail (opsional)"
                    />
                    <InputError message={errors.thumbnail} />

                    <Label htmlFor="price" className="sr-only">
                        Harga
                    </Label>
                    <Input
                        id="price"
                        type="number"
                        name="price"
                        ref={priceInput}
                        value={data.price}
                        onChange={(e) => setData('price', Number(e.target.value))}
                        placeholder="Harga"
                    />
                    <InputError message={errors.price} />

                    <Label htmlFor="level" className="sr-only">
                        Level
                    </Label>
                    <Input
                        id="level"
                        type="text"
                        name="level"
                        ref={levelInput}
                        value={data.level}
                        onChange={(e) => setData('level', e.target.value)}
                        placeholder="Level"
                    />
                    <InputError message={errors.level} />
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
