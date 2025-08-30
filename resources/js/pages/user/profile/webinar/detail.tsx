import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import UserLayout from '@/layouts/user-layout';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Award, BadgeCheck, Calendar, CheckCircle, Clock, Download, Eye, MessageSquare, Upload, Users, X, Youtube } from 'lucide-react';
import { useState } from 'react';

interface Category {
    id: string;
    name: string;
}

interface Webinar {
    id: string;
    title: string;
    slug: string;
    thumbnail: string;
    category_id: string;
    category: Category;
    start_time: string;
    end_time: string;
    webinar_url: string;
    registration_url: string;
    recording_url: string | null;
    benefits: string;
    description: string | null;
    short_description: string | null;
    group_url: string | null;
    status: string;
    user_id: string;
    created_at: string;
    updated_at: string;
}

interface EnrollmentWebinarItem {
    id: string;
    invoice_id: string;
    webinar_id: string;
    webinar: Webinar;
    progress: number;
    completed_at: string | null;
    attendance_proof?: string | null;
    attendance_verified: boolean;
    review?: string | null;
    rating?: number | null;
    created_at: string;
    updated_at: string;
}

interface WebinarProps {
    id: string;
    invoice_code: string;
    invoice_url: string;
    amount: number;
    status: string;
    paid_at: string | null;
    user_id: string;
    webinar_items: EnrollmentWebinarItem[];
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

interface DetailWebinarProps {
    webinar: WebinarProps;
    certificate?: Certificate | null;
    certificateParticipant?: CertificateParticipant | null;
}

function parseList(items?: string | null): string[] {
    if (!items) return [];
    const matches = items.match(/<li>(.*?)<\/li>/g);
    if (!matches) return [];
    return matches.map((li) => li.replace(/<\/?li>/g, '').trim());
}

function getYoutubeEmbedUrl(url: string): string | null {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = match && match[2].length === 11 ? match[2] : null;
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
}

const StarRating = ({
    rating,
    onRatingChange,
    readonly = false,
}: {
    rating: number;
    onRatingChange?: (rating: number) => void;
    readonly?: boolean;
}) => {
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    disabled={readonly}
                    onClick={() => !readonly && onRatingChange?.(star)}
                    className={`text-2xl transition-colors ${
                        star <= rating ? 'text-yellow-400' : readonly ? 'text-gray-300' : 'text-gray-300 hover:text-yellow-300'
                    } ${readonly ? 'cursor-default' : 'cursor-pointer'}`}
                >
                    ★
                </button>
            ))}
        </div>
    );
};

