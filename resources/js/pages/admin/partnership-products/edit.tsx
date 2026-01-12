'use client';

import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
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
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { Calendar, Check, ChevronsUpDown, Clock, Package } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

interface PartnershipProduct {
    id: string;
    title: string;
    category_id: string;
    category_relation?: { name: string };
    short_description?: string | null;
    description?: string | null;
    key_points?: string | null;
    thumbnail?: string | null;
    registration_deadline: string;
    duration_days?: number | null;
    schedule_days: string[];
    strikethrough_price: number;
    price: number;
    product_url?: string | null;
    registration_url: string;
    status: 'draft' | 'published' | 'archived';
    type: 'regular' | 'scholarship';
    scholarship_group_link?: string | null;
}

const DAYS_OF_WEEK = [
    { value: 'Senin', label: 'Senin' },
    { value: 'Selasa', label: 'Selasa' },
    { value: 'Rabu', label: 'Rabu' },
    { value: 'Kamis', label: 'Kamis' },
    { value: 'Jumat', label: 'Jumat' },
    { value: 'Sabtu', label: 'Sabtu' },
    { value: 'Minggu', label: 'Minggu' },
];

const formSchema = z
    .object({
        title: z.string().nonempty('Judul harus diisi'),
        category_id: z.string().nonempty('Kategori harus dipilih'),
        short_description: z.string().nullable(),
        description: z.string().nullable(),
        key_points: z.string().nullable(),
        thumbnail: z.any().nullable(),
        registration_deadline: z.date({
            required_error: 'Batas waktu pendaftaran harus diisi',
            invalid_type_error: 'Batas waktu pendaftaran harus berupa tanggal yang valid',
        }),
        duration_days: z.number().min(0, 'Durasi tidak boleh negatif').nullable(),
        schedule_days: z.array(z.string()).min(1, 'Pilih minimal 1 hari'),
        strikethrough_price: z.number().min(0, 'Harga tidak boleh negatif'),
        price: z.number().min(0, 'Harga tidak boleh negatif'),
        registration_url: z.string().url('URL pendaftaran harus valid').nonempty('URL pendaftaran harus diisi'),
        type: z.enum(['regular', 'scholarship'], {
            required_error: 'Tipe kategori harus dipilih',
        }),
        scholarship_group_link: z.string().url('Link grup harus berupa URL yang valid').nullable(),
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
    )
    .refine(
        (data) => {
            if (data.type === 'scholarship') {
                return data.scholarship_group_link && data.scholarship_group_link.trim() !== '';
            }
            return true;
        },
        {
            message: 'Link grup WhatsApp/Telegram harus diisi untuk tipe Beasiswa',
            path: ['scholarship_group_link'],
        },
    );

export default function EditPartnershipProduct({ product, categories }: { product: PartnershipProduct; categories: { id: string; name: string }[] }) {
    const [isItemPopoverOpen, setIsItemPopoverOpen] = useState(false);
    const [showStrikethroughPrice, setShowStrikethroughPrice] = useState(product.strikethrough_price > 0);
    const [preview, setPreview] = useState<string | null>(null);
    const [thumbnailError, setThumbnailError] = useState(false);
    const [openIssuedCalendar, setOpenIssuedCalendar] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Sertifikasi Kerjasama',
            href: route('partnership-products.index'),
        },
        {
            title: product.title,
            href: route('partnership-products.show', product.id),
        },
        {
            title: 'Edit Produk',
            href: route('partnership-products.edit', product.id),
        },
    ];

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: product.title ?? '',
            category_id: product.category_id ?? '',
            short_description: product.short_description ?? '',
            description: product.description ?? '',
            key_points: product.key_points ?? '',
            thumbnail: null,
            registration_deadline: product.registration_deadline ? parseISO(product.registration_deadline) : undefined,
            duration_days: product.duration_days ?? null,
            schedule_days: product.schedule_days ?? [],
            strikethrough_price: product.strikethrough_price ?? 0,
            price: product.price ?? 0,
            registration_url: product.registration_url ?? '',
            type: product.type ?? 'regular',
            scholarship_group_link: product.scholarship_group_link ?? '',
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        const deadline = new Date(values.registration_deadline);
        deadline.setHours(23, 59, 59, 999);

        const formData = {
            ...values,
            registration_deadline: format(deadline, 'yyyy-MM-dd HH:mm:ss'),
        };

        router.post(route('partnership-products.update', product.id), { ...formData, _method: 'PUT' }, { forceFormData: true });
    }

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Produk - ${product.title}`} />
            <div className="px-4 py-4 md:px-6">
                <h1 className="text-2xl font-semibold">Edit {product.title}</h1>
                <p className="text-muted-foreground mb-6 max-w-2xl text-sm">
                    Edit informasi produk partnership. Setelah selesai, klik tombol "Simpan Perubahan" untuk menyimpan.
                </p>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
                        <div className="space-y-6 rounded-lg border p-4">
                            <div className="flex items-center gap-2">
                                <Package size={16} />
                                <h3 className="font-medium">Informasi Produk</h3>
                            </div>

                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Judul Produk <span className="text-red-500">*</span>
                                        </FormLabel>
                                        <FormControl>
                                            <Input placeholder="Masukkan judul produk" {...field} autoComplete="off" />
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
                                name="short_description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Deskripsi Singkat</FormLabel>
                                        <Textarea
                                            {...field}
                                            value={field.value ?? ''}
                                            placeholder="Deskripsi singkat produk (maks 500 karakter)"
                                            maxLength={500}
                                            autoComplete="off"
                                        />
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
                                            placeholder="Deskripsi lengkap produk"
                                            rows={6}
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
                                        <FormLabel>Poin-Poin Penting</FormLabel>
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
                                                toolbar:
                                                    'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | checklist numlist bullist indent outdent | emoticons charmap | removeformat',
                                                height: 300,
                                                menubar: false,
                                            }}
                                        />
                                        <FormDescription>Format poin-poin penting dengan bullet list atau numbering</FormDescription>
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
                                            src={
                                                preview
                                                    ? preview
                                                    : product.thumbnail
                                                      ? `/storage/${product.thumbnail}`
                                                      : '/assets/images/placeholder.png'
                                            }
                                            alt={product.title}
                                            className="my-1 mt-2 h-56 rounded border object-cover"
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
                                <Package size={16} />
                                <h3 className="font-medium">Harga, Jadwal & URL</h3>
                            </div>

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
                                            placeholder="Masukkan harga produk"
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
                                name="type"
                                render={({ field }) => (
                                    <FormItem className="space-y-3">
                                        <FormLabel>
                                            Tipe Kategori <span className="text-red-500">*</span>
                                        </FormLabel>
                                        <FormControl>
                                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-1">
                                                <FormItem className="flex items-center space-y-0 space-x-3">
                                                    <FormControl>
                                                        <RadioGroupItem value="regular" />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">Reguler</FormLabel>
                                                </FormItem>
                                                <FormItem className="flex items-center space-y-0 space-x-3">
                                                    <FormControl>
                                                        <RadioGroupItem value="scholarship" />
                                                    </FormControl>
                                                    <FormLabel className="font-normal">Beasiswa</FormLabel>
                                                </FormItem>
                                            </RadioGroup>
                                        </FormControl>
                                        <FormDescription>Pilih apakah produk ini termasuk program reguler atau beasiswa.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {form.watch('type') === 'scholarship' && (
                                <FormField
                                    control={form.control}
                                    name="scholarship_group_link"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Link Grup WhatsApp/Telegram <span className="text-red-500">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="url"
                                                    placeholder="https://chat.whatsapp.com/xxxxx atau https://t.me/xxxxx"
                                                    value={field.value ?? ''}
                                                />
                                            </FormControl>
                                            <FormDescription>Link grup WhatsApp atau Telegram untuk peserta beasiswa yang diterima.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            <div className="space-y-4 rounded-md border border-gray-200 p-4">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <h4 className="font-medium">Informasi Jadwal</h4>
                                </div>

                                <FormField
                                    control={form.control}
                                    name="registration_deadline"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>
                                                Batas Waktu Pendaftaran <span className="text-red-500">*</span>
                                            </FormLabel>
                                            <Popover open={openIssuedCalendar} onOpenChange={setOpenIssuedCalendar}>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            className={cn(
                                                                'w-full pl-3 text-left font-normal',
                                                                !field.value && 'text-muted-foreground',
                                                            )}
                                                        >
                                                            {field.value ? format(field.value, 'PPP', { locale: id }) : <span>Pilih tanggal</span>}
                                                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <CalendarComponent
                                                        mode="single"
                                                        selected={field.value}
                                                        captionLayout="dropdown"
                                                        endMonth={new Date(new Date().getFullYear() + 10, 11)}
                                                        onSelect={(date) => {
                                                            if (date) field.onChange(date);
                                                            setOpenIssuedCalendar(false);
                                                        }}
                                                        disabled={(date) => {
                                                            const today = new Date();
                                                            today.setHours(0, 0, 0, 0);
                                                            return date < today;
                                                        }}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormDescription>Tanggal terakhir untuk melakukan pendaftaran</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="schedule_days"
                                    render={() => (
                                        <FormItem>
                                            <FormLabel>
                                                Hari Pelaksanaan <span className="text-red-500">*</span>
                                            </FormLabel>
                                            <FormDescription>Pilih hari-hari pelaksanaan program</FormDescription>
                                            <div className="grid grid-cols-2 gap-3">
                                                {DAYS_OF_WEEK.map((day) => (
                                                    <FormField
                                                        key={day.value}
                                                        control={form.control}
                                                        name="schedule_days"
                                                        render={({ field }) => {
                                                            return (
                                                                <FormItem key={day.value} className="flex flex-row items-center space-y-0 space-x-3">
                                                                    <FormControl>
                                                                        <Checkbox
                                                                            checked={field.value?.includes(day.value)}
                                                                            onCheckedChange={(checked) => {
                                                                                return checked
                                                                                    ? field.onChange([...(field.value || []), day.value])
                                                                                    : field.onChange(
                                                                                          field.value?.filter((value) => value !== day.value),
                                                                                      );
                                                                            }}
                                                                        />
                                                                    </FormControl>
                                                                    <FormLabel className="cursor-pointer font-normal">{day.label}</FormLabel>
                                                                </FormItem>
                                                            );
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="duration_days"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Durasi Program (Hari)</FormLabel>
                                            <div className="flex items-center gap-2">
                                                <Clock className="text-muted-foreground h-4 w-4" />
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        placeholder="0"
                                                        min="0"
                                                        {...field}
                                                        value={field.value ?? ''}
                                                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                                                        autoComplete="off"
                                                        className="flex-1"
                                                    />
                                                </FormControl>
                                            </div>
                                            <FormDescription>Total durasi program dalam hari (kosongkan jika tidak ada)</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="registration_url"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            URL Pendaftaran Eksternal <span className="text-red-500">*</span>
                                        </FormLabel>
                                        <Input
                                            {...field}
                                            value={field.value ?? ''}
                                            type="url"
                                            placeholder="https://partner.com/register"
                                            autoComplete="off"
                                        />
                                        <FormDescription>URL untuk mengarahkan user mendaftar/membeli produk di website partner</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
                                <h4 className="mb-2 font-medium text-gray-900">Status Produk</h4>
                                <div className="space-y-2 text-sm text-gray-700">
                                    <div
                                        className={cn(
                                            'w-fit rounded-full border px-3 py-1',
                                            product.status === 'draft' && 'border-gray-200 bg-gray-100 text-gray-700',
                                            product.status === 'published' && 'border-green-200 bg-green-100 text-green-700',
                                            product.status === 'archived' && 'border-red-200 bg-red-100 text-red-700',
                                        )}
                                    >
                                        <span className="font-medium capitalize">
                                            {product.status === 'draft' && 'Draft'}
                                            {product.status === 'published' && 'Terbit'}
                                            {product.status === 'archived' && 'Arsip'}
                                        </span>
                                    </div>
                                    <p className="text-muted-foreground pt-2 text-xs">
                                        Ubah status produk di halaman detail setelah menyimpan perubahan.
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
                                <h4 className="mb-2 font-medium text-amber-900">Informasi Penting</h4>
                                <ul className="list-inside list-disc space-y-1 text-sm text-amber-800">
                                    <li>Produk ini tidak dijual di platform</li>
                                    <li>User akan diarahkan ke URL pendaftaran eksternal</li>
                                    <li>Setiap klik akan dicatat untuk statistik</li>
                                    <li>Pastikan URL pendaftaran valid dan aktif</li>
                                </ul>
                            </div>
                        </div>

                        <Button type="submit" className="hover:cursor-pointer lg:col-span-2">
                            Simpan Perubahan
                        </Button>
                    </form>
                </Form>
            </div>
        </AdminLayout>
    );
}
