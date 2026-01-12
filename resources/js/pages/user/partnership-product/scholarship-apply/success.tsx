'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import UserLayout from '@/layouts/user-layout';
import { Head, Link } from '@inertiajs/react';
import { CheckCircle2, MessageCircle, Trophy } from 'lucide-react';

interface PartnershipProduct {
    id: string;
    title: string;
    slug: string;
    scholarship_group_link?: string | null;
}

interface SuccessPageProps {
    partnershipProduct: PartnershipProduct;
}

export default function ScholarshipApplicationSuccess({ partnershipProduct }: SuccessPageProps) {
    return (
        <UserLayout>
            <Head title="Pendaftaran Berhasil - Aksademy" />

            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-zinc-900 dark:to-zinc-800">
                <div className="mx-auto w-full max-w-3xl px-4 py-12">
                    {/* Success Icon and Message */}
                    <div className="mb-8 flex flex-col items-center text-center">
                        <div className="mb-4 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 p-6 shadow-lg">
                            <CheckCircle2 className="h-16 w-16 text-white" />
                        </div>
                        <h1 className="mb-2 text-3xl font-bold text-gray-900 md:text-4xl dark:text-white">Pendaftaran Berhasil! 🎉</h1>
                        <p className="text-lg text-gray-600 dark:text-gray-400">Terima kasih telah mendaftar program beasiswa</p>
                    </div>

                    {/* Main Content Card */}
                    <Card className="mb-6 border-0 shadow-lg dark:bg-zinc-800">
                        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                                <Trophy className="h-5 w-5" />
                                Apa Langkah Selanjutnya?
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <div className="space-y-4">
                                {/* Step 1 */}
                                <div className="flex gap-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
                                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                                        1
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Bergabung dengan Grup Komunitas</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Segera bergabung dengan grup komunitas untuk mendapatkan informasi terbaru, update program, dan materi
                                            pembelajaran.
                                        </p>
                                    </div>
                                </div>

                                {/* Step 2 */}
                                <div className="flex gap-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950/30">
                                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-yellow-600 text-sm font-bold text-white">
                                        2
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Tunggu Pengumuman Seleksi</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Tim kami akan meninjau data Anda dalam 3-5 hari kerja. Pengumuman hasil seleksi akan diinformasikan
                                            melalui grup komunitas.
                                        </p>
                                    </div>
                                </div>

                                {/* Step 3 */}
                                <div className="flex gap-4 rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-900 dark:bg-purple-950/30">
                                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-purple-600 text-sm font-bold text-white">
                                        3
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Ikuti Update di Grup</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Pastikan Anda aktif di grup untuk tidak melewatkan informasi penting, pengumuman, dan kesempatan sharing
                                            dengan peserta lain.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Group Invitation Card */}
                    {partnershipProduct.scholarship_group_link && (
                        <div className="mb-6 rounded-xl border-0 shadow-lg dark:bg-zinc-800">
                            <div className="rounded-t-xl bg-gradient-to-r from-green-500 to-emerald-500 p-4">
                                <div className="flex items-center gap-2 text-white">
                                    <MessageCircle className="h-5 w-5" />
                                    Bergabung dengan Grup Komunitas
                                </div>
                                <CardDescription className="text-green-100">
                                    Dapatkan update terbaru, sharing pengalaman, dan dukungan dari peserta lain
                                </CardDescription>
                            </div>
                            <div className="space-y-4 p-6">
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                    Bergabunglah dengan grup eksklusif peserta beasiswa untuk mendapatkan akses ke materi, update program, dan
                                    komunitas pembelajaran!
                                </p>

                                <Button
                                    asChild
                                    className="w-full border-green-700 bg-gradient-to-r from-green-500 to-emerald-500 transition hover:from-green-600 hover:to-emerald-600"
                                >
                                    <a
                                        href={partnershipProduct.scholarship_group_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2"
                                    >
                                        <MessageCircle className="h-4 w-4" />
                                        Buka Grup Sekarang
                                    </a>
                                </Button>

                                <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-xs text-green-800 dark:border-green-900 dark:bg-green-950/30 dark:text-green-200">
                                    💡 Link grup juga bisa diakses melalui panel profil Anda nanti
                                </div>
                            </div>
                        </div>
                    )}

                    {/* FAQ Card */}
                    <Card className="border-0 shadow-lg dark:bg-zinc-800">
                        <CardHeader>
                            <CardTitle>Pertanyaan yang Sering Diajukan</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="font-semibold text-gray-900 dark:text-gray-100">Berapa lama proses seleksi?</h4>
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                    Proses seleksi membutuhkan waktu 3-5 hari kerja. Kami akan menghubungi Anda melalui email atau telepon dengan
                                    hasil seleksi.
                                </p>
                            </div>

                            <div className="border-t border-gray-200 pt-4 dark:border-zinc-700">
                                <h4 className="font-semibold text-gray-900 dark:text-gray-100">Bagaimana jika saya tidak diterima?</h4>
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                    Anda tetap dapat mengikuti program reguler dengan harga normal. Tim kami mungkin juga menawarkan alternative
                                    beasiswa di periode berikutnya.
                                </p>
                            </div>

                            <div className="border-t border-gray-200 pt-4 dark:border-zinc-700">
                                <h4 className="font-semibold text-gray-900 dark:text-gray-100">Apakah data saya aman?</h4>
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                    Ya, data Anda dijaga dengan keamanan tingkat enterprise. Kami hanya menggunakan data Anda untuk keperluan
                                    pendaftaran beasiswa.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                        <Button asChild variant="outline" className="flex-1 border-2">
                            <Link href={route('partnership-product.detail', partnershipProduct.slug)}>← Kembali ke Detail Program</Link>
                        </Button>
                        <Button asChild className="flex-1">
                            <Link href={route('partnership-product.index')}>Jelajahi Program Lain</Link>
                        </Button>
                    </div>

                    {/* Support Contact */}
                    <div className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-4 text-center dark:border-blue-900 dark:bg-blue-950/30">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                            Ada pertanyaan atau butuh bantuan?{' '}
                            <a href="mailto:info@aksademy.id" className="font-semibold text-blue-600 hover:underline dark:text-blue-400">
                                Hubungi kami
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </UserLayout>
    );
}
