import RatingDialog from '@/components/rating-dialog';
import { Button } from '@/components/ui/button';
import UserLayout from '@/layouts/user-layout';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Award, BadgeCheck, CheckCircle, Download, Eye, Star } from 'lucide-react';
import { useState } from 'react';

interface Category {
    id: string;
    name: string;
}

interface Course {
    id: string;
    title: string;
    slug: string;
    thumbnail: string;
    level: string;
    category_id: string;
    category: Category;
    course_url: string;
    registration_url: string;
    key_points: string;
    description: string | null;
    short_description: string | null;
    status: string;
    user_id: string;
    created_at: string;
    updated_at: string;
}

interface EnrollmentCourseItem {
    id: string;
    invoice_id: string;
    course_id: string;
    course: Course;
    progress: number;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
}

interface CourseProps {
    id: string;
    invoice_code: string;
    invoice_url: string;
    amount: number;
    status: string;
    paid_at: string | null;
    user_id: string;
    course_items: EnrollmentCourseItem[];
    created_at: string;
    updated_at: string;
}

interface CourseRating {
    id: string;
    user_id: string;
    course_id: string;
    rating: number;
    review: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    updated_at: string;
}

interface Certificate {
    id: string;
    title: string;
    certificate_number: string;
    description?: string;
}

interface CertificateParticipant {
    id: string;
    certificate_code: string;
    certificate_number: number;
}

function parseList(items?: string | null): string[] {
    if (!items) return [];
    const matches = items.match(/<li>(.*?)<\/li>/g);
    if (!matches) return [];
    return matches.map((li) => li.replace(/<\/?li>/g, '').trim());
}

