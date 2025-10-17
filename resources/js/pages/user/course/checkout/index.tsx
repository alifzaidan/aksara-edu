import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserLayout from '@/layouts/user-layout';
import { SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { BadgeCheck, Check, Hourglass, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Course {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    slug: string;
    strikethrough_price: number;
    price: number;
    key_points?: string | null;
    level: 'beginner' | 'intermediate' | 'advanced';
    modules?: {
        title: string;
        description?: string | null;
        lessons?: {
            title: string;
            description?: string | null;
            type: 'text' | 'video' | 'file' | 'quiz';
            attachment?: string | null;
            video_url?: string | null;
            is_free?: boolean;
        }[];
    }[];
}

interface DiscountData {
    valid: boolean;
    discount_amount: number;
    final_amount: number;
    discount_code: {
        id: string;
        code: string;
        name: string;
        type: string;
        formatted_value: string;
    };
    message?: string;
}

interface ReferralInfo {
    code?: string;
    hasActive: boolean;
}

function getYoutubeId(url: string) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : '';
}

function parseList(items?: string | null): string[] {
    if (!items) return [];
    const matches = items.match(/<li>(.*?)<\/li>/g);
    if (!matches) return [];
    return matches.map((li) => li.replace(/<\/?li>/g, '').trim());
}

export default function CheckoutCourse({
    course,
    hasAccess,
    pendingInvoiceUrl,
    referralInfo,
}: {
    course: Course;
    hasAccess: boolean;
    pendingInvoiceUrl?: string | null;
    referralInfo: ReferralInfo;
}) {
    const { auth } = usePage<SharedData>().props;
    const isLoggedIn = !!auth.user;
    const isProfileComplete = isLoggedIn && auth.user?.phone_number;

    const firstVideoLesson = course.modules?.flatMap((module) => module.lessons || []).find((lesson) => lesson.type === 'video' && lesson.video_url);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [promoCode, setPromoCode] = useState('');
    const [discountData, setDiscountData] = useState<DiscountData | null>(null);
    const [promoLoading, setPromoLoading] = useState(false);
    const [promoError, setPromoError] = useState('');

    const keyPointList = parseList(course.key_points);
    const isFree = course.price === 0;

    const transactionFee = 5000;
    const basePrice = course.price;
    const discountAmount = discountData?.discount_amount || 0;
    const finalCoursePrice = basePrice - discountAmount;
    const totalPrice = isFree ? 0 : finalCoursePrice + transactionFee;

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const refFromUrl = urlParams.get('ref');

        if (refFromUrl) {
            sessionStorage.setItem('referral_code', refFromUrl);
        } else if (referralInfo.code) {
            sessionStorage.setItem('referral_code', referralInfo.code);
        }
    }, [referralInfo]);

    useEffect(() => {
        if (!promoCode.trim() || isFree) {
            setDiscountData(null);
            setPromoError('');
            return;
        }

        const timer = setTimeout(() => {
            validatePromoCode();
        }, 500);

        return () => clearTimeout(timer);
    }, [promoCode]);

    const validatePromoCode = async () => {
        if (!promoCode.trim() || isFree) return;

        setPromoLoading(true);
        setPromoError('');

        try {
            const response = await fetch('/api/discount-codes/validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    code: promoCode,
                    amount: course.price,
                    product_type: 'course',
                    product_id: course.id,
                }),
            });

            const data = await response.json();

            if (data.valid) {
                setDiscountData(data);
                setPromoError('');
            } else {
                setDiscountData(null);
                setPromoError(data.message || 'Kode promo tidak valid');
            }
        } catch {
            setDiscountData(null);
            setPromoError('Terjadi kesalahan saat memvalidasi kode promo');
        } finally {
            setPromoLoading(false);
        }
    };

    const refreshCSRFToken = async (): Promise<string> => {
        try {
            const response = await fetch('/csrf-token', {
                method: 'GET',
                credentials: 'same-origin',
            });
            const data = await response.json();

            const metaTag = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement;
            if (metaTag) {
                metaTag.content = data.token;
            }

            return data.token;
        } catch (error) {
            console.error('Failed to refresh CSRF token:', error);
            throw error;
        }
    };

    const handleFreeCheckout = (e: React.FormEvent) => {
        e.preventDefault();

        if (!isProfileComplete) {
            alert('Profil Anda belum lengkap! Harap lengkapi nomor telepon terlebih dahulu.');
            window.location.href = route('profile.edit');
            return;
        }

        setLoading(true);

        router.post(
            route('enroll.free'),
            {
                type: 'course',
                id: course.id,
            },
            {
                onError: (errors) => {
                    console.log('Free enrollment errors:', errors);
                    alert(errors.message || 'Gagal mendaftar kelas gratis.');
                },
                onFinish: () => {
                    setLoading(false);
                },
            },
        );
    };

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isProfileComplete) {
            alert('Profil Anda belum lengkap! Harap lengkapi nomor telepon terlebih dahulu.');
            window.location.href = route('profile.edit');
            return;
        }

        if (!termsAccepted && !isFree) {
            alert('Anda harus menyetujui syarat dan ketentuan!');
            return;
        }

        setLoading(true);

        if (isFree) {
            return handleFreeCheckout(e);
        }

        const submitPayment = async (retryCount = 0): Promise<void> => {
            const originalDiscountAmount = course.strikethrough_price > 0 ? course.strikethrough_price - course.price : 0;
            const promoDiscountAmount = discountData?.discount_amount || 0;

            const invoiceData: any = {
                type: 'course',
                id: course.id,
                discount_amount: originalDiscountAmount + promoDiscountAmount,
                nett_amount: finalCoursePrice,
                transaction_fee: transactionFee,
                total_amount: totalPrice,
            };

            if (discountData?.valid) {
                invoiceData.discount_code_id = discountData.discount_code.id;
                invoiceData.discount_code_amount = discountData.discount_amount;
            }

            try {
                const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content;

                const res = await fetch(route('invoice.store'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken || '',
                        Accept: 'application/json',
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify(invoiceData),
                });

                // Handle 419 error with retry
                if (res.status === 419 && retryCount < 2) {
                    console.log(`CSRF token expired, refreshing... (attempt ${retryCount + 1})`);
                    await refreshCSRFToken();
                    return submitPayment(retryCount + 1);
                }

                const data = await res.json();

                if (res.ok && data.success) {
                    if (data.payment_url) {
                        window.location.href = data.payment_url;
                    } else {
                        throw new Error('Payment URL not received');
                    }
                } else {
                    throw new Error(data.message || 'Gagal membuat invoice.');
                }
            } catch (error) {
                console.error('Payment error:', error);
                throw error;
            }
        };

        try {
            await submitPayment();
        } catch (error: any) {
            alert(error.message || 'Terjadi kesalahan saat proses pembayaran.');
            setLoading(false);
        }
    };

    if (!isLoggedIn) {
        const currentUrl = window.location.href;
        const loginUrl = route('login', { redirect: currentUrl });

        return (
            <UserLayout>
                <Head title="Login Required" />

                <section className="to-primary w-full bg-gradient-to-tl from-black px-4">
                    <div className="mx-auto my-12 w-full max-w-7xl px-4">
                        <h2 className="mx-auto mb-4 max-w-3xl bg-gradient-to-r from-[#71D0F7] via-white to-[#E6834A] bg-clip-text text-center text-3xl font-bold text-transparent italic sm:text-4xl">
                            Daftar Kelas Online "{course.title}"
                        </h2>
                        <p className="text-center text-gray-400">Silakan login terlebih dahulu untuk mendaftar kelas online.</p>
                    </div>
                </section>
                <section className="mx-auto my-4 w-full max-w-7xl px-4">
                    <div className="flex h-full flex-col items-center justify-center space-y-4 rounded-lg border p-6 text-center">
                        <User size={64} className="text-blue-500" />
                        <h2 className="text-xl font-bold">Login Diperlukan</h2>
                        <p className="text-sm text-gray-500">
                            Anda perlu login terlebih dahulu untuk mendaftar kelas online ini.
                            {referralInfo.hasActive && ' Kode referral Anda akan tetap tersimpan.'}
                        </p>
                        <div className="flex w-full max-w-md gap-2">
                            <Button asChild className="flex-1">
                                <a href={loginUrl}>Login</a>
                            </Button>
                            <Button asChild variant="outline" className="flex-1">
                                <Link href={route('register', referralInfo.code ? { ref: referralInfo.code } : {})}>Daftar</Link>
                            </Button>
                        </div>
                    </div>
                </section>
            </UserLayout>
        );
    }

    if (!isProfileComplete) {
        return (
            <UserLayout>
                <Head title="Checkout Kelas" />
                <section className="to-primary w-full bg-gradient-to-tl from-black px-4">
                    <div className="mx-auto my-12 w-full max-w-7xl px-4">
                        <h2 className="mx-auto mb-4 max-w-3xl bg-gradient-to-r from-[#71D0F7] via-white to-[#E6834A] bg-clip-text text-center text-3xl font-bold text-transparent italic sm:text-4xl">
                            Checkout Kelas "{course.title}"
                        </h2>
                        <p className="text-center text-gray-400">Silakan lengkapi profil Anda terlebih dahulu.</p>
                    </div>
                </section>
                <section className="mx-auto my-4 w-full max-w-7xl px-4">
                    <div className="flex h-full flex-col items-center justify-center space-y-4 rounded-lg border p-6 text-center">
                        <User size={64} className="text-orange-500" />
                        <h2 className="text-xl font-bold">Profil Belum Lengkap</h2>
                        <p className="text-sm text-gray-500">
                            Profil Anda belum lengkap! Harap lengkapi nomor telepon terlebih dahulu untuk mendaftar kelas.
                        </p>
                        <Button asChild className="w-full max-w-md">
                            <Link href={route('profile.edit', { redirect: window.location.href })}>Lengkapi Profil</Link>
                        </Button>
                    </div>
                </section>
            </UserLayout>
        );
    }

    return (
        <UserLayout>
            <Head title="Checkout Kelas" />
            <section className="to-primary w-full bg-gradient-to-tl from-black px-4">
                <div className="mx-auto my-12 w-full max-w-7xl px-4">
                    <h2 className="mx-auto mb-4 max-w-3xl bg-gradient-to-r from-[#71D0F7] via-white to-[#E6834A] bg-clip-text text-center text-3xl font-bold text-transparent italic sm:text-4xl">
                        Checkout Kelas "{course.title}"
                    </h2>
                    <p className="text-center text-gray-400">
                        {isFree ? 'Lanjutkan untuk mendapatkan akses gratis ke kelas ini.' : 'Silakan selesaikan pembayaran untuk mendaftar kelas.'}
                    </p>
                </div>
            </section>
            <section className="mx-auto my-4 w-full max-w-7xl px-4">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
                    <Tabs defaultValue="detail" className="lg:col-span-2">
                        <TabsList>
                            <TabsTrigger value="detail">Detail Kelas</TabsTrigger>
                            <TabsTrigger value="preview">Preview Video</TabsTrigger>
                        </TabsList>
                        <TabsContent value="detail">
                            <div className="h-full rounded-lg border p-4">
                                <h2 className="text-3xl font-bold italic">Yang akan kamu pelajari</h2>
                                <p className="mt-2 mb-4 text-sm text-gray-600">
                                    Berikut adalah beberapa poin penting yang akan kamu pelajari dalam kelas "{course.title}".
                                </p>
                                <ul className="space-y-2">
                                    {keyPointList.map((keyPoint, idx) => (
                                        <li key={idx} className="flex items-center gap-2">
                                            <BadgeCheck size={18} className="mt-1 min-w-6 text-green-600" />
                                            <p className="text-sm md:text-base">{keyPoint}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </TabsContent>
                        <TabsContent value="preview">
                            <div className="h-full rounded-lg border p-4">
                                <h2 className="text-3xl font-bold italic">Preview Video</h2>
                                <p className="mt-2 mb-4 text-sm text-gray-600">
                                    Berikut adalah preview video dari kelas "{course.title}". Silakan tonton untuk mendapatkan gambaran materi yang
                                    akan dipelajari.
                                </p>
                                <div className="aspect-video w-full">
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        src={
                                            firstVideoLesson?.video_url &&
                                            (firstVideoLesson.video_url.includes('youtube.com') || firstVideoLesson.video_url.includes('youtu.be'))
                                                ? `https://www.youtube.com/embed/${getYoutubeId(firstVideoLesson.video_url)}`
                                                : ''
                                        }
                                        title="YouTube video player"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        className="h-full w-full rounded-xl"
                                    ></iframe>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>

                    {hasAccess ? (
                        <div className="flex h-full flex-col items-center justify-center space-y-4 rounded-lg border p-6 text-center">
                            <BadgeCheck size={64} className="text-green-500" />
                            <h2 className="text-xl font-bold">Anda Sudah Memiliki Akses</h2>
                            <p className="text-sm text-gray-500">Anda sudah terdaftar di kelas ini. Silakan lanjutkan belajar.</p>
                            <Button asChild className="w-full">
                                <a href={`/profile/my-courses/${course.slug}`}>Masuk ke Kelas</a>
                            </Button>
                        </div>
                    ) : pendingInvoiceUrl ? (
                        <div className="flex h-full flex-col items-center justify-center space-y-4 rounded-lg border p-6 text-center">
                            <Hourglass size={64} className="text-yellow-500" />
                            <h2 className="text-xl font-bold">Pembayaran Tertunda</h2>
                            <p className="text-sm text-gray-500">
                                Anda memiliki pembayaran yang belum selesai untuk kelas ini. Silakan lanjutkan untuk membayar.
                            </p>
                            <Button asChild className="w-full">
                                <a href={pendingInvoiceUrl}>Lanjutkan Pembayaran</a>
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleCheckout}>
                            <h2 className="my-2 text-xl font-bold italic">Detail {isFree ? 'Pendaftaran' : 'Pembayaran'}</h2>
                            <div className="space-y-4 rounded-lg border p-4">
                                {isFree ? (
                                    <div className="flex items-center justify-between p-4 text-center">
                                        <span className="w-full text-2xl font-bold text-green-600">KELAS GRATIS</span>
                                    </div>
                                ) : (
                                    <>
                                        {/* Promo Code Input */}
                                        <div className="space-y-2">
                                            <Label htmlFor="promo-code">Kode Promo (Opsional)</Label>
                                            <div className="relative">
                                                <Input
                                                    id="promo-code"
                                                    type="text"
                                                    placeholder="Masukkan kode promo"
                                                    value={promoCode}
                                                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                                    className="pr-10"
                                                />
                                                {promoLoading && (
                                                    <div className="absolute top-1/2 right-3 -translate-y-1/2 transform">
                                                        <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-blue-600"></div>
                                                    </div>
                                                )}
                                                {!promoLoading && promoCode && (
                                                    <div className="absolute top-1/2 right-3 -translate-y-1/2 transform">
                                                        {discountData?.valid ? (
                                                            <Check className="h-4 w-4 text-green-600" />
                                                        ) : promoError ? (
                                                            <X className="h-4 w-4 text-red-600" />
                                                        ) : null}
                                                    </div>
                                                )}
                                            </div>
                                            {promoError && <p className="text-sm text-red-600">{promoError}</p>}
                                            {discountData?.valid && (
                                                <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                                                    <div className="flex items-center gap-2">
                                                        <Check className="h-4 w-4 text-green-600" />
                                                        <p className="text-sm font-medium text-green-800">
                                                            Kode promo "{discountData.discount_code.code}" berhasil diterapkan!
                                                        </p>
                                                    </div>
                                                    <p className="mt-1 text-xs text-green-600">
                                                        {discountData.discount_code.name} - Diskon {discountData.discount_code.formatted_value}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-2 rounded-lg border p-4">
                                            {course.strikethrough_price > 0 && (
                                                <>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-gray-600">Harga Asli</span>
                                                        <span className="font-semibold text-gray-500 line-through">
                                                            Rp {course.strikethrough_price.toLocaleString('id-ID')}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-gray-600">Diskon</span>
                                                        <span className="font-semibold text-red-500">
                                                            -Rp {(course.strikethrough_price - course.price).toLocaleString('id-ID')}
                                                        </span>
                                                    </div>
                                                    <Separator className="my-2" />
                                                </>
                                            )}
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-600">Harga Kelas</span>
                                                <span className="font-semibold text-gray-500">Rp {course.price.toLocaleString('id-ID')}</span>
                                            </div>

                                            {/* Promo Discount */}
                                            {discountData?.valid && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-600">Diskon Promo ({discountData.discount_code.code})</span>
                                                    <span className="font-semibold text-green-600">
                                                        -Rp {discountData.discount_amount.toLocaleString('id-ID')}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-600">Biaya Transaksi</span>
                                                <span className="font-semibold text-gray-500">Rp {transactionFee.toLocaleString('id-ID')}</span>
                                            </div>
                                            <Separator className="my-2" />
                                            <div className="flex items-center justify-between">
                                                <span className="font-semibold text-gray-900">Total Pembayaran</span>
                                                <span className="text-primary text-xl font-bold">Rp {totalPrice.toLocaleString('id-ID')}</span>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {!isFree && (
                                    <div className="flex items-center gap-3">
                                        <Checkbox
                                            id="terms"
                                            checked={termsAccepted}
                                            onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                                        />
                                        <Label htmlFor="terms">
                                            Saya menyetujui{' '}
                                            <a
                                                href="/terms-and-conditions"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-700 hover:underline"
                                            >
                                                syarat dan ketentuan
                                            </a>
                                        </Label>
                                    </div>
                                )}
                                <Button className="w-full" type="submit" disabled={(isFree ? false : !termsAccepted) || loading}>
                                    {loading ? 'Memproses...' : isFree ? 'Dapatkan Akses Gratis Sekarang' : 'Lanjutkan Pembayaran'}
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </section>
        </UserLayout>
    );
}
