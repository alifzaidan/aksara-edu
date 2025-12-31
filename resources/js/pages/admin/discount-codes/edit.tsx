'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Head, router } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { AlertCircle, CalendarIcon, ChevronDownIcon, Percent, Plus, Shuffle, Tag, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

interface Product {
    id: string;
    title: string;
    price: number;
    registration_deadline?: string;
    start_date?: string;
    event_date?: string;
    batch?: number;
}

interface EditDiscountCodeProps {
    discountCode: {
        id: string;
        code: string;
        name: string;
        description: string | null;
        type: 'percentage' | 'fixed';
        value: number;
        minimum_amount: number | null;
        usage_limit: number | null;
        usage_limit_per_user: number | null;
        starts_at: string;
        expires_at: string;
        is_active: boolean;
        applicable_types: string[] | null;
        applicable_products: Array<{
            type: string;
            id: string;
            title: string;
            price: number;
            registration_deadline?: string;
            start_date?: string;
            event_date?: string;
            batch?: number;
        }>;
    };
    products: {
        courses: Product[];
        bootcamps: Product[];
        webinars: Product[];
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/admin/dashboard',
    },
    {
        title: 'Kode Diskon',
        href: '/admin/discount-codes',
    },
    {
        title: 'Edit Kode Diskon',
        href: '#',
    },
];

const formSchema = z
    .object({
        code: z.string().min(1, 'Kode diskon harus diisi').max(50, 'Kode diskon maksimal 50 karakter'),
        name: z.string().min(1, 'Nama diskon harus diisi').max(255, 'Nama diskon maksimal 255 karakter'),
        description: z.string().optional(),
        type: z.enum(['percentage', 'fixed'], {
            required_error: 'Jenis diskon harus dipilih',
        }),
        value: z.number().min(1, 'Nilai diskon harus lebih dari 0'),
        minimum_amount: z.number().optional(),
        usage_limit: z.number().optional(),
        usage_limit_per_user: z.number().optional(),
        starts_at: z.date({
            required_error: 'Tanggal mulai harus dipilih',
        }),
        expires_at: z.date({
            required_error: 'Tanggal berakhir harus dipilih',
        }),
        is_active: z.boolean(),
        applicable_types: z.array(z.string()).optional(),
        applicable_products: z
            .array(
                z.object({
                    type: z.string(),
                    id: z.string(),
                    title: z.string(),
                    price: z.number(),
                    registration_deadline: z.string().nullable().optional(),
                    start_date: z.string().nullable().optional(),
                    event_date: z.string().nullable().optional(),
                    batch: z.number().nullable().optional(),
                }),
            )
            .optional(),
    })
    .refine(
        (data) => {
            if (data.type === 'percentage' && data.value > 100) {
                return false;
            }
            return true;
        },
        {
            message: 'Persentase tidak boleh lebih dari 100%',
            path: ['value'],
        },
    )
    .refine(
        (data) => {
            return data.expires_at > data.starts_at;
        },
        {
            message: 'Tanggal berakhir harus setelah tanggal mulai',
            path: ['expires_at'],
        },
    );

type FormData = z.infer<typeof formSchema>;