export default function DetailMyCourse({
    course,
    courseRating,
    certificate,
    certificateParticipant,
}: {
    course: CourseProps | null;
    courseRating: CourseRating | null;
    certificate?: Certificate | null;
    certificateParticipant?: CertificateParticipant | null;
}) {
    const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);

    if (!course) {
        return (
            <UserLayout>
                <Head title="Kelas Tidak Ditemukan" />
                <div className="flex h-screen items-center justify-center">
                    <p>Detail kelas tidak dapat ditemukan.</p>
                    <Button className="mt-4 rounded-full" variant="secondary" asChild>
                        <Link href="/profile/my-courses">
                            <ArrowLeft /> Kembali Ke Kelas Saya
                        </Link>
                    </Button>
                </div>
            </UserLayout>
        );
    }

    const courseItem = course.course_items?.[0];
    const courseData = courseItem?.course;
    const courseInvoiceStatus = course.status;
    const keyPointList = parseList(courseData?.key_points);
    const isCompleted = courseItem?.progress === 100;
    const hasCertificate = certificate && isCompleted && courseRating && courseInvoiceStatus === 'paid';

    const renderCertificateSection = () => {
        if (!courseItem || courseItem.progress !== 100) return null;

        if (!courseRating) {
            return (
                <div className="mb-6 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 p-4 dark:border-blue-700 dark:from-blue-900/20 dark:to-blue-800/20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-400 to-blue-600">
                                <Star className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100">🎉 Selamat! Anda telah menyelesaikan kelas ini</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Berikan rating dan review untuk mendapatkan sertifikat kelulusan
                                </p>
                            </div>
                        </div>
                        <Button
                            size="sm"
                            className="border-none bg-gradient-to-r from-blue-400 to-blue-600 text-white shadow-lg hover:from-blue-500 hover:to-blue-700"
                            onClick={() => setIsRatingDialogOpen(true)}
                        >
                            <Star className="mr-2 h-4 w-4" />
                            Beri Rating
                        </Button>
                    </div>
                </div>
            );
        }

        if (courseRating && !hasCertificate) {
            return (
                <div className="mb-6 rounded-lg border border-yellow-200 bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 dark:border-yellow-700 dark:from-yellow-900/20 dark:to-yellow-800/20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600">
                                <Award className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100">🎉 Terima kasih atas rating Anda!</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {!certificate ? 'Sertifikat belum dibuat untuk course ini.' : 'Sertifikat sedang diproses.'}
                                </p>
                                <div className="mt-1 flex items-center gap-1">
                                    <span className="text-xs text-gray-500">Rating Anda:</span>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            className={`h-3 w-3 ${star <= courseRating.rating ? 'fill-current text-yellow-400' : 'text-gray-300'}`}
                                        />
                                    ))}
                                    <span className="ml-1 text-xs text-gray-500">({courseRating.rating}/5)</span>
                                </div>
                            </div>
                        </div>
                        <Button size="sm" disabled>
                            <Download className="mr-2 h-4 w-4" />
                            {!certificate ? 'Sertifikat Belum Tersedia' : 'Menunggu Sertifikat'}
                        </Button>
                    </div>
                </div>
            );
        }

        if (hasCertificate) {
            return (
                <div className="mb-6 rounded-lg border border-green-200 bg-gradient-to-r from-green-50 to-green-100 p-6 dark:border-green-700 dark:from-green-900/20 dark:to-green-800/20">
                    <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-green-400 to-green-600">
                            <Award className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">🎉 Sertifikat Kelulusan Tersedia!</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Anda telah berhasil menyelesaikan kelas ini dan sertifikat sudah siap diunduh
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-between">
                        {certificateParticipant && (
                            <div className="mt-4">
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                    No. Sertifikat: {String(certificateParticipant.certificate_number).padStart(4, '0')}/
                                    {certificate.certificate_number}
                                </p>
                                <Link
                                    href={route('certificate.participant.detail', {
                                        code: certificateParticipant.certificate_code,
                                    })}
                                    className="text-sm text-green-600 underline hover:text-green-800 dark:text-green-400"
                                >
                                    Lihat Detail Sertifikat
                                </Link>
                            </div>
                        )}

                        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <Button className="w-full" asChild>
                                <a href={route('profile.course.certificate', { course: courseData.slug })} target="_blank">
                                    <Download size={16} className="mr-2" />
                                    Unduh Sertifikat
                                </a>
                            </Button>

                            <Button variant="outline" className="w-full" asChild>
                                <a href={route('profile.course.certificate.preview', { course: courseData.slug })} target="_blank">
                                    <Eye size={16} className="mr-2" />
                                    Lihat Preview
                                </a>
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return null;
    };

    return (
        <UserLayout>
            <Head title={courseData?.title || 'Detail Kelas'} />
            {!courseData ? (
                <div className="flex h-screen items-center justify-center">
                    <div className="text-center">
                        <p className="mb-4">Detail kelas tidak dapat ditemukan.</p>
                        <Button className="rounded-full" variant="secondary" asChild>
                            <Link href="/profile/my-courses">
                                <ArrowLeft className="mr-2 h-4 w-4" /> Kembali Ke Kelas Saya
                            </Link>
                        </Button>
                    </div>
                </div>
            ) : (
                <>
                    <section className="to-background from-background via-tertiary dark:via-background dark:to-background relative bg-gradient-to-b py-12 text-gray-900 dark:text-white">
                        <div className="pointer-events-none absolute top-1/2 left-1/2 z-0 flex -translate-x-1/2 -translate-y-1/2 animate-spin items-center gap-8 duration-[10s]">
                            <div className="bg-primary h-[300px] w-[300px] rounded-full blur-[200px]" />
                            <div className="bg-secondary h-[300px] w-[300px] rounded-full blur-[200px]" />
                        </div>
                        <div className="relative mx-auto max-w-7xl px-4 text-center">
                            <Button className="top-0 left-4 mb-4 rounded-full md:absolute md:mb-0" variant="secondary" asChild>
                                <Link href="/profile/my-courses">
                                    <ArrowLeft /> Kembali Ke Kelas Saya
                                </Link>
                            </Button>
                            <div className="col-span-2">
                                <div className="flex flex-col items-center justify-center md:flex-row md:gap-4">
                                    <span className="text-primary border-primary bg-background mb-4 w-fit rounded-full border bg-gradient-to-t from-[#D9E5FF] to-white px-4 py-1 text-sm font-medium shadow-xs">
                                        📌 Enrolled in{' '}
                                        {courseItem &&
                                            new Date(courseItem.created_at).toLocaleDateString('id-ID', {
                                                month: 'long',
                                                year: 'numeric',
                                            })}
                                    </span>
                                    <span className="text-secondary border-secondary bg-background mb-4 inline-block rounded-full border bg-gradient-to-t from-[#FED6AD] to-white px-3 py-1 text-sm font-medium shadow-xs hover:text-[#FF925B]">
                                        🎮 Level <span className="capitalize">{courseData.level}</span>
                                    </span>
                                    {hasCertificate ? (
                                        <span className="mb-4 flex w-fit items-center gap-2 rounded-full border border-green-800 bg-green-100 px-4 py-1 text-sm font-medium text-green-800 shadow-xs">
                                            <Award size={16} />
                                            Sertifikat Tersedia
                                        </span>
                                    ) : null}
                                </div>

                                <h1 className="mx-auto mb-4 max-w-2xl text-4xl leading-tight font-bold italic sm:text-5xl">{courseData.title}</h1>

                                <p className="mb-6 text-lg text-gray-600 dark:text-gray-400">{courseData.description}</p>

                                <div className="flex items-center justify-center gap-4">
                                    <span className={`font-semibold ${courseInvoiceStatus === 'paid' ? 'text-green-600' : 'text-red-600'}`}>
                                        {courseInvoiceStatus !== 'paid' && (
                                            <>
                                                <span className="block text-red-600">⚠️ Status Pembayaran: {courseInvoiceStatus.toUpperCase()}</span>
                                                <span className="block text-sm text-gray-600">
                                                    {courseInvoiceStatus === 'failed'
                                                        ? 'Pembayaran gagal atau dibatalkan. Silakan lakukan pembelian ulang.'
                                                        : 'Selesaikan pembayaran untuk mengakses kelas.'}
                                                </span>
                                            </>
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </section>
                    <section className="mx-auto mb-12 w-full max-w-7xl px-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="col-span-2 flex h-full flex-col rounded-xl bg-white p-6 shadow dark:bg-zinc-800">
                                {renderCertificateSection()}

                                <h1 className="text-lg font-semibold">Progres Kamu</h1>

                                <div className="mt-4 mb-6">
                                    <div className="mb-2 flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progres Pembelajaran</span>
                                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{courseItem?.progress || 0}%</span>
                                    </div>
                                    <div className="h-3 w-full rounded-full bg-gray-200 shadow-inner dark:bg-gray-700">
                                        <div
                                            className={`relative h-3 rounded-full transition-all duration-500 ease-out ${
                                                (courseItem?.progress || 0) === 100
                                                    ? 'bg-gradient-to-r from-green-400 via-green-500 to-green-600 shadow-lg'
                                                    : 'bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600'
                                            }`}
                                            style={{ width: `${courseItem?.progress || 0}%` }}
                                        >
                                            {(courseItem?.progress || 0) > 10 && (
                                                <div className="absolute inset-0 animate-pulse rounded-full bg-white/20"></div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status Penyelesaian:</span>
                                        <div className="flex items-center gap-2">
                                            {courseItem?.completed_at ? (
                                                <>
                                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                                    <span className="text-sm font-semibold text-green-700 dark:text-green-400">Selesai</span>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="h-5 w-5 rounded-full border-2 border-gray-300 dark:border-gray-600"></div>
                                                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Sedang Berlangsung</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    {courseItem?.completed_at && (
                                        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                                            Diselesaikan pada:{' '}
                                            {new Date(courseItem.completed_at).toLocaleDateString('id-ID', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </div>
                                    )}
                                </div>

                                <h1 className="text-lg font-semibold">Poin Utama</h1>
                                <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                    {keyPointList.map((keyPoint, idx) => (
                                        <li key={idx} className="flex items-center gap-2">
                                            <BadgeCheck size={18} className="mt-1 min-w-6 text-green-600" />
                                            <p>{keyPoint}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="col-span-1 space-y-4">
                                <div className="flex h-full flex-col rounded-xl bg-white p-6 shadow dark:bg-zinc-800">
                                    <h2 className="mb-4 text-center font-semibold">{courseData.title}</h2>
                                    <img
                                        src={courseData.thumbnail ? `/storage/${courseData.thumbnail}` : '/assets/images/placeholder.png'}
                                        alt={courseData.title}
                                        className="aspect-video rounded-xl object-cover shadow-lg"
                                    />
                                    <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">{courseData.short_description}</p>

                                    <Button
                                        className="mt-2 w-full"
                                        onClick={() => router.get(route('learn.course.detail', { course: courseData.slug }))}
                                    >
                                        {isCompleted ? 'Lihat Kembali Materi' : 'Lanjutkan Belajar'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </section>
                </>
            )}

            {courseData && (
                <RatingDialog
                    isOpen={isRatingDialogOpen}
                    onClose={() => setIsRatingDialogOpen(false)}
                    course={{
                        id: courseData.id,
                        title: courseData.title,
                        thumbnail: courseData.thumbnail,
                        description: courseData.description || courseData.short_description || '',
                    }}
                />
            )}
        </UserLayout>
    );
}
