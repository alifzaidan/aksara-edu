'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/layouts/admin-layout';
import { cn, parseRupiah, rupiahFormatter } from '@/lib/utils';
import { BreadcrumbItem } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Head, router } from '@inertiajs/react';
import { Editor } from '@tinymce/tinymce-react';
import { addDays, setHours, setMinutes, setSeconds } from 'date-fns';
import { ChevronDownIcon, GripVertical, Package, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

interface Product {
    id: string;
    title: string;
    price: number;
    slug: string;
    registration_deadline?: string | null;
}

interface BundleItem {
    id: string;
    bundleable_type: string;
    bundleable_id: string;
    bundleable: Product | null;
    price: number;
    order: number;
}

interface Bundle {
    id: string;
    title: string;
    slug: string;
    short_description?: string | null;
    description?: string | null;
    benefits?: string | null;
    thumbnail?: string | null;
    price: number;
    registration_deadline?: string | null;
    registration_url?: string | null;
    status: 'draft' | 'published' | 'archived';
    bundle_items: BundleItem[];
}

interface EditProps {
    bundle: Bundle;
    courses: Product[];
    bootcamps: Product[];
    webinars: Product[];
}

const breadcrumbs = (bundle: Bundle): BreadcrumbItem[] => [
    {
        title: 'Paket Bundling',
        href: route('bundles.index'),
    },
    {
        title: bundle.title,
        href: route('bundles.show', bundle.id),
    },
    {
        title: 'Edit Paket Bundling',
        href: route('bundles.edit', bundle.id),
    },
];

const formSchema = z
    .object({
        title: z.string().nonempty('Judul harus diisi'),
        short_description: z.string().nullable(),
        description: z.string().nullable(),
        benefits: z.string().nullable(),
        thumbnail: z.any().nullable(),
        registration_deadline: z.string().nonempty('Deadline pendaftaran harus diisi'),
        price: z.number().min(0, 'Harga tidak boleh negatif'),
        items: z
            .array(
                z.object({
                    type: z.string(),
                    id: z.string(),
                    title: z.string(),
                    price: z.number(),
                    registration_deadline: z.string().nullable().optional(),
                }),
            )
            .min(2, 'Minimal 2 item harus dipilih'),
    })
    .refine(
        (data) => {
            const hasPaidItem = data.items.some((item) => item.price > 0);
            return hasPaidItem;
        },
        {
            message: 'Minimal harus ada 1 produk berbayar dalam bundle',
            path: ['items'],
        },
    )
    .refine(
        (data) => {
            const totalOriginalPrice = data.items.reduce((sum, item) => sum + item.price, 0);
            return data.price <= totalOriginalPrice;
        },
        {
            message: 'Harga bundling tidak boleh melebihi total harga normal',
            path: ['price'],
        },
    );

type FormValues = z.infer<typeof formSchema>;

export default function EditBundle({ bundle, courses, bootcamps, webinars }: EditProps) {
    const [preview, setPreview] = useState<string | null>(null);
    const [thumbnailError, setThumbnailError] = useState(false);
    const [openDeadlineCalendar, setOpenDeadlineCalendar] = useState(false);
    const [openItemSelector, setOpenItemSelector] = useState(false);
    const [selectedItemType, setSelectedItemType] = useState<'course' | 'bootcamp' | 'webinar'>('course');
    const [isDeadlineAutoSet, setIsDeadlineAutoSet] = useState(false);

    // Get registration_deadline from products
    const getProductDeadline = (type: string, id: string): string | null => {
        const products = type === 'course' ? courses : type === 'bootcamp' ? bootcamps : webinars;
        const product = products.find((p) => p.id === id);
        return product?.registration_deadline || null;
    };

    // Convert bundle items to form format with complete data including registration_deadline
    const initialItems = bundle.bundle_items
        .filter((item) => item.bundleable !== null)
        .map((item) => {
            let type = 'course';
            if (item.bundleable_type.includes('Bootcamp')) type = 'bootcamp';
            else if (item.bundleable_type.includes('Webinar')) type = 'webinar';
            return {
                type,
                id: item.bundleable_id,
                title: item.bundleable?.title || 'Unknown',
                price: item.price,
                registration_deadline: getProductDeadline(type, item.bundleable_id),
            };
        });

    // Default registration deadline
    const now = new Date();
    let defaultRegDeadline = addDays(now, 7);
    defaultRegDeadline = setHours(defaultRegDeadline, 23);
    defaultRegDeadline = setMinutes(defaultRegDeadline, 59);
    defaultRegDeadline = setSeconds(defaultRegDeadline, 0);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: bundle.title ?? '',
            short_description: bundle.short_description ?? '',
            description: bundle.description ?? '',
            benefits: bundle.benefits ?? '',
            thumbnail: null,
            registration_deadline: bundle.registration_deadline ?? defaultRegDeadline.toISOString(),
            price: bundle.price ?? 0,
            items: initialItems,
        },
    });

    const watchedItems = form.watch('items');

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'items',
    });

    // Auto-update registration deadline based on selected items
    useEffect(() => {
        if (watchedItems.length === 0) return;

        const now = new Date();
        const deadlines = watchedItems
            .filter((item) => item.registration_deadline)
            .map((item) => new Date(item.registration_deadline!))
            .filter((date) => date > now);

        if (deadlines.length > 0) {
            const earliestDeadline = deadlines.reduce((earliest, current) => {
                return current < earliest ? current : earliest;
            });

            form.setValue('registration_deadline', earliestDeadline.toISOString());
            setIsDeadlineAutoSet(true);
        } else {
            setIsDeadlineAutoSet(false);
        }
    }, [watchedItems, form]);

    const getProductsByType = (type: string): Product[] => {
        switch (type) {
            case 'course':
                return courses || [];
            case 'bootcamp':
                return bootcamps || [];
            case 'webinar':
                return webinars || [];
            default:
                return [];
        }
    };

    const isItemSelected = (type: string, id: string): boolean => {
        return watchedItems.some((item) => item.type === type && item.id === id);
    };

    const getAvailableProducts = (type: string): Product[] => {
        const products = getProductsByType(type);
        return products.filter((product) => !isItemSelected(type, product.id));
    };

    const calculateTotalOriginalPrice = (): number => {
        return fields.reduce((total, item) => {
            return total + (item.price || 0);
        }, 0);
    };

    const addItem = (type: string, product: Product) => {
        if (isItemSelected(type, product.id)) {
            toast.error('Item sudah ditambahkan');
            return;
        }

        append({
            type,
            id: product.id,
            title: product.title,
            price: product.price,
            registration_deadline: product.registration_deadline || null,
        });

        setOpenItemSelector(false);
    };

    function onSubmit(values: FormValues) {
        const formData = {
            ...values,
            _method: 'PUT',
        };

        router.post(route('bundles.update', bundle.id), formData, { forceFormData: true });
    }

    return (
        <AdminLayout breadcrumbs={breadcrumbs(bundle)}>
            <Head title={`Edit Paket Bundling - ${bundle.title}`} />
            <div className="px-4 py-4 md:px-6">
                <h1 className="text-2xl font-semibold">Edit {bundle.title}</h1>
                <p className="text-muted-foreground mb-6 max-w-2xl text-sm">
                    Edit informasi paket bundling. Perubahan akan meng-update slug dan URL jika judul berubah.
                </p>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
                        <div className="space-y-6 rounded-lg border p-4">
                            <div className="flex items-center gap-2">
                                <Package size={16} />
                                <h3 className="font-medium">Informasi Bundle</h3>
                            </div>

                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Judul Bundling <span className="text-red-500">*</span>
                                        </FormLabel>
                                        <FormControl>
                                            <Input placeholder="Masukkan judul bundling" {...field} autoComplete="off" />
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
                                        <Textarea
                                            {...field}
                                            value={field.value ?? ''}
                                            placeholder="Deskripsi singkat bundle (maks 500 karakter)"
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
                                            placeholder="Deskripsi lengkap bundle"
                                            rows={6}
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
                                        <FormLabel>Benefit Bundling</FormLabel>
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
                                        <FormDescription>Keuntungan yang didapat dari bundle ini</FormDescription>
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
                                                    : bundle.thumbnail
                                                      ? `/storage/${bundle.thumbnail}`
                                                      : '/assets/images/placeholder.png'
                                            }
                                            alt={bundle.title}
                                            className="my-1 mt-2 h-40 rounded border object-cover"
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
                                <h3 className="font-medium">Isi Paket & Harga</h3>
                            </div>

                            {/* Bundle Items */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label>
                                        Isi Paket <span className="text-red-500">*</span>
                                    </Label>
                                    <Popover open={openItemSelector} onOpenChange={setOpenItemSelector}>
                                        <PopoverTrigger asChild>
                                            <Button type="button" variant="outline" size="sm">
                                                <Plus className="mr-1 h-4 w-4" /> Tambah Item
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[400px] p-0" align="end">
                                            <Command>
                                                <div className="border-b p-2">
                                                    <div className="flex gap-1">
                                                        <Button
                                                            type="button"
                                                            variant={selectedItemType === 'course' ? 'default' : 'outline'}
                                                            size="sm"
                                                            onClick={() => setSelectedItemType('course')}
                                                            className="flex-1"
                                                        >
                                                            Course ({getAvailableProducts('course').length})
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant={selectedItemType === 'bootcamp' ? 'default' : 'outline'}
                                                            size="sm"
                                                            onClick={() => setSelectedItemType('bootcamp')}
                                                            className="flex-1"
                                                        >
                                                            Bootcamp ({getAvailableProducts('bootcamp').length})
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant={selectedItemType === 'webinar' ? 'default' : 'outline'}
                                                            size="sm"
                                                            onClick={() => setSelectedItemType('webinar')}
                                                            className="flex-1"
                                                        >
                                                            Webinar ({getAvailableProducts('webinar').length})
                                                        </Button>
                                                    </div>
                                                </div>
                                                <CommandInput placeholder="Cari item..." className="h-9" />
                                                <CommandList>
                                                    <CommandEmpty>Tidak ada item tersedia.</CommandEmpty>
                                                    <CommandGroup>
                                                        {getAvailableProducts(selectedItemType).map((product) => (
                                                            <CommandItem
                                                                key={product.id}
                                                                value={product.title}
                                                                onSelect={() => addItem(selectedItemType, product)}
                                                                className="cursor-pointer"
                                                            >
                                                                <div className="flex w-full items-center justify-between gap-2">
                                                                    <span className="flex-1 truncate">{product.title}</span>
                                                                    <span className="text-muted-foreground text-xs font-medium whitespace-nowrap">
                                                                        {rupiahFormatter.format(product.price || 0)}
                                                                    </span>
                                                                </div>
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                {fields.length === 0 ? (
                                    <div className="rounded-lg border-2 border-dashed p-8 text-center">
                                        <Package className="text-muted-foreground mx-auto mb-2 h-12 w-12" />
                                        <p className="text-muted-foreground text-sm">Belum ada item ditambahkan</p>
                                        <p className="text-muted-foreground mt-1 text-xs">Minimal 2 item untuk membuat bundle</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {fields.map((field, index) => (
                                            <div key={field.id} className="flex items-center gap-2 rounded-lg border p-3">
                                                <GripVertical className="text-muted-foreground h-4 w-4 flex-shrink-0" />
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="truncate text-sm font-medium">{field.title}</p>
                                                        {field.price === 0 && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                Gratis
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-muted-foreground text-xs capitalize">
                                                            {field.type === 'course' ? 'Kelas Online' : field.type}
                                                        </p>
                                                        {field.registration_deadline && (
                                                            <p className="text-xs text-blue-600">
                                                                • Deadline:{' '}
                                                                {new Date(field.registration_deadline).toLocaleDateString('id-ID', {
                                                                    day: 'numeric',
                                                                    month: 'short',
                                                                    year: 'numeric',
                                                                })}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <span
                                                    className={`text-sm font-medium whitespace-nowrap ${field.price === 0 ? 'text-green-600' : ''}`}
                                                >
                                                    {field.price === 0 ? 'Gratis' : rupiahFormatter.format(field.price || 0)}
                                                </span>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 flex-shrink-0"
                                                    onClick={() => remove(index)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                        <div className="bg-muted rounded-lg p-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium">Total Harga Normal:</span>
                                                <span className="text-base font-bold">{rupiahFormatter.format(calculateTotalOriginalPrice())}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <FormMessage>{form.formState.errors.items?.message}</FormMessage>
                            </div>

                            {/* Pricing */}
                            <FormField
                                control={form.control}
                                name="price"
                                render={({ field }) => {
                                    const totalOriginalPrice = calculateTotalOriginalPrice();
                                    const isOverpriced = field.value > totalOriginalPrice && totalOriginalPrice > 0;

                                    return (
                                        <FormItem>
                                            <FormLabel>
                                                Harga Bundling <span className="text-red-500">*</span>
                                            </FormLabel>
                                            <Input
                                                {...field}
                                                type="text"
                                                placeholder="Masukkan harga bundling"
                                                value={rupiahFormatter.format(field.value || 0)}
                                                onChange={(e) => field.onChange(parseRupiah(e.target.value))}
                                                autoComplete="off"
                                                className={isOverpriced ? 'border-red-500 focus-visible:ring-red-500' : ''}
                                            />
                                            {isOverpriced && (
                                                <p className="text-sm font-medium text-red-500">
                                                    ⚠️ Harga bundling tidak boleh melebihi total harga normal (
                                                    {rupiahFormatter.format(totalOriginalPrice)})
                                                </p>
                                            )}
                                            {!isOverpriced && totalOriginalPrice > 0 && field.value > 0 && (
                                                <p className="text-sm text-green-600">
                                                    ✓ Hemat {Math.round(((totalOriginalPrice - field.value) / totalOriginalPrice) * 100)}% dari harga
                                                    normal
                                                </p>
                                            )}
                                            <FormDescription>
                                                Harga spesial untuk bundling ini (harus lebih murah dari total harga normal)
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    );
                                }}
                            />

                            {/* Additional Info */}
                            <FormField
                                control={form.control}
                                name="registration_deadline"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>
                                            Deadline Pendaftaran <span className="text-red-500">*</span>
                                        </FormLabel>
                                        {isDeadlineAutoSet && (
                                            <div className="mb-2 rounded-md bg-blue-50 p-2 text-xs text-blue-700">
                                                ⓘ Deadline otomatis disesuaikan dengan produk terdekat yang dipilih
                                            </div>
                                        )}
                                        <div className="flex gap-4">
                                            <div className="flex flex-col gap-3">
                                                <Popover open={openDeadlineCalendar} onOpenChange={setOpenDeadlineCalendar}>
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
                                                        <CalendarComponent
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
                                                                setOpenDeadlineCalendar(false);
                                                                setIsDeadlineAutoSet(false);
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
                                                    value={field.value ? new Date(field.value).toTimeString().slice(0, 5) : '23:59'}
                                                    onChange={(e) => {
                                                        const prev = field.value ? new Date(field.value) : new Date();
                                                        const dateStr = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-${String(prev.getDate()).padStart(2, '0')}`;
                                                        const time = e.target.value || '00:00';
                                                        field.onChange(`${dateStr}T${time}:00`);
                                                        setIsDeadlineAutoSet(false);
                                                    }}
                                                    className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                                                />
                                            </div>
                                        </div>
                                        <FormDescription>
                                            {isDeadlineAutoSet
                                                ? 'Deadline otomatis dari produk terdekat. Bisa diubah manual.'
                                                : 'Tanggal dan waktu terakhir untuk membeli bundle'}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
                                <h4 className="mb-2 font-medium text-gray-900">Status Bundling</h4>
                                <div className="space-y-2 text-sm text-gray-700">
                                    <div
                                        className={cn(
                                            'w-fit rounded-full border px-3 py-1',
                                            bundle.status === 'draft' && 'border-gray-200 bg-gray-100 text-gray-700',
                                            bundle.status === 'published' && 'border-green-200 bg-green-100 text-green-700',
                                            bundle.status === 'archived' && 'border-red-200 bg-red-100 text-red-700',
                                        )}
                                    >
                                        <span className="font-medium capitalize">
                                            {bundle.status === 'draft' && 'Draft'}
                                            {bundle.status === 'published' && 'Published'}
                                            {bundle.status === 'archived' && 'Archived'}
                                        </span>
                                    </div>
                                    <p className="text-muted-foreground pt-2 text-xs">
                                        Ubah status bundling di halaman detail setelah menyimpan perubahan.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Button type="submit" className="hover:cursor-pointer lg:col-span-2" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </Button>
                    </form>
                </Form>
            </div>
        </AdminLayout>
    );
}
