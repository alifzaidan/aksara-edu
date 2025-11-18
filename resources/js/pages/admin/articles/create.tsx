'use client';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/layouts/admin-layout';
import { BreadcrumbItem } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Head, router } from '@inertiajs/react';
import { Editor } from '@tinymce/tinymce-react';
import { Clock, FileText } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Artikel',
        href: route('articles.index'),
    },
    {
        title: 'Tambah Artikel Baru',
        href: route('articles.create'),
    },
];

interface Category {
    id: string;
    name: string;
}

interface CreateProps {
    categories: Category[];
}

const formSchema = z.object({
    title: z.string().min(1, 'Judul harus diisi'),
    category_id: z.string().min(1, 'Kategori harus dipilih'),
    excerpt: z.string().nullable().optional(),
    content: z.string().nullable().optional(),
    thumbnail: z.any().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateArticle({ categories }: CreateProps) {
    const [preview, setPreview] = useState<string | null>(null);
    const [thumbnailError, setThumbnailError] = useState(false);
    const [readTime, setReadTime] = useState<number>(0);
    const [wordCount, setWordCount] = useState<number>(0);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: '',
            category_id: '',
            excerpt: '',
            content: '',
            thumbnail: null,
        },
    });
    const calculateReadTime = (content: string) => {
        const textContent = content.replace(/<[^>]*>/g, '');
        const words = textContent
            .trim()
            .split(/\s+/)
            .filter((word) => word.length > 0).length;
        const minutes = Math.max(1, Math.ceil(words / 200));

        setWordCount(words);
        setReadTime(minutes);
    };

    function onSubmit(values: FormValues) {
        router.post(route('articles.store'), values, { forceFormData: true });
    }

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah Artikel Baru" />
            <div className="px-4 py-4 md:px-6">
                <h1 className="text-2xl font-semibold">Tambah Artikel Baru</h1>
                <p className="text-muted-foreground mb-6 max-w-2xl text-sm">
                    Buat artikel blog atau konten edukatif untuk dibagikan kepada pengguna platform.
                </p>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
                        <div className="space-y-6 rounded-lg border p-4">
                            <div className="flex items-center gap-2">
                                <FileText size={16} />
                                <h3 className="font-medium">Informasi Artikel</h3>
                            </div>

                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Judul Artikel <span className="text-red-500">*</span>
                                        </FormLabel>
                                        <FormControl>
                                            <Input placeholder="Masukkan judul artikel" {...field} autoComplete="off" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="category_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Kategori <span className="text-red-500">*</span>
                                        </FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih kategori" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {categories.map((category) => (
                                                    <SelectItem key={category.id} value={category.id}>
                                                        {category.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="excerpt"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ringkasan Singkat</FormLabel>
                                        <Textarea
                                            {...field}
                                            value={field.value ?? ''}
                                            placeholder="Ringkasan singkat artikel (maks 500 karakter)"
                                            maxLength={500}
                                            rows={3}
                                            autoComplete="off"
                                        />
                                        <FormDescription>Ringkasan yang akan ditampilkan di list artikel</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="thumbnail"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Thumbnail</FormLabel>
                                        <img
                                            src={preview || '/assets/images/placeholder.png'}
                                            alt="Preview Thumbnail"
                                            className="my-1 mt-2 h-52 rounded border object-cover"
                                        />
                                        <Input
                                            type="file"
                                            name={field.name}
                                            accept="image/png, image/jpeg, image/jpg, image/webp"
                                            className={thumbnailError ? 'border-red-500 focus-visible:ring-red-500' : ''}
                                            onChange={(e) => {
                                                const file = e.target.files?.[0] ?? null;
                                                if (file) {
                                                    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
                                                    if (!validTypes.includes(file.type)) {
                                                        setThumbnailError(true);
                                                        toast.error('Gambar harus png, jpg, jpeg, atau webp');
                                                        return;
                                                    }
                                                    if (file.size > 2 * 1024 * 1024) {
                                                        setThumbnailError(true);
                                                        toast.error('Ukuran file maksimal 2MB!');
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
                                        <FormDescription>Format: PNG, JPG, JPEG, WEBP. Maksimal 2MB</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="space-y-6 rounded-lg border p-4">
                            <div className="flex items-center gap-2">
                                <FileText size={16} />
                                <h3 className="font-medium">Konten Artikel</h3>
                            </div>

                            <FormField
                                control={form.control}
                                name="content"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Konten</FormLabel>
                                        <Editor
                                            apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
                                            value={field.value ?? ''}
                                            onEditorChange={(content) => {
                                                field.onChange(content);
                                                calculateReadTime(content);
                                            }}
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
                                                    'code',
                                                ],
                                                toolbar:
                                                    'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table codesample | align lineheight | checklist numlist bullist indent outdent | emoticons charmap | removeformat | code',
                                                height: 500,
                                                menubar: false,
                                                content_style:
                                                    'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-size: 14px; }',
                                            }}
                                        />
                                        <FormDescription>Tulis konten artikel dengan lengkap dan menarik</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {wordCount > 0 && (
                                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-blue-600" />
                                            <span className="text-sm font-medium text-blue-900">Estimasi Waktu Baca</span>
                                        </div>
                                        <span className="text-lg font-bold text-blue-600">{readTime} menit</span>
                                    </div>
                                    <p className="mt-2 text-xs text-blue-700">
                                        {wordCount.toLocaleString()} kata • Kecepatan baca rata-rata: 200 kata/menit
                                    </p>
                                </div>
                            )}
                        </div>

                        <Button type="submit" className="hover:cursor-pointer lg:col-span-2" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? 'Menyimpan...' : 'Simpan Draft Artikel'}
                        </Button>
                    </form>
                </Form>
            </div>
        </AdminLayout>
    );
}
