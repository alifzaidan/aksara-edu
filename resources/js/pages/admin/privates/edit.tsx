'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useInitials } from '@/hooks/use-initials';
import AdminLayout from '@/layouts/admin-layout';
import { cn, parseRupiah, rupiahFormatter } from '@/lib/utils';
import { BreadcrumbItem } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Head, router } from '@inertiajs/react';
import { BookMarked, CalendarFold, Check, ChevronDownIcon, ChevronsUpDown, Plus, Trash2, UserRound } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const scheduleSchema = z.object({
    start_time: z.string().nonempty('Waktu mulai harus diisi'),
    end_time: z.string().nonempty('Waktu selesai harus diisi'),
    max_participants: z.number().min(1),
});

const formSchema = z
    .object({
        user_id: z.string().nonempty('Mentor harus dipilih'),
        category_id: z.string().nonempty('Kategori harus dipilih'),
        title: z.string().nonempty('Judul harus diisi'),
        description: z.string().nullable(),
        requirements: z.string().nullable(),
        benefits: z.string().nullable(),
        curriculum: z.string().nullable(),
        thumbnail: z.any().nullable(),
        mode: z.enum(['online', 'offline']),
        location: z.string().nullable(),
        registration_deadline: z.string().nullable(),
        strikethrough_price: z.number().min(0),
        price: z.number().min(0),
        group_url: z.string().nullable(),
        requirement_1: z.string().nullable(),
        requirement_2: z.string().nullable(),
        requirement_3: z.string().nullable(),
        schedules: z.array(scheduleSchema).min(1, 'Minimal 1 slot jadwal'),
    })
    .refine(
        (data) => {
            if (data.strikethrough_price > 0) {
                return data.strikethrough_price > data.price;
            }
            return true;
        },
        { message: 'Harga coret harus lebih besar dari harga normal.', path: ['strikethrough_price'] },
    );

interface Category { id: string; name: string; }
interface Mentor { id: string; name: string; email: string; bio?: string; avatar?: string; }
interface Schedule { id: string; start_time: string; end_time: string; registration_deadline?: string | null; max_participants?: number; }
interface PrivateClass {
    id: string; title: string; user_id: string; category_id: string;
    description?: string | null; requirements?: string | null; benefits?: string | null; curriculum?: string | null;
    mode: 'online' | 'offline'; location?: string | null; registration_deadline?: string | null;
    strikethrough_price: number; price: number; group_url?: string | null;
    requirement_1?: string | null; requirement_2?: string | null; requirement_3?: string | null;
    thumbnail?: string | null; schedules?: Schedule[];
}
interface Props { privateClass: PrivateClass; categories: Category[]; mentors: Mentor[]; }

