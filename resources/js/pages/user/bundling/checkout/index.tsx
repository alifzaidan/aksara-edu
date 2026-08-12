import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import UserLayout from '@/layouts/user-layout';
import { rupiahFormatter } from '@/lib/utils';
import { SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import axios from 'axios';
import { BadgeCheck, Check, Hourglass, LoaderCircle, Package, RefreshCw, User, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Product {
    id: string;
    title: string;
    slug: string;
    price: number;
    thumbnail?: string | null;
}

interface BundleItem {
    id: string;
    bundleable_type: string;
    bundleable: Product;
    price: number;
}

interface Bundle {
    id: string;
    title: string;
    slug: string;
    short_description?: string | null;
    description?: string | null;
    thumbnail?: string | null;
    batch?: string | null;
    price: number;
    strikethrough_price: number;
    registration_deadline?: string | null;
    bundle_items: BundleItem[];
    bundle_items_count: number;
}

interface ReferralInfo {
    code?: string;
    hasActive: boolean;
}

interface CheckoutBundleProps {
    bundle: Bundle;
    hasAccess: boolean;
    pendingInvoiceUrl?: string | null;
    referralInfo: ReferralInfo;
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

interface GuestFormData {
    name: string;
    email: string;
    phone_number: string;
    instance: string;
    city: string;
}

interface PendingCheckoutData {
    bundleId: string;
    timestamp: number;
    promoCode: string;
    discountData: DiscountData | null;
    termsAccepted: boolean;
    codeType?: 'voucher' | 'referral';
    referralValid?: boolean;
    pointsChecked?: boolean;
    pointsToUse?: number;
}

function getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message) return error.message;
    return fallback;
}

export default function CheckoutBundle({ bundle, hasAccess, pendingInvoiceUrl, referralInfo }: CheckoutBundleProps) {
    const { auth } = usePage<SharedData>().props;
    const isLoggedIn = !!auth.user;
    const isProfileComplete = isLoggedIn && auth.user?.phone_number && auth.user?.instance && auth.user?.city;

    const [termsAccepted, setTermsAccepted] = useState(false);
    const [loading, setLoading] = useState(false);

    const transactionFee = 5000;
    const bundleDiscount = bundle.strikethrough_price - bundle.price;
    const [discountData, setDiscountData] = useState<DiscountData | null>(null);
    const discountAmount = discountData?.valid ? discountData.discount_amount : 0;

    // Referral & Points State
    const [codeType, setCodeType] = useState<'voucher' | 'referral'>('voucher');
    const [userPoints, setUserPoints] = useState(0);
    const [pointsChecked, setPointsChecked] = useState(false);
    const [pointsToUse, setPointsToUse] = useState(0);
    const [pointsError, setPointsError] = useState('');

    const [promoCode, setPromoCode] = useState('');
    const [promoLoading, setPromoLoading] = useState(false);
    const [promoError, setPromoError] = useState('');

    const [referralData, setReferralData] = useState<{ valid: boolean; referrer?: { name: string } } | null>(null);
    const [referralLoading, setReferralLoading] = useState(false);
    const [referralError, setReferralError] = useState('');

    const [checkingEmail, setCheckingEmail] = useState(false);
    const [emailExists, setEmailExists] = useState(false);

    const [guestFormData, setGuestFormData] = useState<GuestFormData>({
        name: '',
        email: '',
        phone_number: '',
        instance: '',
        city: '',
    });

    const maxPointsAllowed = bundle.price - discountAmount;
    const finalBundle = bundle.price - discountAmount - (pointsChecked ? pointsToUse : 0);
    const totalPrice = finalBundle + transactionFee;

    const updateGuestForm = (field: keyof GuestFormData, value: string) => {
        setGuestFormData((prev) => ({ ...prev, [field]: value }));
    };

    // Load points balance on mount
    useEffect(() => {
        if (isLoggedIn) {
            axios.get('/api/user/points')
                .then((response) => {
                    setUserPoints(response.data.point_balance || 0);
                })
                .catch((err) => {
                    console.error('Failed to load points balance:', err);
                });
        }
    }, [isLoggedIn]);

    const validatePromoCode = useCallback(async () => {
        if (!promoCode.trim()) return;

        setPromoLoading(true);
        setPromoError('');

        try {
            const requestData: Record<string, string | number> = {
                code: promoCode,
                amount: bundle.price,
                product_type: 'bundle',
                product_id: bundle.id,
            };

            if (!isLoggedIn && emailExists && guestFormData.email) {
                requestData.email = guestFormData.email;
            }

            const response = await axios.post('/api/discount-codes/validate', requestData);

            if (response.data.valid) {
                setDiscountData(response.data);
                setPromoError('');
            } else {
                setDiscountData(null);
                setPromoError(response.data.message || 'Kode promo tidak valid');
            }
        } catch (error: unknown) {
            setDiscountData(null);
            if (axios.isAxiosError(error)) {
                setPromoError(error.response?.data?.message || 'Terjadi kesalahan saat memvalidasi kode promo');
            } else {
                setPromoError('Terjadi kesalahan saat memvalidasi kode promo');
            }
        } finally {
            setPromoLoading(false);
        }
    }, [bundle.id, bundle.price, emailExists, guestFormData.email, isLoggedIn, promoCode]);

    const validateReferralCode = useCallback(async () => {
        if (!promoCode.trim()) return;

        setReferralLoading(true);
        setReferralError('');

        try {
            const response = await axios.post('/api/referral/validate', {
                code: promoCode,
                email: !isLoggedIn ? guestFormData.email : undefined,
            });
            const data = response.data;

            if (data.valid) {
                setReferralData(data);
                setReferralError('');
            } else {
                setReferralData(null);
                setReferralError(data.message || 'Kode referral tidak valid');
            }
        } catch (error: unknown) {
            setReferralData(null);
            if (axios.isAxiosError(error)) {
                setReferralError(error.response?.data?.message || 'Terjadi kesalahan saat memvalidasi kode referral');
            } else {
                setReferralError('Terjadi kesalahan saat memvalidasi kode referral');
            }
        } finally {
            setReferralLoading(false);
        }
    }, [promoCode, isLoggedIn, guestFormData.email]);

    useEffect(() => {
        if (!promoCode.trim()) {
            setDiscountData(null);
            setReferralData(null);
            setPromoError('');
            setReferralError('');
            return;
        }

        const timer = setTimeout(() => {
            if (codeType === 'voucher') {
                validatePromoCode();
            } else {
                validateReferralCode();
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [promoCode, codeType, validatePromoCode, validateReferralCode]);

    useEffect(() => {
        if (isLoggedIn) return;

        const email = guestFormData.email.trim();
        if (!email || !email.includes('@')) {
            setEmailExists(false);
            return;
        }

        const timer = setTimeout(async () => {
            setCheckingEmail(true);

            try {
                const response = await axios.post('/api/check-email', { email });
                const data = response.data;

                if (data.exists) {
                    setEmailExists(true);
                    setGuestFormData((prev) => ({
                        ...prev,
                        name: data.name || prev.name,
                        phone_number: data.phone_number || prev.phone_number,
                        instance: data.instance || prev.instance,
                        city: data.city || prev.city,
                    }));
                    setUserPoints(data.point_balance || 0);
                } else {
                    setEmailExists(false);
                    setUserPoints(0);
                    setPointsChecked(false);
                    setPointsToUse(0);
                }
            } catch {
                setEmailExists(false);
                setUserPoints(0);
                setPointsChecked(false);
                setPointsToUse(0);
            } finally {
                setCheckingEmail(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [guestFormData.email, isLoggedIn]);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const refFromUrl = urlParams.get('ref');

        if (refFromUrl) {
            sessionStorage.setItem('affiliate_code', refFromUrl);
        } else if (referralInfo?.code) {
            sessionStorage.setItem('affiliate_code', referralInfo.code);
        }
    }, [referralInfo]);

    const refreshCSRFToken = useCallback(async (): Promise<string> => {
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
    }, []);

    const savePendingCheckout = () => {
        const pendingCheckoutData: PendingCheckoutData = {
            bundleId: bundle.id,
            timestamp: Date.now(),
            promoCode,
            discountData,
            termsAccepted,
            codeType,
            referralValid: codeType === 'referral' && !!referralData?.valid,
            pointsChecked,
            pointsToUse,
        };

        sessionStorage.setItem('pendingCheckoutBundle', JSON.stringify(pendingCheckoutData));
    };

    const ensureAuthenticated = async (): Promise<boolean> => {
        if (isLoggedIn) return true;

        if (!guestFormData.email || !guestFormData.phone_number) {
            toast.error('Email dan nomor telepon wajib diisi.');
            return false;
        }

        if (!guestFormData.instance) {
            toast.error('Instansi wajib diisi.');
            return false;
        }

        if (!guestFormData.city) {
            toast.error('Kota domisili wajib diisi.');
            return false;
        }

        setLoading(true);

        try {
            if (emailExists) {
                const loginResponse = await axios.post(route('auto-login'), {
                    email: guestFormData.email,
                    phone_number: guestFormData.phone_number,
                    instance: guestFormData.instance,
                    city: guestFormData.city,
                });

                const loginData = loginResponse.data;

                if (!loginData.success) {
                    throw new Error(loginData.message || 'Gagal login otomatis.');
                }

                toast.success('Login berhasil. Melanjutkan checkout...');
            } else {
                if (!guestFormData.name) {
                    toast.error('Nama wajib diisi.');
                    setLoading(false);
                    return false;
                }

                await axios.post(route('register'), {
                    name: guestFormData.name,
                    email: guestFormData.email,
                    phone_number: guestFormData.phone_number,
                    instance: guestFormData.instance,
                    city: guestFormData.city,
                    password: guestFormData.phone_number,
                    password_confirmation: guestFormData.phone_number,
                    affiliate_code: sessionStorage.getItem('affiliate_code') || urlParams.get('ref') || referralInfo?.code || '',
                });

                toast.success('Registrasi berhasil. Melanjutkan checkout...');
            }

            savePendingCheckout();
            window.location.reload();
            return false;
        } catch (error: unknown) {
            setLoading(false);
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || getErrorMessage(error, 'Gagal memproses login/registrasi otomatis.'));
            } else {
                toast.error(getErrorMessage(error, 'Gagal memproses login/registrasi otomatis.'));
            }
            return false;
        }
    };

    const submitPayment = useCallback(
        async (
            activeDiscountData: DiscountData | null,
            overrideCodeType?: 'voucher' | 'referral',
            overridePromoCode?: string,
            overrideReferralValid?: boolean,
            overridePointsChecked?: boolean,
            overridePointsToUse?: number,
            retryCount = 0
        ): Promise<void> => {
            const activeDiscountAmount = activeDiscountData?.valid ? activeDiscountData.discount_amount : 0;
            const activeFinalPrice = bundle.price - activeDiscountAmount;
            
            const pointsDeduction = overridePointsChecked !== undefined ? (overridePointsChecked ? (overridePointsToUse || 0) : 0) : (pointsChecked ? pointsToUse : 0);
            const finalNettAmount = activeFinalPrice - pointsDeduction;
            const activeTotal = finalNettAmount + transactionFee;

            const invoiceData: Record<string, string | number> = {
                bundle_id: bundle.id,
                discount_amount: bundleDiscount + activeDiscountAmount,
                nett_amount: finalNettAmount,
                transaction_fee: transactionFee,
                total_amount: activeTotal,
                points_redeemed: pointsDeduction,
            };
            if (activeDiscountData?.valid) {
                invoiceData.discount_code_id = activeDiscountData.discount_code.id;
                invoiceData.discount_code_amount = activeDiscountData.discount_amount;
            }

            const currentCodeType = overrideCodeType || codeType;
            const currentPromoCode = overridePromoCode || promoCode;
            const isReferralValid = overrideReferralValid !== undefined ? overrideReferralValid : referralData?.valid;

            if (currentCodeType === 'referral' && isReferralValid) {
                invoiceData.referral_code = currentPromoCode;
            }

            try {
                const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content;

                const res = await fetch(route('invoice.store.bundle'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken || '',
                        Accept: 'application/json',
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify(invoiceData),
                });

                if (res.status === 419 && retryCount < 2) {
                    await refreshCSRFToken();
                    return submitPayment(
                        activeDiscountData,
                        overrideCodeType,
                        overridePromoCode,
                        overrideReferralValid,
                        overridePointsChecked,
                        overridePointsToUse,
                        retryCount + 1
                    );
                }

                const data = await res.json();

                if (res.ok && data.success) {
                    if (data.payment_url) {
                        sessionStorage.removeItem('pendingCheckoutBundle');
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
        },
        [bundle.id, bundle.price, bundleDiscount, refreshCSRFToken, transactionFee, pointsChecked, pointsToUse, codeType, referralData, promoCode],
    );

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!termsAccepted) {
            alert('Anda harus menyetujui syarat dan ketentuan!');
            return;
        }

        const authenticated = await ensureAuthenticated();
        if (!authenticated) {
            return;
        }

        if (!isProfileComplete) {
            alert('Profil Anda belum lengkap! Harap lengkapi nomor telepon dan instansi terlebih dahulu.');
            window.location.href = route('profile.edit');
            return;
        }

        setLoading(true);

        try {
            await submitPayment(discountData);
        } catch (error: unknown) {
            alert(getErrorMessage(error, 'Terjadi kesalahan saat proses pembayaran.'));
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isLoggedIn) return;

        const pendingCheckoutRaw = sessionStorage.getItem('pendingCheckoutBundle');
        if (!pendingCheckoutRaw) return;

        try {
            const pendingCheckout = JSON.parse(pendingCheckoutRaw) as PendingCheckoutData;

            const fiveMinutes = 5 * 60 * 1000;
            if (Date.now() - pendingCheckout.timestamp > fiveMinutes) {
                sessionStorage.removeItem('pendingCheckoutBundle');
                return;
            }

            if (pendingCheckout.bundleId !== bundle.id) {
                sessionStorage.removeItem('pendingCheckoutBundle');
                return;
            }

            // Remove immediately to prevent double submissions in StrictMode/concurrent renders
            sessionStorage.removeItem('pendingCheckoutBundle');

            if (pendingCheckout.promoCode) {
                setPromoCode(pendingCheckout.promoCode);
            }
            if (pendingCheckout.codeType) {
                setCodeType(pendingCheckout.codeType);
            }
            if (pendingCheckout.referralValid) {
                setReferralData({ valid: true });
            }

            if (pendingCheckout.pointsChecked) {
                setPointsChecked(true);
            }
            if (pendingCheckout.pointsToUse) {
                setPointsToUse(pendingCheckout.pointsToUse);
            }

            setDiscountData(pendingCheckout.discountData || null);
            setTermsAccepted(pendingCheckout.termsAccepted || false);

            if (!pendingCheckout.termsAccepted) {
                setLoading(false);
                return;
            }

            setLoading(true);

            submitPayment(
                pendingCheckout.discountData || null,
                pendingCheckout.codeType,
                pendingCheckout.promoCode,
                pendingCheckout.referralValid,
                pendingCheckout.pointsChecked,
                pendingCheckout.pointsToUse
            ).catch((error: unknown) => {
                console.error('Pending checkout bundle error:', error);
                toast.error(getErrorMessage(error, 'Gagal melanjutkan checkout bundle.'));
                setLoading(false);
            });
        } catch {
            sessionStorage.removeItem('pendingCheckoutBundle');
        }
    }, [bundle.id, isLoggedIn, submitPayment]);

    if (isLoggedIn && !isProfileComplete) {
        return (
            <UserLayout>
                <Head title="Checkout Paket Bundling" />
                <section className="to-primary w-full bg-gradient-to-tl from-black px-4">
                    <div className="mx-auto my-12 w-full max-w-7xl px-4">
                        <h2 className="mx-auto mb-4 max-w-3xl bg-gradient-to-r from-[#71D0F7] via-white to-[#E6834A] bg-clip-text text-center text-3xl font-bold text-transparent italic sm:text-4xl">
                            Checkout Paket Bundling "{bundle.title}"
                        </h2>
                        <p className="text-center text-gray-400">Silakan lengkapi profil Anda terlebih dahulu.</p>
                    </div>
                </section>
                <section className="mx-auto my-4 w-full max-w-7xl px-4">
                    <div className="flex h-full flex-col items-center justify-center space-y-4 rounded-lg border p-6 text-center">
                        <User size={64} className="text-orange-500" />
                        <h2 className="text-xl font-bold">Profil Belum Lengkap</h2>
                        <p className="text-sm text-gray-500">
                            Profil Anda belum lengkap! Harap lengkapi nomor telepon, instansi, dan kota domisili terlebih dahulu untuk membeli paket bundling.
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
            <Head title={`Checkout - ${bundle.title}`} />
            <section className="to-primary w-full bg-gradient-to-tl from-black px-4">
                <div className="mx-auto my-12 w-full max-w-7xl px-4">
                    <h2 className="mx-auto mb-4 max-w-3xl bg-gradient-to-r from-[#71D0F7] via-white to-[#E6834A] bg-clip-text text-center text-3xl font-bold text-transparent italic sm:text-4xl">
                        Checkout Paket Bundling
                    </h2>
                    <p className="text-center text-gray-400">
                        Silakan selesaikan pembayaran untuk mendapatkan akses ke semua program dalam paket bundling.
                    </p>
                </div>
            </section>

            <section className="mx-auto my-4 w-full max-w-7xl px-4">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Left Column - Bundle Details */}
                    <div className="lg:col-span-2">
                        <div className="rounded-lg border bg-white p-6 dark:bg-gray-800">
                            <div className="mb-6 flex items-start gap-4">
                                <img
                                    src={bundle.thumbnail ? `/storage/${bundle.thumbnail}` : '/assets/images/placeholder.png'}
                                    alt={bundle.title}
                                    className="h-32 w-48 rounded-lg object-cover"
                                />
                                <div className="flex-1">
                                    <Badge className="bg-primary mb-2 text-white">
                                        <Package size={12} className="mr-1" />
                                        Paket Bundling
                                    </Badge>
                                    <h2 className="mb-2 text-2xl font-bold text-gray-900 italic dark:text-white">{bundle.title}</h2>
                                    {bundle.batch && (
                                        <Badge variant="outline" className="mb-2">
                                            {bundle.batch}
                                        </Badge>
                                    )}
                                    {bundle.short_description && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{bundle.short_description}</p>
                                    )}
                                </div>
                            </div>

                            <Separator className="my-6" />

                            <div>
                                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                                    Isi Paket ({bundle.bundle_items_count} Program)
                                </h3>
                                <div className="space-y-3">
                                    {bundle.bundle_items.map((item, index) => (
                                        <div key={item.id} className="flex items-center gap-3 rounded-lg border p-3">
                                            <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-full font-semibold">
                                                {index + 1}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate font-medium text-gray-900 dark:text-white">{item.bundleable.title}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {item.bundleable_type.includes('Course')
                                                        ? 'Kelas Online'
                                                        : item.bundleable_type.includes('Bootcamp')
                                                          ? 'Bootcamp'
                                                          : 'Webinar'}
                                                </p>
                                            </div>
                                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                                {item.price === 0 ? 'Gratis' : rupiahFormatter.format(item.price)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Separator className="my-6" />

                            <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                                <h4 className="mb-2 flex items-center gap-2 font-semibold text-green-800 dark:text-green-400">
                                    <BadgeCheck size={18} />
                                    Keuntungan Paket Bundling
                                </h4>
                                <ul className="space-y-2">
                                    <li className="flex items-start gap-2 text-sm text-green-700 dark:text-green-300">
                                        <Check size={16} className="mt-0.5 flex-shrink-0" />
                                        <span>
                                            Hemat {Math.round(((bundle.strikethrough_price - bundle.price) / bundle.strikethrough_price) * 100)}% dari
                                            harga normal
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2 text-sm text-green-700 dark:text-green-300">
                                        <Check size={16} className="mt-0.5 flex-shrink-0" />
                                        <span>Akses ke {bundle.bundle_items_count} program pembelajaran sekaligus</span>
                                    </li>
                                    <li className="flex items-start gap-2 text-sm text-green-700 dark:text-green-300">
                                        <Check size={16} className="mt-0.5 flex-shrink-0" />
                                        <span>Sertifikat untuk semua program yang diselesaikan</span>
                                    </li>
                                    <li className="flex items-start gap-2 text-sm text-green-700 dark:text-green-300">
                                        <Check size={16} className="mt-0.5 flex-shrink-0" />
                                        <span>Akses selamanya ke semua materi pembelajaran</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Payment */}
                    <div className="lg:col-span-1">
                        {hasAccess ? (
                            <div className="flex h-full flex-col items-center justify-center space-y-4 rounded-lg border p-6 text-center">
                                <BadgeCheck size={64} className="text-green-500" />
                                <h2 className="text-xl font-bold">Anda Sudah Memiliki Akses</h2>
                                <p className="text-sm text-gray-500">Anda sudah membeli paket bundling ini. Silakan lanjutkan belajar.</p>
                                <Button asChild className="w-full">
                                    <Link href={route('profile.index')}>Lihat Dashboard</Link>
                                </Button>
                            </div>
                        ) : pendingInvoiceUrl ? (
                            <div className="flex h-full flex-col items-center justify-center space-y-4 rounded-lg border p-6 text-center">
                                <Hourglass size={64} className="text-yellow-500" />
                                <h2 className="text-xl font-bold">Pembayaran Tertunda</h2>
                                <p className="text-sm text-gray-500">
                                    Anda memiliki pembayaran yang belum selesai untuk paket bundling ini. Silakan lanjutkan untuk membayar.
                                </p>
                                <Button asChild className="w-full">
                                    <a href={pendingInvoiceUrl}>Lanjutkan Pembayaran</a>
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleCheckout}>
                                <h2 className="mb-4 text-xl font-bold italic">Detail Pembayaran</h2>
                                <div className="space-y-4 rounded-lg border p-4">
                                    {!isLoggedIn && (
                                        <div className="space-y-3 rounded-lg border p-4">
                                            <h3 className="text-lg font-semibold">Data Diri</h3>
                                            <div className="space-y-2">
                                                <Label htmlFor="guest-email">Email</Label>
                                                <Input
                                                    id="guest-email"
                                                    type="email"
                                                    placeholder="email@example.com"
                                                    value={guestFormData.email}
                                                    onChange={(e) => updateGuestForm('email', e.target.value)}
                                                    required
                                                />
                                                {checkingEmail && <p className="text-xs text-gray-500">Mengecek email...</p>}
                                                {emailExists && (
                                                    <p className="text-xs text-green-600">Email ditemukan. Login otomatis akan digunakan.</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="guest-name">Nama</Label>
                                                <Input
                                                    id="guest-name"
                                                    type="text"
                                                    placeholder="Nama lengkap"
                                                    value={guestFormData.name}
                                                    onChange={(e) => updateGuestForm('name', e.target.value)}
                                                    disabled={emailExists}
                                                    required
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="guest-phone">No. Telepon</Label>
                                                <Input
                                                    id="guest-phone"
                                                    type="tel"
                                                    placeholder="08xxxxxxxxxx"
                                                    value={guestFormData.phone_number}
                                                    onChange={(e) => updateGuestForm('phone_number', e.target.value)}
                                                    disabled={emailExists}
                                                    required
                                                />
                                                {!emailExists && (
                                                    <p className="text-xs text-gray-500">Nomor telepon akan digunakan sebagai password akun Anda.</p>
                                                )}
                                                {emailExists && (
                                                    <p className="text-xs text-blue-600">
                                                        Data akun ditemukan dan dikunci agar sesuai akun terdaftar.
                                                    </p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="guest-instance">Instansi</Label>
                                                <Input
                                                    id="guest-instance"
                                                    type="text"
                                                    placeholder="Instansi / perusahaan"
                                                    value={guestFormData.instance}
                                                    onChange={(e) => updateGuestForm('instance', e.target.value)}
                                                    disabled={loading}
                                                    required
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="guest-city">Kota Domisili</Label>
                                                <Input
                                                    id="guest-city"
                                                    type="text"
                                                    placeholder="Kota domisili Anda"
                                                    value={guestFormData.city}
                                                    onChange={(e) => updateGuestForm('city', e.target.value)}
                                                    disabled={loading}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Pilihan Jenis Kode */}
                                    <div className="space-y-2">
                                        <Label>Jenis Kode</Label>
                                        <RadioGroup
                                            value={codeType}
                                            onValueChange={(val: 'voucher' | 'referral') => {
                                                setCodeType(val);
                                                setPromoCode('');
                                                setDiscountData(null);
                                                setReferralData(null);
                                                setPromoError('');
                                                setReferralError('');
                                                if (val === 'voucher') {
                                                    setPointsChecked(false);
                                                    setPointsToUse(0);
                                                }
                                            }}
                                            className="flex gap-4"
                                        >
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="voucher" id="code-voucher" />
                                                <Label htmlFor="code-voucher" className="cursor-pointer">Voucher</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="referral" id="code-referral" />
                                                <Label htmlFor="code-referral" className="cursor-pointer">Referral</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>

                                    {/* Input Kode Tunggal */}
                                    <div className="space-y-2">
                                        <Label htmlFor="promo-code">
                                            {codeType === 'voucher' ? 'Kode Voucher' : 'Kode Referral'}
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="promo-code"
                                                type="text"
                                                placeholder={codeType === 'voucher' ? 'Masukkan kode voucher' : 'Masukkan kode referral'}
                                                value={promoCode}
                                                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                                className="pr-10"
                                            />
                                            {(promoLoading || referralLoading) && (
                                                <div className="absolute top-1/2 right-3 -translate-y-1/2 transform">
                                                    <LoaderCircle className="h-4 w-4 animate-spin text-gray-400" />
                                                </div>
                                            )}
                                            {!(promoLoading || referralLoading) && promoCode && (
                                                <div className="absolute top-1/2 right-3 -translate-y-1/2 transform">
                                                    {codeType === 'voucher' ? (
                                                        discountData?.valid ? (
                                                            <Check className="h-5 w-5 text-green-600" />
                                                        ) : promoError ? (
                                                            <X className="h-5 w-5 text-red-600" />
                                                        ) : null
                                                    ) : (
                                                        referralData?.valid ? (
                                                            <Check className="h-5 w-5 text-green-600" />
                                                        ) : referralError ? (
                                                            <X className="h-5 w-5 text-red-600" />
                                                        ) : null
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {codeType === 'voucher' && promoError && (
                                            <p className="text-sm text-red-600">{promoError}</p>
                                        )}
                                        {codeType === 'voucher' && discountData?.valid && (
                                            <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
                                                <div className="flex items-center gap-2">
                                                    <Check className="h-4 w-4 text-green-600" />
                                                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                                        Promo "{discountData.discount_code.code}" diterapkan!
                                                    </p>
                                                </div>
                                                <p className="mt-1 text-xs text-green-600 dark:text-green-300">{discountData.discount_code.name}</p>
                                            </div>
                                        )}
                                        {codeType === 'referral' && referralError && (
                                            <p className="text-sm text-red-600">{referralError}</p>
                                        )}
                                        {codeType === 'referral' && referralData?.valid && (
                                            <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                                                <div className="flex items-center gap-2">
                                                    <Check className="h-4 w-4 text-green-600" />
                                                    <p className="text-sm font-medium text-green-800">
                                                        Kode referral valid!
                                                    </p>
                                                </div>
                                                <p className="mt-1 text-xs text-green-600">
                                                    Pembelian pertama Anda dirujuk oleh {referralData.referrer?.name}. Reward poin akan masuk setelah pembayaran sukses.
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Point Reward/Redeem Section */}
                                    {(isLoggedIn || emailExists) && userPoints > 0 && (
                                        <div className="space-y-4 rounded-lg border p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label className="text-base">Gunakan Reward Point</Label>
                                                    <p className="text-muted-foreground text-xs">
                                                        Anda memiliki {userPoints.toLocaleString('id-ID')} poin (Rp {userPoints.toLocaleString('id-ID')})
                                                    </p>
                                                </div>
                                                <Switch
                                                    checked={pointsChecked}
                                                    disabled={codeType === 'voucher' && !!discountData?.valid}
                                                    onCheckedChange={(checked) => {
                                                        setPointsChecked(checked);
                                                        if (checked) {
                                                            const autoPoints = Math.min(userPoints, maxPointsAllowed);
                                                            setPointsToUse(autoPoints);
                                                            setPointsError('');
                                                        } else {
                                                            setPointsToUse(0);
                                                            setPointsError('');
                                                        }
                                                    }}
                                                />
                                            </div>

                                            {pointsChecked && (
                                                <div className="space-y-2">
                                                    <Label htmlFor="points-input">Jumlah poin yang digunakan</Label>
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            id="points-input"
                                                            type="number"
                                                            max={Math.min(userPoints, maxPointsAllowed)}
                                                            min={1}
                                                            value={pointsToUse || ''}
                                                            onChange={(e) => {
                                                                const val = parseInt(e.target.value) || 0;
                                                                if (val > userPoints) {
                                                                    setPointsError('Poin melebihi saldo Anda.');
                                                                } else if (val > maxPointsAllowed) {
                                                                    setPointsError(`Maksimal poin yang dapat digunakan adalah ${maxPointsAllowed}.`);
                                                                } else {
                                                                    setPointsError('');
                                                                }
                                                                setPointsToUse(val);
                                                            }}
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                setPointsToUse(Math.min(userPoints, maxPointsAllowed));
                                                                setPointsError('');
                                                            }}
                                                        >
                                                            Maksimal
                                                        </Button>
                                                    </div>
                                                    {pointsError && <p className="text-xs text-red-600">{pointsError}</p>}
                                                    {codeType === 'voucher' && !!discountData?.valid && (
                                                        <p className="text-xs text-amber-600">Poin tidak dapat digunakan bersamaan dengan kode voucher.</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <Separator />
                                    {/* Price Breakdown */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Harga Normal</span>
                                            <span className="text-sm font-semibold text-gray-500 line-through dark:text-gray-400">
                                                {rupiahFormatter.format(bundle.strikethrough_price)}
                                            </span>
                                        </div>

                                        {bundleDiscount > 0 && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Diskon Bundle</span>
                                                <span className="text-sm font-semibold text-red-500">-{rupiahFormatter.format(bundleDiscount)}</span>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Harga Bundle</span>
                                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                                {rupiahFormatter.format(bundle.price)}
                                            </span>
                                        </div>

                                        {codeType === 'voucher' && discountData?.valid && (
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600 dark:text-gray-400">
                                                    Diskon Promo ({discountData.discount_code.code})
                                                </span>
                                                <span className="font-semibold text-green-600">
                                                    -Rp {discountData.discount_amount.toLocaleString('id-ID')}
                                                </span>
                                            </div>
                                        )}

                                        {/* Points Discount */}
                                        {pointsChecked && pointsToUse > 0 && !pointsError && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Potongan Poin</span>
                                                <span className="font-semibold text-green-600">
                                                    -Rp {pointsToUse.toLocaleString('id-ID')}
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Biaya Transaksi</span>
                                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                                {rupiahFormatter.format(transactionFee)}
                                            </span>
                                        </div>

                                        <Separator className="my-2" />

                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-gray-900 dark:text-white">Total Pembayaran</span>
                                            <span className="text-primary text-2xl font-bold">{rupiahFormatter.format(totalPrice)}</span>
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Referral Info */}
                                    {referralInfo.hasActive && (
                                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
                                            <p className="text-sm font-medium text-blue-800 dark:text-blue-400">
                                                🎁 Menggunakan kode referral: <span className="font-bold">{referralInfo.code}</span>
                                            </p>
                                            <p className="mt-1 text-xs text-blue-600 dark:text-blue-500">
                                                Anda membantu teman Anda mendapatkan komisi!
                                            </p>
                                        </div>
                                    )}

                                    {/* Terms & Conditions */}
                                    <div className="flex items-start gap-3">
                                        <Checkbox
                                            id="terms"
                                            checked={termsAccepted}
                                            onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                                        />
                                        <Label htmlFor="terms" className="text-sm leading-tight">
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

                                    {/* Submit Button */}
                                    <Button className="w-full" type="submit" disabled={!termsAccepted || loading}>
                                        {loading ? 'Memproses...' : 'Lanjutkan Pembayaran'}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </section>
        </UserLayout>
    );
}
