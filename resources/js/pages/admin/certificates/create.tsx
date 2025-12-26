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
import { addYears, format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Award, CalendarFold, Check, ChevronDownIcon, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Sertifikat',
        href: route('certificates.index'),
    },
    {
        title: 'Tambah Sertifikat Baru',
        href: route('certificates.create'),
    },
];

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

interface CertificateCreateProps {
    designs: { id: string; name: string }[];
    signs: { id: string; name: string }[];
    courses: { id: string; title: string }[];
    bootcamps: { id: string; title: string }[];
    webinars: { id: string; title: string }[];
    prefilledData?: {
        program_type?: string;
        course_id?: string;
        bootcamp_id?: string;
        webinar_id?: string;
        title?: string;
        description?: string;
    };
}

const getTodayDate = () => {
    return format(new Date(), 'yyyy-MM-dd');
};

const generatePeriod = () => {
    const today = new Date();
    const futureDate = addYears(today, 5);

    const currentMonth = format(today, 'MMMM yyyy', { locale: id });
    const futureMonth = format(futureDate, 'MMMM yyyy', { locale: id });

    return `${currentMonth} - ${futureMonth}`;
};

export default function CreateCertificate({ designs, signs, courses, bootcamps, webinars, prefilledData = {} }: CertificateCreateProps) {
    const [isDesignPopoverOpen, setIsDesignPopoverOpen] = useState(false);
    const [isSignPopoverOpen, setIsSignPopoverOpen] = useState(false);
    const [isProgramPopoverOpen, setIsProgramPopoverOpen] = useState(false);
    const [openIssuedCalendar, setOpenIssuedCalendar] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            design_id: '',
            sign_id: '',
            certificate_number: '',
            title: prefilledData.title || '',
            description: prefilledData.description || '',
            header_top: 'No: AHU-0001401-AH.01.14 Tahun 2025',
            header_bottom: 'Alamat Permata Permadani Residence, Junrejo, Kota Batu, Jawa Timur',
            issued_date: getTodayDate(),
            period: generatePeriod(),
            program_type: prefilledData.program_type as 'course' | 'bootcamp' | 'webinar' | undefined,
            course_id: prefilledData.course_id || '',
            bootcamp_id: prefilledData.bootcamp_id || '',
            webinar_id: prefilledData.webinar_id || '',
        },
    });

    const programType = form.watch('program_type');

    const isPrefilledFromCourse = !!prefilledData.course_id;
    const isPrefilledFromBootcamp = !!prefilledData.bootcamp_id;
    const isPrefilledFromWebinar = !!prefilledData.webinar_id;
    const isPrefilledProgram = isPrefilledFromCourse || isPrefilledFromBootcamp || isPrefilledFromWebinar;

    function onSubmit(values: z.infer<typeof formSchema>) {
        router.post(route('certificates.store'), values);
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

    const getSelectedProgramName = () => {
        const programFieldName = getProgramFieldName();
        const selectedId = form.watch(programFieldName as 'course_id' | 'bootcamp_id' | 'webinar_id');
        const options = getProgramOptions();
        const selected = options.find((option) => option.id === selectedId);
        return selected?.title || '';
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah Sertifikat Baru" />
            <div className="px-4 py-4 md:px-6">
                <h1 className="text-2xl font-semibold">Tambah Sertifikat Baru</h1>
                <p className="text-muted-foreground mb-6 max-w-2xl text-sm">
                    Silakan isi form di bawah ini untuk membuat sertifikat baru. Pastikan semua informasi yang diperlukan telah diisi dengan benar.
                </p>

                {isPrefilledProgram && (
                    <div className="mb-6 rounded-lg bg-blue-50 p-4">
                        <div className="mb-2 flex items-center gap-2">
                            <Award className="h-4 w-4 text-blue-600" />
                            <h3 className="text-sm font-medium text-blue-900">Program Terpilih</h3>
                        </div>
                        <p className="text-sm text-blue-700">
                            Sertifikat ini akan dibuat untuk program: <strong>{getSelectedProgramName()}</strong>
                        </p>
                    </div>
                )}

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
                                            <Input placeholder="Contoh: LA12-AKS/VII/2025" {...field} autoComplete="off" />
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
                                                // Reset program IDs when type changes (only if not prefilled)
                                                if (!isPrefilledProgram) {
                                                    form.setValue('course_id', '');
                                                    form.setValue('bootcamp_id', '');
                                                    form.setValue('webinar_id', '');
                                                }
                                            }}
                                            defaultValue={field.value}
                                            disabled={isPrefilledProgram}
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
                                        {isPrefilledProgram && (
                                            <FormDescription className="text-blue-600">
                                                Program sudah dipilih dari halaman detail program
                                            </FormDescription>
                                        )}
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
                                            {isPrefilledProgram ? (
                                                // Show selected program as disabled input when prefilled
                                                <FormControl>
                                                    <Input value={getSelectedProgramName()} disabled className="bg-gray-50" />
                                                </FormControl>
                                            ) : (
                                                // Show dropdown when not prefilled
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
                                                                                    getProgramFieldName() as
                                                                                        | 'course_id'
                                                                                        | 'bootcamp_id'
                                                                                        | 'webinar_id',
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
                                            )}
                                            {isPrefilledProgram && (
                                                <FormDescription className="text-blue-600">Program sudah dipilih dari halaman detail</FormDescription>
                                            )}
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
                                                    endMonth={new Date(new Date().getFullYear() + 10, 11)}
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
                                Simpan Sertifikat
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </AdminLayout>
    );
}
