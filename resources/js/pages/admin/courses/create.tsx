'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import AdminLayout from '@/layouts/admin-layout';
import { cn, parseRupiah, rupiahFormatter } from '@/lib/utils';
import { BreadcrumbItem } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Head, Link, router } from '@inertiajs/react';
import { BookImage, BookMarked, Check, ChevronsUpDown, Edit, Folder, Plus, Trash } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Kelas',
        href: route('courses.index'),
    },
    {
        title: 'Tambah Kelas Baru',
        href: route('courses.create'),
    },
];

const formSchema = z.object({
    id: z.string().uuid(),
    title: z.string().nonempty('Judul harus diisi'),
    category_id: z.string().nonempty('Kategori harus dipilih'),
    short_description: z.string().max(200).nullable(),
    description: z.string().max(1000).nullable(),
    thumbnail: z.any().nullable(),
    price: z.number().min(0),
    level: z.enum(['beginner', 'intermediate', 'advanced']),
});

export default function CreateCourse(categories: { categories: { id: string; name: string }[] }) {
    const [isItemPopoverOpen, setIsItemPopoverOpen] = useState(false);

    const courseId = uuidv4();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            id: courseId,
            title: '',
            category_id: '',
            short_description: '',
            description: '',
            thumbnail: '',
            price: 0,
            level: 'beginner',
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        router.post(route('courses.store'), values);
    }

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah Kelas Baru" />
            <div className="px-4 py-4 md:px-6">
                <h1 className="text-2xl font-semibold">Tambah Kelas Baru</h1>
                <p className="text-muted-foreground mb-6 max-w-2xl text-sm">
                    Silakan isi form di bawah ini untuk membuat kelas baru. Setelah selesai, klik tombol "Simpan Draft" untuk menyimpan kelas sebagai
                    draft.
                </p>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
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
                                                            ? categories.categories.find((category) => category.id === field.value)?.name
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
                                                            {categories.categories.map((category) => (
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
                                name="short_description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Deskripsi Singkat</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Masukkan deskripsi singkat" {...field} value={field.value ?? ''} autoComplete="off" />
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
                                name="thumbnail"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Thumbnail (File Upload)</FormLabel>
                                        <Input type="file" name={field.name} onChange={(e) => field.onChange(e.target.files?.[0] ?? null)} />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
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
                                                    <FormLabel className="font-normal">Pemula</FormLabel>
                                                </FormItem>
                                                <FormItem className="flex items-center gap-3">
                                                    <FormControl>
                                                        <RadioGroupItem value="intermediate" />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">Menengah</FormLabel>
                                                </FormItem>
                                                <FormItem className="flex items-center gap-3">
                                                    <FormControl>
                                                        <RadioGroupItem value="advanced" />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">Lanjutan</FormLabel>
                                                </FormItem>
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="space-y-4 rounded-lg border p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <BookImage size={16} />
                                    <h3 className="font-medium">Materi Kelas</h3>
                                </div>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline" className="size-8">
                                            <Plus />
                                            <span className="sr-only">Tambah Modul</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Tambah Modul</p>
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                            <div className="space-y-4">
                                <ul className="space-y-2">
                                    <li>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Modul 1</span>
                                            <div className="flex items-center justify-center">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="link" size="icon" className="size-8 hover:cursor-pointer">
                                                            <Edit />
                                                            <span className="sr-only">Edit Modul</span>
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Edit Modul</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="link"
                                                            size="icon"
                                                            className="size-8 text-red-500 hover:cursor-pointer"
                                                            asChild
                                                        >
                                                            <Link method="delete" href={'/'}>
                                                                <Trash />
                                                                <span className="sr-only">Hapus Modul</span>
                                                            </Link>
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Hapus Modul</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">Install Tools</span>
                                            <div className="flex items-center justify-center">
                                                <Badge className="mr-2">Text</Badge>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="link" size="icon" className="size-8 hover:cursor-pointer">
                                                            <Folder />
                                                            <span className="sr-only">Lihat Materi</span>
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Lihat Materi</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="link" size="icon" className="size-8 hover:cursor-pointer">
                                                            <Edit />
                                                            <span className="sr-only">Edit Materi</span>
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Edit Materi</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="link"
                                                            size="icon"
                                                            className="size-8 text-red-500 hover:cursor-pointer"
                                                            asChild
                                                        >
                                                            <Link method="delete" href={'/'}>
                                                                <Trash />
                                                                <span className="sr-only">Hapus Materi</span>
                                                            </Link>
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Hapus Materi</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">Mengenal Javascript</span>
                                            <div className="flex items-center justify-center">
                                                <Badge className="mr-2">Video</Badge>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="link" size="icon" className="size-8 hover:cursor-pointer">
                                                            <Folder />
                                                            <span className="sr-only">Lihat Materi</span>
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Lihat Materi</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="link" size="icon" className="size-8 hover:cursor-pointer">
                                                            <Edit />
                                                            <span className="sr-only">Edit Materi</span>
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Edit Materi</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="link"
                                                            size="icon"
                                                            className="size-8 text-red-500 hover:cursor-pointer"
                                                            asChild
                                                        >
                                                            <Link method="delete" href={'/'}>
                                                                <Trash />
                                                                <span className="sr-only">Hapus Materi</span>
                                                            </Link>
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Hapus Materi</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </div>
                                    </li>
                                    <Separator />
                                    <li>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Modul 2</span>
                                            <div className="flex items-center justify-center">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="link" size="icon" className="size-8 hover:cursor-pointer">
                                                            <Edit />
                                                            <span className="sr-only">Edit Modul</span>
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Edit Modul</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="link"
                                                            size="icon"
                                                            className="size-8 text-red-500 hover:cursor-pointer"
                                                            asChild
                                                        >
                                                            <Link method="delete" href={'/'}>
                                                                <Trash />
                                                                <span className="sr-only">Hapus Modul</span>
                                                            </Link>
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Hapus Modul</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">Design Web</span>
                                            <div className="flex items-center justify-center">
                                                <Badge className="mr-2">Text</Badge>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="link" size="icon" className="size-8 hover:cursor-pointer">
                                                            <Folder />
                                                            <span className="sr-only">Lihat Materi</span>
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Lihat Materi</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="link" size="icon" className="size-8 hover:cursor-pointer">
                                                            <Edit />
                                                            <span className="sr-only">Edit Materi</span>
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Edit Materi</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="link"
                                                            size="icon"
                                                            className="size-8 text-red-500 hover:cursor-pointer"
                                                            asChild
                                                        >
                                                            <Link method="delete" href={'/'}>
                                                                <Trash />
                                                                <span className="sr-only">Hapus Materi</span>
                                                            </Link>
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Hapus Materi</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">Slicing Component</span>
                                            <div className="flex items-center justify-center">
                                                <Badge className="mr-2">Video</Badge>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="link" size="icon" className="size-8 hover:cursor-pointer">
                                                            <Folder />
                                                            <span className="sr-only">Lihat Materi</span>
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Lihat Materi</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="link" size="icon" className="size-8 hover:cursor-pointer">
                                                            <Edit />
                                                            <span className="sr-only">Edit Materi</span>
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Edit Materi</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="link"
                                                            size="icon"
                                                            className="size-8 text-red-500 hover:cursor-pointer"
                                                            asChild
                                                        >
                                                            <Link method="delete" href={'/'}>
                                                                <Trash />
                                                                <span className="sr-only">Hapus Materi</span>
                                                            </Link>
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Hapus Materi</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <Button type="submit" className="hover:cursor-pointer">
                            Simpan Draft
                        </Button>
                    </form>
                </Form>
            </div>
        </AdminLayout>
    );
}
