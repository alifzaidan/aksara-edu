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

interface Program {
    id: string;
    title: string;
    slug: string;
    description?: string | null;
    thumbnail?: string | null;
    type: 'regular' | 'scholarship';
    status: string;
}

const formSchema = z.object({
    name: z.string().nonempty('Nama lengkap harus diisi'),
    email: z.string().email('Email tidak valid'),
    phone: z.string().nonempty('Nomor telepon harus diisi'),
    nim: z.string().nonempty('NIM harus diisi'),
    university: z.string().nonempty('Nama universitas harus diisi'),
    major: z.string().nonempty('Program studi harus diisi'),
    semester: z.string().nonempty('Semester harus dipilih'),
    ktm_photo: z.instanceof(File, { message: 'Foto KTM harus diunggah' }).optional(),
    transcript_photo: z.instanceof(File, { message: 'Foto transkrip nilai harus diunggah' }).optional(),
    instagram_follow_photo: z.instanceof(File, { message: 'Foto bukti follow Instagram harus diunggah' }).optional(),
    tiktok_follow_photo: z.instanceof(File, { message: 'Foto bukti follow TikTok harus diunggah' }).optional(),
    comment_tag_photo: z.instanceof(File, { message: 'Foto bukti komentar & tag harus diunggah' }).optional(),
});

