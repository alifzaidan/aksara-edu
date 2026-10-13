'use client';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import UserLayout from '@/layouts/user-layout';
import { zodResolver } from '@hookform/resolvers/zod';
import { Head, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
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

export default function ScholarshipApply({ program }: { program: Program }) {
    const { t } = useTranslation('user');
    const [isLoading, setIsLoading] = useState(false);
    const [ktmPreview, setKtmPreview] = useState<string | null>(null);
    const [transcriptPreview, setTranscriptPreview] = useState<string | null>(null);
    const [igFollowPreview, setIgFollowPreview] = useState<string | null>(null);
    const [tiktokFollowPreview, setTiktokFollowPreview] = useState<string | null>(null);
    const [commentTagPreview, setCommentTagPreview] = useState<string | null>(null);
    const [waSharePreview, setWaSharePreview] = useState<string | null>(null);
    const [igStoryPreview, setIgStoryPreview] = useState<string | null>(null);

    const formSchema = useMemo(
        () =>
            z.object({
                name: z.string().nonempty(t('certificationProgram.scholarshipApply.validation.nameRequired')),
                email: z.string().email(t('certificationProgram.scholarshipApply.validation.emailInvalid')),
                phone: z.string().nonempty(t('certificationProgram.scholarshipApply.validation.phoneRequired')),
                nim: z.string().nonempty(t('certificationProgram.scholarshipApply.validation.nimRequired')),
                university: z.string().nonempty(t('certificationProgram.scholarshipApply.validation.univRequired')),
                major: z.string().nonempty(t('certificationProgram.scholarshipApply.validation.majorRequired')),
                semester: z.string().nonempty(t('certificationProgram.scholarshipApply.validation.semesterRequired')),
                ktm_photo: z.instanceof(File, { message: t('certificationProgram.scholarshipApply.validation.ktmRequired') }),
                transcript_photo: z.instanceof(File, { message: t('certificationProgram.scholarshipApply.validation.transcriptRequired') }),
                instagram_follow_photo: z.instanceof(File, { message: t('certificationProgram.scholarshipApply.validation.igFollowRequired') }),
                tiktok_follow_photo: z.instanceof(File, { message: t('certificationProgram.scholarshipApply.validation.tiktokFollowRequired') }),
                comment_tag_photo: z.instanceof(File, { message: t('certificationProgram.scholarshipApply.validation.commentTagRequired') }),
                whatsapp_share_photo: z.instanceof(File, { message: t('certificationProgram.scholarshipApply.validation.waShareRequired') }),
                instagram_story_photo: z.instanceof(File, { message: t('certificationProgram.scholarshipApply.validation.igStoryRequired') }),
            }),
        [t],
    );

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
        if (values.whatsapp_share_photo) formData.append('whatsapp_share_photo', values.whatsapp_share_photo);
        if (values.instagram_story_photo) formData.append('instagram_story_photo', values.instagram_story_photo);

        router.post(route('certification-programs.scholarship-store', program.slug), formData, {
            onSuccess: () => {
                toast.success(t('certificationProgram.scholarshipApply.toastSuccess'));
                setIsLoading(false);
            },
            onError: () => {
                toast.error(t('certificationProgram.scholarshipApply.toastError'));
                setIsLoading(false);
            },
        });
    }

    const handleFilePreview = (e: React.ChangeEvent<HTMLInputElement>, setPreview: React.Dispatch<React.SetStateAction<string | null>>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    return (
        <UserLayout>
            <Head title={t('certificationProgram.scholarshipApply.headTitle', { title: program.title })} />
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
                                <p className="text-blue-100 md:text-xl">{t('certificationProgram.scholarshipApply.subtitle')}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="mx-auto w-full max-w-5xl px-4 py-8">
                    {/* Form */}
                    <div className="rounded-xl border-0 bg-white shadow-lg dark:bg-zinc-800">
                        <div className="to-primary rounded-t-xl border-b border-gray-200 bg-gradient-to-tl from-black px-6 py-6 dark:border-zinc-700">
                            <h2 className="font-bold text-white md:text-2xl">{t('certificationProgram.scholarshipApply.cardTitle')}</h2>
                            <p className="mt-1 text-sm text-blue-100 md:text-base">{t('certificationProgram.scholarshipApply.cardSubtitle')}</p>
                        </div>

                        <div className="p-3 md:p-6">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                                    {/* Personal Info */}
                                    <div className="space-y-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-4 md:p-5 dark:from-blue-950/20 dark:to-indigo-950/20">
                                        <div className="flex items-center gap-2">
                                            <span className="md:text-2xl">👤</span>
                                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t('certificationProgram.scholarshipApply.personalSection')}</h3>
                                        </div>
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('certificationProgram.scholarshipApply.nameLabel')}</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} placeholder={t('certificationProgram.scholarshipApply.namePlaceholder')} />
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
                                                    <FormLabel>{t('certificationProgram.scholarshipApply.emailLabel')}</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} type="email" placeholder={t('certificationProgram.scholarshipApply.emailPlaceholder')} />
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
                                                    <FormLabel>{t('certificationProgram.scholarshipApply.phoneLabel')}</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} placeholder={t('certificationProgram.scholarshipApply.phonePlaceholder')} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* University Info */}
                                    <div className="space-y-4 rounded-lg border-t border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50 p-4 pt-5 md:p-5 dark:border-zinc-700 dark:from-green-950/20 dark:to-emerald-950/20">
                                        <div className="flex items-center gap-2">
                                            <span className="md:text-2xl">🎓</span>
                                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t('certificationProgram.scholarshipApply.univSection')}</h3>
                                        </div>
                                        <FormField
                                            control={form.control}
                                            name="university"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('certificationProgram.scholarshipApply.univLabel')}</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} placeholder={t('certificationProgram.scholarshipApply.univPlaceholder')} />
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
                                                    <FormLabel>{t('certificationProgram.scholarshipApply.majorLabel')}</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} placeholder={t('certificationProgram.scholarshipApply.majorPlaceholder')} />
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
                                                    <FormLabel>{t('certificationProgram.scholarshipApply.semesterLabel')}</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder={t('certificationProgram.scholarshipApply.semesterPlaceholder')} />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                                                                <SelectItem key={s} value={String(s)}>
                                                                    {t('certificationProgram.scholarshipApply.semesterItem', { semester: s })}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="nim"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('certificationProgram.scholarshipApply.nimLabel')}</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} placeholder={t('certificationProgram.scholarshipApply.nimPlaceholder')} autoComplete="off" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* Documents */}
                                    <div className="space-y-4 rounded-lg border-t border-gray-200 bg-gradient-to-r from-orange-50 to-amber-50 p-4 pt-5 md:p-5 dark:border-zinc-700 dark:from-orange-950/20 dark:to-amber-950/20">
                                        <div className="flex items-center gap-2">
                                            <span className="md:text-2xl">📄</span>
                                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t('certificationProgram.scholarshipApply.docSection')}</h3>
                                        </div>

                                        {/* KTM */}
                                        <FormField
                                            control={form.control}
                                            name="ktm_photo"
                                            render={({ field: { onChange, value, ...field } }) => {
                                                void value;
                                                return (
                                                    <FormItem>
                                                        <FormLabel className="flex items-center gap-2">
                                                            <span>📋</span> {t('certificationProgram.scholarshipApply.ktmLabel')}
                                                        </FormLabel>
                                                        <FormControl>
                                                            <div className="space-y-3">
                                                                {ktmPreview && (
                                                                    <div className="relative overflow-hidden rounded-lg border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 p-2 dark:from-green-950/30 dark:to-emerald-950/30">
                                                                        <img src={ktmPreview} alt="KTM Preview" className="h-40 w-full rounded object-contain" />
                                                                        <div className="absolute top-2 right-2 rounded-full bg-green-500 px-2 py-1 text-xs font-semibold text-white">
                                                                            {t('certificationProgram.scholarshipApply.fileSelected')}
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
                                                        <FormDescription className="text-xs">{t('certificationProgram.scholarshipApply.fileFormatDesc')}</FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                );
                                            }}
                                        />

                                        {/* Transcript */}
                                        <FormField
                                            control={form.control}
                                            name="transcript_photo"
                                            render={({ field: { onChange, value, ...field } }) => {
                                                void value;
                                                return (
                                                    <FormItem>
                                                        <FormLabel className="flex items-center gap-2">
                                                            <span>📊</span> {t('certificationProgram.scholarshipApply.transcriptLabel')}
                                                        </FormLabel>
                                                        <FormControl>
                                                            <div className="space-y-3">
                                                                {transcriptPreview && (
                                                                    <div className="relative overflow-hidden rounded-lg border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 p-2 dark:from-blue-950/30 dark:to-indigo-950/30">
                                                                        <img src={transcriptPreview} alt="Transcript Preview" className="h-40 w-full rounded object-contain" />
                                                                        <div className="absolute top-2 right-2 rounded-full bg-blue-500 px-2 py-1 text-xs font-semibold text-white">
                                                                            {t('certificationProgram.scholarshipApply.fileSelected')}
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
                                                        <FormDescription className="text-xs">{t('certificationProgram.scholarshipApply.fileFormatDesc')}</FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                );
                                            }}
                                        />

                                        {/* Instagram Follow */}
                                        <FormField
                                            control={form.control}
                                            name="instagram_follow_photo"
                                            render={({ field: { onChange, value, ...field } }) => {
                                                void value;
                                                return (
                                                    <FormItem>
                                                        <FormLabel className="flex items-center gap-2">
                                                            <span>📱</span> {t('certificationProgram.scholarshipApply.igFollowLabel')}
                                                        </FormLabel>
                                                        <FormControl>
                                                            <div className="space-y-3">
                                                                {igFollowPreview && (
                                                                    <div className="relative overflow-hidden rounded-lg border-2 border-pink-300 bg-gradient-to-br from-pink-50 to-rose-50 p-2 dark:from-pink-950/30 dark:to-rose-950/30">
                                                                        <img src={igFollowPreview} alt="IG Follow Preview" className="h-40 w-full rounded object-contain" />
                                                                        <div className="absolute top-2 right-2 rounded-full bg-pink-500 px-2 py-1 text-xs font-semibold text-white">
                                                                            {t('certificationProgram.scholarshipApply.fileSelected')}
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
                                                                            handleFilePreview(e, setIgFollowPreview);
                                                                        }
                                                                    }}
                                                                    className="cursor-pointer border-2 border-dashed border-gray-300 py-6 hover:border-pink-400 dark:border-zinc-600"
                                                                    {...field}
                                                                />
                                                            </div>
                                                        </FormControl>
                                                        <FormDescription className="text-xs">{t('certificationProgram.scholarshipApply.fileFormatDesc')}</FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                );
                                            }}
                                        />

                                        {/* TikTok Follow */}
                                        <FormField
                                            control={form.control}
                                            name="tiktok_follow_photo"
                                            render={({ field: { onChange, value, ...field } }) => {
                                                void value;
                                                return (
                                                    <FormItem>
                                                        <FormLabel className="flex items-center gap-2">
                                                            <span>📱</span> {t('certificationProgram.scholarshipApply.tiktokFollowLabel')}
                                                        </FormLabel>
                                                        <FormControl>
                                                            <div className="space-y-3">
                                                                {tiktokFollowPreview && (
                                                                    <div className="relative overflow-hidden rounded-lg border-2 border-cyan-300 bg-gradient-to-br from-cyan-50 to-teal-50 p-2 dark:from-cyan-950/30 dark:to-teal-950/30">
                                                                        <img src={tiktokFollowPreview} alt="TikTok Follow Preview" className="h-40 w-full rounded object-contain" />
                                                                        <div className="absolute top-2 right-2 rounded-full bg-cyan-500 px-2 py-1 text-xs font-semibold text-white">
                                                                            {t('certificationProgram.scholarshipApply.fileSelected')}
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
                                                                            handleFilePreview(e, setTiktokFollowPreview);
                                                                        }
                                                                    }}
                                                                    className="cursor-pointer border-2 border-dashed border-gray-300 py-6 hover:border-cyan-400 dark:border-zinc-600"
                                                                    {...field}
                                                                />
                                                            </div>
                                                        </FormControl>
                                                        <FormDescription className="text-xs">{t('certificationProgram.scholarshipApply.fileFormatDesc')}</FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                );
                                            }}
                                        />

                                        {/* Comment Tag */}
                                        <FormField
                                            control={form.control}
                                            name="comment_tag_photo"
                                            render={({ field: { onChange, value, ...field } }) => {
                                                void value;
                                                return (
                                                    <FormItem>
                                                        <FormLabel className="flex items-center gap-2">
                                                            <span>👥</span> {t('certificationProgram.scholarshipApply.commentTagLabel')}
                                                        </FormLabel>
                                                        <FormControl>
                                                            <div className="space-y-3">
                                                                {commentTagPreview && (
                                                                    <div className="relative overflow-hidden rounded-lg border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-violet-50 p-2 dark:from-purple-950/30 dark:to-violet-950/30">
                                                                        <img src={commentTagPreview} alt="Comment Tag Preview" className="h-40 w-full rounded object-contain" />
                                                                        <div className="absolute top-2 right-2 rounded-full bg-purple-500 px-2 py-1 text-xs font-semibold text-white">
                                                                            {t('certificationProgram.scholarshipApply.fileSelected')}
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
                                                                            handleFilePreview(e, setCommentTagPreview);
                                                                        }
                                                                    }}
                                                                    className="cursor-pointer border-2 border-dashed border-gray-300 py-6 hover:border-purple-400 dark:border-zinc-600"
                                                                    {...field}
                                                                />
                                                            </div>
                                                        </FormControl>
                                                        <FormDescription className="text-xs">{t('certificationProgram.scholarshipApply.fileFormatDesc')}</FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                );
                                            }}
                                        />

                                        {/* WhatsApp Group Share */}
                                        <FormField
                                            control={form.control}
                                            name="whatsapp_share_photo"
                                            render={({ field: { onChange, value, ...field } }) => {
                                                void value;
                                                return (
                                                    <FormItem>
                                                        <FormLabel className="flex items-center gap-2">
                                                            <span>📲</span> {t('certificationProgram.scholarshipApply.waShareLabel')}
                                                        </FormLabel>
                                                        <FormControl>
                                                            <div className="space-y-3">
                                                                {waSharePreview && (
                                                                    <div className="relative overflow-hidden rounded-lg border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-teal-50 p-2 dark:from-emerald-950/30 dark:to-teal-950/30">
                                                                        <img src={waSharePreview} alt="WA Share Preview" className="h-40 w-full rounded object-contain" />
                                                                        <div className="absolute top-2 right-2 rounded-full bg-emerald-500 px-2 py-1 text-xs font-semibold text-white">
                                                                            {t('certificationProgram.scholarshipApply.fileSelected')}
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
                                                                            handleFilePreview(e, setWaSharePreview);
                                                                        }
                                                                    }}
                                                                    className="cursor-pointer border-2 border-dashed border-gray-300 py-6 hover:border-emerald-400 dark:border-zinc-600"
                                                                    {...field}
                                                                />
                                                            </div>
                                                        </FormControl>
                                                        <FormDescription className="text-xs">{t('certificationProgram.scholarshipApply.fileFormatDesc')}</FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                );
                                            }}
                                        />

                                        {/* Instagram Story */}
                                        <FormField
                                            control={form.control}
                                            name="instagram_story_photo"
                                            render={({ field: { onChange, value, ...field } }) => {
                                                void value;
                                                return (
                                                    <FormItem>
                                                        <FormLabel className="flex items-center gap-2">
                                                            <span>📸</span> {t('certificationProgram.scholarshipApply.igStoryLabel')}
                                                        </FormLabel>
                                                        <FormControl>
                                                            <div className="space-y-3">
                                                                {igStoryPreview && (
                                                                    <div className="relative overflow-hidden rounded-lg border-2 border-fuchsia-300 bg-gradient-to-br from-fuchsia-50 to-pink-50 p-2 dark:from-fuchsia-950/30 dark:to-pink-950/30">
                                                                        <img src={igStoryPreview} alt="IG Story Preview" className="h-40 w-full rounded object-contain" />
                                                                        <div className="absolute top-2 right-2 rounded-full bg-fuchsia-500 px-2 py-1 text-xs font-semibold text-white">
                                                                            {t('certificationProgram.scholarshipApply.fileSelected')}
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
                                                                            handleFilePreview(e, setIgStoryPreview);
                                                                        }
                                                                    }}
                                                                    className="cursor-pointer border-2 border-dashed border-gray-300 py-6 hover:border-fuchsia-400 dark:border-zinc-600"
                                                                    {...field}
                                                                />
                                                            </div>
                                                        </FormControl>
                                                        <FormDescription className="text-xs">{t('certificationProgram.scholarshipApply.fileFormatDesc')}</FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                );
                                            }}
                                        />
                                    </div>

                                    {/* Submit */}
                                    <div className="flex gap-3 border-t border-gray-200 pt-6 dark:border-zinc-700">
                                        <Button variant="outline" type="button" onClick={() => window.history.back()} className="border-2">
                                            {t('certificationProgram.scholarshipApply.btnBack')}
                                        </Button>
                                        <Button type="submit" disabled={isLoading} className="flex-1">
                                            {isLoading
                                                ? t('certificationProgram.scholarshipApply.btnSubmitting')
                                                : t('certificationProgram.scholarshipApply.btnSubmit')}
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
