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
import { BookMarked, CalendarFold, Check, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import CertificationProgramScheduleInput, { BootcampSchedule } from './schedule-input';

interface Category {
    id: string;
    name: string;
}
interface Mentor {
    id: string;
    name: string;
    bio?: string;
    avatar?: string;
}
interface Schedule {
    id?: string;
    title?: string;
    schedule_date: string;
    day: string;
    start_time: string;
    end_time: string;
}

interface Program {
    id: string;
    title: string;
    category_id: string;
    short_description?: string | null;
    description?: string | null;
    benefits?: string | null;
    terms_conditions?: string | null;
    thumbnail?: string | null;
    document_required?: boolean;
    document_description?: string | null;
    batch?: string | null;
    strikethrough_price: number;
    price: number;
    registration_deadline?: string | null;
    group_url?: string | null;
    status: 'draft' | 'published' | 'archived';
    mentors?: Mentor[];
    schedules?: Schedule[];
}

interface EditRegularProps {
    program: Program;
    categories: Category[];
    mentors: Mentor[];
}

const formSchema = z
    .object({
        mentor_ids: z.array(z.string()).min(1, 'Minimal 1 mentor harus dipilih'),
        title: z.string().nonempty('Judul harus diisi'),
        category_id: z.string().nonempty('Kategori harus dipilih'),
        short_description: z.string().nullable(),
        description: z.string().nullable(),
        benefits: z.string().nullable(),
        terms_conditions: z.string().nullable(),
        thumbnail: z.any().nullable(),
        document_required: z.boolean().optional(),
        document_description: z.string().nullable(),
        batch: z.string().nullable(),
        strikethrough_price: z.number().min(0),
        price: z.number().min(0),
        registration_deadline: z.string().nonempty('Deadline pendaftaran harus diisi'),
        group_url: z.string().nullable(),
        status: z.enum(['draft', 'published', 'archived']),
    })
    .refine(
        (data) => {
            if (!data.document_required) {
                return true;
            }

            return Boolean(data.document_description?.trim());
        },
        {
            message: 'Deskripsi dokumen wajib diisi jika dokumen diperlukan.',
            path: ['document_description'],
        },
    )
    .refine(
        (data) => {
            if (data.strikethrough_price > 0) return data.strikethrough_price > data.price;
            return true;
        },
        { message: 'Harga coret harus lebih besar dari harga normal.', path: ['strikethrough_price'] },
    );

type FormValues = z.infer<typeof formSchema>;

const tinyInit = {
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
};

export default function EditRegularCertificationProgram({ program, categories, mentors }: EditRegularProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Program Sertifikasi', href: route('certification-programs.index') },
        { title: program.title, href: route('certification-programs.show', program.id) },
        { title: 'Edit', href: route('certification-programs.edit', program.id) },
    ];

    const [preview, setPreview] = useState<string | null>(program.thumbnail ? `/storage/${program.thumbnail}` : null);
    const [thumbnailError, setThumbnailError] = useState(false);
    const [schedules, setSchedules] = useState<BootcampSchedule[]>(
        (program.schedules ?? []).map((s) => ({
            id: s.id,
            title: s.title,
            schedule_date: s.schedule_date,
            day: s.day,
            start_time: s.start_time,
            end_time: s.end_time,
        })),
    );
    const [showStrikethroughPrice, setShowStrikethroughPrice] = useState(program.strikethrough_price > 0);
    const [openRegDeadlineCalendar, setOpenRegDeadlineCalendar] = useState(false);
    const [isItemPopoverOpen, setIsItemPopoverOpen] = useState(false);
    const [isMentorPopoverOpen, setIsMentorPopoverOpen] = useState(false);
    const getInitials = useInitials();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            mentor_ids: program.mentors?.map((m) => m.id) ?? [],
            title: program.title,
            category_id: program.category_id,
            short_description: program.short_description ?? '',
            description: program.description ?? '',
            benefits: program.benefits ?? '',
            terms_conditions: program.terms_conditions ?? '',
            thumbnail: null,
            document_required: program.document_required ?? false,
            document_description: program.document_description ?? '',
            batch: program.batch ?? '',
            strikethrough_price: program.strikethrough_price,
            price: program.price,
            registration_deadline: program.registration_deadline ?? '',
            group_url: program.group_url ?? '',
            status: program.status,
        },
    });

    const documentRequired = form.watch('document_required') ?? false;

    function onSubmit(values: FormValues) {
        const submitData = { ...values, type: 'regular', schedules, _method: 'PUT' };
        router.post(route('certification-programs.update', program.id), submitData, { forceFormData: true });
    }

    const selectedMentors = mentors.filter((m) => (form.watch('mentor_ids') ?? []).includes(m.id));

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Program Reguler - ${program.title}`} />
            <div className="px-4 py-4 md:px-6">
                <h1 className="text-2xl font-semibold">Edit Program Sertifikasi Reguler</h1>
                <p className="text-muted-foreground mb-6 max-w-2xl text-sm">
                    Edit detail program sertifikasi reguler. Perubahan akan disimpan ke data yang sudah ada.
                </p>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
                        {/* Left Column */}
                        <div className="space-y-6 rounded-lg border p-4">
                            <div className="flex items-center gap-2">
                                <BookMarked size={16} />
                                <h3 className="font-medium">Informasi Program</h3>
                            </div>

                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Judul Program <span className="text-red-500">*</span>
                                        </FormLabel>
                                        <FormControl>
                                            <Input placeholder="Masukkan judul program sertifikasi" {...field} />
                                        </FormControl>
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
                                            <Input placeholder="Deskripsi singkat untuk preview" {...field} value={field.value || ''} />
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
                                        <FormControl>
                                            <Textarea
                                                {...field}
                                                value={field.value ?? ''}
                                                placeholder="Masukkan deskripsi lengkap"
                                                autoComplete="off"
                                                rows={6}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="benefits"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Manfaat/Keuntungan Program</FormLabel>
                                        <FormControl>
                                            <Editor
                                                apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
                                                value={field.value ?? ''}
                                                onEditorChange={(content) => field.onChange(content)}
                                                init={{ placeholder: 'Masukkan manfaat/keuntungan program...', ...tinyInit }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="terms_conditions"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Syarat & Ketentuan</FormLabel>
                                        <FormControl>
                                            <Editor
                                                apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
                                                value={field.value ?? ''}
                                                onEditorChange={(content) => field.onChange(content)}
                                                init={{ placeholder: 'Masukkan syarat & ketentuan program...', ...tinyInit }}
                                            />
                                        </FormControl>
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
                                        <FormDescription className="ms-1">Upload Icon. Format: PNG atau JPG Max 2 Mb</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                            <div className="rounded-lg border p-4">
                                <h3 className="mb-4 font-medium">Pengaturan Program</h3>
                                <div className="space-y-4">
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
                                                                    ? categories.find((cat) => cat.id === field.value)?.name
                                                                    : 'Pilih kategori'}
                                                                <ChevronsUpDown className="opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="p-0">
                                                        <Command>
                                                            <CommandInput placeholder="Cari kategori..." />
                                                            <CommandList>
                                                                <CommandEmpty>Tidak ada kategori ditemukan.</CommandEmpty>
                                                                <CommandGroup>
                                                                    {categories.map((cat) => (
                                                                        <CommandItem
                                                                            key={cat.id}
                                                                            value={cat.name}
                                                                            onSelect={() => {
                                                                                form.setValue('category_id', cat.id);
                                                                                setIsItemPopoverOpen(false);
                                                                            }}
                                                                        >
                                                                            {cat.name}
                                                                            <Check
                                                                                className={cn(
                                                                                    'ml-auto',
                                                                                    cat.id === field.value ? 'opacity-100' : 'opacity-0',
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
                                        name="mentor_ids"
                                        render={() => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>
                                                    Mentor <span className="text-red-500">*</span>
                                                </FormLabel>
                                                <Popover open={isMentorPopoverOpen} onOpenChange={setIsMentorPopoverOpen}>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button variant="outline" role="combobox">
                                                                {selectedMentors.length > 0
                                                                    ? `${selectedMentors.length} mentor dipilih`
                                                                    : 'Pilih mentor'}
                                                                <ChevronsUpDown className="opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="p-0">
                                                        <Command>
                                                            <CommandInput placeholder="Cari mentor..." />
                                                            <CommandList>
                                                                <CommandEmpty>Tidak ada mentor ditemukan.</CommandEmpty>
                                                                <CommandGroup>
                                                                    {mentors.map((mentor) => (
                                                                        <FormField
                                                                            key={mentor.id}
                                                                            control={form.control}
                                                                            name="mentor_ids"
                                                                            render={({ field }) => (
                                                                                <CommandItem
                                                                                    value={mentor.name}
                                                                                    onSelect={() => {
                                                                                        const current = field.value || [];
                                                                                        field.onChange(
                                                                                            current.includes(mentor.id)
                                                                                                ? current.filter((id) => id !== mentor.id)
                                                                                                : [...current, mentor.id],
                                                                                        );
                                                                                    }}
                                                                                >
                                                                                    <Checkbox checked={field.value?.includes(mentor.id)} />
                                                                                    <span className="ml-2">{mentor.name}</span>
                                                                                </CommandItem>
                                                                            )}
                                                                        />
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

                                    {selectedMentors.length > 0 && (
                                        <div className="space-y-2">
                                            <Label className="text-xs">Mentor Terpilih</Label>
                                            <div className="space-y-2">
                                                {selectedMentors.map((mentor) => (
                                                    <div key={mentor.id} className="flex items-center gap-2 rounded-lg border border-dashed p-2">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={mentor.avatar} />
                                                            <AvatarFallback>{getInitials(mentor.name)}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1">
                                                            <p className="text-xs font-medium">{mentor.name}</p>
                                                            <p className="text-muted-foreground text-xs">{mentor.bio || '-'}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <FormField
                                        control={form.control}
                                        name="document_required"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center justify-between rounded-lg border p-3">
                                                <div className="space-y-0.5">
                                                    <FormLabel>Dokumen Diperlukan?</FormLabel>
                                                    <FormDescription>Peserta harus upload dokumen saat mendaftar</FormDescription>
                                                </div>
                                                <FormControl>
                                                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    {documentRequired && (
                                        <FormField
                                            control={form.control}
                                            name="document_description"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Deskripsi Dokumen Pendukung <span className="text-red-500">*</span>
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            placeholder="Contoh: unggah KTM, transkrip, dan bukti lain yang diminta saat pendaftaran"
                                                            className="min-h-28"
                                                            {...field}
                                                            value={field.value || ''}
                                                        />
                                                    </FormControl>
                                                    <FormDescription>
                                                        Tulis informasi dokumen yang wajib diunggah agar calon pendaftar tahu apa yang harus
                                                        disiapkan.
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}

                                    <FormField
                                        control={form.control}
                                        name="batch"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Batch</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g., 22" {...field} value={field.value || ''} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="group_url"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Link Grup (WhatsApp/Telegram)</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="https://..." {...field} value={field.value || ''} type="url" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="rounded-lg border p-4">
                                <h3 className="mb-4 font-medium">Harga, Jadwal & Deadline</h3>
                                <div className="space-y-4">
                                    <div className="space-y-4 rounded-md border p-4">
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                id="show-strikethrough"
                                                checked={showStrikethroughPrice}
                                                onCheckedChange={(checked) => {
                                                    setShowStrikethroughPrice(checked);
                                                    if (!checked) form.setValue('strikethrough_price', 0);
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
                                                    Harga Program <span className="text-red-500">*</span>
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        type="text"
                                                        placeholder="0"
                                                        value={rupiahFormatter.format(field.value || 0)}
                                                        onChange={(e) => field.onChange(parseRupiah(e.target.value))}
                                                        autoComplete="off"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="registration_deadline"
                                        render={({ field }) => {
                                            const dateVal = field.value ? new Date(field.value) : null;
                                            const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                                            const dayLabel = dateVal ? dayNames[dateVal.getDay()] : null;
                                            return (
                                                <FormItem className="flex flex-col">
                                                    <FormLabel>
                                                        Deadline Pendaftaran <span className="text-red-500">*</span>
                                                    </FormLabel>
                                                    <div className="flex flex-wrap gap-2">
                                                        <Popover open={openRegDeadlineCalendar} onOpenChange={setOpenRegDeadlineCalendar}>
                                                            <PopoverTrigger asChild>
                                                                <FormControl>
                                                                    <Button
                                                                        variant="outline"
                                                                        type="button"
                                                                        className="w-36 justify-between font-normal"
                                                                    >
                                                                        {dateVal
                                                                            ? dateVal.toLocaleDateString('id-ID', {
                                                                                  day: 'numeric',
                                                                                  month: 'short',
                                                                                  year: 'numeric',
                                                                              })
                                                                            : 'Pilih tanggal'}
                                                                        <CalendarFold className="ml-auto h-4 w-4 opacity-50" />
                                                                    </Button>
                                                                </FormControl>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                                                                <Calendar
                                                                    mode="single"
                                                                    selected={dateVal || undefined}
                                                                    captionLayout="dropdown"
                                                                    endMonth={new Date(new Date().getFullYear() + 10, 11)}
                                                                    onSelect={(date) => {
                                                                        const prev = field.value ? new Date(field.value) : new Date();
                                                                        const time = prev.toTimeString().split(' ')[0];
                                                                        const dateStr = date
                                                                            ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
                                                                            : '';
                                                                        field.onChange(dateStr && time ? `${dateStr}T${time}` : '');
                                                                        setOpenRegDeadlineCalendar(false);
                                                                    }}
                                                                />
                                                            </PopoverContent>
                                                        </Popover>
                                                        <Input
                                                            type="time"
                                                            step="60"
                                                            value={dateVal ? dateVal.toTimeString().slice(0, 5) : '23:59'}
                                                            onChange={(e) => {
                                                                const prev = field.value ? new Date(field.value) : new Date();
                                                                const dateStr = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-${String(prev.getDate()).padStart(2, '0')}`;
                                                                field.onChange(`${dateStr}T${e.target.value || '00:00'}:00`);
                                                            }}
                                                            className="bg-background w-28 appearance-none [&::-webkit-calendar-picker-indicator]:hidden"
                                                        />
                                                        {dayLabel && (
                                                            <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm text-blue-700">
                                                                {dayLabel}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            );
                                        }}
                                    />

                                    <CertificationProgramScheduleInput value={schedules} onChange={setSchedules} label="Jadwal Pelaksanaan" />

                                    <FormField
                                        control={form.control}
                                        name="status"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Status</FormLabel>
                                                <FormControl>
                                                    <div className="flex gap-2">
                                                        {(['draft', 'published', 'archived'] as const).map((status) => (
                                                            <Button
                                                                key={status}
                                                                type="button"
                                                                variant={field.value === status ? 'default' : 'outline'}
                                                                onClick={() => field.onChange(status)}
                                                                className="flex-1"
                                                            >
                                                                {status === 'draft' ? 'Draft' : status === 'published' ? 'Dipublikasi' : 'Diarsipkan'}
                                                            </Button>
                                                        ))}
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full">
                                Simpan Perubahan
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </AdminLayout>
    );
}