export default function EditPrivate({ privateClass, categories, mentors }: Props) {
    const getInitials = useInitials();
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Private Class', href: route('privates.index') },
        { title: privateClass.title, href: route('privates.show', { private: privateClass.id }) },
        { title: 'Edit', href: route('privates.edit', { private: privateClass.id }) },
    ];

    const [isCategoryPopoverOpen, setIsCategoryPopoverOpen] = useState(false);
    const [isMentorPopoverOpen, setIsMentorPopoverOpen] = useState(false);
    const [showStrikethroughPrice, setShowStrikethroughPrice] = useState((privateClass.strikethrough_price || 0) > 0);
    const [preview, setPreview] = useState<string | null>(
        privateClass.thumbnail ? `/storage/${privateClass.thumbnail}` : null,
    );
    const [thumbnailError, setThumbnailError] = useState(false);

    const initialSchedules = privateClass.schedules && privateClass.schedules.length > 0
        ? privateClass.schedules.map((s) => ({
              start_time: s.start_time ? s.start_time.slice(0, 16) : '',
              end_time: s.end_time ? s.end_time.slice(0, 16) : '',
              max_participants: s.max_participants || 1,
          }))
        : [{ start_time: '', end_time: '', max_participants: 1 }];

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            user_id: privateClass.user_id || '', category_id: privateClass.category_id || '',
            title: privateClass.title || '', description: privateClass.description || '',
            requirements: privateClass.requirements || '', benefits: privateClass.benefits || '',
            curriculum: privateClass.curriculum || '', thumbnail: null, mode: privateClass.mode || 'online',
            location: privateClass.location || '',
            registration_deadline: privateClass.registration_deadline ? privateClass.registration_deadline.slice(0, 16) : '',
            strikethrough_price: privateClass.strikethrough_price || 0, price: privateClass.price || 0,
            group_url: privateClass.group_url || '',
            requirement_1: privateClass.requirement_1 || '', requirement_2: privateClass.requirement_2 || '',
            requirement_3: privateClass.requirement_3 || '', schedules: initialSchedules,
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        const payload = {
            ...values,
            _method: 'PUT',
            schedules: values.schedules.map((s) => {
                const deadline = s.start_time
                    ? new Date(new Date(s.start_time).getTime() - 24 * 60 * 60 * 1000)
                          .toISOString()
                          .slice(0, 16)
                    : null;
                return { ...s, registration_deadline: deadline };
            }),
        };
        router.post(route('privates.update', { private: privateClass.id }), payload, { forceFormData: true });
    }

    const selectedMentor = mentors.find((m) => m.id === form.watch('user_id'));
    const schedules = form.watch('schedules');
    const addSchedule = () => {
        form.setValue('schedules', [...form.getValues('schedules'), { start_time: '', end_time: '', max_participants: 1 }]);
    };
    const removeSchedule = (index: number) => {
        const current = form.getValues('schedules');
        if (current.length <= 1) return;
        form.setValue('schedules', current.filter((_, i) => i !== index));
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${privateClass.title}`} />
            <div className="px-4 py-4 md:px-6">
                <h1 className="text-2xl font-semibold">Edit Private Class</h1>
                <p className="text-muted-foreground mb-6 max-w-2xl text-sm">
                    Ubah informasi private class di bawah ini. Klik "Simpan Perubahan" untuk menyimpan.
                </p>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
                        <div className="space-y-6 rounded-lg border p-4">
                            <div className="flex items-center gap-2">
                                <BookMarked size={16} />
                                <h3 className="font-medium">Detail Informasi Private Class</h3>
                            </div>
                            <FormField control={form.control} name="title" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Judul Private Class <span className="text-red-500">*</span></FormLabel>
                                    <FormControl><Input placeholder="Masukkan judul" {...field} autoComplete="off" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="category_id" render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Kategori <span className="text-red-500">*</span></FormLabel>
                                    <Popover open={isCategoryPopoverOpen} onOpenChange={setIsCategoryPopoverOpen}>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button variant="outline" role="combobox" className={cn('justify-between', !field.value && 'text-muted-foreground')}>
                                                    {field.value ? categories.find((c) => c.id === field.value)?.name : 'Pilih kategori'}
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
                                                        {categories.map((c) => (
                                                            <CommandItem key={c.id} value={c.name} onSelect={() => { form.setValue('category_id', c.id); setIsCategoryPopoverOpen(false); }}>
                                                                {c.name}
                                                                <Check className={cn('ml-auto', c.id === field.value ? 'opacity-100' : 'opacity-0')} />
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="description" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Deskripsi Lengkap</FormLabel>
                                    <Textarea {...field} value={field.value ?? ''} placeholder="Masukkan deskripsi" rows={6} autoComplete="off" />
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="mode" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mode</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih mode" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="online">Online</SelectItem>
                                            <SelectItem value="offline">Offline</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="location" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Lokasi (wajib jika offline)</FormLabel>
                                    <FormControl><Input placeholder="Masukkan lokasi" {...field} value={field.value ?? ''} autoComplete="off" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="thumbnail" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Thumbnail (File Upload)</FormLabel>
                                    <img src={preview || '/assets/images/placeholder.png'} alt="Preview" className="my-1 mt-2 h-40 w-64 rounded border object-cover" />
                                    <Input type="file" name={field.name} accept="image/png, image/jpeg, image/jpg"
                                        className={thumbnailError ? 'border-red-500 focus-visible:ring-red-500' : ''}
                                        onChange={(e) => {
                                            const file = e.target.files?.[0] ?? null;
                                            if (file) {
                                                if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) { setThumbnailError(true); toast('Gambar harus png, jpg, atau jpeg'); return; }
                                                if (file.size > 2 * 1024 * 1024) { setThumbnailError(true); toast('Ukuran file maksimal 2MB!'); return; }
                                            }
                                            setThumbnailError(false); field.onChange(file);
                                            if (file) { const r = new FileReader(); r.onload = (ev) => setPreview(ev.target?.result as string); r.readAsDataURL(file); } else { setPreview(privateClass.thumbnail ? `/storage/${privateClass.thumbnail}` : null); }
                                        }}
                                    />
                                    <FormDescription className="ms-1">Upload thumbnail. Format: PNG atau JPG Max 2 Mb</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <div className="space-y-4 rounded-md border p-4">
                                <div className="flex items-center space-x-2">
                                    <Switch id="show-strikethrough" checked={showStrikethroughPrice} onCheckedChange={(checked) => { setShowStrikethroughPrice(checked); if (!checked) form.setValue('strikethrough_price', 0); }} />
                                    <Label htmlFor="show-strikethrough">Aktifkan Harga Coret (Opsional)</Label>
                                </div>
                                {showStrikethroughPrice && (
                                    <FormField control={form.control} name="strikethrough_price" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Harga Coret</FormLabel>
                                            <Input {...field} type="text" placeholder="Rp 0" value={rupiahFormatter.format(field.value || 0)} onChange={(e) => field.onChange(parseRupiah(e.target.value))} autoComplete="off" />
                                            <FormDescription>Harga asli yang akan ditampilkan tercoret.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                )}
                            </div>
                            <FormField control={form.control} name="price" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Harga <span className="text-red-500">*</span></FormLabel>
                                    <Input {...field} type="text" placeholder="Masukkan harga" value={rupiahFormatter.format(field.value || 0)} onChange={(e) => field.onChange(parseRupiah(e.target.value))} autoComplete="off" />
                                    <FormDescription className="ms-1">Isi 0 untuk harga gratis</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                        <div className="space-y-6 rounded-lg border p-4">
                            <div className="flex items-center gap-2">
                                <CalendarFold size={16} />
                                <h3 className="font-medium">Jadwal dan Informasi Pemateri</h3>
                            </div>
                            <FormField control={form.control} name="registration_deadline" render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Registration Deadline Global (Opsional)</FormLabel>
                                    <div className="flex gap-4">
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" type="button" className="w-40 justify-between font-normal">
                                                    {field.value
                                                        ? new Date(field.value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                                                        : 'Pilih tanggal'}
                                                    <ChevronDownIcon />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                                                <Calendar mode="single" selected={field.value ? new Date(field.value) : undefined} captionLayout="dropdown" onSelect={(date) => { if (!date) return; const prev = field.value ? new Date(field.value) : new Date(); const time = prev.toTimeString().slice(0, 8) || '00:00:00'; const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; field.onChange(`${dateStr}T${time}`); }} />
                                            </PopoverContent>
                                        </Popover>
                                        <Input type="time" step="60" value={field.value ? new Date(field.value).toTimeString().slice(0, 5) : ''} onChange={(e) => { const prev = field.value ? new Date(field.value) : new Date(); const dateStr = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-${String(prev.getDate()).padStart(2, '0')}`; field.onChange(`${dateStr}T${e.target.value}:00`); }} className="w-24 bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none" />
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <div className="rounded-md border p-3">
                                <div className="mb-3 flex items-center justify-between">
                                    <Label>Jadwal Slot</Label>
                                    <Button type="button" variant="outline" size="sm" onClick={addSchedule}><Plus className="mr-1 h-4 w-4" />Tambah Slot</Button>
                                </div>
                                <div className="space-y-3">
                                    {schedules.map((_, index) => (
                                        <div key={index} className="rounded-md border p-3">
                                            <div className="mb-2 flex items-center justify-between">
                                                <p className="text-sm font-medium">Slot #{index + 1}</p>
                                                <Button type="button" variant="ghost" size="sm" onClick={() => removeSchedule(index)} disabled={schedules.length <= 1}><Trash2 className="mr-1 h-4 w-4" />Hapus</Button>
                                            </div>
                                            <div className="grid gap-3 md:grid-cols-2">
                                                <FormField control={form.control} name={`schedules.${index}.start_time`} render={({ field }) => (
                                                    <FormItem className="flex flex-col">
                                                        <FormLabel>Mulai</FormLabel>
                                                        <div className="flex gap-2">
                                                            <Popover>
                                                                <PopoverTrigger asChild>
                                                                    <Button variant="outline" type="button" className="w-32 justify-between font-normal text-xs">
                                                                        {field.value ? new Date(field.value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Tanggal'}
                                                                        <ChevronDownIcon />
                                                                    </Button>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                                                                    <Calendar mode="single" selected={field.value ? new Date(field.value) : undefined} captionLayout="dropdown" onSelect={(date) => { if (!date) return; const prev = field.value ? new Date(field.value) : new Date(); const time = prev.toTimeString().slice(0, 8) || '10:00:00'; const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; field.onChange(`${dateStr}T${time}`); }} />
                                                                </PopoverContent>
                                                            </Popover>
                                                            <Input type="time" step="60" value={field.value ? new Date(field.value).toTimeString().slice(0, 5) : '10:00'} onChange={(e) => { const prev = field.value ? new Date(field.value) : new Date(); const dateStr = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-${String(prev.getDate()).padStart(2, '0')}`; field.onChange(`${dateStr}T${e.target.value}:00`); }} className="w-20 bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none" />
                                                        </div>
                                                        <FormMessage />
                                                    </FormItem>
                                                )} />
                                                <FormField control={form.control} name={`schedules.${index}.end_time`} render={({ field }) => (
                                                    <FormItem className="flex flex-col">
                                                        <FormLabel>Selesai</FormLabel>
                                                        <div className="flex gap-2">
                                                            <Popover>
                                                                <PopoverTrigger asChild>
                                                                    <Button variant="outline" type="button" className="w-32 justify-between font-normal text-xs">
                                                                        {field.value ? new Date(field.value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Tanggal'}
                                                                        <ChevronDownIcon />
                                                                    </Button>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                                                                    <Calendar mode="single" selected={field.value ? new Date(field.value) : undefined} captionLayout="dropdown" onSelect={(date) => { if (!date) return; const prev = field.value ? new Date(field.value) : new Date(); const time = prev.toTimeString().slice(0, 8) || '12:00:00'; const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; field.onChange(`${dateStr}T${time}`); }} />
                                                                </PopoverContent>
                                                            </Popover>
                                                            <Input type="time" step="60" value={field.value ? new Date(field.value).toTimeString().slice(0, 5) : '12:00'} onChange={(e) => { const prev = field.value ? new Date(field.value) : new Date(); const dateStr = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-${String(prev.getDate()).padStart(2, '0')}`; field.onChange(`${dateStr}T${e.target.value}:00`); }} className="w-20 bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none" />
                                                        </div>
                                                        <FormMessage />
                                                    </FormItem>
                                                )} />
                                            </div>
                                            <div className="mt-3">
                                                <FormField control={form.control} name={`schedules.${index}.max_participants`} render={({ field }) => (<FormItem><FormLabel>Kuota Slot</FormLabel><FormControl><Input type="number" min={1} {...field} onChange={(e) => field.onChange(Number(e.target.value || 1))} /></FormControl><FormMessage /></FormItem>)} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <FormField control={form.control} name="user_id" render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Mentor / Pemateri <span className="text-red-500">*</span></FormLabel>
                                    <Popover open={isMentorPopoverOpen} onOpenChange={setIsMentorPopoverOpen}>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button variant="outline" role="combobox" className={cn('justify-between', !field.value && 'text-muted-foreground')}>
                                                    {selectedMentor ? (<div className="flex items-center gap-2"><Avatar className="h-6 w-6"><AvatarImage src={selectedMentor.avatar} alt={selectedMentor.name} /><AvatarFallback className="text-xs">{getInitials(selectedMentor.name)}</AvatarFallback></Avatar><span>{selectedMentor.name}</span></div>) : (<span className="flex items-center gap-2"><UserRound className="h-4 w-4" />Pilih mentor</span>)}
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
                                                        {mentors.map((m) => (
                                                            <CommandItem key={m.id} value={m.name} onSelect={() => { form.setValue('user_id', m.id); setIsMentorPopoverOpen(false); }} className="flex items-start gap-2 py-2">
                                                                <Avatar className="mt-0.5 h-8 w-8"><AvatarImage src={m.avatar} alt={m.name} /><AvatarFallback className="text-xs">{getInitials(m.name)}</AvatarFallback></Avatar>
                                                                <div className="flex-1"><p className="font-medium">{m.name}</p><p className="text-muted-foreground line-clamp-1 text-xs">{m.email}</p></div>
                                                                <Check className={cn('mt-1 ml-auto', m.id === field.value ? 'opacity-100' : 'opacity-0')} />
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    <FormDescription>Pilih mentor yang akan menjadi pemateri</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="requirement_1" render={({ field }) => (<FormItem><FormLabel>Persyaratan 1</FormLabel><Textarea {...field} value={field.value ?? ''} placeholder="Contoh: Follow Instagram @aksademy" autoComplete="off" /><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="requirement_2" render={({ field }) => (<FormItem><FormLabel>Persyaratan 2</FormLabel><Textarea {...field} value={field.value ?? ''} placeholder="Contoh: Follow TikTok @aksademy" autoComplete="off" /><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="requirement_3" render={({ field }) => (<FormItem><FormLabel>Persyaratan 3</FormLabel><Textarea {...field} value={field.value ?? ''} placeholder="Contoh: Tag 3 teman" autoComplete="off" /><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="group_url" render={({ field }) => (<FormItem><FormLabel>Link Group Peserta</FormLabel><Textarea {...field} value={field.value ?? ''} placeholder="Masukkan link grup" autoComplete="off" /><FormMessage /></FormItem>)} />
                        </div>
                        <Button type="submit" className="hover:cursor-pointer">Simpan Perubahan</Button>
                    </form>
                </Form>
            </div>
        </AdminLayout>
    );
}