export default function DetailMyWebinar({ webinar, certificate, certificateParticipant }: DetailWebinarProps) {
    const webinarItem = webinar.webinar_items?.[0];
    const webinarData = webinarItem?.webinar;
    const webinarInvoiceStatus = webinar.status;
    const benefitList = parseList(webinarData.benefits);
    const [isLoading, setIsLoading] = useState(true);

    const [submittingForm, setSubmittingForm] = useState(false);
    const [showCombinedForm, setShowCombinedForm] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [reviewText, setReviewText] = useState('');
    const [rating, setRating] = useState(0);

    const handleIframeLoad = () => {
        setIsLoading(false);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            if (!validTypes.includes(file.type)) {
                alert('Format file harus berupa gambar (JPG, PNG, WEBP)');
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                alert('Ukuran file maksimal 5MB');
                return;
            }

            setSelectedFile(file);
        }
    };

    const handleSubmitForm = async () => {
        if (!selectedFile || !reviewText.trim() || rating === 0 || !webinarItem) {
            alert('Mohon lengkapi semua field: upload bukti kehadiran, review, dan rating');
            return;
        }

        setSubmittingForm(true);

        const formData = new FormData();
        formData.append('attendance_proof', selectedFile);
        formData.append('review', reviewText);
        formData.append('rating', rating.toString());
        formData.append('enrollment_id', webinarItem.id);

        router.post(route('profile.webinar.attendance-review.submit'), formData, {
            preserveState: false,
            preserveScroll: true,
            onSuccess: () => {
                setShowCombinedForm(false);
                resetForm();
            },
            onError: (errors) => {
                console.error('Submit errors:', errors);
                alert('Gagal mengirim data');
            },
            onFinish: () => {
                setSubmittingForm(false);
            },
        });
    };

    const resetForm = () => {
        setSelectedFile(null);
        setReviewText('');
        setRating(0);
    };

    if (!webinarData || !webinarItem) {
        return (
            <UserLayout>
                <Head title="Webinar Tidak Ditemukan" />
                <div className="flex h-screen items-center justify-center">
                    <p>Detail webinar tidak dapat ditemukan.</p>
                </div>
            </UserLayout>
        );
    }

    const webinarEndDate = new Date(webinarData.end_time);
    const isWebinarFinished = new Date() > webinarEndDate;
    const isCompleted = isWebinarFinished;
    const hasRecording = webinarData.recording_url && getYoutubeEmbedUrl(webinarData.recording_url);
    const isAttendanceVerified = webinarItem.attendance_verified;
    const hasReview = webinarItem.review && webinarItem.rating;

    const hasCertificate = certificate && isCompleted && webinarInvoiceStatus === 'paid' && isAttendanceVerified && hasReview;

    return (
        <UserLayout>
            <Head title={webinarData.title} />
            <section className="to-background from-background via-tertiary dark:via-background dark:to-background relative bg-gradient-to-b py-12 text-gray-900 dark:text-white">
                <div className="pointer-events-none absolute top-1/2 left-1/2 z-0 flex -translate-x-1/2 -translate-y-1/2 animate-spin items-center gap-8 duration-[10s]">
                    <div className="bg-primary h-[300px] w-[300px] rounded-full blur-[200px]" />
                    <div className="bg-secondary h-[300px] w-[300px] rounded-full blur-[200px]" />
                </div>
                <div className="relative mx-auto max-w-7xl px-4 text-center">
                    <Button className="top-0 left-4 mb-4 rounded-full md:absolute md:mb-0" variant="secondary" asChild>
                        <Link href="/profile/my-webinars">
                            <ArrowLeft /> Kembali Ke Webinar Saya
                        </Link>
                    </Button>
                    <div className="col-span-2">
                        <div className="flex flex-col items-center justify-center md:flex-row md:gap-4">
                            <span className="text-primary border-primary bg-background mb-4 w-fit rounded-full border bg-gradient-to-t from-[#D9E5FF] to-white px-4 py-1 text-sm font-medium shadow-xs">
                                📌 Enrolled in{' '}
                                {new Date(webinarItem.created_at).toLocaleDateString('id-ID', {
                                    month: 'long',
                                    year: 'numeric',
                                })}
                            </span>
                            {hasCertificate ? (
                                <span className="mb-4 flex w-fit items-center gap-2 rounded-full border border-green-800 bg-green-100 px-4 py-1 text-sm font-medium text-green-800 shadow-xs">
                                    <Award size={16} />
                                    Sertifikat Tersedia
                                </span>
                            ) : null}
                            {hasRecording ? (
                                <span className="mb-4 flex w-fit items-center gap-2 rounded-full border border-red-800 bg-red-100 px-4 py-1 text-sm font-medium text-red-800 shadow-xs">
                                    <Youtube size={16} />
                                    Recording Tersedia
                                </span>
                            ) : null}
                        </div>

                        <h1 className="mx-auto mb-4 max-w-2xl text-4xl leading-tight font-bold italic sm:text-5xl">{webinarData.title}</h1>

                        <p className="mb-6 text-lg text-gray-600 dark:text-gray-400">{webinarData.description}</p>

                        <div className="flex items-center justify-center gap-4">
                            <span className={`font-semibold ${webinarInvoiceStatus === 'paid' ? 'text-green-600' : 'text-red-600'}`}>
                                {webinarInvoiceStatus !== 'paid' ? 'Selesaikan Pembayaran Untuk Bergabung Webinar!!' : ''}
                            </span>
                        </div>
                    </div>
                </div>
            </section>
            <section className="mx-auto mb-12 w-full max-w-7xl px-4">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {isWebinarFinished ? (
                        <>
                            <div className="col-span-2 space-y-6">
                                <div className="rounded-xl border border-green-200 bg-gradient-to-r from-green-50 to-blue-50 p-6 dark:border-green-800 dark:from-green-900/20 dark:to-blue-900/20">
                                    <div className="mb-4 flex items-center gap-3">
                                        <Award className="text-green-600" size={24} />
                                        <h2 className="text-xl font-bold text-green-800 dark:text-green-200">Terima Kasih Telah Berpartisipasi!</h2>
                                    </div>
                                    <p className="mb-4 text-green-700 dark:text-green-300">
                                        Semoga ilmu yang didapat bermanfaat untuk pengembangan karir dan skill Anda. Jangan lupa terapkan ilmu yang
                                        telah dipelajari!
                                    </p>
                                    {isCompleted && (
                                        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                                            <CheckCircle size={16} />
                                            <span>
                                                Selesai pada:{' '}
                                                {new Date(webinarData.end_time!).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                })}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {hasRecording ? (
                                    <div className="rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-pink-50 p-6 dark:border-red-800 dark:from-red-900/20 dark:to-pink-900/20">
                                        <div className="mb-4 flex items-center gap-3">
                                            <div className="rounded-full bg-red-100 p-2 dark:bg-red-800">
                                                <Youtube className="text-red-600 dark:text-red-400" size={20} />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-red-800 dark:text-red-200">🎥 Recording Webinar Tersedia</h2>
                                                <p className="text-sm text-red-600 dark:text-red-400">Tonton kembali materi webinar kapan saja</p>
                                            </div>
                                        </div>

                                        <div className="group relative">
                                            <div className="aspect-video w-full overflow-hidden rounded-lg shadow-lg">
                                                <iframe
                                                    className="h-full w-full"
                                                    src={getYoutubeEmbedUrl(webinarData.recording_url!)!}
                                                    title="Rekaman Webinar"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                />
                                            </div>
                                        </div>

                                        <p className="mt-4 text-sm text-red-700 dark:text-red-300">✨ Akses selamanya untuk materi webinar ini</p>
                                    </div>
                                ) : (
                                    <div className="rounded-xl border border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50 p-6 dark:border-yellow-800 dark:from-yellow-900/20 dark:to-orange-900/20">
                                        <div className="mb-4 flex items-center gap-3">
                                            <div className="rounded-full bg-yellow-100 p-2 dark:bg-yellow-800">
                                                <Clock className="text-yellow-600 dark:text-yellow-400" size={20} />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-yellow-800 dark:text-yellow-200">
                                                    ⏳ Recording Sedang Diproses
                                                </h2>
                                                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                                                    Mohon tunggu, recording akan tersedia dalam 1-2 hari
                                                </p>
                                            </div>
                                        </div>
                                        <div className="rounded-lg bg-yellow-100 p-4 dark:bg-yellow-800/50">
                                            <p className="text-center text-yellow-800 dark:text-yellow-200">
                                                📹 Tim kami sedang memproses recording webinar. Anda akan mendapat notifikasi ketika sudah siap
                                                ditonton.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
                                    <div className="mb-4 flex items-center gap-3">
                                        <Calendar className="text-blue-600" size={20} />
                                        <h3 className="text-lg font-semibold">Detail Webinar</h3>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
                                            <Calendar size={16} className="text-blue-600" />
                                            <div>
                                                <p className="font-medium text-blue-900 dark:text-blue-100">
                                                    {new Date(webinarData.start_time).toLocaleDateString('id-ID', {
                                                        weekday: 'long',
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric',
                                                    })}
                                                </p>
                                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                                    {new Date(webinarData.start_time).toLocaleTimeString('id-ID', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}{' '}
                                                    -{' '}
                                                    {new Date(webinarData.end_time).toLocaleTimeString('id-ID', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}{' '}
                                                    WIB
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="col-span-2 space-y-6">
                                {/* Schedule */}
                                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
                                    <div className="mb-4 flex items-center gap-3">
                                        <Calendar className="text-blue-600" size={20} />
                                        <h3 className="text-lg font-semibold">Jadwal Webinar</h3>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                                            <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-800">
                                                <Calendar size={16} className="text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                                                    {new Date(webinarData.start_time).toLocaleDateString('id-ID', {
                                                        weekday: 'long',
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric',
                                                    })}
                                                </p>
                                                <div className="mt-1 flex items-center gap-2">
                                                    <Clock size={14} className="text-blue-600" />
                                                    <p className="font-medium text-blue-700 dark:text-blue-300">
                                                        {new Date(webinarData.start_time).toLocaleTimeString('id-ID', {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}{' '}
                                                        -{' '}
                                                        {new Date(webinarData.end_time).toLocaleTimeString('id-ID', {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}{' '}
                                                        WIB
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Benefits */}
                                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
                                    <div className="mb-4 flex items-center gap-3">
                                        <BadgeCheck className="text-green-600" size={20} />
                                        <h3 className="text-lg font-semibold">Fasilitas yang Tersedia</h3>
                                    </div>
                                    <div className="space-y-3">
                                        {benefitList.map((benefit, idx) => (
                                            <div key={idx} className="flex items-start gap-3 rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                                                <BadgeCheck size={18} className="mt-1 min-w-6 text-green-600" />
                                                <p className="text-gray-700 dark:text-gray-300">{benefit}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Sidebar */}
                    <div className="col-span-1 space-y-6">
                        {isCompleted && webinarInvoiceStatus === 'paid' && !hasReview && (
                            <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-6 dark:border-purple-800 dark:from-purple-900/20 dark:to-pink-900/20">
                                <div className="mb-4 flex items-center gap-3">
                                    <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-800">
                                        <MessageSquare className="text-purple-600 dark:text-purple-400" size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-purple-800 dark:text-purple-200">Lengkapi Data untuk Sertifikat</h2>
                                        <p className="text-sm text-purple-600 dark:text-purple-400">Upload bukti kehadiran dan berikan review</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="rounded-lg bg-purple-100 p-4 dark:bg-purple-800/50">
                                        <p className="text-center text-purple-800 dark:text-purple-200">
                                            🎯 Untuk mendapatkan sertifikat, silakan upload bukti kehadiran dan berikan review untuk webinar ini.
                                        </p>
                                    </div>

                                    {!showCombinedForm ? (
                                        <Button onClick={() => setShowCombinedForm(true)} className="w-full bg-purple-600 hover:bg-purple-700">
                                            <Upload size={16} className="mr-2" />
                                            Lengkapi Data Sertifikat
                                        </Button>
                                    ) : (
                                        <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-medium">Formulir Sertifikat</h4>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setShowCombinedForm(false);
                                                        resetForm();
                                                    }}
                                                >
                                                    <X size={16} />
                                                </Button>
                                            </div>

                                            {/* File Upload */}
                                            <div className="space-y-2">
                                                <Label htmlFor="attendance_proof">
                                                    Screenshot Kehadiran <span className="text-red-500">*</span>
                                                </Label>
                                                <Input
                                                    id="attendance_proof"
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleFileSelect}
                                                    className="file:mr-4 file:rounded file:border-0 file:bg-gray-100 file:px-2 file:py-1 file:text-sm file:text-gray-700 hover:file:bg-gray-200"
                                                />
                                                <p className="text-xs text-gray-500">Format: JPG, PNG, WEBP. Maksimal 5MB.</p>
                                            </div>

                                            {selectedFile && (
                                                <div className="text-center">
                                                    <img
                                                        src={URL.createObjectURL(selectedFile)}
                                                        alt="Preview"
                                                        className="mx-auto max-h-32 rounded-lg border shadow-sm"
                                                    />
                                                    <p className="mt-2 text-sm text-gray-600">{selectedFile.name}</p>
                                                </div>
                                            )}

                                            {/* Rating */}
                                            <div className="space-y-2">
                                                <Label>
                                                    Rating <span className="text-red-500">*</span>
                                                </Label>
                                                <StarRating rating={rating} onRatingChange={setRating} />
                                                <p className="text-xs text-gray-500">Berikan rating 1-5 bintang untuk webinar ini</p>
                                            </div>

                                            {/* Review */}
                                            <div className="space-y-2">
                                                <Label htmlFor="review">
                                                    Review <span className="text-red-500">*</span>
                                                </Label>
                                                <textarea
                                                    id="review"
                                                    value={reviewText}
                                                    onChange={(e) => setReviewText(e.target.value)}
                                                    placeholder="Bagikan pengalaman Anda mengikuti webinar ini..."
                                                    className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                                    rows={4}
                                                    maxLength={500}
                                                />
                                                <p className="text-xs text-gray-500">Maksimal 500 karakter ({reviewText.length}/500)</p>
                                            </div>

                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                        setShowCombinedForm(false);
                                                        resetForm();
                                                    }}
                                                    className="flex-1"
                                                >
                                                    Batal
                                                </Button>
                                                <Button
                                                    onClick={handleSubmitForm}
                                                    disabled={!selectedFile || !reviewText.trim() || rating === 0 || submittingForm}
                                                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                                                >
                                                    {submittingForm ? 'Mengirim...' : 'Kirim Data'}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {hasReview && (
                            <div className="rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6 dark:border-green-800 dark:from-green-900/20 dark:to-emerald-900/20">
                                <div className="mb-4 flex items-center gap-3">
                                    <div className="rounded-full bg-green-100 p-2 dark:bg-green-800">
                                        <CheckCircle className="text-green-600 dark:text-green-400" size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-green-800 dark:text-green-200">✅ Data Telah Lengkap</h2>
                                        <p className="text-sm text-green-600 dark:text-green-400">Terima kasih atas review Anda!</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="rounded-lg bg-green-100 p-4 dark:bg-green-800/50">
                                        <div className="mb-2">
                                            <StarRating rating={webinarItem.rating || 0} readonly />
                                        </div>
                                        <p className="text-green-800 dark:text-green-200">"{webinarItem.review}"</p>
                                    </div>

                                    {webinarItem.attendance_proof ? (
                                        <div className="text-center">
                                            <img
                                                src={`/storage/${webinarItem.attendance_proof}`}
                                                alt="Bukti Kehadiran"
                                                className="mx-auto max-h-32 rounded-lg border shadow-sm"
                                            />
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        )}

                        {isWebinarFinished ? (
                            <div className="sticky top-6 space-y-4">
                                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
                                    <div className="mb-4 flex items-center gap-2">
                                        <Award className="text-yellow-500" size={20} />
                                        <h3 className="font-semibold">Sertifikat Partisipasi</h3>
                                    </div>

                                    {isLoading && hasCertificate ? (
                                        <div className="space-y-3">
                                            <Skeleton className="h-[250px] w-full rounded-lg" />
                                            <div className="space-y-2">
                                                <Skeleton className="mx-auto h-3 w-3/4" />
                                                <Skeleton className="mx-auto h-3 w-1/2" />
                                            </div>
                                            <div className="space-y-2">
                                                <Skeleton className="mx-auto h-8 w-full" />
                                                <Skeleton className="mx-auto h-8 w-full" />
                                            </div>
                                        </div>
                                    ) : null}

                                    <div className="relative">
                                        {hasCertificate ? (
                                            <div className={`group ${isLoading ? 'absolute opacity-0' : 'relative opacity-100'}`}>
                                                <iframe
                                                    src={`${route('profile.webinar.certificate.preview', { webinar: webinarData.slug })}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                                                    className="h-[238px] w-full rounded-lg border shadow-lg dark:border-zinc-700"
                                                    title="Preview Sertifikat"
                                                    onLoad={handleIframeLoad}
                                                />
                                                <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                                            </div>
                                        ) : (
                                            <div className="group relative">
                                                <img
                                                    src={'/assets/images/placeholder.png'}
                                                    alt="Sertifikat"
                                                    className="aspect-video rounded-lg border object-cover shadow-lg transition-transform group-hover:scale-105 dark:border-zinc-700"
                                                />
                                                <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                                            </div>
                                        )}
                                    </div>

                                    {hasCertificate ? (
                                        <div className={`${isLoading ? 'opacity-0' : 'opacity-100'}`}>
                                            <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
                                                Unduh sertifikat sebagai bukti keikutsertaan dalam webinar ini.
                                            </p>
                                            {certificateParticipant && (
                                                <div className="mt-2 text-center">
                                                    <p className="text-xs text-blue-600 dark:text-blue-400">
                                                        No. Sertifikat: {String(certificateParticipant.certificate_number).padStart(4, '0')}/
                                                        {certificate.certificate_number}
                                                    </p>
                                                    <Link
                                                        href={route('certificate.participant.detail', {
                                                            code: certificateParticipant.certificate_code,
                                                        })}
                                                        className="text-xs text-green-600 underline hover:text-green-800"
                                                    >
                                                        Lihat Detail Sertifikat
                                                    </Link>
                                                </div>
                                            )}
                                            <div className="mt-3 space-y-2">
                                                <Button className="w-full" asChild>
                                                    <a href={route('profile.webinar.certificate', { webinar: webinarData.slug })} target="_blank">
                                                        <Download size={16} className="mr-2" />
                                                        Unduh Sertifikat
                                                    </a>
                                                </Button>

                                                <Button variant="outline" className="w-full" asChild>
                                                    <a
                                                        href={route('profile.webinar.certificate.preview', { webinar: webinarData.slug })}
                                                        target="_blank"
                                                    >
                                                        <Eye size={16} className="mr-2" />
                                                        Lihat Preview
                                                    </a>
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
                                                {!certificate
                                                    ? 'Sertifikat belum dibuat untuk webinar ini.'
                                                    : webinarInvoiceStatus !== 'paid'
                                                      ? 'Selesaikan pembayaran untuk mendapatkan sertifikat.'
                                                      : !hasReview
                                                        ? 'Lengkapi bukti kehadiran dan review untuk mendapatkan sertifikat.'
                                                        : 'Sertifikat akan tersedia setelah webinar selesai.'}
                                            </p>
                                            <Button variant="outline" className="mt-3 w-full" disabled>
                                                <Download size={16} className="mr-2" />
                                                {!certificate
                                                    ? 'Sertifikat Belum Tersedia'
                                                    : webinarInvoiceStatus !== 'paid'
                                                      ? 'Selesaikan Pembayaran'
                                                      : !hasReview
                                                        ? 'Lengkapi Data Diperlukan'
                                                        : 'Menunggu Webinar Selesai'}
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="sticky top-6">
                                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
                                    <h3 className="mb-4 text-center font-semibold">{webinarData.title}</h3>
                                    <div className="group relative">
                                        <img
                                            src={webinarData.thumbnail ? `/storage/${webinarData.thumbnail}` : '/assets/images/placeholder.png'}
                                            alt={webinarData.title}
                                            className="aspect-video rounded-lg object-cover shadow-lg transition-transform group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                                    </div>
                                    <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">{webinarData.short_description}</p>
                                    <Button
                                        className="mt-4 w-full"
                                        disabled={webinarInvoiceStatus !== 'paid'}
                                        onClick={() => window.open(webinarData.group_url ?? undefined, '_blank')}
                                    >
                                        <Users size={16} className="mr-2" />
                                        Gabung Grup WA
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </UserLayout>
    );
}
