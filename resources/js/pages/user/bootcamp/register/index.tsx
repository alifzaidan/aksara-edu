import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { parseHtmlList } from '@/lib/utils';
import UserLayout from '@/layouts/user-layout';
import { SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { BadgeCheck, Check, Hourglass, User, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
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
    requirement_1?: string | null;
    requirement_2?: string | null;
    requirement_3?: string | null;
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

interface PendingInvoice {
    id: string;
    invoice_code: string;
    status: string;
    amount: number;
    payment_method?: string;
    invoice_url?: string | null;
    created_at: string;
    expires_at?: string | null;
}

interface GuestFormData {
    name: string;
    email: string;
    phone_number: string;
    instance: string;
    city: string;
}

interface PendingCheckoutData {
    bootcampId: string;
    timestamp: number;
    promoCode: string;
    discountData: DiscountData | null;
    termsAccepted: boolean;
    isFree: boolean;
    codeType?: 'voucher' | 'referral';
    referralValid?: boolean;
    pointsChecked?: boolean;
    pointsToUse?: number;
}

function parseList(items?: string | null): string[] {
    return parseHtmlList(items);
}

function getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message) return error.message;
    return fallback;
}

export default function RegisterBootcamp({
    bootcamp,
    hasAccess,
    pendingInvoice,
    pendingInvoiceUrl,
    referralInfo,
}: {
    bootcamp: Bootcamp;
    hasAccess: boolean;
    pendingInvoice?: PendingInvoice | null;
    pendingInvoiceUrl?: string | null;
    referralInfo: ReferralInfo;
}) {
    const { auth } = usePage<SharedData>().props;
    const isLoggedIn = !!auth.user;
    const isProfileComplete = isLoggedIn && auth.user?.phone_number && auth.user?.instance && auth.user?.city;

    const [cancellingInvoice, setCancellingInvoice] = useState(false);

    const [termsAccepted, setTermsAccepted] = useState(false);
    const [loading, setLoading] = useState(false);

    // Referral & Points State
    const [codeType, setCodeType] = useState<'voucher' | 'referral'>('voucher');
    const [userPoints, setUserPoints] = useState(0);
    const [pointsChecked, setPointsChecked] = useState(false);
    const [pointsToUse, setPointsToUse] = useState(0);
    const [pointsError, setPointsError] = useState('');

    const [promoCode, setPromoCode] = useState('');
    const [discountData, setDiscountData] = useState<DiscountData | null>(null);
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

    const [showFreeForm, setShowFreeForm] = useState(false);
    const [freeFormData, setFreeFormData] = useState<Record<string, File | null>>({
        requirement_1_proof: null,
        requirement_2_proof: null,
        requirement_3_proof: null,
    });
    const [fileErrors, setFileErrors] = useState<Record<string, boolean>>({
        requirement_1_proof: false,
        requirement_2_proof: false,
        requirement_3_proof: false,
    });

    const requirementList = parseList(bootcamp.requirements);
    const benefitList = parseList(bootcamp.benefits);
    const curriculumList = parseList(bootcamp.curriculum);
    const isFree = bootcamp.price === 0;

    const transactionFee = 5000;
    const basePrice = bootcamp.price;
    const discountAmount = discountData?.valid ? discountData.discount_amount : 0;
    const maxPointsAllowed = basePrice - discountAmount;

    const finalBootcampPrice = basePrice - discountAmount - (pointsChecked ? pointsToUse : 0);
    const totalPrice = isFree ? 0 : finalBootcampPrice + transactionFee;

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

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const refFromUrl = urlParams.get('ref');

        if (refFromUrl) {
            sessionStorage.setItem('affiliate_code', refFromUrl);
        } else if (referralInfo?.code) {
            sessionStorage.setItem('affiliate_code', referralInfo.code);
        }
    }, [referralInfo]);

    const validatePromoCode = useCallback(async () => {
        if (!promoCode.trim() || isFree) return;

        setPromoLoading(true);
        setPromoError('');

        try {
            const requestData: Record<string, string | number> = {
                code: promoCode,
                amount: bootcamp.price,
                product_type: 'bootcamp',
                product_id: bootcamp.id,
            };

            if (!isLoggedIn && emailExists && guestFormData.email) {
                requestData.email = guestFormData.email;
            }

            const response = await axios.post('/api/discount-codes/validate', requestData);
            const data = response.data;

            if (data.valid) {
                setDiscountData(data);
                setPromoError('');
            } else {
                setDiscountData(null);
                setPromoError(data.message || 'Kode promo tidak valid');
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
    }, [bootcamp.id, bootcamp.price, emailExists, guestFormData.email, isFree, isLoggedIn, promoCode]);

    const validateReferralCode = useCallback(async () => {
        if (!promoCode.trim() || isFree) return;

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
    }, [promoCode, isFree, isLoggedIn, guestFormData.email]);

    useEffect(() => {
        if (!promoCode.trim() || isFree) {
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
    }, [isFree, promoCode, codeType, validatePromoCode, validateReferralCode]);

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
            bootcampId: bootcamp.id,
            timestamp: Date.now(),
            promoCode,
            discountData,
            termsAccepted,
            isFree,
            codeType,
            referralValid: codeType === 'referral' && !!referralData?.valid,
            pointsChecked,
            pointsToUse,
        };

        sessionStorage.setItem('pendingCheckout', JSON.stringify(pendingCheckoutData));
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
                    affiliate_code: sessionStorage.getItem('affiliate_code') || new URLSearchParams(window.location.search).get('ref') || referralInfo?.code || '',
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
        ): Promise<void> => {
            const originalDiscountAmount = bootcamp.strikethrough_price > 0 ? bootcamp.strikethrough_price - bootcamp.price : 0;
            const promoDiscountAmount = activeDiscountData?.discount_amount || 0;
            const activeFinalPrice = basePrice - promoDiscountAmount;
            
            const pointsDeduction = overridePointsChecked !== undefined ? (overridePointsChecked ? (overridePointsToUse || 0) : 0) : (pointsChecked ? pointsToUse : 0);
            const finalNettAmount = activeFinalPrice - pointsDeduction;
            const activeTotalPrice = isFree ? 0 : finalNettAmount + transactionFee;

            const invoiceData: Record<string, string | number> = {
                type: 'bootcamp',
                id: bootcamp.id,
                discount_amount: originalDiscountAmount + promoDiscountAmount,
                nett_amount: finalNettAmount,
                transaction_fee: transactionFee,
                total_amount: activeTotalPrice,
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

            const affiliateCode = sessionStorage.getItem('affiliate_code') || new URLSearchParams(window.location.search).get('ref') || referralInfo?.code;
            if (affiliateCode) {
                invoiceData.affiliate_code = affiliateCode;
            }

            try {
                const res = await axios.post(route('invoice.store'), invoiceData);

                if (res.data && res.data.success) {
                    if (res.data.payment_url) {
                        sessionStorage.removeItem('pendingCheckout');
                        window.location.href = res.data.payment_url;
                    } else {
                        throw new Error('Payment URL tidak diterima dari server.');
                    }
                } else {
                    throw new Error(res.data?.message || 'Gagal membuat invoice.');
                }
            } catch (error) {
                console.error('Payment error:', error);
                throw error;
            }
        },
        [basePrice, bootcamp.id, bootcamp.price, bootcamp.strikethrough_price, isFree, transactionFee, pointsChecked, pointsToUse, codeType, referralData, promoCode, referralInfo?.code],
    );

    const handleFreeCheckout = (e: React.FormEvent) => {
        e.preventDefault();

        if (!isProfileComplete) {
            toast.error('Profil Anda belum lengkap! Harap lengkapi nomor telepon, instansi, dan kota domisili terlebih dahulu.');
            setTimeout(() => {
                window.location.href = route('profile.edit', { redirect: window.location.href });
            }, 1500);
            return;
        }

        if (!freeFormData.requirement_1_proof || !freeFormData.requirement_2_proof || !freeFormData.requirement_3_proof) {
            toast.error('Harap upload semua bukti yang diperlukan!');
            return;
        }

        setLoading(true);

        const formData = new FormData();
        formData.append('type', 'bootcamp');
        formData.append('id', bootcamp.id);
        formData.append('requirement_1_proof', freeFormData.requirement_1_proof);
        formData.append('requirement_2_proof', freeFormData.requirement_2_proof);
        formData.append('requirement_3_proof', freeFormData.requirement_3_proof);

        router.post(route('enroll.free'), formData, {
            onError: (errors) => {
                console.log('Free enrollment errors:', errors);
                toast.error(errors.message || 'Gagal mendaftar bootcamp gratis.');
            },
            onFinish: () => {
                setLoading(false);
            },
        });
    };

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Jika pengguna sudah login
        if (isLoggedIn) {
            if (!isProfileComplete) {
                toast.error('Profil Anda belum lengkap! Harap lengkapi nomor telepon, instansi, dan kota domisili terlebih dahulu.');
                setTimeout(() => {
                    window.location.href = route('profile.edit', { redirect: window.location.href });
                }, 1500);
                return;
            }

            if (!termsAccepted && !isFree) {
                toast.error('Anda harus menyetujui syarat dan ketentuan!');
                return;
            }

            if (isFree) {
                setShowFreeForm(true);
                return;
            }

            setLoading(true);
            try {
                await submitPayment(discountData);
            } catch (error: unknown) {
                toast.error(getErrorMessage(error, 'Terjadi kesalahan saat proses pembayaran.'));
                setLoading(false);
            }
            return;
        }

        // 2. Jika pengguna belum login (Guest)
        if (!guestFormData.email || !guestFormData.phone_number || !guestFormData.instance || !guestFormData.city) {
            toast.error('Mohon lengkapi seluruh data diri.');
            return;
        }

        if (!termsAccepted && !isFree) {
            toast.error('Anda harus menyetujui syarat dan ketentuan!');
            return;
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

                if (!loginResponse.data?.success) {
                    throw new Error(loginResponse.data?.message || 'Gagal login otomatis. Pastikan nomor telepon sesuai dengan yang terdaftar.');
                }
            } else {
                if (!guestFormData.name) {
                    toast.error('Nama lengkap wajib diisi.');
                    setLoading(false);
                    return;
                }

                const regResponse = await axios.post(route('register'), {
                    name: guestFormData.name,
                    email: guestFormData.email,
                    phone_number: guestFormData.phone_number,
                    instance: guestFormData.instance,
                    city: guestFormData.city,
                    password: guestFormData.phone_number,
                    password_confirmation: guestFormData.phone_number,
                    affiliate_code: sessionStorage.getItem('affiliate_code') || new URLSearchParams(window.location.search).get('ref') || referralInfo?.code || '',
                });

                if (!(regResponse.data?.success || regResponse.status === 200 || regResponse.status === 201)) {
                    throw new Error('Registrasi gagal.');
                }
            }

            if (isFree) {
                setShowFreeForm(true);
                setLoading(false);
                return;
            }

            // Langsung eksekusi submitPayment() tanpa reload halaman!
            await submitPayment(discountData);
        } catch (error: unknown) {
            setLoading(false);
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || getErrorMessage(error, 'Gagal memproses pendaftaran.'));
            } else {
                toast.error(getErrorMessage(error, 'Gagal memproses pendaftaran.'));
            }
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

    if (isLoggedIn && !isProfileComplete) {
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
                            Profil Anda belum lengkap! Harap lengkapi nomor telepon, instansi, dan kota domisili terlebih dahulu untuk mendaftar bootcamp.
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
                    ) : (pendingInvoice || pendingInvoiceUrl) ? (
                        <div className="rounded-2xl border bg-white p-6 shadow-xl dark:bg-gray-800">
                            <div className="flex items-center gap-2 mb-2 text-yellow-600 dark:text-yellow-400">
                                <Hourglass className="h-5 w-5" />
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                    Transaksi Menunggu Pembayaran
                                </h3>
                            </div>
                            <p className="text-sm text-gray-500">
                                {pendingInvoice?.invoice_code ? (
                                    <>Kode Invoice: <span className="font-semibold text-gray-800 dark:text-gray-200">{pendingInvoice.invoice_code}</span></>
                                ) : (
                                    'Anda memiliki transaksi yang belum selesai untuk bootcamp ini.'
                                )}
                            </p>
                            {pendingInvoice?.amount !== undefined && (
                                <p className="text-2xl font-bold text-orange-600 my-3">
                                    Rp {pendingInvoice.amount.toLocaleString('id-ID')}
                                </p>
                            )}
                            <div className="space-y-2 pt-2">
                                {(pendingInvoice?.invoice_url || pendingInvoiceUrl) && (
                                    <Button asChild className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold" size="lg">
                                        <a href={pendingInvoice?.invoice_url || pendingInvoiceUrl!}>
                                            Lanjutkan Pembayaran
                                        </a>
                                    </Button>
                                )}
                                <div className="flex gap-2">
                                    <Button onClick={() => window.location.reload()} variant="outline" className="flex-1" size="lg">
                                        Cek Status
                                    </Button>
                                    {pendingInvoice?.id && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="flex-1 text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
                                            size="lg"
                                            disabled={cancellingInvoice}
                                            onClick={async () => {
                                                if (confirm('Apakah Anda yakin ingin membatalkan transaksi ini dan membuat pesanan baru?')) {
                                                    setCancellingInvoice(true);
                                                    try {
                                                        await axios.post(route('invoice.cancel', pendingInvoice.id));
                                                        toast.success('Pesanan berhasil dibatalkan.');
                                                        window.location.reload();
                                                    } catch (err: any) {
                                                        toast.error(err.response?.data?.message || 'Gagal membatalkan pesanan.');
                                                        setCancellingInvoice(false);
                                                    }
                                                }
                                            }}
                                        >
                                            {cancellingInvoice ? 'Membatalkan...' : 'Batalkan Pesanan'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : !showFreeForm ? (
                        <form onSubmit={handleCheckout}>
                            <h2 className="my-2 text-xl font-bold italic">Detail {isFree ? 'Pendaftaran' : 'Pembayaran'}</h2>
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
                                            {emailExists && <p className="text-xs text-green-600">Email ditemukan. Login otomatis akan digunakan.</p>}
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
                                                    Data akun ditemukan dan dikunci agar sesuai dengan akun terdaftar.
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

                                {isFree ? (
                                    <div className="space-y-2 text-center">
                                        <div className="flex items-center justify-between p-4">
                                            <span className="w-full text-2xl font-bold text-green-600">BOOTCAMP GRATIS</span>
                                        </div>
                                        <p className="text-sm text-gray-600">Untuk mendapatkan akses gratis, Anda perlu:</p>
                                        <ul className="space-y-1 text-left text-sm">
                                            {bootcamp.requirement_1 && <li>• {bootcamp.requirement_1}</li>}
                                            {bootcamp.requirement_2 && <li>• {bootcamp.requirement_2}</li>}
                                            {bootcamp.requirement_3 && <li>• {bootcamp.requirement_3}</li>}
                                        </ul>
                                        <p className="text-xs text-gray-500">Upload bukti follow dan tag untuk mendapatkan akses</p>
                                    </div>
                                ) : (
                                    <>
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
                                                        <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-blue-600"></div>
                                                    </div>
                                                )}
                                                {!(promoLoading || referralLoading) && promoCode && (
                                                    <div className="absolute top-1/2 right-3 -translate-y-1/2 transform">
                                                        {codeType === 'voucher' ? (
                                                            discountData?.valid ? (
                                                                <Check className="h-4 w-4 text-green-600" />
                                                            ) : promoError ? (
                                                                <X className="h-4 w-4 text-red-600" />
                                                            ) : null
                                                        ) : (
                                                            referralData?.valid ? (
                                                                <Check className="h-4 w-4 text-green-600" />
                                                            ) : referralError ? (
                                                                <X className="h-4 w-4 text-red-600" />
                                                            ) : null
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            {codeType === 'voucher' && promoError && (
                                                <p className="text-sm text-red-600">{promoError}</p>
                                            )}
                                            {codeType === 'voucher' && discountData?.valid && (
                                                <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                                                    <div className="flex items-center gap-2">
                                                        <Check className="h-4 w-4 text-green-600" />
                                                        <p className="text-sm font-medium text-green-800">
                                                            Voucher "{discountData.discount_code.code}" berhasil diterapkan!
                                                        </p>
                                                    </div>
                                                    <p className="mt-1 text-xs text-green-600">
                                                        {discountData.discount_code.name} - Diskon {discountData.discount_code.formatted_value}
                                                    </p>
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
                                            {codeType === 'voucher' && discountData?.valid && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-600">Diskon Promo ({discountData.discount_code.code})</span>
                                                    <span className="font-semibold text-green-600">
                                                        -Rp {discountData.discount_amount.toLocaleString('id-ID')}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Points Discount */}
                                            {pointsChecked && pointsToUse > 0 && !pointsError && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-600">Potongan Poin</span>
                                                    <span className="font-semibold text-green-600">
                                                        -Rp {pointsToUse.toLocaleString('id-ID')}
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
                                {[1, 2, 3].map((index) => {
                                    const requirementKey = `requirement_${index}` as keyof Bootcamp;
                                    const proofKey = `requirement_${index}_proof` as const;
                                    const requirementText = (bootcamp[requirementKey] as string | null | undefined) || `Persyaratan ${index}`;

                                    return (
                                        <div key={index}>
                                            <Label htmlFor={proofKey}>Bukti: {requirementText}</Label>
                                            <Input
                                                id={proofKey}
                                                data-field={proofKey}
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleFileChange(proofKey, e.target.files?.[0] || null)}
                                                className={fileErrors[proofKey] ? 'border-red-500' : ''}
                                                required
                                            />
                                            <p className="mt-1 text-xs text-gray-500">Screenshot atau bukti untuk: {requirementText} (Maks. 2MB)</p>
                                        </div>
                                    );
                                })}

                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setShowFreeForm(false);
                                            setFileErrors({
                                                requirement_1_proof: false,
                                                requirement_2_proof: false,
                                                requirement_3_proof: false,
                                            });
                                            setFreeFormData({
                                                requirement_1_proof: null,
                                                requirement_2_proof: null,
                                                requirement_3_proof: null,
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
                                            !freeFormData.requirement_1_proof ||
                                            !freeFormData.requirement_2_proof ||
                                            !freeFormData.requirement_3_proof ||
                                            Object.values(fileErrors).some((e) => e)
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
