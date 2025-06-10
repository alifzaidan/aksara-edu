'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/layouts/admin-layout';
import { cn, parseRupiah, rupiahFormatter } from '@/lib/utils';
import { BreadcrumbItem } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Head, router } from '@inertiajs/react';
import { Editor } from '@tinymce/tinymce-react';
import { BookMarked, CalendarFold, Check, ChevronDownIcon, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import BootcampScheduleInput, { BootcampSchedule } from './schedule-input';

interface Bootcamp {
    id: string;
    title: string;
    category?: { name: string };
    schedules?: BootcampSchedule[];
    category_id: string;
    batch?: number | null;
    price: number;
    quota: number;
    start_date: string | Date;
    end_date: string | Date;
    registration_deadline: string | Date;
    status: string;
    bootcamp_url: string;
    registration_url: string;
    thumbnail?: string | null;
    description?: string | null;
    benefits?: string | null;
    instructions?: string | null;
    host_name?: string | null;
    host_description?: string | null;
    created_at: string | Date;
}

const formSchema = z.object({
    title: z.string().nonempty('Judul harus diisi'),
    category_id: z.string().nonempty('Kategori harus dipilih'),
    description: z.string().nullable(),
    benefits: z.string().nullable(),
    thumbnail: z.any().nullable(),
    start_date: z.string(),
    end_date: z.string(),
    registration_deadline: z.string(),
    host_name: z.string().nullable(),
    host_description: z.string().nullable(),
    price: z.number().min(0),
    quota: z.number().min(0),
    instructions: z.string().nullable(),
    batch: z.number().min(0),
});

export default function EditBootcamp({ bootcamp, categories }: { bootcamp: Bootcamp; categories: { id: string; name: string }[] }) {
    const [isItemPopoverOpen, setIsItemPopoverOpen] = useState(false);
    const [openStartCalendar, setOpenStartCalendar] = useState(false);
    const [openEndCalendar, setOpenEndCalendar] = useState(false);
    const [openRegistrationCalendar, setOpenRegistrationCalendar] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Bootcamp',
            href: route('bootcamps.index'),
        },
        {
            title: bootcamp.title,
            href: route('bootcamps.show', { bootcamp: bootcamp.id }),
        },
        {
            title: 'Edit Bootcamp',
            href: route('bootcamps.edit', { bootcamp: bootcamp.id }),
        },
    ];

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: bootcamp.title ?? '',
            category_id: bootcamp.category_id ?? '',
            description: bootcamp.description ?? '',
            benefits: bootcamp.benefits ?? '',
            thumbnail: '',
            start_date: typeof bootcamp.start_date === 'string' ? bootcamp.start_date : (bootcamp.start_date?.toISOString() ?? ''),
            end_date: typeof bootcamp.end_date === 'string' ? bootcamp.end_date : (bootcamp.end_date?.toISOString() ?? ''),
            registration_deadline:
                typeof bootcamp.registration_deadline === 'string'
                    ? bootcamp.registration_deadline
                    : (bootcamp.registration_deadline?.toISOString() ?? ''),
            host_name: bootcamp.host_name ?? '',
            host_description: bootcamp.host_description ?? '',
            price: bootcamp.price ?? 0,
            quota: bootcamp.quota ?? 0,
            instructions: bootcamp.instructions ?? '',
            batch: bootcamp.batch ?? 0,
        },
    });

    const [schedules, setSchedules] = useState<BootcampSchedule[]>(
        bootcamp.schedules?.map((s: BootcampSchedule) => ({
            day: s.day,
            start_time: s.start_time,
            end_time: s.end_time,
        })) ?? [],
    );

    function onSubmit(values: z.infer<typeof formSchema>) {
        router.post(route('bootcamps.update', { bootcamp: bootcamp.id }), { ...values, schedules, _method: 'PUT' }, { forceFormData: true });
    }

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Bootcamp - ${bootcamp.title}`} />
            <div className="px-4 py-4 md:px-6">
                <h1 className="text-2xl font-semibold">Edit Bootcamp {bootcamp.title}</h1>
                <p className="text-muted-foreground mb-6 max-w-2xl text-sm">
                    Silakan isi form di bawah ini untuk mengedit bootcamp. Setelah selesai, klik tombol "Simpan Draft" untuk menyimpan perubahan
                    sebagai draft.
                </p>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
                        <div className="space-y-6 rounded-lg border p-4">
                            <div className="flex items-center gap-2">
                                <BookMarked size={16} />
                                <h3 className="font-medium">Detail Informasi Bootcamp</h3>
                            </div>
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Judul Bootcamp <span className="text-red-500">*</span>
                                        </FormLabel>
                                        <FormControl>
                                            <Input placeholder="Masukkan judul bootcamp" {...field} autoComplete="off" />
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
                                        <FormLabel>
                                            Kategori <span className="text-red-500">*</span>
                                        </FormLabel>
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
                                        <img
                                            src={
                                                preview
                                                    ? preview
                                                    : bootcamp.thumbnail
                                                      ? `/storage/${bootcamp.thumbnail}`
                                                      : '/assets/images/placeholder.png'
                                            }
                                            alt={bootcamp.title}
                                            className="my-1 mt-2 h-40 w-64 rounded border object-cover"
                                        />
                                        <Input
                                            type="file"
                                            name={field.name}
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0] ?? null;
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
                                        <FormDescription className="ms-1">Upload Icon. Format: PNG atau JPG Max 2 Mb</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="price"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Harga <span className="text-red-500">*</span>
                                        </FormLabel>
                                        <Input
                                            {...field}
                                            type="text"
                                            placeholder="Masukkan harga bootcamp"
                                            value={rupiahFormatter.format(field.value || 0)}
                                            onChange={(e) => field.onChange(parseRupiah(e.target.value))}
                                            autoComplete="off"
                                        />
                                        <FormDescription className="ms-1">Isi 0 untuk harga bootcamp gratis</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="batch"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Batch</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                {...field}
                                                onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                                                placeholder="Masukkan batch"
                                                autoComplete="off"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="quota"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Kuota Peserta</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                {...field}
                                                onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                                                placeholder="Masukkan kuota peserta"
                                                autoComplete="off"
                                            />
                                        </FormControl>
                                        <FormDescription className="ms-1">Isi 0 untuk kuota tak terbatas</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="instructions"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Instruksi Peserta</FormLabel>
                                        <Textarea
                                            {...field}
                                            value={field.value ?? ''}
                                            className="w-full rounded border p-2"
                                            placeholder="Masukkan instruksi setelah peserta mendaftar"
                                            autoComplete="off"
                                        />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="space-y-6 rounded-lg border p-4">
                            <div className="flex items-center gap-2">
                                <CalendarFold size={16} />
                                <h3 className="font-medium">Tanggal dan Informasi Pemateri</h3>
                            </div>
                            <div className="flex flex-col gap-4 lg:flex-row">
                                <FormField
                                    control={form.control}
                                    name="start_date"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>
                                                Waktu Mulai <span className="text-red-500">*</span>
                                            </FormLabel>
                                            <div className="flex gap-4">
                                                <div className="flex flex-col gap-3">
                                                    <Popover open={openStartCalendar} onOpenChange={setOpenStartCalendar}>
                                                        <PopoverTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                id="date"
                                                                className="w-32 justify-between font-normal"
                                                                type="button"
                                                            >
                                                                {field.value
                                                                    ? new Date(field.value).toLocaleDateString('id-ID', {
                                                                          day: 'numeric',
                                                                          month: 'short',
                                                                          year: 'numeric',
                                                                      })
                                                                    : 'Pilih tanggal'}
                                                                <ChevronDownIcon />
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                                                            <Calendar
                                                                mode="single"
                                                                selected={field.value ? new Date(field.value) : undefined}
                                                                captionLayout="dropdown"
                                                                onSelect={(date) => {
                                                                    if (!date) return;
                                                                    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                                                                    field.onChange(dateStr);
                                                                    setOpenStartCalendar(false);
                                                                }}
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                </div>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="end_date"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>
                                                Waktu Selesai <span className="text-red-500">*</span>
                                            </FormLabel>
                                            <div className="flex gap-4">
                                                <div className="flex flex-col gap-3">
                                                    <Popover open={openEndCalendar} onOpenChange={setOpenEndCalendar}>
                                                        <PopoverTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                id="date"
                                                                className="w-32 justify-between font-normal"
                                                                type="button"
                                                            >
                                                                {field.value
                                                                    ? new Date(field.value).toLocaleDateString('id-ID', {
                                                                          day: 'numeric',
                                                                          month: 'short',
                                                                          year: 'numeric',
                                                                      })
                                                                    : 'Pilih tanggal'}
                                                                <ChevronDownIcon />
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                                                            <Calendar
                                                                mode="single"
                                                                selected={field.value ? new Date(field.value) : undefined}
                                                                captionLayout="dropdown"
                                                                onSelect={(date) => {
                                                                    if (!date) return;
                                                                    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                                                                    field.onChange(dateStr);
                                                                    setOpenEndCalendar(false);
                                                                }}
                                                            />
                                                        </PopoverContent>
                                                    </Popover>
                                                </div>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <BootcampScheduleInput value={schedules} onChange={setSchedules} />
                            <FormField
                                control={form.control}
                                name="registration_deadline"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>
                                            Deadline Pendaftaran <span className="text-red-500">*</span>
                                        </FormLabel>
                                        <div className="flex gap-4">
                                            <div className="flex flex-col gap-3">
                                                <Popover open={openRegistrationCalendar} onOpenChange={setOpenRegistrationCalendar}>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            id="date"
                                                            className="w-32 justify-between font-normal"
                                                            type="button"
                                                        >
                                                            {field.value
                                                                ? new Date(field.value).toLocaleDateString('id-ID', {
                                                                      day: 'numeric',
                                                                      month: 'short',
                                                                      year: 'numeric',
                                                                  })
                                                                : 'Pilih tanggal'}
                                                            <ChevronDownIcon />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value ? new Date(field.value) : undefined}
                                                            captionLayout="dropdown"
                                                            onSelect={(date) => {
                                                                const prev = field.value ? new Date(field.value) : new Date();
                                                                const time = prev.toTimeString().split(' ')[0];
                                                                const dateStr = date
                                                                    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
                                                                    : '';
                                                                field.onChange(dateStr && time ? `${dateStr}T${time}` : '');
                                                                setOpenRegistrationCalendar(false);
                                                            }}
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                            <div className="flex flex-col gap-3">
                                                <Input
                                                    type="time"
                                                    id="time"
                                                    step="60"
                                                    value={field.value ? new Date(field.value).toTimeString().slice(0, 5) : '10:30'}
                                                    onChange={(e) => {
                                                        const prev = field.value ? new Date(field.value) : new Date();
                                                        const dateStr = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-${String(prev.getDate()).padStart(2, '0')}`;
                                                        const time = e.target.value || '00:00';
                                                        field.onChange(`${dateStr}T${time}:00`);
                                                    }}
                                                    className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                                                />
                                            </div>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="host_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nama Pemateri</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Masukkan nama pemateri" {...field} value={field.value ?? ''} autoComplete="off" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="host_description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Deskripsi Pemateri</FormLabel>
                                        <Textarea
                                            {...field}
                                            value={field.value ?? ''}
                                            className="w-full rounded border p-2"
                                            placeholder="Masukkan deskripsi pemateri"
                                            autoComplete="off"
                                        />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="benefits"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Benefit Mengikuti Bootcamp</FormLabel>
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
                        </div>
                        <Button type="submit">Simpan Perubahan</Button>
                    </form>
                </Form>
            </div>
        </AdminLayout>
    );
}