export default function ScholarshipApply({ program }: { program: Program }) {
    const [isLoading, setIsLoading] = useState(false);
    const [ktmPreview, setKtmPreview] = useState<string | null>(null);
    const [transcriptPreview, setTranscriptPreview] = useState<string | null>(null);
    const [igFollowPreview, setIgFollowPreview] = useState<string | null>(null);
    const [tiktokFollowPreview, setTiktokFollowPreview] = useState<string | null>(null);
    const [commentTagPreview, setCommentTagPreview] = useState<string | null>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { name: '', email: '', phone: '', nim: '', university: '', major: '', semester: '' },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        const formData = new FormData();
        formData.append('name', values.name);
        formData.append('email', values.email);
        formData.append('phone', values.phone);
        formData.append('nim', values.nim);
        formData.append('university', values.university);
        formData.append('major', values.major);
        formData.append('semester', values.semester);
        if (values.ktm_photo) formData.append('ktm_photo', values.ktm_photo);
        if (values.transcript_photo) formData.append('transcript_photo', values.transcript_photo);
        if (values.instagram_follow_photo) formData.append('instagram_follow_photo', values.instagram_follow_photo);
        if (values.tiktok_follow_photo) formData.append('tiktok_follow_photo', values.tiktok_follow_photo);
        if (values.comment_tag_photo) formData.append('comment_tag_photo', values.comment_tag_photo);

        router.post(route('certification-programs.scholarship-store', program.slug), formData, {
            onSuccess: () => { toast.success('Pengajuan beasiswa berhasil dikirim!'); setIsLoading(false); },
            onError: () => { toast.error('Terjadi kesalahan saat mengirim pengajuan'); setIsLoading(false); },
        });
    }

    const handleFilePreview = (e: React.ChangeEvent<HTMLInputElement>, setPreview: React.Dispatch<React.SetStateAction<string | null>>) => {
        const file = e.target.files?.[0];
        if (file) { const reader = new FileReader(); reader.onloadend = () => setPreview(reader.result as string); reader.readAsDataURL(file); }
    };

    return (
        <UserLayout>
            <Head title={`Ajukan Beasiswa - ${program.title}`} />
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-zinc-900 dark:to-zinc-800">
                {/* Hero */}
                <div className="to-primary relative overflow-hidden bg-gradient-to-tl from-black px-4 py-8 md:py-12">
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 left-0 size-96 rounded-full bg-white blur-3xl" />
                        <div className="absolute right-0 bottom-0 size-96 rounded-full bg-white blur-3xl" />
                    </div>
                    <div className="relative mx-auto w-full max-w-5xl">
                        <div className="flex flex-col items-center gap-8 text-center">
                            {program.thumbnail && (
                                <div className="overflow-hidden rounded-lg shadow-xl">
                                    <img src={`/storage/${program.thumbnail}`} alt={program.title} className="h-36 object-cover md:h-56" />
                                </div>
                            )}
                            <div className="space-y-2">
                                <h1 className="text-3xl font-bold text-white md:text-4xl">{program.title}</h1>
                                <p className="text-blue-100 md:text-xl">Formulir Pengajuan Beasiswa</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="mx-auto w-full max-w-5xl px-4 py-8">
                    {/* Requirements */}
                    <div className="mb-8 space-y-6 rounded-xl border-0 bg-gradient-to-br from-blue-50 to-indigo-50 p-2 shadow-md md:p-8 dark:from-blue-950/30 dark:to-indigo-950/30">
                        <div className="rounded-lg bg-white/60 p-3 text-center backdrop-blur-sm md:p-6 dark:bg-zinc-800/40">
                            <p className="font-semibold text-gray-900 md:text-lg dark:text-gray-100">
                                Aksademy membuka Program Beasiswa bagi mahasiswa yang ingin meningkatkan kemampuan dan memperoleh sertifikasi profesional yang dibutuhkan di dunia kerja.
                            </p>
                        </div>
                        <div>
                            <h3 className="mb-4 flex items-center justify-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                                <span className="md:text-2xl">🎓</span> Persyaratan Peserta
                            </h3>
                            <div className="grid gap-3">
                                {['Mahasiswa aktif jenjang D1–S1', 'Memiliki IPK minimal 3,00', 'Maksimal berada pada semester 8', 'Bersedia mengikuti seluruh tahapan seleksi'].map((req, i) => (
                                    <div key={i} className="flex items-start gap-3 rounded-lg bg-white/60 p-3 backdrop-blur-sm dark:bg-zinc-800/40">
                                        <CheckCircle2 className="mt-0.5 size-5 flex-shrink-0 text-green-500" />
                                        <span className="text-sm text-gray-700 md:text-base dark:text-gray-300">{req}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="to-primary rounded-lg bg-gradient-to-tl from-black p-4 text-white shadow-lg">
                            <p className="mb-3 text-xs font-semibold md:text-sm">📞 Untuk informasi lebih lanjut, silakan hubungi:</p>
                            <div className="space-y-1">
                                <p className="text-sm">📧 <span className="font-medium">aksarateknologimandiri@gmail.com</span></p>
                                <p className="text-sm">💬 <span className="font-medium">+6285142505794</span></p>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="rounded-xl border-0 bg-white shadow-lg dark:bg-zinc-800">
                        <div className="to-primary rounded-t-xl border-b border-gray-200 bg-gradient-to-tl from-black px-6 py-6 dark:border-zinc-700">
                            <h2 className="font-bold text-white md:text-2xl">📝 Formulir Pendaftaran Beasiswa</h2>
                            <p className="mt-1 text-sm text-blue-100 md:text-base">Lengkapi data diri dan dokumen pendukung Anda</p>
                        </div>

                        <div className="p-3 md:p-6">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                                    {/* Personal Info */}
                                    <div className="space-y-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-4 md:p-5 dark:from-blue-950/20 dark:to-indigo-950/20">
                                        <div className="flex items-center gap-2"><span className="md:text-2xl">👤</span><h3 className="font-semibold text-gray-900 dark:text-gray-100">Informasi Pribadi</h3></div>
                                        <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nama Lengkap *</FormLabel><FormControl><Input {...field} placeholder="Masukkan nama lengkap Anda" /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email *</FormLabel><FormControl><Input {...field} type="email" placeholder="Masukkan email Anda" /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Nomor Telepon *</FormLabel><FormControl><Input {...field} placeholder="Masukkan nomor telepon Anda (08XXXX)" /></FormControl><FormMessage /></FormItem>)} />
                                    </div>

                                    {/* University Info */}
                                    <div className="space-y-4 rounded-lg border-t border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50 p-4 pt-5 md:p-5 dark:border-zinc-700 dark:from-green-950/20 dark:to-emerald-950/20">
                                        <div className="flex items-center gap-2"><span className="md:text-2xl">🎓</span><h3 className="font-semibold text-gray-900 dark:text-gray-100">Informasi Universitas</h3></div>
                                        <FormField control={form.control} name="university" render={({ field }) => (<FormItem><FormLabel>Nama Universitas *</FormLabel><FormControl><Input {...field} placeholder="Masukkan nama universitas Anda" /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="major" render={({ field }) => (<FormItem><FormLabel>Program Studi *</FormLabel><FormControl><Input {...field} placeholder="Contoh: Teknik Informatika, Ekonomi, etc" /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="semester" render={({ field }) => (<FormItem><FormLabel>Semester *</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Pilih semester Anda" /></SelectTrigger></FormControl><SelectContent>{[1,2,3,4,5,6,7,8].map(s => <SelectItem key={s} value={String(s)}>Semester {s}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="nim" render={({ field }) => (<FormItem><FormLabel>NIM *</FormLabel><FormControl><Input {...field} placeholder="Masukkan NIM Anda" autoComplete="off" /></FormControl><FormMessage /></FormItem>)} />
                                    </div>

                                    {/* Documents */}
                                    <div className="space-y-4 rounded-lg border-t border-gray-200 bg-gradient-to-r from-orange-50 to-amber-50 p-4 pt-5 md:p-5 dark:border-zinc-700 dark:from-orange-950/20 dark:to-amber-950/20">
                                        <div className="flex items-center gap-2"><span className="md:text-2xl">📄</span><h3 className="font-semibold text-gray-900 dark:text-gray-100">Dokumen Pendukung</h3></div>

                                        {/* KTM */}
                                        <FormField control={form.control} name="ktm_photo" render={({ field: { onChange, value, ...field } }) => { void value; return (
                                            <FormItem><FormLabel className="flex items-center gap-2"><span>📋</span> Foto KTM *</FormLabel><FormControl><div className="space-y-3">
                                                {ktmPreview && <div className="relative overflow-hidden rounded-lg border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 p-2 dark:from-green-950/30 dark:to-emerald-950/30"><img src={ktmPreview} alt="KTM Preview" className="h-40 w-full rounded object-contain" /><div className="absolute top-2 right-2 rounded-full bg-green-500 px-2 py-1 text-xs font-semibold text-white">✓ Terpilih</div></div>}
                                                <Input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) { onChange(file); handleFilePreview(e, setKtmPreview); }}} className="cursor-pointer border-2 border-dashed border-gray-300 py-6 hover:border-green-400 dark:border-zinc-600" {...field} />
                                            </div></FormControl><FormDescription className="text-xs">📸 Format: JPG, PNG, WebP (Maks 5MB)</FormDescription><FormMessage /></FormItem>
                                        ); }} />

                                        {/* Transcript */}
                                        <FormField control={form.control} name="transcript_photo" render={({ field: { onChange, value, ...field } }) => { void value; return (
                                            <FormItem><FormLabel className="flex items-center gap-2"><span>📊</span> Foto Transkrip Nilai *</FormLabel><FormControl><div className="space-y-3">
                                                {transcriptPreview && <div className="relative overflow-hidden rounded-lg border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 p-2 dark:from-blue-950/30 dark:to-indigo-950/30"><img src={transcriptPreview} alt="Transcript Preview" className="h-40 w-full rounded object-contain" /><div className="absolute top-2 right-2 rounded-full bg-blue-500 px-2 py-1 text-xs font-semibold text-white">✓ Terpilih</div></div>}
                                                <Input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) { onChange(file); handleFilePreview(e, setTranscriptPreview); }}} className="cursor-pointer border-2 border-dashed border-gray-300 py-6 hover:border-blue-400 dark:border-zinc-600" {...field} />
                                            </div></FormControl><FormDescription className="text-xs">📸 Format: JPG, PNG, WebP (Maks 5MB)</FormDescription><FormMessage /></FormItem>
                                        ); }} />

                                        {/* Instagram Follow */}
                                        <FormField control={form.control} name="instagram_follow_photo" render={({ field: { onChange, value, ...field } }) => { void value; return (
                                            <FormItem><FormLabel className="flex items-center gap-2"><span>📱</span> Screenshot Follow Instagram @aksademy *</FormLabel><FormControl><div className="space-y-3">
                                                {igFollowPreview && <div className="relative overflow-hidden rounded-lg border-2 border-pink-300 bg-gradient-to-br from-pink-50 to-rose-50 p-2 dark:from-pink-950/30 dark:to-rose-950/30"><img src={igFollowPreview} alt="IG Follow Preview" className="h-40 w-full rounded object-contain" /><div className="absolute top-2 right-2 rounded-full bg-pink-500 px-2 py-1 text-xs font-semibold text-white">✓ Terpilih</div></div>}
                                                <Input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) { onChange(file); handleFilePreview(e, setIgFollowPreview); }}} className="cursor-pointer border-2 border-dashed border-gray-300 py-6 hover:border-pink-400 dark:border-zinc-600" {...field} />
                                            </div></FormControl><FormDescription className="text-xs">📸 Format: JPG, PNG, WebP (Maks 5MB)</FormDescription><FormMessage /></FormItem>
                                        ); }} />

                                        {/* TikTok Follow */}
                                        <FormField control={form.control} name="tiktok_follow_photo" render={({ field: { onChange, value, ...field } }) => { void value; return (
                                            <FormItem><FormLabel className="flex items-center gap-2"><span>📱</span> Screenshot Follow TikTok @aksademy *</FormLabel><FormControl><div className="space-y-3">
                                                {tiktokFollowPreview && <div className="relative overflow-hidden rounded-lg border-2 border-cyan-300 bg-gradient-to-br from-cyan-50 to-teal-50 p-2 dark:from-cyan-950/30 dark:to-teal-950/30"><img src={tiktokFollowPreview} alt="TikTok Follow Preview" className="h-40 w-full rounded object-contain" /><div className="absolute top-2 right-2 rounded-full bg-cyan-500 px-2 py-1 text-xs font-semibold text-white">✓ Terpilih</div></div>}
                                                <Input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) { onChange(file); handleFilePreview(e, setTiktokFollowPreview); }}} className="cursor-pointer border-2 border-dashed border-gray-300 py-6 hover:border-cyan-400 dark:border-zinc-600" {...field} />
                                            </div></FormControl><FormDescription className="text-xs">📸 Format: JPG, PNG, WebP (Maks 5MB)</FormDescription><FormMessage /></FormItem>
                                        ); }} />

                                        {/* Comment Tag */}
                                        <FormField control={form.control} name="comment_tag_photo" render={({ field: { onChange, value, ...field } }) => { void value; return (
                                            <FormItem><FormLabel className="flex items-center gap-2"><span>👥</span> Screenshot Komentar & Tag 3 Teman *</FormLabel><FormControl><div className="space-y-3">
                                                {commentTagPreview && <div className="relative overflow-hidden rounded-lg border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-violet-50 p-2 dark:from-purple-950/30 dark:to-violet-950/30"><img src={commentTagPreview} alt="Comment Tag Preview" className="h-40 w-full rounded object-contain" /><div className="absolute top-2 right-2 rounded-full bg-purple-500 px-2 py-1 text-xs font-semibold text-white">✓ Terpilih</div></div>}
                                                <Input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) { onChange(file); handleFilePreview(e, setCommentTagPreview); }}} className="cursor-pointer border-2 border-dashed border-gray-300 py-6 hover:border-purple-400 dark:border-zinc-600" {...field} />
                                            </div></FormControl><FormDescription className="text-xs">📸 Format: JPG, PNG, WebP (Maks 5MB)</FormDescription><FormMessage /></FormItem>
                                        ); }} />
                                    </div>

                                    {/* Submit */}
                                    <div className="flex gap-3 border-t border-gray-200 pt-6 dark:border-zinc-700">
                                        <Button variant="outline" type="button" onClick={() => window.history.back()} className="border-2">← Kembali</Button>
                                        <Button type="submit" disabled={isLoading} className="flex-1">{isLoading ? '⏳ Mengirim...' : '✓ Kirim Pengajuan Beasiswa'}</Button>
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
