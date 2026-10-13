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
import { formatExternalUrl, parseHtmlList } from '@/lib/utils';
import UserLayout from '@/layouts/user-layout';
import { SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { BadgeCheck, Check, Hourglass, User, X } from 'lucide-react';
import { parseISO } from 'date-fns';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface Webinar {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    strikethrough_price: number;
    price: number;
    thumbnail?: string | null;
    description?: string | null;
    benefits?: string | null;
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

function parseList(items?: string | null): string[] {
    return parseHtmlList(items);
}

function getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message) return error.message;
    return fallback;
}

export default function RegisterWebinar({
    webinar,
    hasAccess,
    activeInstallment: initialActiveInstallment = null,
    pendingInvoice,
    pendingInvoiceUrl,
    referralInfo,
    installmentTerms = [],
}: {
    webinar: Webinar;
    hasAccess: boolean;
    activeInstallment?: ActiveInstallmentData | null;
    pendingInvoice?: PendingInvoice | null;
    pendingInvoiceUrl?: string | null;
    referralInfo: ReferralInfo;
    installmentTerms?: InstallmentTermOption[];
}) {
    const { t, i18n } = useTranslation('user');
    const dateLocale = i18n.language === 'en' ? 'en-US' : 'id-ID';
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

    const benefitList = parseList(webinar.benefits);
    const isFree = webinar.price === 0;

    const transactionFee = 5000;
    const basePrice = webinar.price;
    const discountAmount = discountData?.valid ? discountData.discount_amount : 0;
    const maxPointsAllowed = basePrice - discountAmount;

    const finalWebinarPrice = basePrice - discountAmount - (pointsChecked ? pointsToUse : 0);
    const totalPrice = isFree ? 0 : finalWebinarPrice + transactionFee;

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
                amount: webinar.price,
                product_type: 'webinar',
                product_id: webinar.id,
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
                setPromoError(data.message || t('webinar.register.errors.invalidPromo'));
            }
        } catch (error: unknown) {
            setDiscountData(null);
            if (axios.isAxiosError(error)) {
                setPromoError(error.response?.data?.message || t('webinar.register.errors.promoValidateError'));
            } else {
                setPromoError(t('webinar.register.errors.promoValidateError'));
            }
        } finally {
            setPromoLoading(false);
        }
    }, [webinar.id, webinar.price, emailExists, guestFormData.email, isFree, isLoggedIn, promoCode, t]);

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
                setReferralError(data.message || t('webinar.register.errors.invalidReferral'));
            }
        } catch (error: unknown) {
            setReferralData(null);
            if (axios.isAxiosError(error)) {
                setReferralError(error.response?.data?.message || t('webinar.register.errors.referralValidateError'));
            } else {
                setReferralError(t('webinar.register.errors.referralValidateError'));
            }
        } finally {
            setReferralLoading(false);
        }
    }, [promoCode, isFree, isLoggedIn, guestFormData.email, t]);

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
                const response = await axios.post('/api/check-email', {
                    email,
                    type: 'webinar',
                    id: webinar.id,
                    webinar_id: webinar.id,
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
                    setActiveInstallment(null);
                    setUserPoints(0);
                    setPointsChecked(false);
                    setPointsToUse(0);
                }
            } catch {
                setEmailExists(false);
                setActiveInstallment(null);
                setUserPoints(0);
                setPointsChecked(false);
                setPointsToUse(0);
            } finally {
                setCheckingEmail(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [guestFormData.email, isLoggedIn, webinar.id]);

    const ensureAuthenticated = async (): Promise<boolean> => {
        if (isLoggedIn) return true;

        if (!guestFormData.email || !guestFormData.phone_number) {
            toast.error(t('webinar.register.errors.emailPhoneRequired'));
            return false;
        }

        if (!guestFormData.instance) {
            toast.error(t('webinar.register.errors.instanceRequired'));
            return false;
        }

        if (!guestFormData.city) {
            toast.error(t('webinar.register.errors.cityRequired'));
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
                    throw new Error(loginData.message || t('webinar.register.errors.autoLoginFailed'));
                }
            } else {
                if (!guestFormData.name) {
                    toast.error(t('webinar.register.errors.nameRequired'));
                    setLoading(false);
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

                if (regResponse.data && regResponse.data.success === false) {
                    throw new Error(regResponse.data.message || t('webinar.register.errors.registerFailed'));
                }
            }

            return true;
        } catch (error: unknown) {
            setLoading(false);
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || getErrorMessage(error, t('webinar.register.errors.processLoginFailed')));
            } else {
                toast.error(getErrorMessage(error, t('webinar.register.errors.processLoginFailed')));
            }
            return false;
        }
    };

    const submitPayment = useCallback(
        async (
            activeDiscountData: DiscountData | null,
        ): Promise<void> => {
            const originalDiscountAmount = webinar.strikethrough_price > 0 ? webinar.strikethrough_price - webinar.price : 0;
            const promoDiscountAmount = activeDiscountData?.valid ? activeDiscountData.discount_amount : 0;
            const activeFinalPrice = basePrice - promoDiscountAmount;
            
            const pointsDeduction = pointsChecked ? pointsToUse : 0;
            const finalNettAmount = activeFinalPrice - pointsDeduction;
            const activeTotalPrice = isFree ? 0 : finalNettAmount + transactionFee;

            const invoiceData: Record<string, string | number> = {
                type: 'webinar',
                id: webinar.id,
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

            if (codeType === 'referral' && referralData?.valid) {
                invoiceData.referral_code = promoCode;
            }
            invoiceData.affiliate_code = sessionStorage.getItem('affiliate_code') || new URLSearchParams(window.location.search).get('ref') || referralInfo?.code || '';

            try {
                const response = await axios.post(route('invoice.store'), invoiceData);
                const data = response.data;

                if (data.success && data.payment_url) {
                    sessionStorage.removeItem('pendingCheckout');
                    window.location.href = data.payment_url;
                } else {
                    throw new Error(data.message || t('webinar.register.errors.createInvoiceFailed'));
                }
            } catch (error) {
                console.error('Payment error:', error);
                throw error;
            }
        },
        [basePrice, webinar.id, webinar.price, webinar.strikethrough_price, isFree, transactionFee, pointsChecked, pointsToUse, codeType, referralData, promoCode, referralInfo, t],
    );

    const handleFreeCheckout = (e: React.FormEvent) => {
        e.preventDefault();

        if (!freeFormData.requirement_1_proof || !freeFormData.requirement_2_proof || !freeFormData.requirement_3_proof) {
            toast.error(t('webinar.register.errors.uploadAllProof'));
            return;
        }

        setLoading(true);

        const formData = new FormData();
        formData.append('type', 'webinar');
        formData.append('id', webinar.id);
        formData.append('requirement_1_proof', freeFormData.requirement_1_proof);
        formData.append('requirement_2_proof', freeFormData.requirement_2_proof);
        formData.append('requirement_3_proof', freeFormData.requirement_3_proof);

        router.post(route('enroll.free'), formData, {
            onError: (errors) => {
                console.log('Free enrollment errors:', errors);
                toast.error(errors.message || t('webinar.register.errors.enrollFreeFailed'));
            },
            onFinish: () => {
                setLoading(false);
            },
        });
    };

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();

        if (activeInstallment && !activeInstallment.is_fully_paid) {
            toast.error(t('webinar.register.activeInstallmentAlert'));
            setPaymentTab('installment');
            return;
        }

        if (!termsAccepted && !isFree) {
            toast.error(t('webinar.register.errors.termsRequired'));
            return;
        }

        setLoading(true);

        const authenticated = await ensureAuthenticated();
        if (!authenticated) {
            setLoading(false);
            return;
        }

        if (isFree) {
            setShowFreeForm(true);
            setLoading(false);
            return;
        }

        try {
            await submitPayment(discountData);
        } catch (error: unknown) {
            const message = axios.isAxiosError(error)
                ? error.response?.data?.message || t('webinar.register.errors.paymentFailed')
                : error instanceof Error
                  ? error.message
                  : t('webinar.register.errors.paymentFailed');
            toast.error(message);
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

            toast.error(t('webinar.register.errors.fileTooLarge'));
            return;
        }

        // Validasi tipe file (hanya image)
        if (!file.type.startsWith('image/')) {
            setFileErrors((prev) => ({ ...prev, [fieldName]: true }));

            const input = document.querySelector(`input[data-field="${fieldName}"]`) as HTMLInputElement;
            if (input) {
                input.value = '';
            }

            toast.error(t('webinar.register.errors.fileMustBeImage'));
            return;
        }

        // File valid
        setFreeFormData((prev) => ({ ...prev, [fieldName]: file }));
        setFileErrors((prev) => ({ ...prev, [fieldName]: false }));

        toast.success(t('webinar.register.errors.fileUploaded'));
    };

    if (isLoggedIn && !isProfileComplete) {
        return (
            <UserLayout>
                <Head title={t('webinar.register.headTitle')} />
                <section className="to-primary w-full bg-gradient-to-tl from-black px-4">
                    <div className="mx-auto my-12 w-full max-w-7xl px-4">
                        <h2 className="mx-auto mb-4 max-w-3xl bg-gradient-to-r from-[#71D0F7] via-white to-[#E6834A] bg-clip-text text-center text-3xl font-bold text-transparent italic sm:text-4xl">
                            {t('webinar.register.pageTitle', { title: webinar.title })}
                        </h2>
                        <p className="text-center text-gray-400">{t('webinar.register.incompleteProfileTitle')}</p>
                    </div>
                </section>
                <section className="mx-auto my-4 w-full max-w-7xl px-4">
                    <div className="flex h-full flex-col items-center justify-center space-y-4 rounded-lg border p-6 text-center">
                        <User size={64} className="text-orange-500" />
                        <h2 className="text-xl font-bold">{t('webinar.register.incompleteProfileTitle')}</h2>
                        <p className="text-sm text-gray-500">
                            {t('webinar.register.incompleteProfileDesc')}
                        </p>
                        <Button asChild className="w-full max-w-md">
                            <Link href={route('profile.edit', { redirect: window.location.href })}>{t('webinar.register.btnCompleteProfile')}</Link>
                        </Button>
                    </div>
                </section>
            </UserLayout>
        );
    }

    const renderFullPaymentDetails = () => (
        <>
            {/* Pilihan Jenis Kode */}
            <div className="space-y-2">
                <Label>{t('webinar.register.codeType')}</Label>
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
                        <Label htmlFor="code-voucher" className="cursor-pointer">{t('webinar.register.voucher')}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="referral" id="code-referral" />
                        <Label htmlFor="code-referral" className="cursor-pointer">{t('webinar.register.referral')}</Label>
                    </div>
                </RadioGroup>
            </div>

            {/* Input Kode Tunggal */}
            <div className="space-y-2">
                <Label htmlFor="promo-code">
                    {codeType === 'voucher' ? t('webinar.register.voucherCode') : t('webinar.register.referralCode')}
                </Label>
                <div className="relative">
                    <Input
                        id="promo-code"
                        type="text"
                        placeholder={codeType === 'voucher' ? t('webinar.register.enterVoucherCode') : t('webinar.register.enterReferralCode')}
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
                                {t('webinar.register.voucherSuccess', { code: discountData.discount_code.code })}
                            </p>
                        </div>
                        <p className="mt-1 text-xs text-green-600">
                            {t('webinar.register.voucherDiscount', { name: discountData.discount_code.name, value: discountData.discount_code.formatted_value })}
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
                                {t('webinar.register.referralSuccess')}
                            </p>
                        </div>
                        <p className="mt-1 text-xs text-green-600">
                            {t('webinar.register.referralReferredBy', { name: referralData.referrer?.name })}
                        </p>
                    </div>
                )}
            </div>

            {/* Point Reward/Redeem Section */}
            {(isLoggedIn || emailExists) && userPoints > 0 && (
                <div className="space-y-4 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">{t('webinar.register.useRewardPoints')}</Label>
                            <p className="text-muted-foreground text-xs">
                                {t('webinar.register.pointsBalance', {
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
                            <Label htmlFor="points-input">{t('webinar.register.pointsToUse')}</Label>
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
                                            setPointsError(t('webinar.register.pointsExceedBalance'));
                                        } else if (val > maxPointsAllowed) {
                                            setPointsError(t('webinar.register.pointsExceedMax', { max: maxPointsAllowed }));
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
                                    {t('webinar.register.maxPoints')}
                                </Button>
                            </div>
                            {pointsError && <p className="text-xs text-red-600">{pointsError}</p>}
                            {codeType === 'voucher' && !!discountData?.valid && (
                                <p className="text-xs text-amber-600">{t('webinar.register.pointsConflictVoucher')}</p>
                            )}
                        </div>
                    )}
                </div>
            )}

            <div className="space-y-2 rounded-lg border p-4">
                {webinar.strikethrough_price > 0 && (
                    <>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">{t('webinar.register.originalPrice')}</span>
                            <span className="font-semibold text-gray-500 line-through">
                                Rp {webinar.strikethrough_price.toLocaleString(dateLocale)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">{t('webinar.register.discount')}</span>
                            <span className="font-semibold text-red-500">
                                -Rp {(webinar.strikethrough_price - webinar.price).toLocaleString(dateLocale)}
                            </span>
                        </div>
                        <Separator className="my-2" />
                    </>
                )}
                <div className="flex items-center justify-between">
                    <span className="text-gray-600">{t('webinar.register.webinarPrice')}</span>
                    <span className="font-semibold text-gray-500">Rp {webinar.price.toLocaleString(dateLocale)}</span>
                </div>

                {/* Promo Discount */}
                {codeType === 'voucher' && discountData?.valid && (
                    <div className="flex items-center justify-between">
                        <span className="text-gray-600">{t('webinar.register.promoDiscount', { code: discountData.discount_code.code })}</span>
                        <span className="font-semibold text-green-600">
                            -Rp {discountData.discount_amount.toLocaleString(dateLocale)}
                        </span>
                    </div>
                )}

                {/* Points Discount */}
                {pointsChecked && pointsToUse > 0 && !pointsError && (
                    <div className="flex items-center justify-between">
                        <span className="text-gray-600">{t('webinar.register.pointsDiscount')}</span>
                        <span className="font-semibold text-green-600">
                            -Rp {pointsToUse.toLocaleString(dateLocale)}
                        </span>
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <span className="text-gray-600">{t('webinar.register.transactionFee')}</span>
                    <span className="font-semibold text-gray-500">Rp {transactionFee.toLocaleString(dateLocale)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">{t('webinar.register.totalPayment')}</span>
                    <span className="text-primary text-xl font-bold">Rp {totalPrice.toLocaleString(dateLocale)}</span>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <Checkbox
                    id="terms"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                />
                <Label htmlFor="terms">
                    {t('webinar.register.agreeTerms')}{' '}
                    <a
                        href="/terms-and-conditions"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-700 hover:underline"
                    >
                        {t('webinar.register.termsAndConditions')}
                    </a>
                </Label>
            </div>

            <Button className="w-full" type="submit" disabled={!termsAccepted || loading}>
                {loading ? t('webinar.register.processing') : t('webinar.register.btnPayNow')}
            </Button>
        </>
    );

    return (
        <UserLayout>
            <Head title={t('webinar.register.headTitle')} />
            <section className="to-primary w-full bg-gradient-to-tl from-black px-4">
                <div className="mx-auto my-12 w-full max-w-7xl px-4">
                    <h2 className="mx-auto mb-4 max-w-3xl bg-gradient-to-r from-[#71D0F7] via-white to-[#E6834A] bg-clip-text text-center text-3xl font-bold text-transparent italic sm:text-4xl">
                        {t('webinar.register.pageTitle', { title: webinar.title })}
                    </h2>
                    <p className="text-center text-gray-400">
                        {isFree
                            ? t('webinar.register.freeSubtitle')
                            : t('webinar.register.subtitle')}
                    </p>
                </div>
            </section>
            <section className="mx-auto my-4 w-full max-w-7xl px-4">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
                    <Tabs defaultValue="detail" className="lg:col-span-2">
                        <TabsList>
                            <TabsTrigger value="detail">{t('webinar.register.tabDetail')}</TabsTrigger>
                        </TabsList>
                        <TabsContent value="detail">
                            <div className="h-full rounded-lg border p-4">
                                <h2 className="text-3xl font-bold italic">{t('webinar.register.whatYouWillGet')}</h2>
                                <p className="mt-2 mb-4 text-sm text-gray-600">{t('webinar.register.whatYouWillGetDesc')}</p>
                                <ul className="space-y-2">
                                    {benefitList.map((benefit, idx) => (
                                        <li key={idx} className="flex items-center gap-2">
                                            <BadgeCheck size={18} className="mt-1 min-w-6 text-green-600" />
                                            <p>{benefit}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </TabsContent>
                    </Tabs>

                    {hasAccess && (!activeInstallment || activeInstallment.is_fully_paid) ? (
                        <div className="flex h-full flex-col items-center justify-center space-y-4 rounded-lg border p-6 text-center">
                            <BadgeCheck size={64} className="text-green-500" />
                            <h2 className="text-xl font-bold">{t('webinar.register.alreadyHaveAccessTitle')}</h2>
                            <p className="text-sm text-gray-500">{t('webinar.register.alreadyHaveAccessDesc')}</p>
                            <Button asChild className="w-full">
                                <a href={formatExternalUrl(webinar.group_url)} target="_blank" rel="noopener noreferrer">
                                    {t('webinar.register.btnEnterGroup')}
                                </a>
                            </Button>
                        </div>
                    ) : (pendingInvoice || pendingInvoiceUrl) && !activeInstallment ? (
                        <div className="rounded-2xl border bg-white p-6 shadow-xl dark:bg-gray-800">
                            <div className="flex items-center gap-2 mb-2 text-yellow-600 dark:text-yellow-400">
                                <Hourglass className="h-5 w-5" />
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                    {t('webinar.register.pendingInvoiceTitle')}
                                </h3>
                            </div>
                            <p className="text-sm text-gray-500">
                                {pendingInvoice?.invoice_code ? (
                                    <>
                                        {t('webinar.register.pendingInvoiceCode', { code: '' })}
                                        <span className="font-semibold text-gray-800 dark:text-gray-200">{pendingInvoice.invoice_code}</span>
                                    </>
                                ) : (
                                    t('webinar.register.pendingInvoiceGeneric')
                                )}
                            </p>
                            {pendingInvoice?.amount !== undefined && (
                                <p className="text-2xl font-bold text-orange-600 my-3">
                                    Rp {pendingInvoice.amount.toLocaleString(dateLocale)}
                                </p>
                            )}
                            <div className="space-y-2 pt-2">
                                {(pendingInvoice?.invoice_url || pendingInvoiceUrl) && (
                                    <Button asChild className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold" size="lg">
                                        <a href={pendingInvoice?.invoice_url || pendingInvoiceUrl!}>
                                            {t('webinar.register.btnContinuePayment')}
                                        </a>
                                    </Button>
                                )}
                                <div className="flex gap-2">
                                    <Button onClick={() => window.location.reload()} variant="outline" className="flex-1" size="lg">
                                        {t('webinar.register.btnCheckStatus')}
                                    </Button>
                                    {pendingInvoice?.id && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="flex-1 text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
                                            size="lg"
                                            disabled={cancellingInvoice}
                                            onClick={async () => {
                                                if (confirm(t('webinar.register.confirmCancel'))) {
                                                    setCancellingInvoice(true);
                                                    try {
                                                        const res = await axios.post(route('invoice.cancel', pendingInvoice.id));
                                                        if (res.data?.success) {
                                                            toast.success(t('webinar.register.cancelSuccess'));
                                                            window.location.reload();
                                                        } else {
                                                            toast.error(res.data?.message || t('webinar.register.cancelFailed'));
                                                            setCancellingInvoice(false);
                                                        }
                                                    } catch (err: unknown) {
                                                        if (axios.isAxiosError(err)) {
                                                            toast.error(err.response?.data?.message || t('webinar.register.cancelFailed'));
                                                        } else {
                                                            toast.error(t('webinar.register.cancelFailed'));
                                                        }
                                                        setCancellingInvoice(false);
                                                    }
                                                }
                                            }}
                                        >
                                            {cancellingInvoice ? t('webinar.register.cancelling') : t('webinar.register.btnCancelOrder')}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : !showFreeForm ? (
                        <form onSubmit={handleCheckout}>
                            <h2 className="my-2 text-xl font-bold italic">
                                {isFree ? t('webinar.register.registrationDetailTitle') : t('webinar.register.paymentDetailTitle')}
                            </h2>
                            <div className="space-y-4 rounded-lg border p-4">
                                {!isLoggedIn && (
                                    <div className="space-y-3 rounded-lg border p-4">
                                        <h3 className="text-lg font-semibold">{t('webinar.register.personalDataTitle')}</h3>
                                        <div className="space-y-2">
                                            <Label htmlFor="guest-email">{t('webinar.register.emailLabel')}</Label>
                                            <Input
                                                id="guest-email"
                                                type="email"
                                                placeholder="email@example.com"
                                                value={guestFormData.email}
                                                onChange={(e) => updateGuestForm('email', e.target.value)}
                                                required
                                            />
                                            {checkingEmail && <p className="text-xs text-gray-500">{t('webinar.register.checkingEmail')}</p>}
                                            {emailExists && <p className="text-xs text-green-600">{t('webinar.register.emailFound')}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="guest-name">{t('webinar.register.nameLabel')}</Label>
                                            <Input
                                                id="guest-name"
                                                type="text"
                                                placeholder={t('webinar.register.namePlaceholder')}
                                                value={guestFormData.name}
                                                onChange={(e) => updateGuestForm('name', e.target.value)}
                                                disabled={emailExists}
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="guest-phone">{t('webinar.register.phoneLabel')}</Label>
                                            <Input
                                                id="guest-phone"
                                                type="tel"
                                                placeholder={t('webinar.register.phonePlaceholder')}
                                                value={guestFormData.phone_number}
                                                onChange={(e) => updateGuestForm('phone_number', e.target.value)}
                                                disabled={emailExists}
                                                required
                                            />
                                            {!emailExists && (
                                                <p className="text-xs text-gray-500">{t('webinar.register.phoneNotice')}</p>
                                            )}
                                            {emailExists && (
                                                <p className="text-xs text-blue-600">
                                                    {t('webinar.register.accountLockedNotice')}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="guest-instance">{t('webinar.register.instanceLabel')}</Label>
                                            <Input
                                                id="guest-instance"
                                                type="text"
                                                placeholder={t('webinar.register.instancePlaceholder')}
                                                value={guestFormData.instance}
                                                onChange={(e) => updateGuestForm('instance', e.target.value)}
                                                disabled={loading}
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="guest-city">{t('webinar.register.cityLabel')}</Label>
                                            <Input
                                                id="guest-city"
                                                type="text"
                                                placeholder={t('webinar.register.cityPlaceholder')}
                                                value={guestFormData.city}
                                                onChange={(e) => updateGuestForm('city', e.target.value)}
                                                disabled={loading}
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                                {isFree ? (
                                    <div className="space-y-4">
                                        <div className="space-y-2 text-center">
                                            <div className="flex items-center justify-between p-4">
                                                <span className="w-full text-2xl font-bold text-green-600">{t('webinar.register.freeBadge')}</span>
                                            </div>
                                            <p className="text-sm text-gray-600">{t('webinar.register.freeInstruction')}</p>
                                            <ul className="space-y-1 text-left text-sm">
                                                {webinar.requirement_1 && <li>• {webinar.requirement_1}</li>}
                                                {webinar.requirement_2 && <li>• {webinar.requirement_2}</li>}
                                                {webinar.requirement_3 && <li>• {webinar.requirement_3}</li>}
                                            </ul>
                                            <p className="text-xs text-gray-500">{t('webinar.register.uploadProofNotice')}</p>
                                        </div>

                                        <Button className="w-full" type="submit" disabled={loading}>
                                            {loading ? t('webinar.register.processing') : t('webinar.register.btnUploadProof')}
                                        </Button>
                                    </div>
                                ) : ((installmentTerms && installmentTerms.length > 0) || (activeInstallment && !activeInstallment.is_fully_paid)) ? (
                                    <Tabs
                                        value={paymentTab}
                                        onValueChange={(val) => {
                                            if (val === 'full' && activeInstallment && !activeInstallment.is_fully_paid) {
                                                toast.error(t('webinar.register.activeInstallmentAlert'));
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
                                        <TabsList className="grid w-full grid-cols-2 mb-3">
                                            <TabsTrigger
                                                value="full"
                                                disabled={!!activeInstallment && !activeInstallment.is_fully_paid}
                                            >
                                                {t('webinar.register.tabFullPayment')}
                                            </TabsTrigger>
                                            <TabsTrigger
                                                value="installment"
                                                disabled={isAnyTermOverdue && !activeInstallment}
                                                className="flex items-center gap-1.5"
                                            >
                                                <span>{t('webinar.register.tabInstallment')}</span>
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
                                                        : t('webinar.register.installmentBadge', {
                                                              count: activeInstallment && !activeInstallment.is_fully_paid
                                                                  ? (activeInstallment.total_terms || activeInstallment.terms?.length)
                                                                  : installmentTerms.length,
                                                          })}
                                                </Badge>
                                            </TabsTrigger>
                                        </TabsList>

                                        {/* Tab Bayar Penuh */}
                                        <TabsContent value="full" className="space-y-4 m-0">
                                            {renderFullPaymentDetails()}
                                        </TabsContent>

                                        {/* Tab Cicilan */}
                                        <TabsContent value="installment" className="space-y-4 m-0">
                                            <InstallmentOptions
                                                productType="webinar"
                                                productId={webinar.id}
                                                productPrice={webinar.price}
                                                terms={installmentTerms}
                                                activeInstallment={activeInstallment}
                                                termsAccepted={termsAccepted}
                                                onTermsAcceptedChange={setTermsAccepted}
                                                onBeforePay={async () => {
                                                    if (!activeInstallment && !termsAccepted) {
                                                        toast.error(t('webinar.register.errors.termsRequired'));
                                                        return false;
                                                    }
                                                    if (!isLoggedIn && (!guestFormData.email || !guestFormData.phone_number || !guestFormData.instance || !guestFormData.city || (!emailExists && !guestFormData.name))) {
                                                        toast.error(t('webinar.register.errors.completePersonalData'));
                                                        return false;
                                                    }
                                                    return await ensureAuthenticated();
                                                }}
                                            />
                                        </TabsContent>
                                    </Tabs>
                                ) : (
                                    renderFullPaymentDetails()
                                )}
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleFreeCheckout}>
                            <h2 className="my-2 text-xl font-bold italic">{t('webinar.register.uploadProofTitle')}</h2>
                            <div className="space-y-4 rounded-lg border p-4">
                                {[1, 2, 3].map((index) => {
                                    const requirementKey = `requirement_${index}` as keyof Webinar;
                                    const proofKey = `requirement_${index}_proof` as const;
                                    const requirementText = (webinar[requirementKey] as string | null | undefined) || `Persyaratan ${index}`;

                                    return (
                                        <div key={index}>
                                            <Label htmlFor={proofKey}>{t('webinar.register.proofFor', { requirement: requirementText })}</Label>
                                            <Input
                                                id={proofKey}
                                                data-field={proofKey}
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleFileChange(proofKey, e.target.files?.[0] || null)}
                                                className={fileErrors[proofKey] ? 'border-red-500' : ''}
                                                required
                                            />
                                            <p className="mt-1 text-xs text-gray-500">
                                                {t('webinar.register.proofScreenshotNotice', { requirement: requirementText })}
                                            </p>
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
                                        {t('webinar.register.btnBack')}
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
                                        {loading ? t('webinar.register.processing') : t('webinar.register.btnGetFreeAccess')}
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
