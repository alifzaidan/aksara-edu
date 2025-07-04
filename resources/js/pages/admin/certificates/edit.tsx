'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';
import { BreadcrumbItem } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Head, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { Award, CalendarFold, Check, ChevronDownIcon, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

interface Certificate {
    id: string;
    design_id: string;
    sign_id: string;
    certificate_number: string;
    title: string;
    description?: string | null;
    header_top?: string | null;
    header_bottom?: string | null;
    issued_date?: string | null;
    period?: string | null;
    program_type?: string;
    course_id?: string | null;
    bootcamp_id?: string | null;
    webinar_id?: string | null;
    design?: { id: string; name: string };
    sign?: { id: string; name: string };
    created_at: string;
    updated_at: string;
}

const formSchema = z.object({
    design_id: z.string().nonempty('Desain sertifikat harus dipilih'),
    sign_id: z.string().nonempty('Tanda tangan harus dipilih'),
    certificate_number: z.string().nonempty('Nomor sertifikat harus diisi'),
    title: z.string().nonempty('Judul sertifikat harus diisi'),
    description: z.string().nullable(),
    header_top: z.string().nullable(),
    header_bottom: z.string().nullable(),
    issued_date: z.string().nullable(),
    period: z.string().nullable(),
    program_type: z.enum(['course', 'bootcamp', 'webinar']).refine((val) => val !== undefined, {
        message: 'Jenis program harus dipilih',
    }),
    course_id: z.string().nullable(),
    bootcamp_id: z.string().nullable(),
    webinar_id: z.string().nullable(),
});

export default function EditCertificate({
    certificate,
    designs,
    signs,
    courses,
    bootcamps,
    webinars,
}: {
    certificate: Certificate;
    designs: { id: string; name: string }[];
    signs: { id: string; name: string }[];
    courses: { id: string; title: string }[];
    bootcamps: { id: string; title: string }[];
    webinars: { id: string; title: string }[];
}) {
    const [isDesignPopoverOpen, setIsDesignPopoverOpen] = useState(false);
    const [isSignPopoverOpen, setIsSignPopoverOpen] = useState(false);
    const [isProgramPopoverOpen, setIsProgramPopoverOpen] = useState(false);
    const [openIssuedCalendar, setOpenIssuedCalendar] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Sertifikat',
            href: route('certificates.index'),
        },
        {
            title: certificate.title,
            href: route('certificates.show', { certificate: certificate.id }),
        },
        {
            title: 'Edit Sertifikat',
            href: route('certificates.edit', { certificate: certificate.id }),
        },
    ];

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            design_id: certificate.design_id ?? '',
            sign_id: certificate.sign_id ?? '',
            certificate_number: certificate.certificate_number ?? '',
            title: certificate.title ?? '',
            description: certificate.description ?? '',
            header_top: certificate.header_top ?? '',
            header_bottom: certificate.header_bottom ?? '',
            issued_date: certificate.issued_date ?? '',
            period: certificate.period ?? '',
            program_type: certificate.program_type as 'course' | 'bootcamp' | 'webinar' | undefined,
            course_id: certificate.course_id ?? '',
            bootcamp_id: certificate.bootcamp_id ?? '',
            webinar_id: certificate.webinar_id ?? '',
        },
    });

    const programType = form.watch('program_type');

    function onSubmit(values: z.infer<typeof formSchema>) {
        router.put(route('certificates.update', { certificate: certificate.id }), values);
    }

    const getProgramOptions = () => {
        switch (programType) {
            case 'course':
                return courses;
            case 'bootcamp':
                return bootcamps;
            case 'webinar':
                return webinars;
            default:
                return [];
        }
    };

    const getProgramFieldName = () => {
        switch (programType) {
            case 'course':
                return 'course_id';
            case 'bootcamp':
                return 'bootcamp_id';
            case 'webinar':
                return 'webinar_id';
            default:
                return '';
        }
    };

    const getProgramPlaceholder = () => {
        switch (programType) {
            case 'course':
                return 'Pilih kelas online';
            case 'bootcamp':
                return 'Pilih bootcamp';
            case 'webinar':
                return 'Pilih webinar';
            default:
                return 'Pilih program';
        }
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Sertifikat - ${certificate.title}`} />
            <div className="px-4 py-4 md:px-6">
                <h1 className="text-2xl font-semibold">Edit Sertifikat {certificate.title}</h1>
                <p className="text-muted-foreground mb-6 max-w-2xl text-sm">
                    Silakan isi form di bawah ini untuk mengedit sertifikat. Setelah selesai, klik tombol "Simpan Perubahan" untuk menyimpan.
                </p>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
                        <div className="space-y-6 rounded-lg border p-4">
                            <div className="flex items-center gap-2">
                                <Award size={16} />
                                <h3 className="font-medium">Informasi Sertifikat</h3>
                            </div>

                            <FormField
                                control={form.control}
                                name="certificate_number"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Nomor Sertifikat <span className="text-red-500">*</span>
                                        </FormLabel>
                                        <FormControl>
                                            <Input placeholder="Contoh: CERT-2025-001" {...field} autoComplete="off" />
                                        </FormControl>
                                        <FormDescription>Nomor unik untuk sertifikat ini</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Judul Sertifikat <span className="text-red-500">*</span>
                                        </FormLabel>
                                        <FormControl>
                                            <Input placeholder="Masukkan judul sertifikat" {...field} autoComplete="off" />
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
                                        <Textarea
                                            {...field}
                                            value={field.value ?? ''}
                                            className="w-full rounded border p-2"
                                            placeholder="Masukkan deskripsi sertifikat"
                                            autoComplete="off"
                                        />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="header_top"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Header Atas</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Teks untuk header bagian atas"
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
                                name="header_bottom"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Header Bawah</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Teks untuk header bagian bawah"
                                                {...field}
                                                value={field.value ?? ''}
                                                autoComplete="off"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="space-y-6 rounded-lg border p-4">
                            <div className="flex items-center gap-2">
                                <CalendarFold size={16} />
                                <h3 className="font-medium">Detail Tambahan</h3>
                            </div>

                            <FormField
                                control={form.control}
                                name="program_type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Jenis Program <span className="text-red-500">*</span>
                                        </FormLabel>
                                        <Select
                                            onValueChange={(value) => {
                                                field.onChange(value);
                                                // Reset program IDs when type changes
                                                form.setValue('course_id', '');
                                                form.setValue('bootcamp_id', '');
                                                form.setValue('webinar_id', '');
                                            }}
                                            value={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih jenis program" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="course">Kelas Online</SelectItem>
                                                <SelectItem value="bootcamp">Bootcamp</SelectItem>
                                                <SelectItem value="webinar">Webinar</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {programType && (
                                <FormField
                                    control={form.control}
                                    name={getProgramFieldName() as 'course_id' | 'bootcamp_id' | 'webinar_id'}
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>
                                                {programType === 'course' ? 'Kelas Online' : programType === 'bootcamp' ? 'Bootcamp' : 'Webinar'}{' '}
                                                <span className="text-red-500">*</span>
                                            </FormLabel>
                                            <Popover open={isProgramPopoverOpen} onOpenChange={setIsProgramPopoverOpen}>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant="outline"
                                                            role="combobox"
                                                            className={cn('justify-between', !field.value && 'text-muted-foreground')}
                                                        >
                                                            {field.value
                                                                ? getProgramOptions().find((option) => option.id === field.value)?.title
                                                                : getProgramPlaceholder()}
                                                            <span className="sr-only">Pilih program</span>
                                                            <ChevronsUpDown className="opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="p-0">
                                                    <Command>
                                                        <CommandInput placeholder={`Cari ${programType}...`} className="h-9" />
                                                        <CommandList>
                                                            <CommandEmpty>Tidak ada {programType} ditemukan.</CommandEmpty>
                                                            <CommandGroup>
                                                                {getProgramOptions().map((option) => (
                                                                    <CommandItem
                                                                        value={option.title}
                                                                        key={option.id}
                                                                        onSelect={() => {
                                                                            form.setValue(
                                                                                getProgramFieldName() as 'course_id' | 'bootcamp_id' | 'webinar_id',
                                                                                option.id,
                                                                            );
                                                                            setIsProgramPopoverOpen(false);
                                                                        }}
                                                                    >
                                                                        {option.title}
                                                                        <Check
                                                                            className={cn(
                                                                                'ml-auto',
                                                                                option.id === field.value ? 'opacity-100' : 'opacity-0',
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
                            )}

                            <FormField
                                control={form.control}
                                name="design_id"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>
                                            Desain Sertifikat <span className="text-red-500">*</span>
                                        </FormLabel>
                                        <Popover open={isDesignPopoverOpen} onOpenChange={setIsDesignPopoverOpen}>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className={cn('justify-between', !field.value && 'text-muted-foreground')}
                                                    >
                                                        {field.value
                                                            ? designs.find((design) => design.id === field.value)?.name
                                                            : 'Pilih desain sertifikat'}
                                                        <span className="sr-only">Pilih desain</span>
                                                        <ChevronsUpDown className="opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="p-0">
                                                <Command>
                                                    <CommandInput placeholder="Cari desain..." className="h-9" />
                                                    <CommandList>
                                                        <CommandEmpty>Tidak ada desain ditemukan.</CommandEmpty>
                                                        <CommandGroup>
                                                            {designs.map((design) => (
                                                                <CommandItem
                                                                    value={design.name}
                                                                    key={design.id}
                                                                    onSelect={() => {
                                                                        form.setValue('design_id', design.id);
                                                                        setIsDesignPopoverOpen(false);
                                                                    }}
                                                                >
                                                                    {design.name}
                                                                    <Check
                                                                        className={cn(
                                                                            'ml-auto',
                                                                            design.id === field.value ? 'opacity-100' : 'opacity-0',
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
                                name="sign_id"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>
                                            Tanda Tangan <span className="text-red-500">*</span>
                                        </FormLabel>
                                        <Popover open={isSignPopoverOpen} onOpenChange={setIsSignPopoverOpen}>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className={cn('justify-between', !field.value && 'text-muted-foreground')}
                                                    >
                                                        {field.value ? signs.find((sign) => sign.id === field.value)?.name : 'Pilih tanda tangan'}
                                                        <span className="sr-only">Pilih tanda tangan</span>
                                                        <ChevronsUpDown className="opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="p-0">
                                                <Command>
                                                    <CommandInput placeholder="Cari tanda tangan..." className="h-9" />
                                                    <CommandList>
                                                        <CommandEmpty>Tidak ada tanda tangan ditemukan.</CommandEmpty>
                                                        <CommandGroup>
                                                            {signs.map((sign) => (
                                                                <CommandItem
                                                                    value={sign.name}
                                                                    key={sign.id}
                                                                    onSelect={() => {
                                                                        form.setValue('sign_id', sign.id);
                                                                        setIsSignPopoverOpen(false);
                                                                    }}
                                                                >
                                                                    {sign.name}
                                                                    <Check
                                                                        className={cn(
                                                                            'ml-auto',
                                                                            sign.id === field.value ? 'opacity-100' : 'opacity-0',
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
                                name="issued_date"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Tanggal Terbit</FormLabel>
                                        <Popover open={openIssuedCalendar} onOpenChange={setOpenIssuedCalendar}>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        className={cn('justify-between font-normal', !field.value && 'text-muted-foreground')}
                                                    >
                                                        {field.value ? format(new Date(field.value), 'dd MMMM yyyy') : 'Pilih tanggal terbit'}
                                                        <ChevronDownIcon className="h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value ? new Date(field.value) : undefined}
                                                    onSelect={(date) => {
                                                        if (date) {
                                                            field.onChange(format(date, 'yyyy-MM-dd'));
                                                        } else {
                                                            field.onChange('');
                                                        }
                                                        setOpenIssuedCalendar(false);
                                                    }}
                                                    captionLayout="dropdown"
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="period"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Periode</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Contoh: Januari - Maret 2025"
                                                {...field}
                                                value={field.value ?? ''}
                                                autoComplete="off"
                                            />
                                        </FormControl>
                                        <FormDescription>Periode berlakunya sertifikat</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="lg:col-span-2">
                            <Button type="submit" className="hover:cursor-pointer">
                                Simpan Perubahan
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </AdminLayout>
    );
}
