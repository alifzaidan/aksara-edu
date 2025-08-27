'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/layouts/admin-layout';
import { cn, parseRupiah, rupiahFormatter } from '@/lib/utils';
import { BreadcrumbItem } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Head, router } from '@inertiajs/react';
import { Editor } from '@tinymce/tinymce-react';
import { BookMarked, Check, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import CourseModulesSection from './course-modules-section';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Kelas Online',
        href: route('courses.index'),
    },
    {
        title: 'Tambah Kelas Baru',
        href: route('courses.create'),
    },
];

interface Lesson {
    title: string;
    type: 'text' | 'video' | 'file' | 'quiz';
    description?: string;
    is_free: boolean;
    content?: string;
    video?: File | null;
    attachment?: File | null;
}

const formSchema = z
    .object({
        title: z.string().nonempty('Judul harus diisi'),
        category_id: z.string().nonempty('Kategori harus dipilih'),
        short_description: z.string().max(200).nullable(),
        description: z.string().max(1000).nullable(),
        key_points: z.string().max(1000).nullable(),
        thumbnail: z.any().nullable(),
        strikethrough_price: z.number().min(0),
        price: z.number().min(0),
        level: z.enum(['beginner', 'intermediate', 'advanced']),
        tools: z.array(z.string()).optional(),
    })
    .refine(
        (data) => {
            if (data.strikethrough_price > 0) {
                return data.strikethrough_price > data.price;
            }
            return true;
        },
        {
            message: 'Harga coret harus lebih besar dari harga normal.',
            path: ['strikethrough_price'],
        },
    );

