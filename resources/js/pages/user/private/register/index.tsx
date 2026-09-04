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
import { useEffect, useMemo, useState } from 'react';
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
    const { auth } = usePage<SharedData>().props;
    const isLoggedIn = !!auth.user;
    const isProfileComplete = isLoggedIn && auth.user?.phone_number && auth.user?.instance && auth.user?.city;
    const isFree = privateClass.price === 0;
    const benefitList = parseList(privateClass.benefits);

    const [activeInstallment, setActiveInstallment] = useState<ActiveInstallmentData | null>(initialActiveInstallment);
    const [paymentTab, setPaymentTab] = useState<'full' | 'installment'>(initialActiveInstallment ? 'installment' : 'full');

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
                    private_class_id: privateClass.id,
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
            toast.error('Mohon lengkapi seluruh data diri.');
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
                    throw new Error(loginResponse.data?.message || 'Gagal login otomatis. Pastikan nomor telepon sesuai dengan yang terdaftar.');
                }
            } else {
                if (!guestFormData.name) {
                    toast.error('Nama lengkap wajib diisi.');
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
                    throw new Error('Registrasi gagal.');
                }
            }
            return true;
        } catch (error: any) {
            console.error('Login/Register error:', error);
            toast.error(error.response?.data?.message || error.message || 'Gagal memproses pendaftaran.');
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

            toast.error(response.data?.message || 'Gagal membuat invoice pembayaran.');
        } catch (error: unknown) {
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || 'Terjadi kesalahan saat checkout.');
            } else {
                toast.error('Terjadi kesalahan saat checkout.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCheckout = async () => {
        if (activeInstallment && !activeInstallment.is_fully_paid) {
            toast.error('Anda sedang memiliki program cicilan berjalan. Silakan selesaikan pembayaran melalui tab Cicilan.');
            setPaymentTab('installment');
            return;
        }

        if (!selectedSchedule) {
            toast.error('Pilih jadwal private class terlebih dahulu.');
            return;
        }

        if (!termsAccepted && !isFree) {
            toast.error('Anda harus menyetujui syarat dan ketentuan.');
            return;
        }

        // 1. Jika pengguna sudah login
        if (isLoggedIn) {
            if (!isProfileComplete) {
                toast.error('Profil Anda belum lengkap! Harap lengkapi nomor telepon, instansi, dan kota domisili terlebih dahulu.');
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
            toast.error('Mohon lengkapi seluruh data diri.');
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

            // Langsung eksekusi submitPayment() tanpa reload halaman!
            await submitPayment(selectedSchedule.id);
        } catch (error: unknown) {
            setLoading(false);
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || 'Gagal memproses pendaftaran.');
            } else {
                toast.error('Gagal memproses pendaftaran.');
            }
        }
    };

    const formatDateTime = (value?: string | null) => {
        if (!value) return '-';
        const date = new Date(value);
        return new Intl.DateTimeFormat('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    const formatTimeOnly = (value?: string | null) => {
        if (!value) return '-';
        return new Date(value).toLocaleTimeString('id-ID', {
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
                <Head title="Daftar Private Class" />
                <section className="to-primary w-full bg-gradient-to-tl from-black px-4">
                    <div className="mx-auto my-12 w-full max-w-7xl px-4">
                        <h2 className="mx-auto mb-4 max-w-3xl bg-gradient-to-r from-[#71D0F7] via-white to-[#E6834A] bg-clip-text text-center text-3xl font-bold text-transparent italic sm:text-4xl">
                            Daftar Private Class "{privateClass.title}"
                        </h2>
                        <p className="text-center text-gray-400">Silakan lengkapi profil Anda terlebih dahulu.</p>
                    </div>
                </section>
                <section className="mx-auto my-4 w-full max-w-7xl px-4">
                    <div className="flex h-full flex-col items-center justify-center space-y-4 rounded-lg border p-6 text-center">
                        <User size={64} className="text-orange-500" />
                        <h2 className="text-xl font-bold">Profil Belum Lengkap</h2>
                        <p className="text-sm text-gray-500">
                            Profil Anda belum lengkap! Harap lengkapi nomor telepon, instansi, dan kota domisili terlebih dahulu untuk mendaftar private class.
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
            <Head title={`Daftar ${privateClass.title}`} />

            {/* Gradient Header */}
            <section className="to-primary w-full bg-gradient-to-tl from-black px-4">
                <div className="mx-auto my-12 w-full max-w-7xl px-4">
                    <h2 className="mx-auto mb-4 max-w-3xl bg-gradient-to-r from-[#71D0F7] via-white to-[#E6834A] bg-clip-text text-center text-3xl font-bold text-transparent italic sm:text-4xl">
                        Daftar Private Class "{privateClass.title}"
                    </h2>
                    <p className="text-center text-gray-400">
                        {isFree
                            ? 'Lanjutkan untuk mendapatkan akses gratis ke private class ini.'
                            : 'Pilih jadwal dan selesaikan pembayaran untuk mendaftar private class.'}
                    </p>
                </div>
            </section>

            {/* Main Content */}
            <section className="mx-auto my-4 w-full max-w-7xl px-4">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
                    {/* Left: Tabs with schedule + benefits */}
                    <Tabs defaultValue="schedule" className="lg:col-span-2">
                        <TabsList>
                            <TabsTrigger value="schedule">Pilih Jadwal</TabsTrigger>
                            <TabsTrigger value="detail">Detail Private Class</TabsTrigger>
                        </TabsList>
                        <TabsContent value="schedule">
                            <div className="h-full rounded-lg border p-4">
                                <h2 className="text-3xl font-bold italic">Jadwal Tersedia</h2>
                                <p className="mt-2 mb-4 text-sm text-gray-600">Pilih jadwal private class yang sesuai dengan waktu Anda.</p>
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
                                                        Kuota: {schedule.occupied_participants}/{schedule.max_participants} peserta
                                                    </p>
                                                    {schedule.registration_deadline && (
                                                        <p className="text-muted-foreground">
                                                            Batas daftar: {formatDateTime(schedule.registration_deadline)}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right text-xs font-medium">
                                                {schedule.has_access && <span className="text-emerald-600">Sudah terdaftar</span>}
                                                {!schedule.has_access && schedule.is_full && <span className="text-amber-600">Penuh</span>}
                                                {!schedule.has_access && !schedule.is_full && schedule.is_registration_closed && (
                                                    <span className="text-rose-600">Ditutup</span>
                                                )}
                                                {!schedule.has_access && !schedule.is_full && !schedule.is_registration_closed && (
                                                    <span className="text-sky-600">Tersedia</span>
                                                )}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </TabsContent>
                        <TabsContent value="detail">
                            <div className="h-full rounded-lg border p-4">
                                <h2 className="text-3xl font-bold italic">Yang akan kamu dapatkan</h2>
                                <p className="mt-2 mb-4 text-sm text-gray-600">Manfaat yang akan kamu peroleh setelah mengikuti private class ini.</p>
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
                                                <p className="text-sm md:text-base">Bimbingan langsung 1-on-1 dari mentor ahli</p>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <BadgeCheck size={18} className="min-w-6 text-green-600" />
                                                <p className="text-sm md:text-base">Materi disesuaikan kebutuhan belajar Anda</p>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <BadgeCheck size={18} className="min-w-6 text-green-600" />
                                                <p className="text-sm md:text-base">Sesi interaktif dan tanya jawab langsung</p>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <BadgeCheck size={18} className="min-w-6 text-green-600" />
                                                <p className="text-sm md:text-base">Jadwal fleksibel sesuai ketersediaan waktu</p>
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
                            <h2 className="text-xl font-bold">Anda Sudah Memiliki Akses</h2>
                            <p className="text-sm text-gray-500">Anda sudah terdaftar di private class ini.</p>
                            <Button asChild className="w-full">
                                <Link href={route('private.detail', { privateClass: privateClass.slug })}>Kembali ke Detail</Link>
                            </Button>
                        </div>
                    ) : (pendingSchedule?.pending_invoice || pendingSchedule?.pending_invoice_url) && !activeInstallment ? (
                        <div className="rounded-2xl border bg-white p-6 shadow-xl dark:bg-gray-800">
                            <div className="flex items-center gap-2 mb-2 text-yellow-600 dark:text-yellow-400">
                                <Hourglass className="h-5 w-5" />
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                    Transaksi Menunggu Pembayaran
                                </h3>
                            </div>
                            <p className="text-sm text-gray-500">
                                {pendingSchedule?.pending_invoice?.invoice_code ? (
                                    <>Kode Invoice: <span className="font-semibold text-gray-800 dark:text-gray-200">{pendingSchedule.pending_invoice.invoice_code}</span></>
                                ) : (
                                    'Anda memiliki transaksi yang belum selesai untuk private class ini.'
                                )}
                            </p>
                            {pendingSchedule?.pending_invoice?.amount !== undefined && (
                                <p className="text-2xl font-bold text-orange-600 my-3">
                                    Rp {pendingSchedule.pending_invoice.amount.toLocaleString('id-ID')}
                                </p>
                            )}
                            <div className="space-y-2 pt-2">
                                {(pendingSchedule?.pending_invoice?.invoice_url || pendingSchedule?.pending_invoice_url) && (
                                    <Button asChild className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold" size="lg">
                                        <a href={pendingSchedule?.pending_invoice?.invoice_url || pendingSchedule?.pending_invoice_url!}>
                                            Lanjutkan Pembayaran
                                        </a>
                                    </Button>
                                )}
                                <div className="flex gap-2">
                                    <Button onClick={() => window.location.reload()} variant="outline" className="flex-1" size="lg">
                                        Cek Status
                                    </Button>
                                    {pendingSchedule?.pending_invoice?.id && (
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
                                                        await axios.post(route('invoice.cancel', pendingSchedule.pending_invoice!.id));
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
                    ) : (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleCheckout();
                            }}
                        >
                            <h2 className="my-2 text-xl font-bold italic">Detail {isFree ? 'Pendaftaran' : 'Pembayaran'}</h2>
                            <div className="space-y-4 rounded-lg border p-4">
                                {/* Guest form */}
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
                                                <p className="text-xs text-blue-600">Data akun ditemukan dan dikunci agar sesuai akun terdaftar.</p>
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

                                {/* Status alerts */}
                                {selectedSchedule?.has_access && (
                                    <div className="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-700">
                                        Anda sudah memiliki akses di jadwal ini.
                                    </div>
                                )}
                                {!selectedSchedule?.has_access && selectedSchedule?.is_full && (
                                    <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-700">
                                        Slot pada jadwal yang dipilih sudah penuh.
                                    </div>
                                )}
                                {!selectedSchedule?.has_access && !selectedSchedule?.is_full && selectedSchedule?.is_registration_closed && (
                                    <div className="rounded-md border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">
                                        Pendaftaran untuk jadwal ini sudah ditutup.
                                    </div>
                                )}

                                {/* Price breakdown */}
                                {isFree ? (
                                    <>
                                        <div className="flex items-center justify-between p-4 text-center">
                                            <span className="w-full text-2xl font-bold text-green-600">PRIVATE CLASS GRATIS</span>
                                        </div>
                                        <Button className="w-full" type="submit" disabled={isDisabled}>
                                            {loading ? 'Memproses...' : 'Daftar Gratis'}
                                        </Button>
                                    </>
                                ) : !isFree && installmentTerms.length > 0 ? (
                                    <Tabs
                                        value={paymentTab}
                                        onValueChange={(val) => {
                                            if (val === 'full' && activeInstallment && !activeInstallment.is_fully_paid) {
                                                toast.error('Anda memiliki program cicilan berjalan. Silakan selesaikan pembayaran cicilan Anda.');
                                                return;
                                            }
                                            setPaymentTab(val as 'full' | 'installment');
                                        }}
                                        className="w-full"
                                    >
                                        <TabsList className="grid w-full grid-cols-2 mb-3">
                                            <TabsTrigger value="full" disabled={!!activeInstallment && !activeInstallment.is_fully_paid}>
                                                Bayar Penuh
                                            </TabsTrigger>
                                            <TabsTrigger value="installment" className="flex items-center gap-1.5">
                                                <span>Cicilan</span>
                                                <Badge variant="secondary" className="px-1.5 py-0 text-[10px] bg-primary/10 text-primary">
                                                    {installmentTerms.length}x
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
                                                                <span className="text-gray-600">Harga Asli</span>
                                                                <span className="font-semibold text-gray-500 line-through">
                                                                    Rp {(privateClass.strikethrough_price ?? 0).toLocaleString('id-ID')}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-gray-600">Diskon</span>
                                                                <span className="font-semibold text-red-500">
                                                                    -Rp{' '}
                                                                    {((privateClass.strikethrough_price ?? 0) - privateClass.price).toLocaleString('id-ID')}
                                                                </span>
                                                            </div>
                                                            <Separator className="my-2" />
                                                        </>
                                                    )}
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-600">Harga Private Class</span>
                                                    <span className="font-semibold text-gray-500">Rp {privateClass.price.toLocaleString('id-ID')}</span>
                                                </div>
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

                                            <Button className="w-full" type="submit" disabled={!termsAccepted || isDisabled}>
                                                {loading ? 'Memproses...' : 'Lanjutkan Pembayaran'}
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
                                                        toast.error('Anda harus menyetujui syarat dan ketentuan!');
                                                        return false;
                                                    }
                                                    if (!activeInstallment && !selectedScheduleId) {
                                                        toast.error('Silakan pilih jadwal terlebih dahulu.');
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
                                                            <span className="text-gray-600">Harga Asli</span>
                                                            <span className="font-semibold text-gray-500 line-through">
                                                                Rp {(privateClass.strikethrough_price ?? 0).toLocaleString('id-ID')}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-gray-600">Diskon</span>
                                                            <span className="font-semibold text-red-500">
                                                                -Rp{' '}
                                                                {((privateClass.strikethrough_price ?? 0) - privateClass.price).toLocaleString('id-ID')}
                                                            </span>
                                                        </div>
                                                        <Separator className="my-2" />
                                                    </>
                                                )}
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-600">Harga Private Class</span>
                                                <span className="font-semibold text-gray-500">Rp {privateClass.price.toLocaleString('id-ID')}</span>
                                            </div>
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

                                        <Button className="w-full" type="submit" disabled={!termsAccepted || isDisabled}>
                                            {loading ? 'Memproses...' : 'Lanjutkan Pembayaran'}
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
