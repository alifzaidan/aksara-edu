'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import UserLayout from '@/layouts/user-layout';
import { formatExternalUrl } from '@/lib/utils';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, CheckCircle2, MessageCircle, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Program {
    id: string;
    title: string;
    slug: string;
    socialization_group_url?: string | null;
}

export default function ScholarshipSuccess({ program }: { program: Program }) {
    const { t } = useTranslation('user');

    return (
        <UserLayout>
            <Head title={t('certificationProgram.scholarshipSuccess.headTitle', { title: program.title })} />

            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-zinc-900 dark:to-zinc-800">
                <div className="mx-auto w-full max-w-3xl px-4 py-12">
                    {/* Success Icon */}
                    <div className="mb-8 flex flex-col items-center text-center">
                        <div className="mb-4 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 p-6 shadow-lg">
                            <CheckCircle2 className="h-16 w-16 text-white" />
                        </div>
                        <h1 className="mb-2 text-3xl font-bold text-gray-900 md:text-4xl dark:text-white">
                            {t('certificationProgram.scholarshipSuccess.title')}
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-400">
                            {t('certificationProgram.scholarshipSuccess.subtitle')}
                        </p>
                    </div>

                    {/* Steps Card */}
                    <Card className="mb-6 border-0 shadow-lg dark:bg-zinc-800">
                        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                                <Trophy className="h-5 w-5" />
                                {t('certificationProgram.scholarshipSuccess.stepsTitle')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <div className="flex gap-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                                    1
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                        {t('certificationProgram.scholarshipSuccess.step1Title')}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {t('certificationProgram.scholarshipSuccess.step1Desc')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950/30">
                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-yellow-600 text-sm font-bold text-white">
                                    2
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                        {t('certificationProgram.scholarshipSuccess.step2Title')}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {t('certificationProgram.scholarshipSuccess.step2Desc')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4 rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-900 dark:bg-purple-950/30">
                                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-purple-600 text-sm font-bold text-white">
                                    3
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                        {t('certificationProgram.scholarshipSuccess.step3Title')}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {t('certificationProgram.scholarshipSuccess.step3Desc')}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Group Link */}
                    <div className="mb-6 rounded-xl border-0 shadow-lg dark:bg-zinc-800">
                        <div className="rounded-t-xl bg-gradient-to-r from-green-500 to-emerald-500 p-4">
                            <div className="flex items-center gap-2 text-white">
                                <MessageCircle className="h-5 w-5" /> {t('certificationProgram.scholarshipSuccess.groupTitle')}
                            </div>
                            <CardDescription className="text-green-100">
                                {t('certificationProgram.scholarshipSuccess.groupSubtitle')}
                            </CardDescription>
                        </div>
                        <div className="space-y-4 p-6">
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                {t('certificationProgram.scholarshipSuccess.groupDesc')}
                            </p>
                            {program.socialization_group_url ? (
                                <Button
                                    asChild
                                    className="w-full border-green-700 bg-gradient-to-r from-green-500 to-emerald-500 transition hover:from-green-600 hover:to-emerald-600"
                                >
                                    <a
                                        href={formatExternalUrl(program.socialization_group_url)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2"
                                    >
                                        <MessageCircle className="h-4 w-4" /> {t('certificationProgram.scholarshipSuccess.btnJoinGroup')}
                                        <ArrowRight className="h-4 w-4" />
                                    </a>
                                </Button>
                            ) : (
                                <div className="rounded-lg border border-dashed border-green-300 bg-green-50 p-4 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300">
                                    {t('certificationProgram.scholarshipSuccess.groupNotAvailable')}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* FAQ */}
                    <Card className="border-0 shadow-lg dark:bg-zinc-800">
                        <CardHeader>
                            <CardTitle>{t('certificationProgram.scholarshipSuccess.faqTitle')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                    {t('certificationProgram.scholarshipSuccess.faq1Q')}
                                </h4>
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                    {t('certificationProgram.scholarshipSuccess.faq1A')}
                                </p>
                            </div>
                            <div className="border-t border-gray-200 pt-4 dark:border-zinc-700">
                                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                    {t('certificationProgram.scholarshipSuccess.faq2Q')}
                                </h4>
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                    {t('certificationProgram.scholarshipSuccess.faq2A')}
                                </p>
                            </div>
                            <div className="border-t border-gray-200 pt-4 dark:border-zinc-700">
                                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                    {t('certificationProgram.scholarshipSuccess.faq3Q')}
                                </h4>
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                    {t('certificationProgram.scholarshipSuccess.faq3A', { title: program.title })}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                        <Button asChild variant="outline" className="flex-1 border-2">
                            <Link href={route('certification-programs.detail', program.slug)}>
                                {t('certificationProgram.scholarshipSuccess.btnBackToDetail')}
                            </Link>
                        </Button>
                        <Button asChild className="flex-1">
                            <Link href="/certification-programs">
                                {t('certificationProgram.scholarshipSuccess.btnExplorePrograms')}
                            </Link>
                        </Button>
                    </div>

                    {/* Support */}
                    <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-4 text-center dark:border-blue-900 dark:bg-blue-950/30">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                            {t('certificationProgram.scholarshipSuccess.supportText')}{' '}
                            <a
                                href="mailto:aksarateknologimandiri@gmail.com"
                                className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
                            >
                                {t('certificationProgram.scholarshipSuccess.contactUs')}
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </UserLayout>
    );
}
