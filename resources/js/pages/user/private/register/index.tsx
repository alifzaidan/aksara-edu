import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import InstallmentOptions, { ActiveInstallmentData, InstallmentTermOption } from '@/components/installment-options';
import UserLayout from '@/layouts/user-layout';
import { SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import axios from 'axios';
import { BadgeCheck, Hourglass, User } from 'lucide-react';
import { parseISO } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface PrivateClass {
    id: string;
    title: string;
    slug: string;
    price: number;
    strikethrough_price?: number;
    mode: 'online' | 'offline';
    location?: string | null;
    description?: string | null;
    benefits?: string | null;
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

interface PrivateScheduleOption {
    id: string;
    start_time: string;
    end_time: string;
    registration_deadline?: string | null;
    max_participants: number;
    occupied_participants: number;
    is_full: boolean;
    has_access: boolean;
    pending_invoice?: PendingInvoice | null;
    pending_invoice_url?: string | null;
    is_registration_closed: boolean;
}

interface ReferralInfo {
    code?: string;
    hasActive: boolean;
}

interface Props {
    privateClass: PrivateClass;
    scheduleOptions: PrivateScheduleOption[];
    referralInfo: ReferralInfo;
    installmentTerms?: Array<{ term_number: number; amount: number; due_date: string }>;
    activeInstallment?: ActiveInstallmentData | null;
}

interface GuestFormData {
    name: string;
    email: string;
    phone_number: string;
    instance: string;
    city: string;
}

function parseList(items?: string | null): string[] {
    if (!items) return [];
    const matches = items.match(/<li>(.*?)<\/li>/g);
    if (!matches) return [];
    return matches.map((li) => li.replace(/<\/?li>/g, '').trim());
}

export default function PrivateRegister({
    privateClass,
    scheduleOptions,
    referralInfo,
    installmentTerms = [],
    activeInstallment: initialActiveInstallment = null,
}: Props) {
    const { t, i18n } = useTranslation('user');
    const dateLocale = i18n.language === 'en' ? 'en-US' : 'id-ID';

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat(dateLocale, {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(val);

    const { auth } = usePage<SharedData>().props;
    const isLoggedIn = !!auth.user;
    const isProfileComplete = isLoggedIn && auth.user?.phone_number && auth.user?.instance && auth.user?.city;
    const isFree = privateClass.price === 0;
    const benefitList = parseList(privateClass.benefits);

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
    const [selectedScheduleId, setSelectedScheduleId] = useState<string>(scheduleOptions[0]?.id || '');

    const [checkingEmail, setCheckingEmail] = useState(false);
    const [emailExists, setEmailExists] = useState(false);
    const [guestFormData, setGuestFormData] = useState<GuestFormData>({
        name: '',
        email: '',
        phone_number: '',
        instance: '',
        city: '',
    });

    const selectedSchedule = useMemo(
        () => scheduleOptions.find((schedule) => schedule.id === selectedScheduleId) || null,
        [scheduleOptions, selectedScheduleId],
    );

    const updateGuestForm = (field: keyof GuestFormData, value: string) => {
        setGuestFormData((prev) => ({ ...prev, [field]: value }));
    };

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const refFromUrl = urlParams.get('ref');

        if (refFromUrl) {
            sessionStorage.setItem('affiliate_code', refFromUrl);
        } else if (referralInfo?.code) {
            sessionStorage.setItem('affiliate_code', referralInfo.code);
        }
    }, [referralInfo]);

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
                    type: 'private',
                    id: privateClass.id,
                    private_class_schedule_id: privateClass.id,
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

                    if (data.active_installment) {
                        setActiveInstallment(data.active_installment);
                        setPaymentTab('installment');
                    } else {
                        setActiveInstallment(null);
                    }
                } else {
                    setEmailExists(false);
                    setActiveInstallment(null);
                }
            } catch {
                setEmailExists(false);
                setActiveInstallment(null);
            } finally {
                setCheckingEmail(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [guestFormData.email, isLoggedIn]);

    const savePendingCheckout = () => {
        sessionStorage.setItem(
            'pendingPrivateCheckout',
            JSON.stringify({
                privateClassId: privateClass.id,
                scheduleId: selectedScheduleId,
                timestamp: Date.now(),
                termsAccepted,
            }),
        );
    };

    const ensureAuth = async (): Promise<boolean> => {
        if (isLoggedIn) return true;

        if (!guestFormData.email || !guestFormData.phone_number || !guestFormData.instance || !guestFormData.city) {
            toast.error(t('privateClass.register.errors.completePersonalData'));
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
                    throw new Error(loginResponse.data?.message || t('privateClass.register.errors.autoLoginFailed'));
                }
            } else {
                if (!guestFormData.name) {
                    toast.error(t('privateClass.register.errors.nameRequired'));
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
                    throw new Error(t('privateClass.register.errors.registerFailed'));
                }
            }
            return true;
        } catch (error: any) {
            console.error('Login/Register error:', error);
            toast.error(error.response?.data?.message || error.message || t('privateClass.register.errors.checkoutError'));
            return false;
        }
    };

    const submitPayment = async (scheduleId: string) => {
        try {
            if (privateClass.price === 0) {
                const form = document.createElement('form');
                form.method = 'POST';
                form.action = route('enroll.free');

                const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content;

                const fields: Record<string, string> = {
                    _token: csrfToken || '',
                    type: 'private',
                    id: privateClass.id,
                    private_class_schedule_id: scheduleId,
                };

                Object.entries(fields).forEach(([key, value]) => {
                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = key;
                    input.value = value;
                    form.appendChild(input);
                });

                document.body.appendChild(form);
                form.submit();
                return;
            }

            const invoiceData: Record<string, any> = {
                type: 'private',
                id: privateClass.id,
                private_class_schedule_id: scheduleId,
                discount_amount: 0,
                nett_amount: privateClass.price,
                transaction_fee: transactionFee,
                total_amount: totalPrice,
                discount_code_id: null,
                discount_code_amount: 0,
            };

            const affiliateCode = sessionStorage.getItem('affiliate_code') || new URLSearchParams(window.location.search).get('ref') || referralInfo?.code;
            if (affiliateCode) {
                invoiceData.affiliate_code = affiliateCode;
            }

            const response = await axios.post(route('invoice.store'), invoiceData);

            if (response.data?.success && response.data?.payment_url) {
                sessionStorage.removeItem('pendingPrivateCheckout');
                window.location.href = response.data.payment_url;
                return;
            }

            toast.error(response.data?.message || t('privateClass.register.errors.createInvoiceFailed'));
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || t('privateClass.register.errors.checkoutError'));
            } else {
                toast.error(t('privateClass.register.errors.checkoutError'));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCheckout = async () => {
        if (activeInstallment && !activeInstallment.is_fully_paid) {
            toast.error(t('privateClass.register.errors.activeInstallmentAlert'));
            setPaymentTab('installment');
            return;
        }

        if (!selectedSchedule) {
            toast.error(t('privateClass.register.errors.selectScheduleRequired'));
            return;
        }

        if (!termsAccepted && !isFree) {
            toast.error(t('privateClass.register.errors.termsRequired'));
            return;
        }

        // 1. Jika pengguna sudah login
        if (isLoggedIn) {
            if (!isProfileComplete) {
                toast.error(t('privateClass.register.errors.incompleteProfileToast'));
                setTimeout(() => {
                    window.location.href = route('profile.edit', { redirect: window.location.href });
                }, 1500);
                return;
            }

            setLoading(true);
            await submitPayment(selectedSchedule.id);
            return;
        }

        // 2. Jika pengguna belum login (Guest)
        if (!guestFormData.email || !guestFormData.phone_number || !guestFormData.instance || !guestFormData.city) {
            toast.error(t('privateClass.register.errors.completePersonalData'));
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
                    throw new Error(loginResponse.data?.message || t('privateClass.register.errors.autoLoginFailed'));
                }
            } else {
                if (!guestFormData.name) {
                    toast.error(t('privateClass.register.errors.nameRequired'));
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
                    throw new Error(t('privateClass.register.errors.registerFailed'));
                }
            }

            // Langsung eksekusi submitPayment() tanpa reload halaman!
            await submitPayment(selectedSchedule.id);
        } catch (error: unknown) {
            setLoading(false);
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || t('privateClass.register.errors.checkoutError'));
            } else {
                toast.error(t('privateClass.register.errors.checkoutError'));
            }
        }
    };

    const formatDateTime = (value?: string | null) => {
        if (!value) return '-';
        const date = new Date(value);
        return new Intl.DateTimeFormat(dateLocale, {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    const formatTimeOnly = (value?: string | null) => {
        if (!value) return '-';
        return new Date(value).toLocaleTimeString(dateLocale, {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const transactionFee = isFree ? 0 : 5000;
    const totalPrice = isFree ? 0 : privateClass.price + transactionFee;

    const isDisabled =
        loading ||
        !selectedSchedule ||
        (!activeInstallment && selectedSchedule.has_access) ||
        selectedSchedule.is_full ||
        selectedSchedule.is_registration_closed ||
        (!activeInstallment && !!selectedSchedule.pending_invoice_url);

    // Check if any schedule grants access (user already enrolled somewhere)
    const hasAccess = scheduleOptions.some((s) => s.has_access);
    const pendingSchedule = scheduleOptions.find((s) => s.pending_invoice_url);

    if (isLoggedIn && !isProfileComplete) {
        return (
            <UserLayout>
                <Head title={t('privateClass.register.headTitleGeneric')} />
                <section className="to-primary w-full bg-gradient-to-tl from-black px-4">
                    <div className="mx-auto my-12 w-full max-w-7xl px-4">
                        <h2 className="mx-auto mb-4 max-w-3xl bg-gradient-to-r from-[#71D0F7] via-white to-[#E6834A] bg-clip-text text-center text-3xl font-bold text-transparent italic sm:text-4xl">
                            {t('privateClass.register.headerTitle', { title: privateClass.title })}
                        </h2>
                        <p className="text-center text-gray-400">{t('privateClass.register.incompleteProfileDesc')}</p>
                    </div>
                </section>
                <section className="mx-auto my-4 w-full max-w-7xl px-4">
                    <div className="flex h-full flex-col items-center justify-center space-y-4 rounded-lg border p-6 text-center">
                        <User size={64} className="text-orange-500" />
                        <h2 className="text-xl font-bold">{t('privateClass.register.incompleteProfileTitle')}</h2>
                        <p className="text-sm text-gray-500">
                            {t('privateClass.register.incompleteProfileNotice')}
                        </p>
                        <Button asChild className="w-full max-w-md">
                            <Link href={route('profile.edit', { redirect: window.location.href })}>{t('privateClass.register.btnCompleteProfile')}</Link>
                        </Button>
                    </div>
                </section>
            </UserLayout>
        );
    }

    return (
        <UserLayout>
            <Head title={t('privateClass.register.headTitle', { title: privateClass.title })} />

            {/* Gradient Header */}
            <section className="to-primary w-full bg-gradient-to-tl from-black px-4">
                <div className="mx-auto my-12 w-full max-w-7xl px-4">
                    <h2 className="mx-auto mb-4 max-w-3xl bg-gradient-to-r from-[#71D0F7] via-white to-[#E6834A] bg-clip-text text-center text-3xl font-bold text-transparent italic sm:text-4xl">
                        {t('privateClass.register.headerTitle', { title: privateClass.title })}
                    </h2>
                    <p className="text-center text-gray-400">
                        {isFree
                            ? t('privateClass.register.headerSubtitleFree')
                            : t('privateClass.register.headerSubtitlePaid')}
                    </p>
                </div>
            </section>

            {/* Main Content */}
            <section className="mx-auto my-4 w-full max-w-7xl px-4">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
                    {/* Left: Tabs with schedule + benefits */}
                    <Tabs defaultValue="schedule" className="lg:col-span-2">
                        <TabsList>
                            <TabsTrigger value="schedule">{t('privateClass.register.tabSchedule')}</TabsTrigger>
                            <TabsTrigger value="detail">{t('privateClass.register.tabDetail')}</TabsTrigger>
                        </TabsList>
                        <TabsContent value="schedule">
                            <div className="h-full rounded-lg border p-4">
                                <h2 className="text-3xl font-bold italic">{t('privateClass.register.scheduleTitle')}</h2>
                                <p className="mt-2 mb-4 text-sm text-gray-600">{t('privateClass.register.scheduleSubtitle')}</p>
                                <div className="space-y-2">
                                    {scheduleOptions.map((schedule) => (
                                        <label
                                            key={schedule.id}
                                            className={`flex cursor-pointer items-start justify-between rounded-lg border p-4 text-sm transition-colors ${
                                                selectedScheduleId === schedule.id
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-border hover:bg-gray-50 dark:hover:bg-zinc-800/50'
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <input
                                                    type="radio"
                                                    name="private_schedule"
                                                    value={schedule.id}
                                                    checked={selectedScheduleId === schedule.id}
                                                    onChange={(e) => setSelectedScheduleId(e.target.value)}
                                                    className="mt-1"
                                                />
                                                <div>
                                                    <p className="font-semibold">
                                                        {formatDateTime(schedule.start_time)} - {formatTimeOnly(schedule.end_time)}
                                                    </p>
                                                    <p className="text-muted-foreground mt-1">
                                                        {t('privateClass.register.quotaCount', { occupied: schedule.occupied_participants, max: schedule.max_participants })}
                                                    </p>
                                                    {schedule.registration_deadline && (
                                                        <p className="text-muted-foreground">
                                                            {t('privateClass.register.deadlineLabel', { date: formatDateTime(schedule.registration_deadline) })}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right text-xs font-medium">
                                                {schedule.has_access && <span className="text-emerald-600">{t('privateClass.register.statusEnrolled')}</span>}
                                                {!schedule.has_access && schedule.is_full && <span className="text-amber-600">{t('privateClass.register.statusFull')}</span>}
                                                {!schedule.has_access && !schedule.is_full && schedule.is_registration_closed && (
                                                    <span className="text-rose-600">{t('privateClass.register.statusClosed')}</span>
                                                )}
                                                {!schedule.has_access && !schedule.is_full && !schedule.is_registration_closed && (
                                                    <span className="text-sky-600">{t('privateClass.register.statusAvailable')}</span>
                                                )}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </TabsContent>
                        <TabsContent value="detail">
                            <div className="h-full rounded-lg border p-4">
                                <h2 className="text-3xl font-bold italic">{t('privateClass.register.whatYouWillGet')}</h2>
                                <p className="mt-2 mb-4 text-sm text-gray-600">{t('privateClass.register.whatYouWillGetDesc')}</p>
                                <ul className="space-y-2">
                                    {benefitList.length > 0 ? (
                                        benefitList.map((benefit, idx) => (
                                            <li key={idx} className="flex items-center gap-2">
                                                <BadgeCheck size={18} className="mt-1 min-w-6 text-green-600" />
                                                <p className="text-sm md:text-base">{benefit}</p>
                                            </li>
                                        ))
                                    ) : (
                                        <>
                                            <li className="flex items-center gap-2">
                                                <BadgeCheck size={18} className="min-w-6 text-green-600" />
                                                <p className="text-sm md:text-base">{t('privateClass.register.defaultBenefit1')}</p>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <BadgeCheck size={18} className="min-w-6 text-green-600" />
                                                <p className="text-sm md:text-base">{t('privateClass.register.defaultBenefit2')}</p>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <BadgeCheck size={18} className="min-w-6 text-green-600" />
                                                <p className="text-sm md:text-base">{t('privateClass.register.defaultBenefit3')}</p>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <BadgeCheck size={18} className="min-w-6 text-green-600" />
                                                <p className="text-sm md:text-base">{t('privateClass.register.defaultBenefit4')}</p>
                                            </li>
                                        </>
                                    )}
                                </ul>
                            </div>
                        </TabsContent>
                    </Tabs>

                    {/* Right: Payment Sidebar */}
                    {hasAccess && (!activeInstallment || activeInstallment.is_fully_paid) ? (
                        <div className="flex h-full flex-col items-center justify-center space-y-4 rounded-lg border p-6 text-center">
                            <BadgeCheck size={64} className="text-green-500" />
                            <h2 className="text-xl font-bold">{t('privateClass.register.alreadyHaveAccessTitle')}</h2>
                            <p className="text-sm text-gray-500">{t('privateClass.register.alreadyHaveAccessDesc')}</p>
                            <Button asChild className="w-full">
                                <Link href={route('private.detail', { privateClass: privateClass.slug })}>{t('privateClass.register.btnBackToDetail')}</Link>
                            </Button>
                        </div>
                    ) : (pendingSchedule?.pending_invoice || pendingSchedule?.pending_invoice_url) && !activeInstallment ? (
                        <div className="rounded-2xl border bg-white p-6 shadow-xl dark:bg-gray-800">
                            <div className="flex items-center gap-2 mb-2 text-yellow-600 dark:text-yellow-400">
                                <Hourglass className="h-5 w-5" />
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                    {t('privateClass.register.pendingInvoiceTitle')}
                                </h3>
                            </div>
                            <p className="text-sm text-gray-500">
                                {pendingSchedule?.pending_invoice?.invoice_code ? (
                                    <>
                                        {t('privateClass.register.pendingInvoiceCode', { code: pendingSchedule.pending_invoice.invoice_code })}
                                    </>
                                ) : (
                                    t('privateClass.register.pendingInvoiceGeneric')
                                )}
                            </p>
                            {pendingSchedule?.pending_invoice?.amount !== undefined && (
                                <p className="text-2xl font-bold text-orange-600 my-3">
                                    {formatCurrency(pendingSchedule.pending_invoice.amount)}
                                </p>
                            )}
                            <div className="space-y-2 pt-2">
                                {(pendingSchedule?.pending_invoice?.invoice_url || pendingSchedule?.pending_invoice_url) && (
                                    <Button asChild className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold" size="lg">
                                        <a href={pendingSchedule?.pending_invoice?.invoice_url || pendingSchedule?.pending_invoice_url!}>
                                            {t('privateClass.register.btnContinuePayment')}
                                        </a>
                                    </Button>
                                )}
                                <div className="flex gap-2">
                                    <Button onClick={() => window.location.reload()} variant="outline" className="flex-1" size="lg">
                                        {t('privateClass.register.btnCheckStatus')}
                                    </Button>
                                    {pendingSchedule?.pending_invoice?.id && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="flex-1 text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
                                            size="lg"
                                            disabled={cancellingInvoice}
                                            onClick={async () => {
                                                if (confirm(t('privateClass.register.confirmCancel'))) {
                                                    setCancellingInvoice(true);
                                                    try {
                                                        await axios.post(route('invoice.cancel', pendingSchedule.pending_invoice!.id));
                                                        toast.success(t('privateClass.register.cancelSuccess'));
                                                        window.location.reload();
                                                    } catch (err: any) {
                                                        toast.error(err.response?.data?.message || t('privateClass.register.cancelFailed'));
                                                        setCancellingInvoice(false);
                                                    }
                                                }
                                            }}
                                        >
                                            {cancellingInvoice ? t('privateClass.register.cancelling') : t('privateClass.register.btnCancelOrder')}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleCheckout();
                            }}
                        >
                            <h2 className="my-2 text-xl font-bold italic">
                                {isFree ? t('privateClass.register.registrationDetailTitle') : t('privateClass.register.paymentDetailTitle')}
                            </h2>
                            <div className="space-y-4 rounded-lg border p-4">
                                {/* Guest form */}
                                {!isLoggedIn && (
                                    <div className="space-y-3 rounded-lg border p-4">
                                        <h3 className="text-lg font-semibold">{t('privateClass.register.personalDataTitle')}</h3>
                                        <div className="space-y-2">
                                            <Label htmlFor="guest-email">{t('privateClass.register.emailLabel')}</Label>
                                            <Input
                                                id="guest-email"
                                                type="email"
                                                placeholder="email@example.com"
                                                value={guestFormData.email}
                                                onChange={(e) => updateGuestForm('email', e.target.value)}
                                                required
                                            />
                                            {checkingEmail && <p className="text-xs text-gray-500">{t('privateClass.register.checkingEmail')}</p>}
                                            {emailExists && <p className="text-xs text-green-600">{t('privateClass.register.emailFound')}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="guest-name">{t('privateClass.register.nameLabel')}</Label>
                                            <Input
                                                id="guest-name"
                                                type="text"
                                                placeholder={t('privateClass.register.namePlaceholder')}
                                                value={guestFormData.name}
                                                onChange={(e) => updateGuestForm('name', e.target.value)}
                                                disabled={emailExists}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="guest-phone">{t('privateClass.register.phoneLabel')}</Label>
                                            <Input
                                                id="guest-phone"
                                                type="tel"
                                                placeholder={t('privateClass.register.phonePlaceholder')}
                                                value={guestFormData.phone_number}
                                                onChange={(e) => updateGuestForm('phone_number', e.target.value)}
                                                disabled={emailExists}
                                                required
                                            />
                                            {!emailExists && (
                                                <p className="text-xs text-gray-500">{t('privateClass.register.phoneNotice')}</p>
                                            )}
                                            {emailExists && (
                                                <p className="text-xs text-blue-600">{t('privateClass.register.accountLockedNotice')}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="guest-instance">{t('privateClass.register.instanceLabel')}</Label>
                                            <Input
                                                id="guest-instance"
                                                type="text"
                                                placeholder={t('privateClass.register.instancePlaceholder')}
                                                value={guestFormData.instance}
                                                onChange={(e) => updateGuestForm('instance', e.target.value)}
                                                disabled={loading}
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="guest-city">{t('privateClass.register.cityLabel')}</Label>
                                            <Input
                                                id="guest-city"
                                                type="text"
                                                placeholder={t('privateClass.register.cityPlaceholder')}
                                                value={guestFormData.city}
                                                onChange={(e) => updateGuestForm('city', e.target.value)}
                                                disabled={loading}
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Status alerts */}
                                {selectedSchedule?.has_access && (
                                    <div className="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-700">
                                        {t('privateClass.register.alertEnrolledInSchedule')}
                                    </div>
                                )}
                                {!selectedSchedule?.has_access && selectedSchedule?.is_full && (
                                    <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-700">
                                        {t('privateClass.register.alertScheduleFull')}
                                    </div>
                                )}
                                {!selectedSchedule?.has_access && !selectedSchedule?.is_full && selectedSchedule?.is_registration_closed && (
                                    <div className="rounded-md border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">
                                        {t('privateClass.register.alertScheduleClosed')}
                                    </div>
                                )}

                                {/* Price breakdown */}
                                {isFree ? (
                                    <>
                                        <div className="flex items-center justify-between p-4 text-center">
                                            <span className="w-full text-2xl font-bold text-green-600">{t('privateClass.register.freeBadge')}</span>
                                        </div>
                                        <Button className="w-full" type="submit" disabled={isDisabled}>
                                            {loading ? t('privateClass.register.processing') : t('privateClass.register.btnRegisterFree')}
                                        </Button>
                                    </>
                                ) : !isFree && ((installmentTerms && installmentTerms.length > 0) || (activeInstallment && !activeInstallment.is_fully_paid)) ? (
                                    <Tabs
                                        value={paymentTab}
                                        onValueChange={(val) => {
                                            if (val === 'full' && activeInstallment && !activeInstallment.is_fully_paid) {
                                                toast.error(t('privateClass.register.activeInstallmentAlert'));
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
                                            <TabsTrigger value="full" disabled={!!activeInstallment && !activeInstallment.is_fully_paid}>
                                                {t('privateClass.register.tabFullPayment')}
                                            </TabsTrigger>
                                            <TabsTrigger
                                                value="installment"
                                                disabled={isAnyTermOverdue && !activeInstallment}
                                                className="flex items-center gap-1.5"
                                            >
                                                <span>{t('privateClass.register.tabInstallment')}</span>
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
                                                        : t('privateClass.register.installmentBadge', {
                                                              count: activeInstallment && !activeInstallment.is_fully_paid
                                                                  ? (activeInstallment.total_terms || activeInstallment.terms?.length)
                                                                  : installmentTerms.length,
                                                          })}
                                                </Badge>
                                            </TabsTrigger>
                                        </TabsList>

                                        {/* Tab Bayar Penuh */}
                                        <TabsContent value="full" className="space-y-4 m-0">
                                            <div className="space-y-2 rounded-lg border p-4">
                                                {(privateClass.strikethrough_price ?? 0) > 0 &&
                                                    (privateClass.strikethrough_price ?? 0) > privateClass.price && (
                                                        <>
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-gray-600">{t('privateClass.register.originalPrice')}</span>
                                                                <span className="font-semibold text-gray-500 line-through">
                                                                    {formatCurrency(privateClass.strikethrough_price ?? 0)}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-gray-600">{t('privateClass.register.discount')}</span>
                                                                <span className="font-semibold text-red-500">
                                                                    -{formatCurrency((privateClass.strikethrough_price ?? 0) - privateClass.price)}
                                                                </span>
                                                            </div>
                                                            <Separator className="my-2" />
                                                        </>
                                                    )}
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-600">{t('privateClass.register.classPrice')}</span>
                                                    <span className="font-semibold text-gray-500">{formatCurrency(privateClass.price)}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-600">{t('privateClass.register.transactionFee')}</span>
                                                    <span className="font-semibold text-gray-500">{formatCurrency(transactionFee)}</span>
                                                </div>
                                                <Separator className="my-2" />
                                                <div className="flex items-center justify-between">
                                                    <span className="font-semibold text-gray-900">{t('privateClass.register.totalPayment')}</span>
                                                    <span className="text-primary text-xl font-bold">{formatCurrency(totalPrice)}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <Checkbox
                                                    id="terms"
                                                    checked={termsAccepted}
                                                    onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                                                />
                                                <Label htmlFor="terms">
                                                    {t('privateClass.register.agreeTerms')}{' '}
                                                    <a
                                                        href="/terms-and-conditions"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-700 hover:underline"
                                                    >
                                                        {t('privateClass.register.termsAndConditions')}
                                                    </a>
                                                </Label>
                                            </div>

                                            <Button className="w-full" type="submit" disabled={!termsAccepted || isDisabled}>
                                                {loading ? t('privateClass.register.processing') : t('privateClass.register.btnPayNow')}
                                            </Button>
                                        </TabsContent>

                                        {/* Tab Cicilan */}
                                        <TabsContent value="installment" className="space-y-4 m-0">
                                            <InstallmentOptions
                                                productType="private"
                                                productId={privateClass.id}
                                                productPrice={privateClass.price}
                                                terms={installmentTerms}
                                                privateClassScheduleId={selectedScheduleId}
                                                termsAccepted={termsAccepted}
                                                onTermsAcceptedChange={setTermsAccepted}
                                                activeInstallment={activeInstallment}
                                                onBeforePay={async () => {
                                                    if (!activeInstallment && !termsAccepted) {
                                                        toast.error(t('privateClass.register.errors.termsRequired'));
                                                        return false;
                                                    }
                                                    if (!activeInstallment && !selectedScheduleId) {
                                                        toast.error(t('privateClass.register.errors.selectScheduleRequired'));
                                                        return false;
                                                    }
                                                    return await ensureAuth();
                                                }}
                                            />
                                        </TabsContent>
                                    </Tabs>
                                ) : (
                                    <>
                                        <div className="space-y-2 rounded-lg border p-4">
                                            {(privateClass.strikethrough_price ?? 0) > 0 &&
                                                (privateClass.strikethrough_price ?? 0) > privateClass.price && (
                                                    <>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-gray-600">{t('privateClass.register.originalPrice')}</span>
                                                            <span className="font-semibold text-gray-500 line-through">
                                                                {formatCurrency(privateClass.strikethrough_price ?? 0)}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-gray-600">{t('privateClass.register.discount')}</span>
                                                            <span className="font-semibold text-red-500">
                                                                -{formatCurrency((privateClass.strikethrough_price ?? 0) - privateClass.price)}
                                                            </span>
                                                        </div>
                                                        <Separator className="my-2" />
                                                    </>
                                                )}
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-600">{t('privateClass.register.classPrice')}</span>
                                                <span className="font-semibold text-gray-500">{formatCurrency(privateClass.price)}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-600">{t('privateClass.register.transactionFee')}</span>
                                                <span className="font-semibold text-gray-500">{formatCurrency(transactionFee)}</span>
                                            </div>
                                            <Separator className="my-2" />
                                            <div className="flex items-center justify-between">
                                                <span className="font-semibold text-gray-900">{t('privateClass.register.totalPayment')}</span>
                                                <span className="text-primary text-xl font-bold">{formatCurrency(totalPrice)}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <Checkbox
                                                id="terms"
                                                checked={termsAccepted}
                                                onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                                            />
                                            <Label htmlFor="terms">
                                                {t('privateClass.register.agreeTerms')}{' '}
                                                <a
                                                    href="/terms-and-conditions"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-700 hover:underline"
                                                >
                                                    {t('privateClass.register.termsAndConditions')}
                                                </a>
                                            </Label>
                                        </div>

                                        <Button className="w-full" type="submit" disabled={!termsAccepted || isDisabled}>
                                            {loading ? t('privateClass.register.processing') : t('privateClass.register.btnPayNow')}
                                        </Button>
                                    </>
                                )}
                            </div>
                        </form>
                    )}
                </div>
            </section>
        </UserLayout>
    );
}