export default function EditDiscountCode({ discountCode, products }: EditDiscountCodeProps) {
    const [startDateOpen, setStartDateOpen] = useState(false);
    const [endDateOpen, setEndDateOpen] = useState(false);
    const [productSelectOpen, setProductSelectOpen] = useState(false);
    const [selectedProductType, setSelectedProductType] = useState<string>('course');

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            code: discountCode.code,
            name: discountCode.name,
            description: discountCode.description || '',
            type: discountCode.type,
            value: discountCode.value,
            minimum_amount: discountCode.minimum_amount || undefined,
            usage_limit: discountCode.usage_limit || undefined,
            usage_limit_per_user: discountCode.usage_limit_per_user || undefined,
            starts_at: new Date(discountCode.starts_at),
            expires_at: new Date(discountCode.expires_at),
            is_active: discountCode.is_active,
            applicable_types: discountCode.applicable_types || [],
            applicable_products: discountCode.applicable_products || [],
        },
    });

    const watchType = form.watch('type');
    const watchedApplicableTypes = form.watch('applicable_types');
    const watchApplicableTypes = useMemo(() => watchedApplicableTypes || [], [watchedApplicableTypes]);
    const watchedApplicableProducts = form.watch('applicable_products');
    const watchApplicableProducts = useMemo(() => watchedApplicableProducts || [], [watchedApplicableProducts]);
    const watchStartsAt = form.watch('starts_at');

    useEffect(() => {
        if (watchApplicableTypes.length > 0) {
            const firstAvailableType = watchApplicableTypes[0];
            if (!watchApplicableTypes.includes(selectedProductType)) {
                setSelectedProductType(firstAvailableType);
            }
        }
    }, [watchApplicableTypes, selectedProductType]);

    const generateCode = () => {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        form.setValue('code', result);
    };

    const handleApplicableTypeChange = (type: string, checked: boolean) => {
        const currentTypes = watchApplicableTypes;
        if (checked) {
            const newTypes = [...currentTypes, type];
            form.setValue('applicable_types', newTypes);

            if (newTypes.length === 1) {
                setSelectedProductType(type);
            }
        } else {
            const filteredTypes = currentTypes.filter((t) => t !== type);
            form.setValue('applicable_types', filteredTypes);

            const filteredProducts = watchApplicableProducts.filter((p) => p.type !== type);
            form.setValue('applicable_products', filteredProducts);

            if (selectedProductType === type && filteredTypes.length > 0) {
                setSelectedProductType(filteredTypes[0]);
            }
        }
    };

    const handleAddProduct = (product: Product, type: string) => {
        const newProduct = {
            ...product,
            type,
            registration_deadline: product.registration_deadline || null,
            start_date: product.start_date || null,
            event_date: product.event_date || null,
            batch: product.batch || null,
        };
        const existingProducts = watchApplicableProducts;

        const isAlreadyAdded = existingProducts.some((p) => p.id === product.id && p.type === type);
        if (!isAlreadyAdded) {
            form.setValue('applicable_products', [...existingProducts, newProduct]);
        }
        setProductSelectOpen(false);
    };

    const handleRemoveProduct = (productToRemove: { id: string; type: string }) => {
        const filteredProducts = watchApplicableProducts.filter((p) => !(p.id === productToRemove.id && p.type === productToRemove.type));
        form.setValue('applicable_products', filteredProducts);
    };

    const getAvailableProducts = useMemo(() => {
        const discountStartDate = watchStartsAt;
        const selectedProductIds = watchApplicableProducts.filter((p) => p.type === selectedProductType).map((p) => p.id);

        switch (selectedProductType) {
            case 'course':
                return products.courses.filter((course) => !selectedProductIds.includes(course.id));

            case 'bootcamp':
                return products.bootcamps.filter((bootcamp) => {
                    if (selectedProductIds.includes(bootcamp.id)) return false;

                    if (!bootcamp.registration_deadline || !discountStartDate) return true;
                    const registrationEnd = parseISO(bootcamp.registration_deadline);
                    return registrationEnd >= discountStartDate;
                });

            case 'webinar':
                return products.webinars.filter((webinar) => {
                    if (selectedProductIds.includes(webinar.id)) return false;

                    if (!webinar.registration_deadline || !discountStartDate) return true;
                    const registrationEnd = parseISO(webinar.registration_deadline);
                    return registrationEnd >= discountStartDate;
                });

            default:
                return [];
        }
    }, [selectedProductType, products, watchStartsAt, watchApplicableProducts]);

    const getProductTypeName = (type: string) => {
        switch (type) {
            case 'course':
                return 'Kelas';
            case 'bootcamp':
                return 'Bootcamp';
            case 'webinar':
                return 'Webinar';
            default:
                return type;
        }
    };

    const getProductStatusInfo = (product: Product, type: string) => {
        if (type === 'course') {
            return null;
        }

        if (!product.registration_deadline) {
            return null;
        }

        const registrationEnd = parseISO(product.registration_deadline);
        const now = new Date();
        const discountStart = watchStartsAt;

        if (registrationEnd < now) {
            return { type: 'closed', text: 'Pendaftaran ditutup' };
        } else if (discountStart && registrationEnd < discountStart) {
            return { type: 'will-close', text: 'Akan tutup sebelum diskon aktif' };
        } else {
            return { type: 'open', text: `Tutup: ${format(registrationEnd, 'dd MMM yyyy', { locale: id })}` };
        }
    };

    function onSubmit(values: FormData) {
        const formData = {
            ...values,
            description: values.description || null,
            minimum_amount: values.minimum_amount || null,
            usage_limit: values.usage_limit || null,
            usage_limit_per_user: values.usage_limit_per_user || null,
            applicable_types: values.applicable_types && values.applicable_types.length > 0 ? values.applicable_types : null,
            applicable_products: values.applicable_products && values.applicable_products.length > 0 ? values.applicable_products : null,
            starts_at: values.starts_at.toISOString(),
            expires_at: values.expires_at.toISOString(),
            _method: 'PUT',
        };
        router.post(route('discount-codes.update', discountCode.id), formData);
    }

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Kode Diskon - ${discountCode.name}`} />

            <div className="px-4 py-4 md:px-6">
                <h1 className="text-2xl font-semibold">Edit Kode Diskon</h1>
                <p className="text-muted-foreground mb-6 max-w-2xl text-sm">
                    Ubah pengaturan kode diskon "{discountCode.name}". Pastikan semua informasi yang diperlukan telah diisi dengan benar.
                </p>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
                        <div className="space-y-6 rounded-lg border p-4">
                            <div className="flex items-center gap-2">
                                <Tag size={16} />
                                <h3 className="font-medium">Informasi Dasar</h3>
                            </div>

                            <FormField
                                control={form.control}
                                name="code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Kode Diskon <span className="text-red-500">*</span>
                                        </FormLabel>
                                        <div className="flex gap-2">
                                            <FormControl>
                                                <Input
                                                    placeholder="DISKON2024"
                                                    {...field}
                                                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                                    className="font-mono"
                                                    autoComplete="off"
                                                />
                                            </FormControl>
                                            <Button type="button" variant="outline" onClick={generateCode}>
                                                <Shuffle className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <FormDescription>Kode unik untuk diskon ini (akan otomatis menjadi huruf besar)</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Nama Diskon <span className="text-red-500">*</span>
                                        </FormLabel>
                                        <FormControl>
                                            <Input placeholder="Diskon Tahun Baru" {...field} autoComplete="off" />
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
                                        <FormLabel>Deskripsi</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Deskripsi kode diskon..."
                                                {...field}
                                                value={field.value || ''}
                                                autoComplete="off"
                                                rows={3}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 items-start gap-4">
                                <FormField
                                    control={form.control}
                                    name="type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Jenis Diskon <span className="text-red-500">*</span>
                                            </FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Pilih jenis diskon" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="percentage">Persentase (%)</SelectItem>
                                                    <SelectItem value="fixed">Nominal (Rp)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="value"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Nilai {watchType === 'percentage' ? 'Persentase' : 'Nominal'} <span className="text-red-500">*</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder={watchType === 'percentage' ? '10' : '50000'}
                                                    {...field}
                                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                                    min="1"
                                                    max={watchType === 'percentage' ? 100 : undefined}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                {watchType === 'percentage' ? 'Masukkan nilai 1-100' : 'Masukkan nominal dalam Rupiah'}
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="minimum_amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Minimum Pembelian</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="100000"
                                                {...field}
                                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                                value={field.value || ''}
                                                min="0"
                                            />
                                        </FormControl>
                                        <FormDescription>Kosongkan untuk tidak membatasi</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="space-y-6 rounded-lg border p-4">
                            <div className="flex items-center gap-2">
                                <Percent size={16} />
                                <h3 className="font-medium">Penggunaan & Validitas</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="usage_limit"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Batas Penggunaan Total</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="100"
                                                    {...field}
                                                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                                    value={field.value || ''}
                                                    min="1"
                                                />
                                            </FormControl>
                                            <FormDescription>Kosongkan untuk tidak membatasi</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="usage_limit_per_user"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Batas Per User</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="1"
                                                    {...field}
                                                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                                    value={field.value || ''}
                                                    min="1"
                                                />
                                            </FormControl>
                                            <FormDescription>Kosongkan untuk tidak membatasi</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="starts_at"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>
                                                Tanggal Mulai <span className="text-red-500">*</span>
                                            </FormLabel>
                                            <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            className={cn(
                                                                'justify-between text-left font-normal',
                                                                !field.value && 'text-muted-foreground',
                                                            )}
                                                        >
                                                            <div className="flex items-center">
                                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                                {field.value ? format(field.value, 'dd MMM yyyy', { locale: id }) : 'Pilih tanggal'}
                                                            </div>
                                                            <ChevronDownIcon className="h-4 w-4" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value}
                                                        captionLayout="dropdown"
                                                        endMonth={new Date(new Date().getFullYear() + 10, 11)}
                                                        onSelect={(date) => {
                                                            if (date) field.onChange(date);
                                                            setStartDateOpen(false);
                                                        }}
                                                        disabled={(date) => date < new Date()}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormDescription>Produk bootcamp dan webinar akan difilter berdasarkan tanggal ini</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="expires_at"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>
                                                Tanggal Berakhir <span className="text-red-500">*</span>
                                            </FormLabel>
                                            <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            className={cn(
                                                                'justify-between text-left font-normal',
                                                                !field.value && 'text-muted-foreground',
                                                            )}
                                                        >
                                                            <div className="flex items-center">
                                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                                {field.value ? format(field.value, 'dd MMM yyyy', { locale: id }) : 'Pilih tanggal'}
                                                            </div>
                                                            <ChevronDownIcon className="h-4 w-4" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value}
                                                        captionLayout="dropdown"
                                                        endMonth={new Date(new Date().getFullYear() + 10, 11)}
                                                        onSelect={(date) => {
                                                            if (date) field.onChange(date);
                                                            setEndDateOpen(false);
                                                        }}
                                                        disabled={(date) => date < form.getValues('starts_at')}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="space-y-3">
                                <FormLabel>Berlaku Untuk Produk</FormLabel>
                                <div className="flex flex-wrap gap-4">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="course"
                                            checked={watchApplicableTypes.includes('course')}
                                            onCheckedChange={(checked) => handleApplicableTypeChange('course', !!checked)}
                                        />
                                        <FormLabel htmlFor="course" className="text-sm font-normal">
                                            Kelas Online
                                        </FormLabel>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="bootcamp"
                                            checked={watchApplicableTypes.includes('bootcamp')}
                                            onCheckedChange={(checked) => handleApplicableTypeChange('bootcamp', !!checked)}
                                        />
                                        <FormLabel htmlFor="bootcamp" className="text-sm font-normal">
                                            Bootcamp
                                        </FormLabel>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="webinar"
                                            checked={watchApplicableTypes.includes('webinar')}
                                            onCheckedChange={(checked) => handleApplicableTypeChange('webinar', !!checked)}
                                        />
                                        <FormLabel htmlFor="webinar" className="text-sm font-normal">
                                            Webinar
                                        </FormLabel>
                                    </div>
                                </div>
                                <p className="text-muted-foreground text-sm">Kosong = berlaku untuk semua produk</p>

                                {(watchApplicableTypes.includes('bootcamp') || watchApplicableTypes.includes('webinar')) && (
                                    <div className="rounded-md bg-blue-50 p-3">
                                        <div className="flex items-start">
                                            <AlertCircle className="mt-0.5 mr-2 h-4 w-4 text-blue-600" />
                                            <div>
                                                <p className="text-xs font-medium text-blue-800">Catatan:</p>
                                                <p className="text-xs text-blue-700">
                                                    Bootcamp dan webinar yang dapat dipilih hanya yang pendaftarannya masih berlaku setelah tanggal
                                                    mulai diskon.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {watchApplicableTypes.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <FormLabel>Produk Spesifik (Opsional)</FormLabel>
                                        <Popover open={productSelectOpen} onOpenChange={setProductSelectOpen}>
                                            <PopoverTrigger asChild>
                                                <Button type="button" variant="outline" size="sm">
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    Tambah Produk
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-80" align="end">
                                                <div className="space-y-4">
                                                    <div>
                                                        <FormLabel>Jenis Produk</FormLabel>
                                                        <Select value={selectedProductType} onValueChange={setSelectedProductType}>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Pilih jenis produk" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {watchApplicableTypes.includes('course') && (
                                                                    <SelectItem value="course">Kelas Online</SelectItem>
                                                                )}
                                                                {watchApplicableTypes.includes('bootcamp') && (
                                                                    <SelectItem value="bootcamp">Bootcamp</SelectItem>
                                                                )}
                                                                {watchApplicableTypes.includes('webinar') && (
                                                                    <SelectItem value="webinar">Webinar</SelectItem>
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="max-h-40 space-y-2 overflow-y-auto">
                                                        {getAvailableProducts.length === 0 ? (
                                                            <p className="py-4 text-center text-sm text-gray-500">
                                                                {selectedProductType === 'course'
                                                                    ? 'Tidak ada kelas yang tersedia atau semua sudah dipilih'
                                                                    : `Tidak ada ${getProductTypeName(selectedProductType).toLowerCase()} yang tersedia untuk tanggal diskon ini atau semua sudah dipilih`}
                                                            </p>
                                                        ) : (
                                                            getAvailableProducts.map((product) => {
                                                                const statusInfo = getProductStatusInfo(product, selectedProductType);
                                                                return (
                                                                    <div
                                                                        key={product.id}
                                                                        className="flex cursor-pointer items-center justify-between rounded-lg border p-2 hover:bg-gray-50"
                                                                        onClick={() => handleAddProduct(product, selectedProductType)}
                                                                    >
                                                                        <div className="flex-1">
                                                                            <p className="text-sm font-medium">{product.title}</p>
                                                                            <p className="text-muted-foreground text-xs">
                                                                                Rp {new Intl.NumberFormat('id-ID').format(product.price)}
                                                                            </p>
                                                                            {/* Tampilkan info batch untuk bootcamp dan webinar */}
                                                                            {(selectedProductType === 'bootcamp' ||
                                                                                selectedProductType === 'webinar') &&
                                                                                product.batch && (
                                                                                    <p className="text-xs font-medium text-blue-600">
                                                                                        Batch {product.batch}
                                                                                    </p>
                                                                                )}
                                                                            {statusInfo && (
                                                                                <p
                                                                                    className={`mt-1 text-xs ${
                                                                                        statusInfo.type === 'closed'
                                                                                            ? 'text-red-600'
                                                                                            : statusInfo.type === 'will-close'
                                                                                              ? 'text-orange-600'
                                                                                              : 'text-green-600'
                                                                                    }`}
                                                                                >
                                                                                    {statusInfo.text}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })
                                                        )}
                                                    </div>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    {watchApplicableProducts.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-muted-foreground text-sm">Produk yang dipilih:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {watchApplicableProducts.map((product, index) => (
                                                    <Badge key={index} variant="secondary" className="flex items-center gap-2">
                                                        <span>
                                                            {getProductTypeName(product.type)}: {product.title}
                                                        </span>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-auto p-0 hover:bg-transparent"
                                                            onClick={() => handleRemoveProduct(product)}
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <p className="text-muted-foreground text-xs">Kosong = berlaku untuk semua produk dari jenis yang dipilih</p>
                                </div>
                            )}

                            <FormField
                                control={form.control}
                                name="is_active"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-y-0 space-x-3">
                                        <FormControl>
                                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>Kode diskon aktif</FormLabel>
                                            <FormDescription>Centang untuk mengaktifkan kode diskon</FormDescription>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="lg:col-span-2">
                            <Button type="submit" className="hover:cursor-pointer" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </AdminLayout>
    );
}
