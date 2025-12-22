'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useInitials } from '@/hooks/use-initials';
import AdminLayout from '@/layouts/admin-layout';
import { cn, parseRupiah, rupiahFormatter } from '@/lib/utils';
import { BreadcrumbItem } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Head, router } from '@inertiajs/react';
import { Editor } from '@tinymce/tinymce-react';
import { BookMarked, CalendarFold, Check, ChevronDownIcon, ChevronsUpDown, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import BootcampScheduleInput, { BootcampSchedule } from './schedule-input';

interface Bootcamp {
    id: string;
    user_id: string;
    title: string;
    category?: { name: string };
    schedules?: BootcampSchedule[];
    category_id: string;
    batch?: number | null;
    strikethrough_price: number;
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
    requirements?: string | null;
    curriculum?: string | null;
    group_url?: string | null;
    host_name?: string | null;
    host_description?: string | null;
    has_submission_link?: boolean;
    created_at: string | Date;
    tools?: { id: string; name: string; description?: string | null }[];
}

interface Mentor {
    id: string;
    name: string;
    bio?: string;
    avatar?: string;
}

const formSchema = z
    .object({
        user_id: z.string().nonempty('Mentor harus dipilih'),
        title: z.string().nonempty('Judul harus diisi'),
        category_id: z.string().nonempty('Kategori harus dipilih'),
        description: z.string().nullable(),
        benefits: z.string().nullable(),
        requirements: z.string().nullable(),
        curriculum: z.string().nullable(),
        thumbnail: z.any().nullable(),
        start_date: z.string(),
        end_date: z.string(),
        registration_deadline: z.string(),
        strikethrough_price: z.number().min(0),
        price: z.number().min(0),
        quota: z.number().min(0),
        group_url: z.string().nullable(),
        batch: z.number().min(0),
        has_submission_link: z.boolean().optional(),
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

export default function EditBootcamp({
    bootcamp,
    categories,
    tools,
    mentors,
}: {
    bootcamp: Bootcamp;
    categories: { id: string; name: string }[];
    tools: { id: string; name: string }[];
    mentors: Mentor[];
}) {
    const getInitials = useInitials();
    const [isItemPopoverOpen, setIsItemPopoverOpen] = useState(false);
    const [isMentorPopoverOpen, setIsMentorPopoverOpen] = useState(false);
    const [openStartCalendar, setOpenStartCalendar] = useState(false);
    const [openEndCalendar, setOpenEndCalendar] = useState(false);
    const [openRegistrationCalendar, setOpenRegistrationCalendar] = useState(false);
    const [showStrikethroughPrice, setShowStrikethroughPrice] = useState(bootcamp.strikethrough_price > 0);
    const [preview, setPreview] = useState<string | null>(null);
    const [thumbnailError, setThumbnailError] = useState(false);

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
            user_id: bootcamp.user_id,
            title: bootcamp.title ?? '',
            category_id: bootcamp.category_id ?? '',
            description: bootcamp.description ?? '',
            benefits: bootcamp.benefits ?? '',
            requirements: bootcamp.requirements ?? '',
            curriculum: bootcamp.curriculum ?? '',
            thumbnail: '',
            start_date: typeof bootcamp.start_date === 'string' ? bootcamp.start_date : (bootcamp.start_date?.toISOString() ?? ''),
            end_date: typeof bootcamp.end_date === 'string' ? bootcamp.end_date : (bootcamp.end_date?.toISOString() ?? ''),
            registration_deadline:
                typeof bootcamp.registration_deadline === 'string'
                    ? bootcamp.registration_deadline
                    : (bootcamp.registration_deadline?.toISOString() ?? ''),
            strikethrough_price: bootcamp.strikethrough_price ?? 0,
            price: bootcamp.price ?? 0,
            quota: bootcamp.quota ?? 0,
            group_url: bootcamp.group_url ?? '',
            batch: bootcamp.batch ?? 1,
            has_submission_link: Boolean(bootcamp.has_submission_link),
            tools: bootcamp.tools?.map((tool) => tool.id) ?? [],
        },
    });

    const startVal = form.watch('start_date');
    const endVal = form.watch('end_date');

    useEffect(() => {
        if (!startVal || !endVal) return;
        const sd = new Date(startVal);
        const ed = new Date(endVal);
        if (ed < sd) {
            form.setValue('end_date', startVal, { shouldDirty: true, shouldValidate: true });
        }
    }, [startVal, endVal]); // eslint-disable-line react-hooks/exhaustive-deps

    function formatYmd(date: Date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    const [schedules, setSchedules] = useState<BootcampSchedule[]>(
        bootcamp.schedules?.map((s: BootcampSchedule) => ({
            schedule_date: s.schedule_date,
            day: s.day,
            start_time: s.start_time,
            end_time: s.end_time,
        })) ?? [],
    );

    function onSubmit(values: z.infer<typeof formSchema>) {
        router.post(route('bootcamps.update', { bootcamp: bootcamp.id }), { ...values, schedules, _method: 'PUT' }, { forceFormData: true });
    }

    const selectedMentor = mentors.find((m) => m.id === form.watch('user_id'));

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
                                name="tools"
                                render={() => (
                                    <FormItem>
                                        <FormLabel>Tools yang Digunakan</FormLabel>
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
                                        <FormDescription className="ms-1">Upload Icon. Format: PNG atau JPG Max 2 Mb</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
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
                                name="curriculum"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Kurikum</FormLabel>
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
                                name="group_url"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Link Group Peserta</FormLabel>
                                        <Textarea
                                            {...field}
                                            value={field.value ?? ''}
                                            className="w-full rounded border p-2"
                                            placeholder="Masukkan link grup peserta"
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
                                    render={({ field }) => {
                                        const endDateObj = endVal ? new Date(endVal) : undefined;
                                        return (
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
                                                                    defaultMonth={field.value ? new Date(field.value) : undefined}
                                                                    disabled={(date) =>
                                                                        !!endDateObj &&
                                                                        date >
                                                                            new Date(
                                                                                endDateObj.getFullYear(),
                                                                                endDateObj.getMonth(),
                                                                                endDateObj.getDate(),
                                                                            )
                                                                    }
                                                                    captionLayout="dropdown"
                                                                    onSelect={(date) => {
                                                                        if (!date) return;
                                                                        const dateStr = formatYmd(date);
                                                                        field.onChange(dateStr);
                                                                        const endDate = form.getValues('end_date');
                                                                        if (!endDate || new Date(endDate) < date) {
                                                                            form.setValue('end_date', dateStr, {
                                                                                shouldDirty: true,
                                                                                shouldValidate: true,
                                                                            });
                                                                        }
                                                                        setOpenStartCalendar(false);
                                                                    }}
                                                                />
                                                            </PopoverContent>
                                                        </Popover>
                                                    </div>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        );
                                    }}
                                />
                                <FormField
                                    control={form.control}
                                    name="end_date"
                                    render={({ field }) => {
                                        const startDateObj = startVal ? new Date(startVal) : undefined;
                                        return (
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
                                                                    disabled={(date) =>
                                                                        !!startDateObj &&
                                                                        date <
                                                                            new Date(
                                                                                startDateObj.getFullYear(),
                                                                                startDateObj.getMonth(),
                                                                                startDateObj.getDate(),
                                                                            )
                                                                    }
                                                                    onSelect={(date) => {
                                                                        if (!date) return;
                                                                        const dateStr = formatYmd(date);
                                                                        if (startDateObj && date < startDateObj) {
                                                                            field.onChange(formatYmd(startDateObj));
                                                                        } else {
                                                                            field.onChange(dateStr);
                                                                        }
                                                                        setOpenEndCalendar(false);
                                                                    }}
                                                                />
                                                            </PopoverContent>
                                                        </Popover>
                                                    </div>
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        );
                                    }}
                                />
                            </div>
                            <BootcampScheduleInput
                                value={schedules}
                                onChange={setSchedules}
                                startDate={startVal ? startVal.split('T')[0] : undefined}
                                endDate={endVal ? endVal.split('T')[0] : undefined}
                            />
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
                                                            endMonth={new Date(new Date().getFullYear() + 10, 11)}
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
                                name="user_id"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>
                                            Mentor / Pemateri <span className="text-red-500">*</span>
                                        </FormLabel>
                                        <Popover open={isMentorPopoverOpen} onOpenChange={setIsMentorPopoverOpen}>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className={cn('justify-between', !field.value && 'text-muted-foreground')}
                                                    >
                                                        {selectedMentor ? (
                                                            <div className="flex items-center gap-2">
                                                                <Avatar className="h-6 w-6">
                                                                    <AvatarImage src={selectedMentor.avatar} alt={selectedMentor.name} />
                                                                    <AvatarFallback className="text-xs">
                                                                        {getInitials(selectedMentor.name)}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <span>{selectedMentor.name}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="flex items-center gap-2">
                                                                <UserRound className="h-4 w-4" />
                                                                Pilih mentor
                                                            </span>
                                                        )}
                                                        <ChevronsUpDown className="opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[400px] p-0">
                                                <Command>
                                                    <CommandInput placeholder="Cari mentor..." className="h-9" />
                                                    <CommandList>
                                                        <CommandEmpty>Tidak ada mentor ditemukan.</CommandEmpty>
                                                        <CommandGroup>
                                                            {mentors.map((mentor) => (
                                                                <CommandItem
                                                                    value={mentor.name}
                                                                    key={mentor.id}
                                                                    onSelect={() => {
                                                                        form.setValue('user_id', mentor.id);
                                                                        setIsMentorPopoverOpen(false);
                                                                    }}
                                                                    className="flex items-start gap-2 py-2"
                                                                >
                                                                    <Avatar className="mt-0.5 h-8 w-8">
                                                                        <AvatarImage src={mentor.avatar} alt={mentor.name} />
                                                                        <AvatarFallback className="text-xs">
                                                                            {getInitials(mentor.name)}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <div className="flex-1">
                                                                        <p className="font-medium">{mentor.name}</p>
                                                                        {mentor.bio && (
                                                                            <p className="text-muted-foreground line-clamp-1 text-xs">{mentor.bio}</p>
                                                                        )}
                                                                    </div>
                                                                    <Check
                                                                        className={cn(
                                                                            'mt-1 ml-auto',
                                                                            mentor.id === field.value ? 'opacity-100' : 'opacity-0',
                                                                        )}
                                                                    />
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                        <FormDescription>Pilih mentor yang akan menjadi pemateri webinar ini</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="requirements"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Syarat Peserta</FormLabel>
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
                            <div className="flex items-center space-x-2">
                                <FormField
                                    control={form.control}
                                    name="has_submission_link"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center space-y-0 space-x-2">
                                            <FormControl>
                                                <Switch id="has-submission-link" checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                            <Label htmlFor="has-submission-link" className="cursor-pointer font-normal">
                                                Apakah bootcamp ini memiliki link submission?
                                            </Label>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                        <Button type="submit" className="hover:cursor-pointer">
                            Simpan Perubahan
                        </Button>
                    </form>
                </Form>
            </div>
        </AdminLayout>
    );
}