export default function CreateCourse({ categories, tools }: { categories: { id: string; name: string }[]; tools: { id: string; name: string }[] }) {
    const [isItemPopoverOpen, setIsItemPopoverOpen] = useState(false);
    const [showStrikethroughPrice, setShowStrikethroughPrice] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [sneakPeekImages, setSneakPeekImages] = useState<File[]>([]);
    const [sneakPeekPreviews, setSneakPeekPreviews] = useState<string[]>([]);
    const [thumbnailError, setThumbnailError] = useState(false);
    const [sneakPeekError, setSneakPeekError] = useState(false);

    const [modules, setModules] = useState<{ title: string; description?: string; lessons?: Lesson[] }[]>([]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: '',
            category_id: '',
            short_description: '',
            description: '',
            key_points: `<ul>
                            <li>Mempelajari fitur-fitur untuk bikin web modern (Contoh)</li>
                            <li>Membuat dashboard, cms, dan restful api dengan filament (Contoh)</li>
                            <li>Memahami cara kerja hooks pada reactjs dan nextjs (Contoh)</li>
                        </ul>`,
            thumbnail: '',
            strikethrough_price: 0,
            price: 0,
            level: 'beginner',
            tools: [],
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        const formData = new FormData();

        Object.entries(values).forEach(([key, value]) => {
            if (key === 'thumbnail' && value) {
                formData.append('thumbnail', value);
            } else if (key === 'tools' && Array.isArray(value)) {
                value.forEach((toolId) => formData.append('tools[]', toolId));
            } else if (key !== 'thumbnail' && key !== 'sneak_peek_images' && key !== 'tools') {
                formData.append(key, value as string);
            }
        });

        sneakPeekImages.forEach((file, idx) => {
            formData.append(`sneak_peek_images[${idx}]`, file);
        });

        modules.forEach((mod, modIdx) => {
            mod.lessons?.forEach((lesson, lessonIdx) => {
                if (lesson.type === 'file' && lesson.attachment instanceof File) {
                    formData.append(`modules[${modIdx}][lessons][${lessonIdx}][attachment]`, lesson.attachment);
                }
            });
        });

        const modulesWithoutAttachment = modules.map((mod) => ({
            ...mod,
            lessons: mod.lessons?.map((lesson) => {
                const { ...rest } = lesson;
                return rest;
            }),
        }));
        formData.append('modules', JSON.stringify(modulesWithoutAttachment));

        router.post(route('courses.store'), formData, { forceFormData: true });
    }

    const handleSneakPeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []).slice(0, 4);

        // Cek ukuran file
        const oversize = files.some((file) => file.size > 2 * 1024 * 1024);
        setSneakPeekError(oversize);
        if (oversize) {
            toast('Ukuran setiap gambar maksimal 2MB!');
            return;
        }

        setSneakPeekImages(files);

        // Preview
        const readers = files.map((file) => {
            return new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = (ev) => resolve(ev.target?.result as string);
                reader.readAsDataURL(file);
            });
        });
        Promise.all(readers).then(setSneakPeekPreviews);
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah Kelas Baru" />
            <div className="px-4 py-4 md:px-6">
                <h1 className="text-2xl font-semibold">Tambah Kelas Baru</h1>
                <p className="text-muted-foreground mb-6 max-w-2xl text-sm">
                    Silakan isi form di bawah ini untuk membuat kelas baru. Setelah selesai, klik tombol "Simpan Draft" untuk menyimpan kelas sebagai
                    draft.
                </p>
                <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-6 rounded-lg border p-4">
                                <div className="flex items-center gap-2">
                                    <BookMarked size={16} />
                                    <h3 className="font-medium">Detail Informasi Kelas</h3>
                                </div>
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Judul Kelas</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Masukkan judul kelas" {...field} autoComplete="off" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="category_id"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Kategori</FormLabel>
                                            <Popover open={isItemPopoverOpen} onOpenChange={setIsItemPopoverOpen}>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            className={cn('justify-between', !field.value && 'text-muted-foreground')}
                                                        >
                                                            {field.value
                                                                ? categories.find((category) => category.id === field.value)?.name
                                                                : 'Pilih kategori'}
                                                            <span className="sr-only">Pilih kategori</span>
                                                            <ChevronsUpDown className="opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="p-0">
                                                    <Command>
                                                        <CommandInput placeholder="Cari kategori..." className="h-9" />
                                                        <CommandList>
                                                            <CommandEmpty>Tidak ada kategori ditemukan.</CommandEmpty>
                                                            <CommandGroup>
                                                                {categories.map((category) => (
                                                                    <CommandItem
                                                                        value={category.name}
                                                                        key={category.id}
                                                                        onSelect={() => {
                                                                            form.setValue('category_id', category.id);
                                                                            setIsItemPopoverOpen(false);
                                                                        }}
                                                                    >
                                                                        {category.name}
                                                                        <Check
                                                                            className={cn(
                                                                                'ml-auto',
                                                                                category.id === field.value ? 'opacity-100' : 'opacity-0',
                                                                            )}
                                                                        />
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="tools"
                                    render={() => (
                                        <FormItem>
                                            <FormLabel>Tools yang Digunakan</FormLabel>
                                            <div className="text-muted-foreground mb-2 text-sm">Pilih tools yang digunakan pada bootcamp ini.</div>
                                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                                                {tools.map((tool) => (
                                                    <FormField
                                                        key={tool.id}
                                                        control={form.control}
                                                        name="tools"
                                                        render={({ field }) => (
                                                            <FormItem className="flex flex-row items-center gap-2 space-y-0">
                                                                <FormControl>
                                                                    <Checkbox
                                                                        checked={field.value?.includes(tool.id)}
                                                                        onCheckedChange={(checked) => {
                                                                            if (checked) {
                                                                                field.onChange([...(field.value ?? []), tool.id]);
                                                                            } else {
                                                                                field.onChange(field.value?.filter((id: string) => id !== tool.id));
                                                                            }
                                                                        }}
                                                                    />
                                                                </FormControl>
                                                                <FormLabel className="text-sm font-normal">{tool.name}</FormLabel>
                                                            </FormItem>
                                                        )}
                                                    />
                                                ))}
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="short_description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Deskripsi Singkat</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Masukkan deskripsi singkat"
                                                    {...field}
                                                    value={field.value ?? ''}
                                                    autoComplete="off"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Deskripsi Lengkap</FormLabel>
                                            <Textarea
                                                {...field}
                                                value={field.value ?? ''}
                                                className="w-full rounded border p-2"
                                                placeholder="Masukkan deskripsi lengkap"
                                                autoComplete="off"
                                            />
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="key_points"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Materi (Poin Utama)</FormLabel>
                                            <Editor
                                                apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
                                                value={field.value ?? ''}
                                                onEditorChange={(content) => field.onChange(content)}
                                                init={{
                                                    plugins: [
                                                        'anchor',
                                                        'autolink',
                                                        'charmap',
                                                        'codesample',
                                                        'emoticons',
                                                        'image',
                                                        'link',
                                                        'lists',
                                                        'media',
                                                        'searchreplace',
                                                        'table',
                                                        'visualblocks',
                                                        'wordcount',
                                                    ],
                                                    onboarding: false,
                                                    toolbar:
                                                        'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table mergetags | addcomment showcomments | spellcheckdialog a11ycheck typography | align lineheight | checklist numlist bullist indent outdent | emoticons charmap | removeformat',
                                                    tinycomments_mode: 'embedded',
                                                    tinycomments_author: 'Author name',
                                                    mergetags_list: [
                                                        { value: 'First.Name', title: 'First Name' },
                                                        { value: 'Email', title: 'Email' },
                                                    ],
                                                    height: 300,
                                                }}
                                            />
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="thumbnail"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Thumbnail (File Upload)</FormLabel>
                                            <img
                                                src={preview || '/assets/images/placeholder.png'}
                                                alt="Preview Thumbnail"
                                                className="my-1 mt-2 h-40 w-64 rounded border object-cover"
                                            />
                                            <Input
                                                type="file"
                                                name={field.name}
                                                accept="image/png, image/jpeg, image/jpg"
                                                className={thumbnailError ? 'border-red-500 focus-visible:ring-red-500' : ''}
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0] ?? null;
                                                    if (file) {
                                                        const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
                                                        if (!validTypes.includes(file.type)) {
                                                            setThumbnailError(true);
                                                            toast('Gambar harus png, jpg, atau jpeg');
                                                            return;
                                                        }
                                                        if (file.size > 2 * 1024 * 1024) {
                                                            setThumbnailError(true);
                                                            toast('Ukuran file maksimal 2MB!');
                                                            return;
                                                        }
                                                    }
                                                    setThumbnailError(false);
                                                    field.onChange(file);
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onload = (ev) => setPreview(ev.target?.result as string);
                                                        reader.readAsDataURL(file);
                                                    } else {
                                                        setPreview(null);
                                                    }
                                                }}
                                            />
                                            <FormDescription className="ms-1">Upload gambar. Format: PNG, JPEG atau JPG Max 2 Mb</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormItem>
                                    <FormLabel>Sneak Peek Kelas (Maksimal 4 gambar)</FormLabel>
                                    {sneakPeekPreviews.length > 0 && (
                                        <div className="mb-2 flex flex-wrap gap-2">
                                            {sneakPeekPreviews.map((src, idx) => (
                                                <img
                                                    key={idx}
                                                    src={src}
                                                    alt={`Sneak Peek ${idx + 1}`}
                                                    className="h-24 w-24 rounded border object-cover"
                                                />
                                            ))}
                                        </div>
                                    )}
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleSneakPeekChange}
                                        max={4}
                                        className={sneakPeekError ? 'border-red-500 focus-visible:ring-red-500' : ''}
                                    />
                                    <FormDescription className="ms-1">Upload hingga 4 gambar. Format: PNG/JPG, max 2MB per gambar.</FormDescription>
                                </FormItem>
                                <div className="space-y-4 rounded-md border p-4">
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="show-strikethrough"
                                            checked={showStrikethroughPrice}
                                            onCheckedChange={(checked) => {
                                                setShowStrikethroughPrice(checked);
                                                if (!checked) {
                                                    form.setValue('strikethrough_price', 0);
                                                }
                                            }}
                                        />
                                        <Label htmlFor="show-strikethrough">Aktifkan Harga Coret (Opsional)</Label>
                                    </div>

                                    {showStrikethroughPrice && (
                                        <FormField
                                            control={form.control}
                                            name="strikethrough_price"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Harga Coret</FormLabel>
                                                    <Input
                                                        {...field}
                                                        type="text"
                                                        placeholder="Rp 0"
                                                        value={rupiahFormatter.format(field.value || 0)}
                                                        onChange={(e) => field.onChange(parseRupiah(e.target.value))}
                                                        autoComplete="off"
                                                    />
                                                    <FormDescription>Harga asli yang akan ditampilkan tercoret.</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                </div>
                                <FormField
                                    control={form.control}
                                    name="price"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Harga</FormLabel>
                                            <Input
                                                {...field}
                                                type="text"
                                                placeholder="Masukkan harga kursus"
                                                value={rupiahFormatter.format(field.value || 0)}
                                                onChange={(e) => field.onChange(parseRupiah(e.target.value))}
                                                autoComplete="off"
                                            />
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="level"
                                    render={({ field }) => (
                                        <FormItem className="space-y-3">
                                            <FormLabel>Tingkat Kesulitan</FormLabel>
                                            <FormControl>
                                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col">
                                                    <FormItem className="flex items-center gap-3">
                                                        <FormControl>
                                                            <RadioGroupItem value="beginner" />
                                                        </FormControl>
                                                        <FormLabel className="font-normal">Beginner</FormLabel>
                                                    </FormItem>
                                                    <FormItem className="flex items-center gap-3">
                                                        <FormControl>
                                                            <RadioGroupItem value="intermediate" />
                                                        </FormControl>
                                                        <FormLabel className="font-normal">Intermediate</FormLabel>
                                                    </FormItem>
                                                    <FormItem className="flex items-center gap-3">
                                                        <FormControl>
                                                            <RadioGroupItem value="advanced" />
                                                        </FormControl>
                                                        <FormLabel className="font-normal">Advanced</FormLabel>
                                                    </FormItem>
                                                </RadioGroup>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <Button type="submit" className="w-full hover:cursor-pointer">
                                Simpan Draft
                            </Button>
                        </form>
                    </Form>
                    <CourseModulesSection modules={modules} setModules={setModules} lessons={[]} setLessons={() => {}} />
                </div>
            </div>
        </AdminLayout>
    );
}
