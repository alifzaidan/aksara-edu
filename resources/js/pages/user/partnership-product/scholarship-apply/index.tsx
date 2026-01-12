'use client';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import UserLayout from '@/layouts/user-layout';
import { zodResolver } from '@hookform/resolvers/zod';
import { Head, router } from '@inertiajs/react';
import { CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

interface PartnershipProduct {
    id: string;
    title: string;
    description?: string | null;
    slug: string;
    thumbnail?: string | null;
}

const formSchema = z.object({
    name: z.string().nonempty('Nama lengkap harus diisi'),
    email: z.string().email('Email tidak valid'),
    phone: z.string().nonempty('Nomor telepon harus diisi'),
    university: z.string().nonempty('Nama universitas harus diisi'),
    major: z.string().nonempty('Program studi harus diisi'),
    semester: z.string().nonempty('Semester harus dipilih'),
    ktm_photo: z.instanceof(File, { message: 'Foto KTM harus diunggah' }).optional(),
    transcript_photo: z.instanceof(File, { message: 'Foto transkrip nilai harus diunggah' }).optional(),
    instagram_proof_photo: z.instanceof(File, { message: 'Foto bukti follow Instagram harus diunggah' }).optional(),
    instagram_tag_proof_photo: z.instanceof(File, { message: 'Foto bukti tag Instagram harus diunggah' }).optional(),
});

export default function ScholarshipApplicationForm({ partnershipProduct }: { partnershipProduct: PartnershipProduct }) {
    const [isLoading, setIsLoading] = useState(false);
    const [ktmPreview, setKtmPreview] = useState<string | null>(null);
    const [transcriptPreview, setTranscriptPreview] = useState<string | null>(null);
    const [instagramProofPreview, setInstagramProofPreview] = useState<string | null>(null);
    const [instagramTagProofPreview, setInstagramTagProofPreview] = useState<string | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            university: '',
            major: '',
            semester: '',
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);

        const formData = new FormData();
        formData.append('name', values.name);
        formData.append('email', values.email);
        formData.append('phone', values.phone);
        formData.append('university', values.university);
        formData.append('major', values.major);
        formData.append('semester', values.semester);

        if (values.ktm_photo) {
            formData.append('ktm_photo', values.ktm_photo);
        }
        if (values.transcript_photo) {
            formData.append('transcript_photo', values.transcript_photo);
        }
        if (values.instagram_proof_photo) {
            formData.append('instagram_proof_photo', values.instagram_proof_photo);
        }
        if (values.instagram_tag_proof_photo) {
            formData.append('instagram_tag_proof_photo', values.instagram_tag_proof_photo);
        }

        router.post(route('partnership-products.scholarship-store', partnershipProduct.slug), formData as any, {
            onSuccess: () => {
                toast.success('Pendaftaran beasiswa berhasil dikirim!');
                setIsLoading(false);
            },
            onError: () => {
                toast.error('Terjadi kesalahan saat mengirim pendaftaran');
                setIsLoading(false);
            },
        });
    }

    const handleFilePreview = (e: React.ChangeEvent<HTMLInputElement>, setPreview: React.Dispatch<React.SetStateAction<string | null>>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <UserLayout>
            <Head title={`Daftar Beasiswa - ${partnershipProduct.title}`} />

            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-zinc-900 dark:to-zinc-800">
                {/* Hero Section with Image */}
                <div className="to-primary relative overflow-hidden bg-gradient-to-tl from-black px-4 py-8 md:py-12">
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 left-0 size-96 rounded-full bg-white blur-3xl"></div>
                        <div className="absolute right-0 bottom-0 size-96 rounded-full bg-white blur-3xl"></div>
                    </div>

                    <div className="relative mx-auto w-full max-w-5xl">
                        <div className="flex flex-col items-center gap-8 text-center">
                            {/* Thumbnail Image */}
                            {partnershipProduct.thumbnail && (
                                <div className="overflow-hidden rounded-lg shadow-xl">
                                    <img
                                        src={
                                            partnershipProduct.thumbnail
                                                ? `/storage/${partnershipProduct.thumbnail}`
                                                : '/assets/images/placeholder.png'
                                        }
                                        alt={partnershipProduct.title}
                                        className="h-36 object-cover md:h-56"
                                    />
                                </div>
                            )}

                            {/* Header Text */}
                            <div className="space-y-2">
                                <h1 className="text-3xl font-bold text-white md:text-4xl">{partnershipProduct.title}</h1>
                                <p className="text-blue-100 md:text-xl">{partnershipProduct.description}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="mx-auto w-full max-w-5xl px-4 py-8">
                    {/* Requirements Section */}
                    <div className="mb-8 space-y-6 rounded-xl border-0 bg-gradient-to-br from-blue-50 to-indigo-50 p-2 shadow-md md:p-8 dark:from-blue-950/30 dark:to-indigo-950/30">
                        {/* Main Description */}
                        <div className="rounded-lg bg-white/60 p-3 text-center backdrop-blur-sm md:p-6 dark:bg-zinc-800/40">
                            <p className="font-semibold text-gray-900 md:text-lg dark:text-gray-100">
                                Aksademy membuka Program Beasiswa Kompetensi bagi mahasiswa yang ingin meningkatkan kemampuan di bidang perpajakan dan
                                memperoleh sertifikasi profesional yang dibutuhkan di dunia kerja.
                            </p>
                        </div>

                        {/* Requirements Grid */}
                        <div>
                            <h3 className="mb-4 flex items-center justify-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                                <span className="md:text-2xl">🎓</span> Persyaratan Peserta
                            </h3>
                            <div className="grid gap-3">
                                <div className="flex items-start gap-3 rounded-lg bg-white/60 p-3 backdrop-blur-sm dark:bg-zinc-800/40">
                                    <CheckCircle2 className="mt-0.5 size-5 flex-shrink-0 text-green-500" />
                                    <span className="text-sm text-gray-700 md:text-base dark:text-gray-300">Mahasiswa aktif jenjang D1–S1</span>
                                </div>
                                <div className="flex items-start gap-3 rounded-lg bg-white/60 p-3 backdrop-blur-sm dark:bg-zinc-800/40">
                                    <CheckCircle2 className="mt-0.5 size-5 flex-shrink-0 text-green-500" />
                                    <span className="text-sm text-gray-700 md:text-base dark:text-gray-300">Memiliki IPK minimal 3,00</span>
                                </div>
                                <div className="flex items-start gap-3 rounded-lg bg-white/60 p-3 backdrop-blur-sm dark:bg-zinc-800/40">
                                    <CheckCircle2 className="mt-0.5 size-5 flex-shrink-0 text-green-500" />
                                    <span className="text-sm text-gray-700 md:text-base dark:text-gray-300">Maksimal berada pada semester 8</span>
                                </div>
                                <div className="flex items-start gap-3 rounded-lg bg-white/60 p-3 backdrop-blur-sm dark:bg-zinc-800/40">
                                    <CheckCircle2 className="mt-0.5 size-5 flex-shrink-0 text-green-500" />
                                    <span className="text-sm text-gray-700 md:text-base dark:text-gray-300">
                                        Bersedia mengikuti seluruh tahapan seleksi
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Timeline Section */}
                        <div>
                            <h3 className="mb-4 flex items-center justify-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                                <span className="md:text-2xl">📅</span> Tahapan Pelaksanaan
                            </h3>
                            <div className="space-y-2">
                                <div className="flex items-start gap-3 rounded-lg bg-white/60 p-3 backdrop-blur-sm dark:bg-zinc-800/40">
                                    <div className="flex size-5 flex-shrink-0 items-center justify-center rounded-full bg-purple-500 text-xs font-bold text-white">
                                        1
                                    </div>
                                    <span className="text-sm text-gray-700 md:text-base dark:text-gray-300">Pendaftaran administrasi</span>
                                </div>
                                <div className="flex items-start gap-3 rounded-lg bg-white/60 p-3 backdrop-blur-sm dark:bg-zinc-800/40">
                                    <div className="flex size-5 flex-shrink-0 items-center justify-center rounded-full bg-purple-500 text-xs font-bold text-white">
                                        2
                                    </div>
                                    <span className="text-sm text-gray-700 md:text-base dark:text-gray-300">Sosialisasi program</span>
                                </div>
                                <div className="flex items-start gap-3 rounded-lg bg-white/60 p-3 backdrop-blur-sm dark:bg-zinc-800/40">
                                    <div className="flex size-5 flex-shrink-0 items-center justify-center rounded-full bg-purple-500 text-xs font-bold text-white">
                                        3
                                    </div>
                                    <span className="text-sm text-gray-700 md:text-base dark:text-gray-300">Seleksi peserta</span>
                                </div>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="to-primary rounded-lg bg-gradient-to-tl from-black p-4 text-white shadow-lg">
                            <p className="mb-3 text-xs font-semibold md:text-sm">📞 Untuk informasi lebih lanjut, silakan hubungi:</p>
                            <div className="space-y-1">
                                <p className="text-sm">
                                    📧 <span className="font-medium">info@aksademy.id</span>
                                </p>
                                <p className="text-sm">
                                    💬 <span className="font-medium">+62 812-XXXX-XXXX</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="rounded-xl border-0 bg-white shadow-lg dark:bg-zinc-800">
                        <div className="to-primary rounded-t-xl border-b border-gray-200 bg-gradient-to-tl from-black px-6 py-6 dark:border-zinc-700">
                            <h2 className="font-bold text-white md:text-2xl">📝 Formulir Pendaftaran</h2>
                            <p className="mt-1 text-sm text-blue-100 md:text-base">Lengkapi data diri dan dokumen pendukung Anda</p>
                        </div>

                        <div className="p-3 md:p-6">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                                    {/* Personal Information */}
                                    <div className="space-y-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-4 md:p-5 dark:from-blue-950/20 dark:to-indigo-950/20">
                                        <div className="flex items-center gap-2">
                                            <span className="md:text-2xl">👤</span>
                                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Informasi Pribadi</h3>
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Nama Lengkap *</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} placeholder="Masukkan nama lengkap Anda" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Email *</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} type="email" placeholder="Masukkan email Anda" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="phone"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Nomor Telepon *</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} placeholder="Masukkan nomor telepon Anda (08XXXX)" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* University Information */}
                                    <div className="space-y-4 rounded-lg border-t border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50 p-4 pt-5 md:p-5 dark:border-zinc-700 dark:from-green-950/20 dark:to-emerald-950/20">
                                        <div className="flex items-center gap-2">
                                            <span className="md:text-2xl">🎓</span>
                                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Informasi Universitas</h3>
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name="university"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Nama Universitas *</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} placeholder="Masukkan nama universitas Anda" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="major"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Program Studi *</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} placeholder="Contoh: Teknik Informatika, Ekonomi, etc" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="semester"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Semester *</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Pilih semester Anda" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="1">Semester 1</SelectItem>
                                                            <SelectItem value="2">Semester 2</SelectItem>
                                                            <SelectItem value="3">Semester 3</SelectItem>
                                                            <SelectItem value="4">Semester 4</SelectItem>
                                                            <SelectItem value="5">Semester 5</SelectItem>
                                                            <SelectItem value="6">Semester 6</SelectItem>
                                                            <SelectItem value="7">Semester 7</SelectItem>
                                                            <SelectItem value="8">Semester 8</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* Documents */}
                                    <div className="space-y-4 rounded-lg border-t border-gray-200 bg-gradient-to-r from-orange-50 to-amber-50 p-4 pt-5 md:p-5 dark:border-zinc-700 dark:from-orange-950/20 dark:to-amber-950/20">
                                        <div className="flex items-center gap-2">
                                            <span className="md:text-2xl">📄</span>
                                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Dokumen Pendukung</h3>
                                        </div>

                                        {/* KTM Photo */}
                                        <FormField
                                            control={form.control}
                                            name="ktm_photo"
                                            render={({ field: { onChange, value, ...field } }) => (
                                                <FormItem>
                                                    <FormLabel className="flex items-center gap-2">
                                                        <span>📋</span>
                                                        Foto KTM *
                                                    </FormLabel>
                                                    <FormControl>
                                                        <div className="space-y-3">
                                                            {ktmPreview && (
                                                                <div className="relative overflow-hidden rounded-lg border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 p-2 dark:from-green-950/30 dark:to-emerald-950/30">
                                                                    <img
                                                                        src={ktmPreview}
                                                                        alt="KTM Preview"
                                                                        className="h-40 w-full rounded object-contain"
                                                                    />
                                                                    <div className="absolute top-2 right-2 rounded-full bg-green-500 px-2 py-1 text-xs font-semibold text-white">
                                                                        ✓ Terpilih
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <Input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={(e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (file) {
                                                                        onChange(file);
                                                                        handleFilePreview(e, setKtmPreview);
                                                                    }
                                                                }}
                                                                className="cursor-pointer border-2 border-dashed border-gray-300 py-6 hover:border-green-400 dark:border-zinc-600"
                                                                {...field}
                                                            />
                                                        </div>
                                                    </FormControl>
                                                    <FormDescription className="text-xs">📸 Format: JPG, PNG, WebP (Maks 5MB)</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {/* Transcript Photo */}
                                        <FormField
                                            control={form.control}
                                            name="transcript_photo"
                                            render={({ field: { onChange, value, ...field } }) => (
                                                <FormItem>
                                                    <FormLabel className="flex items-center gap-2">
                                                        <span>📊</span>
                                                        Foto Transkrip Nilai *
                                                    </FormLabel>
                                                    <FormControl>
                                                        <div className="space-y-3">
                                                            {transcriptPreview && (
                                                                <div className="relative overflow-hidden rounded-lg border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 p-2 dark:from-blue-950/30 dark:to-indigo-950/30">
                                                                    <img
                                                                        src={transcriptPreview}
                                                                        alt="Transcript Preview"
                                                                        className="h-40 w-full rounded object-contain"
                                                                    />
                                                                    <div className="absolute top-2 right-2 rounded-full bg-blue-500 px-2 py-1 text-xs font-semibold text-white">
                                                                        ✓ Terpilih
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <Input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={(e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (file) {
                                                                        onChange(file);
                                                                        handleFilePreview(e, setTranscriptPreview);
                                                                    }
                                                                }}
                                                                className="cursor-pointer border-2 border-dashed border-gray-300 py-6 hover:border-blue-400 dark:border-zinc-600"
                                                                {...field}
                                                            />
                                                        </div>
                                                    </FormControl>
                                                    <FormDescription className="text-xs">📸 Format: JPG, PNG, WebP (Maks 5MB)</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {/* Instagram Follow Proof */}
                                        <FormField
                                            control={form.control}
                                            name="instagram_proof_photo"
                                            render={({ field: { onChange, value, ...field } }) => (
                                                <FormItem>
                                                    <FormLabel className="flex items-center gap-2">
                                                        <span>📱</span>
                                                        Foto Bukti Follow Instagram @aksademy *
                                                    </FormLabel>
                                                    <FormControl>
                                                        <div className="space-y-3">
                                                            {instagramProofPreview && (
                                                                <div className="relative overflow-hidden rounded-lg border-2 border-pink-300 bg-gradient-to-br from-pink-50 to-rose-50 p-2 dark:from-pink-950/30 dark:to-rose-950/30">
                                                                    <img
                                                                        src={instagramProofPreview}
                                                                        alt="Instagram Proof Preview"
                                                                        className="h-40 w-full rounded object-contain"
                                                                    />
                                                                    <div className="absolute top-2 right-2 rounded-full bg-pink-500 px-2 py-1 text-xs font-semibold text-white">
                                                                        ✓ Terpilih
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <Input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={(e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (file) {
                                                                        onChange(file);
                                                                        handleFilePreview(e, setInstagramProofPreview);
                                                                    }
                                                                }}
                                                                className="cursor-pointer border-2 border-dashed border-gray-300 py-6 hover:border-pink-400 dark:border-zinc-600"
                                                                {...field}
                                                            />
                                                        </div>
                                                    </FormControl>
                                                    <FormDescription className="text-xs">📸 Format: JPG, PNG, WebP (Maks 5MB)</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        {/* Instagram Tag Proof */}
                                        <FormField
                                            control={form.control}
                                            name="instagram_tag_proof_photo"
                                            render={({ field: { onChange, value, ...field } }) => (
                                                <FormItem>
                                                    <FormLabel className="flex items-center gap-2">
                                                        <span>👥</span>
                                                        Foto Bukti Tag 3 Teman di Instagram @aksademy *
                                                    </FormLabel>
                                                    <FormControl>
                                                        <div className="space-y-3">
                                                            {instagramTagProofPreview && (
                                                                <div className="relative overflow-hidden rounded-lg border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-violet-50 p-2 dark:from-purple-950/30 dark:to-violet-950/30">
                                                                    <img
                                                                        src={instagramTagProofPreview}
                                                                        alt="Instagram Tag Proof Preview"
                                                                        className="h-40 w-full rounded object-contain"
                                                                    />
                                                                    <div className="absolute top-2 right-2 rounded-full bg-purple-500 px-2 py-1 text-xs font-semibold text-white">
                                                                        ✓ Terpilih
                                                                    </div>
                                                                </div>
                                                            )}
                                                            <Input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={(e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (file) {
                                                                        onChange(file);
                                                                        handleFilePreview(e, setInstagramTagProofPreview);
                                                                    }
                                                                }}
                                                                className="cursor-pointer border-2 border-dashed border-gray-300 py-6 hover:border-purple-400 dark:border-zinc-600"
                                                                {...field}
                                                            />
                                                        </div>
                                                    </FormControl>
                                                    <FormDescription className="text-xs">📸 Format: JPG, PNG, WebP (Maks 5MB)</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* Submit Button */}
                                    <div className="flex gap-3 border-t border-gray-200 pt-6 dark:border-zinc-700">
                                        <Button variant="outline" type="button" onClick={() => window.history.back()} className="border-2">
                                            ← Kembali
                                        </Button>
                                        <Button type="submit" disabled={isLoading} className="flex-1">
                                            {isLoading ? '⏳ Mengirim...' : '✓ Kirim Pendaftaran'}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </div>
                    </div>
                </div>
            </div>
        </UserLayout>
    );
}
