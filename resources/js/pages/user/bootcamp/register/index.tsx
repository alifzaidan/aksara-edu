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
import { toast } from 'sonner';

interface Bootcamp {
    id: string;
    title: string;
    schedules?: { day: string; start_time: string; end_time: string }[];
    start_date: string;
    end_date: string;
    strikethrough_price: number;
    price: number;
    thumbnail?: string | null;
    description?: string | null;
    benefits?: string | null;
    requirements?: string | null;
    curriculum?: string | null;
    group_url?: string | null;
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

function parseList(items?: string | null): string[] {
    if (!items) return [];
    const matches = items.match(/<li>(.*?)<\/li>/g);
    if (!matches) return [];
    return matches.map((li) => li.replace(/<\/?li>/g, '').trim());
}

export default function RegisterBootcamp({
    bootcamp,
    hasAccess,
    pendingInvoiceUrl,
    referralInfo,
}: {
    bootcamp: Bootcamp;
    hasAccess: boolean;
    pendingInvoiceUrl?: string | null;
    referralInfo: ReferralInfo;
}) {
    const { auth } = usePage<SharedData>().props;
    const isLoggedIn = !!auth.user;
    const isProfileComplete = isLoggedIn && auth.user?.phone_number;

    const [termsAccepted, setTermsAccepted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [promoCode, setPromoCode] = useState('');
    const [discountData, setDiscountData] = useState<DiscountData | null>(null);
    const [promoLoading, setPromoLoading] = useState(false);
    const [promoError, setPromoError] = useState('');

    const [showFreeForm, setShowFreeForm] = useState(false);
    const [freeFormData, setFreeFormData] = useState({
        ig_follow_proof: null as File | null,
        tiktok_follow_proof: null as File | null,
        tag_friend_proof: null as File | null,
    });
    const [fileErrors, setFileErrors] = useState({
        ig_follow_proof: false,
        tiktok_follow_proof: false,
        tag_friend_proof: false,
    });

    const requirementList = parseList(bootcamp.requirements);
    const benefitList = parseList(bootcamp.benefits);
    const curriculumList = parseList(bootcamp.curriculum);
    const isFree = bootcamp.price === 0;

    const transactionFee = 5000;
    const basePrice = bootcamp.price;
    const discountAmount = discountData?.discount_amount || 0;
    const finalBootcampPrice = basePrice - discountAmount;
    const totalPrice = isFree ? 0 : finalBootcampPrice + transactionFee;

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
                    amount: bootcamp.price,
                    product_type: 'bootcamp',
                    product_id: bootcamp.id,
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

        if (!freeFormData.ig_follow_proof || !freeFormData.tiktok_follow_proof || !freeFormData.tag_friend_proof) {
            alert('Harap upload semua bukti yang diperlukan!');
            return;
        }

        setLoading(true);

        const formData = new FormData();
        formData.append('type', 'bootcamp');
        formData.append('id', bootcamp.id);
        formData.append('ig_follow_proof', freeFormData.ig_follow_proof);
        formData.append('tiktok_follow_proof', freeFormData.tiktok_follow_proof);
        formData.append('tag_friend_proof', freeFormData.tag_friend_proof);

        router.post(route('enroll.free'), formData, {
            onError: (errors) => {
                console.log('Free enrollment errors:', errors);
                alert(errors.message || 'Gagal mendaftar bootcamp gratis.');
            },
            onFinish: () => {
                setLoading(false);
            },
        });
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
            setShowFreeForm(true);
            setLoading(false);
            return;
        }

        const submitPayment = async (retryCount = 0): Promise<void> => {
            const originalDiscountAmount = bootcamp.strikethrough_price > 0 ? bootcamp.strikethrough_price - bootcamp.price : 0;
            const promoDiscountAmount = discountData?.discount_amount || 0;

            const invoiceData: any = {
                type: 'bootcamp',
                id: bootcamp.id,
                discount_amount: originalDiscountAmount + promoDiscountAmount,
                nett_amount: finalBootcampPrice,
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

    // Function untuk validasi ukuran file
    const validateFileSize = (file: File, maxSizeMB: number = 2): boolean => {
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        return file.size <= maxSizeBytes;
    };

    // Function untuk handle file input dengan validasi
    const handleFileChange = (fieldName: keyof typeof freeFormData, file: File | null) => {
        if (!file) {
            setFreeFormData((prev) => ({ ...prev, [fieldName]: null }));
            setFileErrors((prev) => ({ ...prev, [fieldName]: false }));
            return;
        }

        // Validasi ukuran file
        if (!validateFileSize(file, 2)) {
            setFileErrors((prev) => ({ ...prev, [fieldName]: true }));

            const input = document.querySelector(`input[data-field="${fieldName}"]`) as HTMLInputElement;
            if (input) {
                input.value = '';
            }

            toast.error('Ukuran file terlalu besar. Maksimal 2MB.');
            return;
        }

        // Validasi tipe file (hanya image)
        if (!file.type.startsWith('image/')) {
            setFileErrors((prev) => ({ ...prev, [fieldName]: true }));

            const input = document.querySelector(`input[data-field="${fieldName}"]`) as HTMLInputElement;
            if (input) {
                input.value = '';
            }

            toast.error('Hanya file gambar (JPG, PNG, GIF, dll) yang diperbolehkan.');
            return;
        }

        // File valid
        setFreeFormData((prev) => ({ ...prev, [fieldName]: file }));
        setFileErrors((prev) => ({ ...prev, [fieldName]: false }));

        toast.success('File berhasil diunggah.');
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
                            Daftar Bootcamp "{bootcamp.title}"
                        </h2>
                        <p className="text-center text-gray-400">Silakan login terlebih dahulu untuk mendaftar bootcamp.</p>
                    </div>
                </section>
                <section className="mx-auto my-4 w-full max-w-7xl px-4">
                    <div className="flex h-full flex-col items-center justify-center space-y-4 rounded-lg border p-6 text-center">
                        <User size={64} className="text-blue-500" />
                        <h2 className="text-xl font-bold">Login Diperlukan</h2>
                        <p className="text-sm text-gray-500">
                            Anda perlu login terlebih dahulu untuk mendaftar bootcamp ini.
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
                <Head title="Daftar Bootcamp" />
                <section className="to-primary w-full bg-gradient-to-tl from-black px-4">
                    <div className="mx-auto my-12 w-full max-w-7xl px-4">
                        <h2 className="mx-auto mb-4 max-w-3xl bg-gradient-to-r from-[#71D0F7] via-white to-[#E6834A] bg-clip-text text-center text-3xl font-bold text-transparent italic sm:text-4xl">
                            Daftar Bootcamp "{bootcamp.title}"
                        </h2>
                        <p className="text-center text-gray-400">Silakan lengkapi profil Anda terlebih dahulu.</p>
                    </div>
                </section>
                <section className="mx-auto my-4 w-full max-w-7xl px-4">
                    <div className="flex h-full flex-col items-center justify-center space-y-4 rounded-lg border p-6 text-center">
                        <User size={64} className="text-orange-500" />
                        <h2 className="text-xl font-bold">Profil Belum Lengkap</h2>
                        <p className="text-sm text-gray-500">
                            Profil Anda belum lengkap! Harap lengkapi nomor telepon terlebih dahulu untuk mendaftar bootcamp.
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
            <Head title="Daftar Bootcamp" />
            <section className="to-primary w-full bg-gradient-to-tl from-black px-4">
                <div className="mx-auto my-12 w-full max-w-7xl px-4">
                    <h2 className="mx-auto mb-4 max-w-3xl bg-gradient-to-r from-[#71D0F7] via-white to-[#E6834A] bg-clip-text text-center text-3xl font-bold text-transparent italic sm:text-4xl">
                        Daftar Bootcamp "{bootcamp.title}"
                    </h2>
                    <p className="text-center text-gray-400">
                        {isFree
                            ? 'Silahkan lengkapi persyaratan berikut untuk mendaftar bootcamp.'
                            : 'Silakan selesaikan pembayaran untuk mendaftar bootcamp.'}
                    </p>
                </div>
            </section>
            <section className="mx-auto my-4 w-full max-w-7xl px-4">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
                    <Tabs defaultValue="detail" className="lg:col-span-2">
                        <TabsList>
                            <TabsTrigger value="detail">Detail Bootcamp</TabsTrigger>
                            <TabsTrigger value="curriculum">Kurikulum Bootcamp</TabsTrigger>
                        </TabsList>
                        <TabsContent value="detail">
                            <div className="h-full rounded-lg border p-4">
                                <h2 className="text-3xl font-bold italic">Yang akan kamu dapatkan</h2>
                                <p className="mt-2 mb-4 text-sm text-gray-600">Manfaat yang akan kamu peroleh setelah mengikuti bootcamp ini.</p>
                                <ul className="space-y-2">
                                    {benefitList.map((benefit, idx) => (
                                        <li key={idx} className="flex items-center gap-2">
                                            <BadgeCheck size={18} className="mt-1 min-w-6 text-green-600" />
                                            <p className="text-sm md:text-base">{benefit}</p>
                                        </li>
                                    ))}
                                </ul>
                                <h2 className="mt-6 text-3xl font-bold italic">Persyaratan Peserta</h2>
                                <p className="mt-2 mb-4 text-sm text-gray-600">
                                    Pastikan kamu memenuhi persyaratan berikut sebelum mendaftar bootcamp ini.
                                </p>
                                <ul className="space-y-2">
                                    {requirementList.map((requirement, idx) => (
                                        <li key={idx} className="flex items-center gap-2">
                                            <BadgeCheck size={18} className="mt-1 min-w-6 text-green-600" />
                                            <p className="text-sm md:text-base">{requirement}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </TabsContent>
                        <TabsContent value="curriculum">
                            <div className="h-full rounded-lg border p-4">
                                <h2 className="text-3xl font-bold italic">Kurikulum</h2>
                                <p className="mt-2 mb-4 text-sm text-gray-600">
                                    Berikut adalah daftar materi yang akan dipelajari selama bootcamp ini.
                                </p>
                                <ul className="space-y-2">
                                    {curriculumList.map((curriculum, idx) => (
                                        <li key={idx} className="flex items-center gap-2">
                                            <p className="font-semibold">{idx + 1}.</p>
                                            <p className="text-sm md:text-base">{curriculum}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </TabsContent>
                    </Tabs>

                    {hasAccess ? (
                        <div className="flex h-full flex-col items-center justify-center space-y-4 rounded-lg border p-6 text-center">
                            <BadgeCheck size={64} className="text-green-500" />
                            <h2 className="text-xl font-bold">Anda Sudah Memiliki Akses</h2>
                            <p className="text-sm text-gray-500">Anda sudah terdaftar di bootcamp ini. Silakan masuk ke dalam grup.</p>
                            <Button asChild className="w-full">
                                <a href={bootcamp.group_url ?? ''} target="_blank" rel="noopener noreferrer">
                                    Masuk Group Bootcamp
                                </a>
                            </Button>
                        </div>
                    ) : pendingInvoiceUrl ? (
                        <div className="flex h-full flex-col items-center justify-center space-y-4 rounded-lg border p-6 text-center">
                            <Hourglass size={64} className="text-yellow-500" />
                            <h2 className="text-xl font-bold">Pembayaran Tertunda</h2>
                            <p className="text-sm text-gray-500">
                                Anda memiliki pembayaran yang belum selesai untuk bootcamp ini. Silakan lanjutkan untuk membayar.
                            </p>
                            <Button asChild className="w-full">
                                <a href={pendingInvoiceUrl}>Lanjutkan Pembayaran</a>
                            </Button>
                        </div>
                    ) : !showFreeForm ? (
                        <form onSubmit={handleCheckout}>
                            <h2 className="my-2 text-xl font-bold italic">Detail {isFree ? 'Pendaftaran' : 'Pembayaran'}</h2>
                            <div className="space-y-4 rounded-lg border p-4">
                                {isFree ? (
                                    <div className="space-y-2 text-center">
                                        <div className="flex items-center justify-between p-4">
                                            <span className="w-full text-2xl font-bold text-green-600">BOOTCAMP GRATIS</span>
                                        </div>
                                        <p className="text-sm text-gray-600">Untuk mendapatkan akses gratis, Anda perlu:</p>
                                        <ul className="space-y-1 text-left text-sm">
                                            <li>
                                                • Follow Instagram kami{' '}
                                                <a
                                                    href="https://www.instagram.com/aksarateknologi/"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 underline"
                                                >
                                                    @aksarateknologi
                                                </a>{' '}
                                                <a
                                                    href="https://www.instagram.com/aksademy/"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 underline"
                                                >
                                                    @aksademy
                                                </a>
                                            </li>
                                            <li>
                                                • Follow TikTok kami{' '}
                                                <a
                                                    href="https://www.tiktok.com/@aksarateknologimandiri"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 underline"
                                                >
                                                    @aksarateknologi
                                                </a>
                                            </li>
                                            <li>• Tag 3 teman di postingan Instagram kami</li>
                                        </ul>
                                        <p className="text-xs text-gray-500">Upload bukti follow dan tag untuk mendapatkan akses</p>
                                    </div>
                                ) : (
                                    <>
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
                                            {bootcamp.strikethrough_price > 0 && (
                                                <>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-gray-600">Harga Asli</span>
                                                        <span className="font-semibold text-gray-500 line-through">
                                                            Rp {bootcamp.strikethrough_price.toLocaleString('id-ID')}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-gray-600">Diskon</span>
                                                        <span className="font-semibold text-red-500">
                                                            -Rp {(bootcamp.strikethrough_price - bootcamp.price).toLocaleString('id-ID')}
                                                        </span>
                                                    </div>
                                                    <Separator className="my-2" />
                                                </>
                                            )}
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-600">Harga Bootcamp</span>
                                                <span className="font-semibold text-gray-500">Rp {bootcamp.price.toLocaleString('id-ID')}</span>
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
                                    {loading ? 'Memproses...' : isFree ? 'Upload Bukti Follow' : 'Lanjutkan Pembayaran'}
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleFreeCheckout}>
                            <h2 className="my-2 text-xl font-bold italic">Upload Bukti Follow & Tag</h2>
                            <div className="space-y-4 rounded-lg border p-4">
                                {/* Bukti Follow Instagram */}
                                <div>
                                    <Label htmlFor="ig_follow_proof">Bukti Follow Instagram</Label>
                                    <Input
                                        id="ig_follow_proof"
                                        data-field="ig_follow_proof"
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileChange('ig_follow_proof', e.target.files?.[0] || null)}
                                        className={fileErrors.ig_follow_proof ? 'border-red-500 focus:ring-red-500' : ''}
                                        required
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Screenshot halaman profil Instagram kami yang menunjukkan Anda sudah follow (Maks. 2MB)
                                    </p>
                                    {fileErrors.ig_follow_proof && (
                                        <p className="mt-1 text-xs text-red-600">
                                            File tidak valid. Pastikan ukuran tidak melebihi 2MB dan format gambar.
                                        </p>
                                    )}
                                </div>

                                {/* Bukti Follow TikTok */}
                                <div>
                                    <Label htmlFor="tiktok_follow_proof">Bukti Follow TikTok</Label>
                                    <Input
                                        id="tiktok_follow_proof"
                                        data-field="tiktok_follow_proof"
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileChange('tiktok_follow_proof', e.target.files?.[0] || null)}
                                        className={fileErrors.tiktok_follow_proof ? 'border-red-500 focus:ring-red-500' : ''}
                                        required
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Screenshot halaman profil TikTok kami yang menunjukkan Anda sudah follow (Maks. 2MB)
                                    </p>
                                    {fileErrors.tiktok_follow_proof && (
                                        <p className="mt-1 text-xs text-red-600">
                                            File tidak valid. Pastikan ukuran tidak melebihi 2MB dan format gambar.
                                        </p>
                                    )}
                                </div>

                                {/* Bukti Tag 3 Teman */}
                                <div>
                                    <Label htmlFor="tag_friend_proof">Bukti Tag 3 Teman di Instagram</Label>
                                    <Input
                                        id="tag_friend_proof"
                                        data-field="tag_friend_proof"
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileChange('tag_friend_proof', e.target.files?.[0] || null)}
                                        className={fileErrors.tag_friend_proof ? 'border-red-500 focus:ring-red-500' : ''}
                                        required
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Screenshot postingan Instagram kami yang menunjukkan Anda sudah tag 3 teman di komentar (Maks. 2MB)
                                    </p>
                                    {fileErrors.tag_friend_proof && (
                                        <p className="mt-1 text-xs text-red-600">
                                            File tidak valid. Pastikan ukuran tidak melebihi 2MB dan format gambar.
                                        </p>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setShowFreeForm(false);
                                            // Reset file errors ketika kembali
                                            setFileErrors({
                                                ig_follow_proof: false,
                                                tiktok_follow_proof: false,
                                                tag_friend_proof: false,
                                            });
                                            setFreeFormData({
                                                ig_follow_proof: null,
                                                tiktok_follow_proof: null,
                                                tag_friend_proof: null,
                                            });
                                        }}
                                        className="flex-1"
                                    >
                                        Kembali
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={
                                            loading ||
                                            !freeFormData.ig_follow_proof ||
                                            !freeFormData.tiktok_follow_proof ||
                                            !freeFormData.tag_friend_proof ||
                                            fileErrors.ig_follow_proof ||
                                            fileErrors.tiktok_follow_proof ||
                                            fileErrors.tag_friend_proof
                                        }
                                        className="flex-1"
                                    >
                                        {loading ? 'Memproses...' : 'Dapatkan Akses Gratis'}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    )}
                </div>
            </section>
        </UserLayout>
    );
}
