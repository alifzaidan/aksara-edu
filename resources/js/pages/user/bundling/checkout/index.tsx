import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import InstallmentOptions, { ActiveInstallmentData, InstallmentTermOption } from '@/components/installment-options';
import UserLayout from '@/layouts/user-layout';
import { SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import axios from 'axios';
import { BadgeCheck, Check, Hourglass, LoaderCircle, Package, RefreshCw, User, X } from 'lucide-react';
import { parseISO } from 'date-fns';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
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

interface ReferralInfo {
    code?: string;
    hasActive: boolean;
}

interface CheckoutBundleProps {
    bundle: Bundle;
    hasAccess: boolean;
    activeInstallment?: ActiveInstallmentData | null;
    pendingInvoice?: PendingInvoice | null;
    pendingInvoiceUrl?: string | null;
    referralInfo: ReferralInfo;
    installmentTerms?: Array<{ term_number: number; amount: number; due_date: string }>;
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

export default function CheckoutBundle({
    bundle,
    hasAccess,
    activeInstallment: initialActiveInstallment = null,
    pendingInvoice,
    pendingInvoiceUrl,
    referralInfo,
    installmentTerms = [],
}: CheckoutBundleProps) {
    const { t, i18n } = useTranslation('user');
    const dateLocale = i18n.language === 'en' ? 'en-US' : 'id-ID';

    const formatRupiah = (amount: number) => {
        return new Intl.NumberFormat(dateLocale, {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const { auth } = usePage<SharedData>().props;
    const isLoggedIn = !!auth.user;
    const isProfileComplete = isLoggedIn && auth.user?.phone_number && auth.user?.instance && auth.user?.city;

    const isAnyTermOverdue = !initialActiveInstallment && installmentTerms.some((t) => {
        if (!t.due_date) return false;
        try {
            const d = typeof t.due_date === 'string' ? parseISO(t.due_date) : new Date(t.due_date);
            if (isNaN(d.getTime())) return false;
            const endOfDay = new Date(d);
            endOfDay.setHours(23, 59, 59, 999);
            return new Date() > endOfDay;
        } catch {
            return false;
        }
    });

    const [activeInstallment, setActiveInstallment] = useState<ActiveInstallmentData | null>(initialActiveInstallment);
    const [paymentTab, setPaymentTab] = useState<'full' | 'installment'>(
        initialActiveInstallment ? 'installment' : 'full'
    );

    const [cancellingInvoice, setCancellingInvoice] = useState(false);

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
                setPromoError(response.data.message || t('bundling.checkout.errors.invalidPromo'));
            }
        } catch (error: unknown) {
            setDiscountData(null);
            if (axios.isAxiosError(error)) {
                setPromoError(error.response?.data?.message || t('bundling.checkout.errors.promoValidateError'));
            } else {
                setPromoError(t('bundling.checkout.errors.promoValidateError'));
            }
        } finally {
            setPromoLoading(false);
        }
    }, [bundle.id, bundle.price, emailExists, guestFormData.email, isLoggedIn, promoCode, t]);

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
                setReferralError(data.message || t('bundling.checkout.errors.invalidReferral'));
            }
        } catch (error: unknown) {
            setReferralData(null);
            if (axios.isAxiosError(error)) {
                setReferralError(error.response?.data?.message || t('bundling.checkout.errors.referralValidateError'));
            } else {
                setReferralError(t('bundling.checkout.errors.referralValidateError'));
            }
        } finally {
            setReferralLoading(false);
        }
    }, [promoCode, isLoggedIn, guestFormData.email, t]);

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
                const response = await axios.post('/api/check-email', {
                    email,
                    type: 'bundle',
                    id: bundle.id,
                    bundle_id: bundle.id,
                });
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

                    if (data.active_installment) {
                        setActiveInstallment(data.active_installment);
                        setPaymentTab('installment');
                    } else {
                        setActiveInstallment(null);
                    }
                } else {
                    setEmailExists(false);
                    setUserPoints(0);
                    setPointsChecked(false);
                    setPointsToUse(0);
                    setActiveInstallment(null);
                }
            } catch {
                setEmailExists(false);
                setUserPoints(0);
                setPointsChecked(false);
                setPointsToUse(0);
                setActiveInstallment(null);
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

    const ensureAuth = async (): Promise<boolean> => {
        if (isLoggedIn) return true;

        if (!guestFormData.email || !guestFormData.phone_number || !guestFormData.instance || !guestFormData.city) {
            toast.error(t('bundling.checkout.errors.completePersonalData'));
            return false;
        }

        try {
            if (emailExists) {
                const loginResponse = await axios.post(route('auto-login'), {
                    email: guestFormData.email,
                    phone_number: guestFormData.phone_number,
                    instance: guestFormData.instance,
                    city: guestFormData.city,
                });

                if (!loginResponse.data?.success) {
                    throw new Error(loginResponse.data?.message || t('bundling.checkout.errors.autoLoginFailed'));
                }
            } else {
                if (!guestFormData.name) {
                    toast.error(t('bundling.checkout.errors.nameRequired'));
                    return false;
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
                    throw new Error(t('bundling.checkout.errors.registerFailed'));
                }
            }
            return true;
        } catch (error: any) {
            console.error('Login/Register error:', error);
            toast.error(error.response?.data?.message || error.message || t('bundling.checkout.errors.processLoginFailed'));
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

            const affiliateCode = sessionStorage.getItem('affiliate_code') || new URLSearchParams(window.location.search).get('ref') || referralInfo?.code;
            if (affiliateCode) {
                invoiceData.affiliate_code = affiliateCode;
            }

            try {
                const res = await axios.post(route('invoice.store.bundle'), invoiceData);

                if (res.data && res.data.success) {
                    if (res.data.payment_url) {
                        sessionStorage.removeItem('pendingCheckoutBundle');
                        window.location.href = res.data.payment_url;
                    } else {
                        throw new Error('Payment URL tidak diterima dari server.');
                    }
                } else {
                    throw new Error(res.data?.message || t('bundling.checkout.errors.createInvoiceFailed'));
                }
            } catch (error) {
                console.error('Payment error:', error);
                throw error;
            }
        },
        [bundle.id, bundle.price, bundleDiscount, transactionFee, pointsChecked, pointsToUse, codeType, referralData, promoCode, referralInfo?.code, t],
    );

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();

        if (activeInstallment && !activeInstallment.is_fully_paid) {
            toast.error(t('bundling.checkout.activeInstallmentAlert'));
            setPaymentTab('installment');
            return;
        }

        // 1. Jika pengguna sudah login
        if (isLoggedIn) {
            if (!isProfileComplete) {
                toast.error(t('bundling.checkout.incompleteProfileDesc'));
                setTimeout(() => {
                    window.location.href = route('profile.edit', { redirect: window.location.href });
                }, 1500);
                return;
            }

            if (!termsAccepted) {
                toast.error(t('bundling.checkout.errors.termsRequired'));
                return;
            }

            setLoading(true);
            try {
                await submitPayment(discountData);
            } catch (error: unknown) {
                toast.error(getErrorMessage(error, t('bundling.checkout.errors.paymentFailed')));
                setLoading(false);
            }
            return;
        }

        // 2. Jika pengguna belum login (Guest)
        if (!guestFormData.email || !guestFormData.phone_number || !guestFormData.instance || !guestFormData.city) {
            toast.error(t('bundling.checkout.errors.completePersonalData'));
            return false;
        }

        if (!termsAccepted) {
            toast.error(t('bundling.checkout.errors.termsRequired'));
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
                    throw new Error(loginResponse.data?.message || t('bundling.checkout.errors.autoLoginFailed'));
                }
            } else {
                if (!guestFormData.name) {
                    toast.error(t('bundling.checkout.errors.nameRequired'));
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
                    throw new Error(t('bundling.checkout.errors.registerFailed'));
                }
            }

            // Langsung eksekusi submitPayment() tanpa reload halaman!
            await submitPayment(discountData);
        } catch (error: unknown) {
            setLoading(false);
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || getErrorMessage(error, t('bundling.checkout.errors.processLoginFailed')));
            } else {
                toast.error(getErrorMessage(error, t('bundling.checkout.errors.processLoginFailed')));
            }
        }
    };

    const renderPaymentContent = () => (
        <>
            {/* Pilihan Jenis Kode */}
            <div className="space-y-2">
                <Label>{t('bundling.checkout.codeType')}</Label>
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
                        <Label htmlFor="code-voucher" className="cursor-pointer">
                            {t('bundling.checkout.voucher')}
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="referral" id="code-referral" />
                        <Label htmlFor="code-referral" className="cursor-pointer">
                            {t('bundling.checkout.referral')}
                        </Label>
                    </div>
                </RadioGroup>
            </div>

            {/* Input Kode Tunggal */}
            <div className="space-y-2">
                <Label htmlFor="promo-code">
                    {codeType === 'voucher' ? t('bundling.checkout.voucherCode') : t('bundling.checkout.referralCode')}
                </Label>
                <div className="relative">
                    <Input
                        id="promo-code"
                        type="text"
                        placeholder={codeType === 'voucher' ? t('bundling.checkout.enterVoucherCode') : t('bundling.checkout.enterReferralCode')}
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
                            ) : referralData?.valid ? (
                                <Check className="h-5 w-5 text-green-600" />
                            ) : referralError ? (
                                <X className="h-5 w-5 text-red-600" />
                            ) : null}
                        </div>
                    )}
                </div>
                {codeType === 'voucher' && promoError && <p className="text-sm text-red-600">{promoError}</p>}
                {codeType === 'voucher' && discountData?.valid && (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
                        <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-600" />
                            <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                {t('bundling.checkout.voucherSuccess', { code: discountData.discount_code.code })}
                            </p>
                        </div>
                        <p className="mt-1 text-xs text-green-600 dark:text-green-300">{discountData.discount_code.name}</p>
                    </div>
                )}
                {codeType === 'referral' && referralError && <p className="text-sm text-red-600">{referralError}</p>}
                {codeType === 'referral' && referralData?.valid && (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                        <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-600" />
                            <p className="text-sm font-medium text-green-800">{t('bundling.checkout.referralSuccess')}</p>
                        </div>
                        <p className="mt-1 text-xs text-green-600">
                            {t('bundling.checkout.referralReferredBy', { name: referralData.referrer?.name })}
                        </p>
                    </div>
                )}
            </div>

            {/* Point Reward/Redeem Section */}
            {(isLoggedIn || emailExists) && userPoints > 0 && (
                <div className="space-y-4 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">{t('bundling.checkout.useRewardPoints')}</Label>
                            <p className="text-muted-foreground text-xs">
                                {t('bundling.checkout.pointsBalance', {
                                    points: userPoints.toLocaleString(dateLocale),
                                    rupiah: userPoints.toLocaleString(dateLocale),
                                })}
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
                            <Label htmlFor="points-input">{t('bundling.checkout.pointsToUse')}</Label>
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
                                            setPointsError(t('bundling.checkout.pointsExceedBalance'));
                                        } else if (val > maxPointsAllowed) {
                                            setPointsError(t('bundling.checkout.pointsExceedMax', { max: maxPointsAllowed }));
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
                                    {t('bundling.checkout.maxPoints')}
                                </Button>
                            </div>
                            {pointsError && <p className="text-xs text-red-600">{pointsError}</p>}
                            {codeType === 'voucher' && !!discountData?.valid && (
                                <p className="text-xs text-amber-600">{t('bundling.checkout.pointsConflictVoucher')}</p>
                            )}
                        </div>
                    )}
                </div>
            )}

            <Separator />
            {/* Price Breakdown */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('bundling.checkout.normalPrice')}</span>
                    <span className="text-sm font-semibold text-gray-500 line-through dark:text-gray-400">
                        {formatRupiah(bundle.strikethrough_price)}
                    </span>
                </div>

                {bundleDiscount > 0 && (
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{t('bundling.checkout.bundleDiscount')}</span>
                        <span className="text-sm font-semibold text-red-500">-{formatRupiah(bundleDiscount)}</span>
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('bundling.checkout.bundlePrice')}</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatRupiah(bundle.price)}
                    </span>
                </div>

                {codeType === 'voucher' && discountData?.valid && (
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                            {t('bundling.checkout.promoDiscount', { code: discountData.discount_code.code })}
                        </span>
                        <span className="font-semibold text-green-600">
                            -{formatRupiah(discountData.discount_amount)}
                        </span>
                    </div>
                )}

                {/* Points Discount */}
                {pointsChecked && pointsToUse > 0 && !pointsError && (
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{t('bundling.checkout.pointsDiscount')}</span>
                        <span className="font-semibold text-green-600">
                            -{formatRupiah(pointsToUse)}
                        </span>
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('bundling.checkout.transactionFee')}</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatRupiah(transactionFee)}
                    </span>
                </div>

                <Separator className="my-2" />

                <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900 dark:text-white">{t('bundling.checkout.totalPayment')}</span>
                    <span className="text-primary text-2xl font-bold">{formatRupiah(totalPrice)}</span>
                </div>
            </div>

            <Separator />

            {/* Referral Info */}
            {referralInfo.hasActive && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-400">
                        {t('bundling.checkout.referralActiveNotice', { code: referralInfo.code })}
                    </p>
                    <p className="mt-1 text-xs text-blue-600 dark:text-blue-500">
                        {t('bundling.checkout.referralHelpFriend')}
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
                    {t('bundling.checkout.agreeTerms')}{' '}
                    <a
                        href="/terms-and-conditions"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-700 hover:underline"
                    >
                        {t('bundling.checkout.termsAndConditions')}
                    </a>
                </Label>
            </div>

            {/* Submit Button */}
            <Button className="w-full" type="submit" disabled={!termsAccepted || loading}>
                {loading ? t('bundling.checkout.processing') : t('bundling.checkout.btnPayNow')}
            </Button>
        </>
    );

    if (isLoggedIn && !isProfileComplete) {
        return (
            <UserLayout>
                <Head title={t('bundling.checkout.headTitle')} />
                <section className="to-primary w-full bg-gradient-to-tl from-black px-4">
                    <div className="mx-auto my-12 w-full max-w-7xl px-4">
                        <h2 className="mx-auto mb-4 max-w-3xl bg-gradient-to-r from-[#71D0F7] via-white to-[#E6834A] bg-clip-text text-center text-3xl font-bold text-transparent italic sm:text-4xl">
                            {t('bundling.checkout.pageTitle', { title: bundle.title })}
                        </h2>
                        <p className="text-center text-gray-400">{t('bundling.checkout.subtitle')}</p>
                    </div>
                </section>
                <section className="mx-auto my-4 w-full max-w-7xl px-4">
                    <div className="flex h-full flex-col items-center justify-center space-y-4 rounded-lg border p-6 text-center">
                        <User size={64} className="text-orange-500" />
                        <h2 className="text-xl font-bold">{t('bundling.checkout.incompleteProfileTitle')}</h2>
                        <p className="text-sm text-gray-500">
                            {t('bundling.checkout.incompleteProfileDesc')}
                        </p>
                        <Button asChild className="w-full max-w-md">
                            <Link href={route('profile.edit', { redirect: window.location.href })}>{t('bundling.checkout.btnCompleteProfile')}</Link>
                        </Button>
                    </div>
                </section>
            </UserLayout>
        );
    }

    return (
        <UserLayout>
            <Head title={t('bundling.checkout.headTitle')} />
            <section className="to-primary w-full bg-gradient-to-tl from-black px-4">
                <div className="mx-auto my-12 w-full max-w-7xl px-4">
                    <h2 className="mx-auto mb-4 max-w-3xl bg-gradient-to-r from-[#71D0F7] via-white to-[#E6834A] bg-clip-text text-center text-3xl font-bold text-transparent italic sm:text-4xl">
                        {t('bundling.checkout.pageTitle', { title: bundle.title })}
                    </h2>
                    <p className="text-center text-gray-400">
                        {t('bundling.checkout.subtitle')}
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
                                        {t('bundling.detail.hero.badge')}
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
                                    {t('bundling.checkout.includedPrograms', { count: bundle.bundle_items_count })}
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
                                                        ? t('bundling.detail.items.courseBadge')
                                                        : item.bundleable_type.includes('Bootcamp')
                                                          ? t('bundling.detail.items.bootcampBadge')
                                                          : t('bundling.detail.items.webinarBadge')}
                                                </p>
                                            </div>
                                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                                {item.price === 0 ? t('bundling.dashboard.catalog.free') : formatRupiah(item.price)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Separator className="my-6" />

                            <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                                <h4 className="mb-2 flex items-center gap-2 font-semibold text-green-800 dark:text-green-400">
                                    <BadgeCheck size={18} />
                                    {t('bundling.checkout.packageBenefits')}
                                </h4>
                                <ul className="space-y-2">
                                    <li className="flex items-start gap-2 text-sm text-green-700 dark:text-green-300">
                                        <Check size={16} className="mt-0.5 flex-shrink-0" />
                                        <span>
                                            {t('bundling.detail.register.benefitSave', {
                                                percent: Math.round(((bundle.strikethrough_price - bundle.price) / bundle.strikethrough_price) * 100),
                                            })}
                                        </span>
                                    </li>
                                    <li className="flex items-start gap-2 text-sm text-green-700 dark:text-green-300">
                                        <Check size={16} className="mt-0.5 flex-shrink-0" />
                                        <span>{t('bundling.detail.register.benefitAccess', { count: bundle.bundle_items_count })}</span>
                                    </li>
                                    <li className="flex items-start gap-2 text-sm text-green-700 dark:text-green-300">
                                        <Check size={16} className="mt-0.5 flex-shrink-0" />
                                        <span>{t('bundling.detail.register.benefitCertificate')}</span>
                                    </li>
                                    <li className="flex items-start gap-2 text-sm text-green-700 dark:text-green-300">
                                        <Check size={16} className="mt-0.5 flex-shrink-0" />
                                        <span>{t('bundling.checkout.lifetimeAccess')}</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Payment */}
                    <div className="lg:col-span-1">
                        {hasAccess && (!activeInstallment || activeInstallment.is_fully_paid) ? (
                            <div className="flex h-full flex-col items-center justify-center space-y-4 rounded-lg border p-6 text-center">
                                <BadgeCheck size={64} className="text-green-500" />
                                <h2 className="text-xl font-bold">{t('bundling.checkout.alreadyHaveAccessTitle')}</h2>
                                <p className="text-sm text-gray-500">{t('bundling.checkout.alreadyHaveAccessDesc')}</p>
                                <Button asChild className="w-full">
                                    <Link href={route('profile.index')}>{t('bundling.checkout.btnGoToProfile')}</Link>
                                </Button>
                            </div>
                        ) : (pendingInvoice || pendingInvoiceUrl) && !activeInstallment ? (
                            <div className="rounded-2xl border bg-white p-6 shadow-xl dark:bg-gray-800">
                                <div className="flex items-center gap-2 mb-2 text-yellow-600 dark:text-yellow-400">
                                    <Hourglass className="h-5 w-5" />
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                        {t('bundling.checkout.pendingInvoiceTitle')}
                                    </h3>
                                </div>
                                <p className="text-sm text-gray-500">
                                    {pendingInvoice?.invoice_code ? (
                                        <>
                                            {t('bundling.checkout.pendingInvoiceCode', { code: '' })}
                                            <span className="font-semibold text-gray-800 dark:text-gray-200">{pendingInvoice.invoice_code}</span>
                                        </>
                                    ) : (
                                        t('bundling.checkout.pendingInvoiceGeneric')
                                    )}
                                </p>
                                {pendingInvoice?.amount !== undefined && (
                                    <p className="text-2xl font-bold text-orange-600 my-3">
                                        {formatRupiah(pendingInvoice.amount)}
                                    </p>
                                )}
                                <div className="space-y-2 pt-2">
                                    {(pendingInvoice?.invoice_url || pendingInvoiceUrl) && (
                                        <Button asChild className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold" size="lg">
                                            <a href={pendingInvoice?.invoice_url || pendingInvoiceUrl!}>
                                                {t('bundling.checkout.btnContinuePayment')}
                                            </a>
                                        </Button>
                                    )}
                                    <div className="flex gap-2">
                                        <Button onClick={() => window.location.reload()} variant="outline" className="flex-1" size="lg">
                                            {t('bundling.checkout.btnCheckStatus')}
                                        </Button>
                                        {pendingInvoice?.id && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="flex-1 text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
                                                size="lg"
                                                disabled={cancellingInvoice}
                                                onClick={async () => {
                                                    if (confirm(t('bundling.checkout.confirmCancel'))) {
                                                        setCancellingInvoice(true);
                                                        try {
                                                            await axios.post(route('invoice.cancel', pendingInvoice.id));
                                                            toast.success(t('bundling.checkout.cancelSuccess'));
                                                            window.location.reload();
                                                        } catch (err: any) {
                                                            toast.error(err.response?.data?.message || t('bundling.checkout.cancelFailed'));
                                                            setCancellingInvoice(false);
                                                        }
                                                    }
                                                }}
                                            >
                                                {cancellingInvoice ? t('bundling.checkout.cancelling') : t('bundling.checkout.btnCancelOrder')}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleCheckout}>
                                <h2 className="mb-4 text-xl font-bold italic">{t('bundling.checkout.paymentDetailTitle')}</h2>
                                <div className="space-y-4 rounded-lg border p-4">
                                    {!isLoggedIn && (
                                        <div className="space-y-3 rounded-lg border p-4">
                                            <h3 className="text-lg font-semibold">{t('bundling.checkout.personalDataTitle')}</h3>
                                            <div className="space-y-2">
                                                <Label htmlFor="guest-email">{t('bundling.checkout.emailLabel')}</Label>
                                                <Input
                                                    id="guest-email"
                                                    type="email"
                                                    placeholder="email@example.com"
                                                    value={guestFormData.email}
                                                    onChange={(e) => updateGuestForm('email', e.target.value)}
                                                    required
                                                />
                                                {checkingEmail && <p className="text-xs text-gray-500">{t('bundling.checkout.checkingEmail')}</p>}
                                                {emailExists && (
                                                    <p className="text-xs text-green-600">{t('bundling.checkout.emailFound')}</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="guest-name">{t('bundling.checkout.nameLabel')}</Label>
                                                <Input
                                                    id="guest-name"
                                                    type="text"
                                                    placeholder={t('bundling.checkout.namePlaceholder')}
                                                    value={guestFormData.name}
                                                    onChange={(e) => updateGuestForm('name', e.target.value)}
                                                    disabled={emailExists}
                                                    required
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="guest-phone">{t('bundling.checkout.phoneLabel')}</Label>
                                                <Input
                                                    id="guest-phone"
                                                    type="tel"
                                                    placeholder={t('bundling.checkout.phonePlaceholder')}
                                                    value={guestFormData.phone_number}
                                                    onChange={(e) => updateGuestForm('phone_number', e.target.value)}
                                                    disabled={emailExists}
                                                    required
                                                />
                                                {!emailExists && (
                                                    <p className="text-xs text-gray-500">{t('bundling.checkout.phoneNotice')}</p>
                                                )}
                                                {emailExists && (
                                                    <p className="text-xs text-blue-600">
                                                        {t('bundling.checkout.accountLockedNotice')}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="guest-instance">{t('bundling.checkout.instanceLabel')}</Label>
                                                <Input
                                                    id="guest-instance"
                                                    type="text"
                                                    placeholder={t('bundling.checkout.instancePlaceholder')}
                                                    value={guestFormData.instance}
                                                    onChange={(e) => updateGuestForm('instance', e.target.value)}
                                                    disabled={loading}
                                                    required
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="guest-city">{t('bundling.checkout.cityLabel')}</Label>
                                                <Input
                                                    id="guest-city"
                                                    type="text"
                                                    placeholder={t('bundling.checkout.cityPlaceholder')}
                                                    value={guestFormData.city}
                                                    onChange={(e) => updateGuestForm('city', e.target.value)}
                                                    disabled={loading}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {((installmentTerms && installmentTerms.length > 0) || (activeInstallment && !activeInstallment.is_fully_paid)) ? (
                                        <Tabs
                                            value={paymentTab}
                                            onValueChange={(val) => {
                                                if (val === 'full' && activeInstallment && !activeInstallment.is_fully_paid) {
                                                    toast.error(t('bundling.checkout.activeInstallmentAlert'));
                                                    return;
                                                }
                                                if (val === 'installment' && isAnyTermOverdue && !activeInstallment) {
                                                    toast.error(t('installmentOptions.errors.installmentExpired'));
                                                    return;
                                                }
                                                setPaymentTab(val as 'full' | 'installment');
                                            }}
                                            className="w-full"
                                        >
                                            <TabsList className="grid w-full grid-cols-2 mb-4">
                                                <TabsTrigger
                                                    value="full"
                                                    disabled={!!activeInstallment && !activeInstallment.is_fully_paid}
                                                >
                                                    {t('bundling.checkout.tabFullPayment')}
                                                </TabsTrigger>
                                                <TabsTrigger
                                                    value="installment"
                                                    disabled={isAnyTermOverdue && !activeInstallment}
                                                    className="flex items-center gap-1.5"
                                                >
                                                    <span>{t('bundling.checkout.tabInstallment')}</span>
                                                    <Badge
                                                        variant={isAnyTermOverdue && !activeInstallment ? 'destructive' : 'secondary'}
                                                        className={`px-1.5 py-0 text-[10px] ${
                                                            isAnyTermOverdue && !activeInstallment
                                                                ? 'bg-destructive/10 text-destructive border-destructive/20'
                                                                : 'bg-primary/10 text-primary'
                                                        }`}
                                                    >
                                                        {isAnyTermOverdue && !activeInstallment
                                                            ? t('installmentOptions.closedBadge')
                                                            : t('bundling.checkout.installmentBadge', {
                                                                  count: activeInstallment && !activeInstallment.is_fully_paid
                                                                      ? (activeInstallment.total_terms || activeInstallment.terms?.length)
                                                                      : installmentTerms.length,
                                                              })}
                                                    </Badge>
                                                </TabsTrigger>
                                            </TabsList>

                                            {/* Tab Bayar Penuh */}
                                            <TabsContent value="full" className="space-y-4 m-0">
                                                {renderPaymentContent()}
                                            </TabsContent>

                                            {/* Tab Cicilan */}
                                            <TabsContent value="installment" className="space-y-4 m-0">
                                                <InstallmentOptions
                                                    productType="bundle"
                                                    productId={bundle.id}
                                                    productPrice={bundle.price}
                                                    terms={installmentTerms}
                                                    activeInstallment={activeInstallment}
                                                    termsAccepted={termsAccepted}
                                                    onTermsAcceptedChange={setTermsAccepted}
                                                    onBeforePay={async () => {
                                                        if (!activeInstallment && !termsAccepted) {
                                                            toast.error(t('bundling.checkout.errors.termsRequired'));
                                                            return false;
                                                        }
                                                        return await ensureAuth();
                                                    }}
                                                />
                                            </TabsContent>
                                        </Tabs>
                                    ) : (
                                        renderPaymentContent()
                                    )}
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </section>
        </UserLayout>
    );
}
