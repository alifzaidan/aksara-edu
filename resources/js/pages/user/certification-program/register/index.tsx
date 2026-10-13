import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import InstallmentOptions, { ActiveInstallmentData, InstallmentTermOption } from '@/components/installment-options';
import UserLayout from '@/layouts/user-layout';
import { SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { enUS, id } from 'date-fns/locale';
import { AlertCircle, BadgeCheck, Calendar, CheckCircle2, Clock, GraduationCap, Hourglass, Loader2, Lock, Tag, User, XCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface Mentor {
    id: string;
    name: string;
}
interface Schedule {
    id: string;
    schedule_date?: string;
    start_date?: string;
}

interface Program {
    id: string;
    title: string;
    slug: string;
    type: 'regular' | 'scholarship';
    price: number;
    scholarship_price?: number;
    strikethrough_price?: number;
    thumbnail?: string | null;
    registration_deadline?: string;
    mentors: Mentor[];
    schedules: Schedule[];
    document_required?: boolean;
    document_description?: string | null;
}

interface Application {
    id: string;
    status: 'pending' | 'approved' | 'rejected';
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
    programSlug: string;
    timestamp: number;
    promoCode: string;
    termsAccepted: boolean;
    discountData: DiscountData | null;
    needsDocumentUpload?: boolean;
    codeType?: 'voucher' | 'referral';
    referralValid?: boolean;
    pointsChecked?: boolean;
    pointsToUse?: number;
}

function getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message) return error.message;
    return fallback;
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

interface RegisterProps {
    program: Program;
    hasAccess: boolean;
    activeInstallment?: ActiveInstallmentData | null;
    pendingInvoice?: PendingInvoice | null;
    pendingInvoiceUrl?: string | null;
    regularApplication?: Application | null;
    scholarshipApplication?: Application | null;
    isScholarship: boolean;
    referralInfo: {
        code: string | null;
        hasActive: boolean;
    };
    installmentTerms?: Array<{ term_number: number; amount: number; due_date: string }>;
}

export default function Register({
    program,
    hasAccess,
    activeInstallment: initialActiveInstallment = null,
    pendingInvoice,
    pendingInvoiceUrl,
    regularApplication,
    scholarshipApplication,
    isScholarship,
    referralInfo,
    installmentTerms = [],
}: RegisterProps) {
    const { auth } = usePage<SharedData>().props;
    const { t, i18n } = useTranslation('user');
    const dateLocale = i18n.language === 'en' ? 'en-US' : 'id-ID';
    const dateLocaleObj = i18n.language === 'en' ? enUS : id;
    const timePattern = i18n.language === 'en' ? 'dd MMMM yyyy, HH:mm' : "dd MMMM yyyy 'pukul' HH:mm";

    const user = auth.user as
        | {
              name?: string;
              email?: string;
              phone_number?: string;
              instance?: string;
              city?: string | null;
          }
        | null
        | undefined;
    const isLoggedIn = !!user;
    const isProfileComplete = !!(isLoggedIn && user?.phone_number && user?.instance && user?.city);

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
    const [isLoading, setIsLoading] = useState(false);
    const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);
    const [documentAttachment, setDocumentAttachment] = useState<File | null>(null);
    const [termsAccepted, setTermsAccepted] = useState(false);

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

    const [referralData, setReferralData] = useState<{ valid: boolean; message?: string; referrer?: { name: string } } | null>(null);
    const [referralLoading, setReferralLoading] = useState(false);
    const [referralError, setReferralError] = useState('');

    const [checkingEmail, setCheckingEmail] = useState(false);
    const [emailExists, setEmailExists] = useState(false);

    const [guestScholarshipStatus, setGuestScholarshipStatus] = useState<string | null>(null);
    const [guestFormData, setGuestFormData] = useState<GuestFormData>({
        name: user?.name ?? '',
        email: user?.email ?? '',
        phone_number: user?.phone_number ?? '',
        instance: user?.instance ?? '',
        city: (user?.city as string) ?? '',
    });

    const formatRupiah = (amount: number) =>
        new Intl.NumberFormat(dateLocale, { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

    const isApprovedScholarship = scholarshipApplication?.status === 'approved' || guestScholarshipStatus === 'approved';
    const isScholarshipNotApproved = program.type === 'scholarship' && !isApprovedScholarship;
    const displayPrice = isScholarshipNotApproved ? 0 : (isScholarship && program.scholarship_price ? program.scholarship_price : program.price);
    const deadline = program.registration_deadline ? new Date(program.registration_deadline) : null;
    const getDate = (s: Schedule) => s.schedule_date || s.start_date || '';
    const requiresDocumentUpload = program.type === 'regular' && !!program.document_required && !isScholarship;
    const documentStatus = regularApplication?.status ?? null;
    const hasApprovedDocument = !requiresDocumentUpload || documentStatus === 'approved';
    const isDocumentPending = documentStatus === 'pending';
    const isDocumentRejected = documentStatus === 'rejected';

    const ADMIN_FEE = 5000;
    const basePrice = displayPrice;
    const discountAmount = discountData?.valid ? discountData.discount_amount : 0;
    const maxPointsAllowed = basePrice - discountAmount;

    const finalCertificationPrice = basePrice - discountAmount - (pointsChecked ? pointsToUse : 0);
    const adminFee = displayPrice > 0 ? ADMIN_FEE : 0;
    const totalPrice = finalCertificationPrice + adminFee;

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

    const isGuestFormComplete = useCallback(() => {
        if (isLoggedIn) return true;

        const hasEmail = !!guestFormData.email;
        const hasPhone = !!guestFormData.phone_number;
        const hasNameOrEmailExists = !!guestFormData.name || emailExists;
        const hasInstanceOrEmailExists = !!guestFormData.instance || guestScholarshipStatus === 'approved';
        const hasCityOrEmailExists = !!guestFormData.city || guestScholarshipStatus === 'approved';

        return hasEmail && hasPhone && hasNameOrEmailExists && hasInstanceOrEmailExists && hasCityOrEmailExists;
    }, [isLoggedIn, guestFormData, emailExists, guestScholarshipStatus]);

    const validatePromoCode = useCallback(async () => {
        if (!promoCode.trim() || displayPrice === 0) return;

        setPromoLoading(true);
        setPromoError('');

        try {
            const requestData: Record<string, string | number> = {
                code: promoCode,
                amount: displayPrice,
                product_type: 'certification_program',
                product_id: program.id,
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
    }, [displayPrice, emailExists, guestFormData.email, isLoggedIn, program.id, promoCode]);

    const validateReferralCode = useCallback(async () => {
        if (!promoCode.trim() || displayPrice === 0) return;

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
    }, [promoCode, displayPrice, isLoggedIn, guestFormData.email]);

    useEffect(() => {
        if (!promoCode.trim() || displayPrice === 0) {
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
    }, [displayPrice, promoCode, codeType, validatePromoCode, validateReferralCode]);

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
                    type: 'certification_program',
                    id: program.id,
                    program_id: program.id,
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

                // Always check and store scholarship application status, regardless of user existence
                if (data.scholarship_application_status) {
                    setGuestScholarshipStatus(data.scholarship_application_status);
                } else {
                    setGuestScholarshipStatus(null);
                }
            } catch {
                setEmailExists(false);
                setGuestScholarshipStatus(null);
                setUserPoints(0);
                setPointsChecked(false);
                setPointsToUse(0);
                setActiveInstallment(null);
            } finally {
                setCheckingEmail(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [guestFormData.email, isLoggedIn, program.id]);

    const savePendingCheckout = useCallback(
        (needsDocumentUpload = false) => {
            const pendingCheckoutData: PendingCheckoutData = {
                programSlug: program.slug,
                timestamp: Date.now(),
                promoCode,
                termsAccepted,
                discountData,
                needsDocumentUpload,
                codeType,
                referralValid: codeType === 'referral' && !!referralData?.valid,
                pointsChecked,
                pointsToUse,
            };

            sessionStorage.setItem('pendingCertificationCheckout', JSON.stringify(pendingCheckoutData));
        },
        [discountData, program.slug, promoCode, termsAccepted, codeType, referralData?.valid, pointsChecked, pointsToUse],
    );

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

    const ensureAuthenticated = useCallback(async (): Promise<boolean> => {
        if (isLoggedIn) return true;

        if (!guestFormData.email || !guestFormData.phone_number) {
            toast.error('Email dan nomor telepon wajib diisi.');
            return false;
        }

        if (!guestFormData.instance || !guestFormData.city) {
            toast.error('Instansi dan Kota Domisili wajib diisi.');
            return false;
        }

        setIsLoading(true);

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

                toast.success('Login berhasil. Melanjutkan pendaftaran...');
                return true;
            } else {
                if (!guestFormData.name) {
                    toast.error('Nama wajib diisi.');
                    setIsLoading(false);
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

                toast.success('Registrasi berhasil. Melanjutkan pendaftaran...');
                return true;
            }
        } catch (error: unknown) {
            setIsLoading(false);
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || 'Gagal memproses login/registrasi otomatis.');
            } else {
                toast.error(getErrorMessage(error, 'Gagal memproses login/registrasi otomatis.'));
            }
            return false;
        }
    }, [emailExists, guestFormData.email, guestFormData.instance, guestFormData.city, guestFormData.name, guestFormData.phone_number, isLoggedIn, referralInfo?.code]);

    // Show scholarship prompt only when the user hasn't applied yet or their application was rejected.
    // For guests, consider `guestScholarshipStatus` returned by `/api/check-email`.
    const showScholarshipWarning = !!(
        isScholarship &&
        ((!scholarshipApplication && !guestScholarshipStatus) ||
            (scholarshipApplication && scholarshipApplication.status === 'rejected') ||
            guestScholarshipStatus === 'rejected')
    );

    // Determine if scholarship is not approved (either for logged user or guest)
    const scholarshipNotApproved = !!(
        isScholarship &&
        ((scholarshipApplication && scholarshipApplication.status !== 'approved') ||
            (guestScholarshipStatus && guestScholarshipStatus !== 'approved'))
    );

    const handleDocumentSubmit = () => {
        if (!documentAttachment) {
            toast.error('Pilih dokumen pendukung terlebih dahulu');
            return;
        }

        const formData = new FormData();
        formData.append('document_attachment', documentAttachment);

        router.post(route('certification-programs.apply-regular', program.slug), formData, {
            forceFormData: true,
            onSuccess: () => {
                setIsDocumentDialogOpen(false);
                setDocumentAttachment(null);
                toast.success('Dokumen berhasil dikirim. Menunggu verifikasi admin.');
            },
            onError: () => {
                toast.error('Gagal mengirim dokumen pendukung');
            },
        });
    };

    const submitPayment = useCallback(
        async (
            overrideCodeType?: 'voucher' | 'referral',
            overridePromoCode?: string,
            overrideReferralValid?: boolean,
            overridePointsChecked?: boolean,
            overridePointsToUse?: number,
        ): Promise<void> => {
            const originalDiscountAmount =
                program.strikethrough_price && program.strikethrough_price > 0 ? program.strikethrough_price - program.price : 0;
            const promoDiscountAmount = discountData?.valid ? discountData.discount_amount : 0;
            const activeFinalPrice = displayPrice - promoDiscountAmount;
            
            const pointsDeduction = overridePointsChecked !== undefined ? (overridePointsChecked ? (overridePointsToUse || 0) : 0) : (pointsChecked ? pointsToUse : 0);
            const finalNettAmount = activeFinalPrice - pointsDeduction;
            const activeAdminFee = displayPrice > 0 ? ADMIN_FEE : 0;
            const activeTotalPrice = finalNettAmount + activeAdminFee;

            const invoiceData: Record<string, string | number> = {
                type: 'certification_program',
                id: program.id,
                discount_amount: originalDiscountAmount + promoDiscountAmount,
                nett_amount: finalNettAmount,
                transaction_fee: activeAdminFee,
                total_amount: activeTotalPrice,
                isScholarship: isScholarship ? 1 : 0,
                points_redeemed: pointsDeduction,
            };

            if (discountData?.valid) {
                invoiceData.discount_code_id = discountData.discount_code.id;
                invoiceData.discount_code_amount = discountData.discount_amount;
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
                        sessionStorage.removeItem('pendingCertificationCheckout');
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
        [displayPrice, discountData, program.id, program.price, program.strikethrough_price, isScholarship, pointsChecked, pointsToUse, codeType, referralData, promoCode, referralInfo?.code],
    );

    const handleCheckout = useCallback(async () => {
        if (activeInstallment && !activeInstallment.is_fully_paid) {
            toast.error('Anda sedang memiliki program cicilan berjalan. Silakan selesaikan pembayaran melalui tab Cicilan.');
            setPaymentTab('installment');
            return;
        }

        if (!termsAccepted && displayPrice > 0) {
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

            if (requiresDocumentUpload && !hasApprovedDocument) {
                if (isDocumentPending) {
                    return;
                }
                setIsDocumentDialogOpen(true);
                return;
            }

            setIsLoading(true);
            try {
                await submitPayment();
            } catch (error) {
                toast.error(getErrorMessage(error, 'Terjadi kesalahan saat proses pembayaran.'));
                setIsLoading(false);
            }
            return;
        }

        // 2. Jika pengguna belum login (Guest)
        if (!isGuestFormComplete()) {
            toast.error('Lengkapi semua data diri terlebih dahulu.');
            return;
        }

        setIsLoading(true);

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
                    setIsLoading(false);
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

            if (requiresDocumentUpload && !hasApprovedDocument) {
                if (isDocumentPending) {
                    setIsLoading(false);
                    return;
                }
                setIsLoading(false);
                setIsDocumentDialogOpen(true);
                return;
            }

            // Langsung eksekusi submitPayment() tanpa reload halaman!
            await submitPayment();
        } catch (error: unknown) {
            setIsLoading(false);
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || getErrorMessage(error, 'Gagal memproses pendaftaran.'));
            } else {
                toast.error(getErrorMessage(error, 'Gagal memproses pendaftaran.'));
            }
        }
    }, [
        displayPrice,
        emailExists,
        guestFormData,
        hasApprovedDocument,
        isDocumentPending,
        isDocumentRejected,
        isGuestFormComplete,
        isLoggedIn,
        isProfileComplete,
        referralInfo?.code,
        requiresDocumentUpload,
        submitPayment,
        termsAccepted,
    ]);

    const ensureAuthenticatedForDocument = useCallback(async () => {
        if (!guestFormData.email || !guestFormData.phone_number) {
            toast.error('Email dan nomor telepon wajib diisi.');
            return;
        }

        if (!guestFormData.instance) {
            toast.error('Instansi wajib diisi.');
            return;
        }

        if (!guestFormData.city) {
            toast.error('Kota domisili wajib diisi.');
            return;
        }

        setIsLoading(true);

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

                toast.success('Login berhasil. Membuka form upload dokumen...');
            } else {
                if (!guestFormData.name) {
                    toast.error('Nama wajib diisi.');
                    setIsLoading(false);
                    return;
                }

                await axios.post(route('register'), {
                    name: guestFormData.name,
                    email: guestFormData.email,
                    phone_number: guestFormData.phone_number,
                    instance: guestFormData.instance,
                    city: guestFormData.city,
                    password: guestFormData.phone_number,
                    password_confirmation: guestFormData.phone_number,
                });

                toast.success('Registrasi berhasil. Membuka form upload dokumen...');
            }

            savePendingCheckout(true);
            window.location.reload();
        } catch (error: unknown) {
            setIsLoading(false);
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || 'Gagal memproses login/registrasi otomatis.');
            } else {
                toast.error(getErrorMessage(error, 'Gagal memproses login/registrasi otomatis.'));
            }
        }
    }, [emailExists, guestFormData.email, guestFormData.instance, guestFormData.city, guestFormData.name, guestFormData.phone_number, savePendingCheckout]);

    useEffect(() => {
        if (!isLoggedIn) return;

        const pendingCheckoutRaw = sessionStorage.getItem('pendingCertificationCheckout');
        if (!pendingCheckoutRaw) return;

        try {
            const pendingCheckout = JSON.parse(pendingCheckoutRaw) as PendingCheckoutData;

            const fiveMinutes = 5 * 60 * 1000;
            if (Date.now() - pendingCheckout.timestamp > fiveMinutes) {
                sessionStorage.removeItem('pendingCertificationCheckout');
                return;
            }

            if (pendingCheckout.programSlug !== program.slug) {
                sessionStorage.removeItem('pendingCertificationCheckout');
                return;
            }

            // Check if pending document upload
            if (pendingCheckout.needsDocumentUpload) {
                sessionStorage.removeItem('pendingCertificationCheckout');
                setIsDocumentDialogOpen(true);
                return;
            }

            // Remove immediately to prevent double submissions in StrictMode/concurrent renders
            sessionStorage.removeItem('pendingCertificationCheckout');

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

            setTermsAccepted(pendingCheckout.termsAccepted || false);
            setDiscountData(pendingCheckout.discountData || null);

            setIsLoading(true);

            submitPayment(
                pendingCheckout.codeType,
                pendingCheckout.promoCode,
                pendingCheckout.referralValid,
                pendingCheckout.pointsChecked,
                pendingCheckout.pointsToUse
            ).catch((error: unknown) => {
                console.error('Pending checkout certification error:', error);
                toast.error(getErrorMessage(error, 'Gagal melanjutkan pendaftaran.'));
                setIsLoading(false);
            });
        } catch {
            sessionStorage.removeItem('pendingCertificationCheckout');
        }
    }, [isLoggedIn, program.slug, submitPayment]);

    if (hasAccess && (!activeInstallment || activeInstallment.is_fully_paid)) {
        return (
            <UserLayout>
                <Head title={t('certificationProgram.register.headTitleEnrolled', { title: program.title })} />
                <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-zinc-900 dark:to-zinc-800">
                    <div className="to-primary relative overflow-hidden bg-gradient-to-tl from-black px-4 py-8 md:py-12">
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-0 left-0 size-96 rounded-full bg-white blur-3xl" />
                            <div className="absolute right-0 bottom-0 size-96 rounded-full bg-white blur-3xl" />
                        </div>
                        <div className="relative mx-auto w-full max-w-3xl text-center">
                            <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-300" />
                            <h1 className="text-3xl font-bold text-white md:text-4xl">{t('certificationProgram.register.enrolledTitle')}</h1>
                            <p className="mt-2 text-blue-100 md:text-lg">{t('certificationProgram.register.enrolledDesc')}</p>
                        </div>
                    </div>
                    <div className="mx-auto flex w-full max-w-md flex-col gap-3 px-4 py-8">
                        <Button asChild className="w-full">
                            <Link href={route('user.dashboard')}>{t('certificationProgram.register.btnToDashboard')}</Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full">
                            <Link href={route('certification-programs.index')}>{t('certificationProgram.register.btnViewOtherPrograms')}</Link>
                        </Button>
                    </div>
                </div>
            </UserLayout>
        );
    }

    if (isLoggedIn && !isProfileComplete) {
        return (
            <UserLayout>
                <Head title={t('certificationProgram.register.headTitle', { title: program.title })} />
                <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-zinc-900 dark:to-zinc-800">
                    <div className="to-primary relative overflow-hidden bg-gradient-to-tl from-black px-4 py-8 md:py-12">
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-0 left-0 size-96 rounded-full bg-white blur-3xl" />
                            <div className="absolute right-0 bottom-0 size-96 rounded-full bg-white blur-3xl" />
                        </div>
                        <div className="relative mx-auto w-full max-w-3xl text-center">
                            <User className="mx-auto mb-4 h-16 w-16 text-amber-300" />
                            <h1 className="text-3xl font-bold text-white md:text-4xl">{t('certificationProgram.register.incompleteProfileTitle')}</h1>
                            <p className="mt-2 text-blue-100 md:text-lg">
                                {t('certificationProgram.register.incompleteProfileDesc')}
                            </p>
                        </div>
                    </div>
                    <div className="mx-auto flex w-full max-w-md flex-col gap-3 px-4 py-8">
                        <Button asChild className="w-full">
                            <Link href={route('profile.edit', { redirect: window.location.href })}>{t('certificationProgram.register.btnCompleteProfile')}</Link>
                        </Button>
                    </div>
                </div>
            </UserLayout>
        );
    }

    const handlePrimaryAction = () => {
        if (requiresDocumentUpload && !hasApprovedDocument) {
            if (isDocumentPending) {
                return;
            }

            // If guest, need to authenticate first
            if (!isLoggedIn) {
                if (!isGuestFormComplete()) {
                    toast.error('Lengkapi semua data diri terlebih dahulu.');
                    return;
                }

                // Proceed with auto-login/register
                void ensureAuthenticatedForDocument();
                return;
            }

            setIsDocumentDialogOpen(true);
            return;
        }

        void handleCheckout();
    };

    const renderPaymentForm = () => (
        <>
            <div className="mb-4 space-y-4">
                {/* Pilihan Jenis Kode */}
                <div className="space-y-2">
                    <Label>{t('certificationProgram.register.voucherTab')} / {t('certificationProgram.register.referralTab')}</Label>
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
                            <Label htmlFor="code-voucher" className="cursor-pointer">{t('certificationProgram.register.voucherTab')}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="referral" id="code-referral" />
                            <Label htmlFor="code-referral" className="cursor-pointer">{t('certificationProgram.register.referralTab')}</Label>
                        </div>
                    </RadioGroup>
                </div>

                {/* Input Kode */}
                <div className="space-y-2">
                    <Label htmlFor="promo-code">
                        {codeType === 'voucher' ? t('certificationProgram.register.voucherTab') : t('certificationProgram.register.referralTab')}
                    </Label>
                    <div className="relative">
                        <Input
                            id="promo-code"
                            type="text"
                            placeholder={codeType === 'voucher' ? t('certificationProgram.register.voucherPlaceholder') : t('certificationProgram.register.referralPlaceholder')}
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
                                        <CheckCircle2 size="18" className="text-green-600" />
                                    ) : (
                                        <XCircle size="18" className="text-red-500" />
                                    )
                                ) : referralData?.valid ? (
                                    <CheckCircle2 size="18" className="text-green-600" />
                                ) : (
                                    <XCircle size="18" className="text-red-500" />
                                )}
                            </div>
                        )}
                    </div>
                    {codeType === 'voucher' && promoError && <p className="text-xs text-red-600">{promoError}</p>}
                    {codeType === 'voucher' && discountData?.valid && (
                        <p className="text-xs text-green-600">
                            {t('certificationProgram.register.discount')}: {discountData.discount_code.name} ({discountData.discount_code.formatted_value})
                        </p>
                    )}
                    {codeType === 'referral' && referralError && <p className="text-xs text-red-600">{referralError}</p>}
                    {codeType === 'referral' && referralData?.valid && (
                        <p className="text-xs text-green-600">
                            {referralData.message || t('certificationProgram.register.referralTab')}
                        </p>
                    )}
                </div>

                {/* Point Reward Section */}
                {isLoggedIn && userPoints > 0 && (
                    <div className="space-y-3 rounded-lg border border-dashed border-gray-200 p-3 dark:border-zinc-700">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="use-points" className="cursor-pointer font-medium">
                                    {t('certificationProgram.register.pointsOption')}
                                </Label>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {t('certificationProgram.register.pointsAvailable', { points: userPoints.toLocaleString(dateLocale) })} ({formatRupiah(userPoints)})
                                </p>
                            </div>
                            <Checkbox
                                id="use-points"
                                checked={pointsChecked}
                                disabled={codeType === 'voucher' && !!discountData?.valid}
                                onCheckedChange={(checked) => {
                                    setPointsChecked(checked === true);
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
                                <Label htmlFor="points-input">{t('certificationProgram.register.pointsInputPlaceholder')}</Label>
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
                                                setPointsError(t('certificationProgram.register.pointsExceedBalance', { defaultValue: 'Poin melebihi saldo Anda.' }));
                                            } else if (val > maxPointsAllowed) {
                                                setPointsError(t('certificationProgram.register.pointsExceedMax', { defaultValue: `Maksimal poin yang dapat digunakan adalah ${maxPointsAllowed}.`, max: maxPointsAllowed }));
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
                                        {t('certificationProgram.register.btnUseMaxPoints')}
                                    </Button>
                                </div>
                                {pointsError && <p className="text-xs text-red-600">{pointsError}</p>}
                                {codeType === 'voucher' && !!discountData?.valid && (
                                    <p className="text-xs text-amber-600">
                                        {t('certificationProgram.register.pointsConflictVoucher', { defaultValue: 'Poin tidak dapat digunakan bersamaan dengan kode voucher.' })}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Tipe</span>
                <Badge className={isScholarship ? 'bg-purple-100 text-purple-700' : ''}>
                    <GraduationCap size={12} className="mr-1" />
                    {isScholarship ? t('certificationProgram.detail.hero.badgeScholarship') : t('certificationProgram.detail.hero.badgeRegular')}
                </Badge>
            </div>
            <Separator className="mb-4" />
            {!isScholarshipNotApproved && (program.strikethrough_price ?? 0) > 0 && (
                <p className="text-right text-sm text-red-500 line-through">{formatRupiah(program.strikethrough_price!)}</p>
            )}
            
            <div className="space-y-1 text-right">
                {codeType === 'voucher' && discountData?.valid ? (
                    <>
                        <p className="text-sm text-gray-500 line-through dark:text-gray-400">{formatRupiah(displayPrice)}</p>
                        <p className="text-xs text-green-600 dark:text-green-500">
                            {t('certificationProgram.register.discount')}: {discountData.discount_code.formatted_value}
                        </p>
                    </>
                ) : pointsChecked && pointsToUse > 0 && !pointsError ? (
                    <>
                        <p className="text-sm text-gray-500 line-through dark:text-gray-400">{formatRupiah(displayPrice)}</p>
                        <p className="text-xs text-green-600 dark:text-green-500">
                            {t('certificationProgram.register.pointsDeduction')} {formatRupiah(pointsToUse)}
                        </p>
                    </>
                ) : null}

                {displayPrice > 0 && (
                    <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                        {(codeType === 'voucher' && discountData?.valid) ? (
                            <div className="flex justify-between">
                                <span>{t('certificationProgram.register.discount')}</span>
                                <span>{formatRupiah(displayPrice - discountData.discount_amount)}</span>
                            </div>
                        ) : pointsChecked && pointsToUse > 0 && !pointsError ? (
                            <div className="flex justify-between">
                                <span>{t('certificationProgram.register.pointsUsed')}</span>
                                <span>{formatRupiah(displayPrice - pointsToUse)}</span>
                            </div>
                        ) : (
                            <div className="flex justify-between">
                                <span>{t('certificationProgram.register.originalPrice')}</span>
                                <span>{formatRupiah(displayPrice)}</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span>{t('certificationProgram.register.adminFee')}</span>
                            <span>+ {formatRupiah(ADMIN_FEE)}</span>
                        </div>
                    </div>
                )}

                <p className="text-right text-3xl font-bold text-gray-900 italic dark:text-gray-100 mt-2">
                    {displayPrice <= 0 ? t('certificationProgram.register.free') : formatRupiah(totalPrice)}
                </p>
            </div>

            {deadline && (
                <div className="mt-4 flex items-start gap-2 text-sm">
                    <Calendar size="16" className="text-primary mt-0.5" />
                    <div>
                        <p className="font-medium">{t('certificationProgram.register.deadline')}</p>
                        <p className="text-gray-600 dark:text-gray-400">
                            {format(deadline, timePattern, { locale: dateLocaleObj })} WIB
                        </p>
                    </div>
                </div>
            )}

            <div className="mt-4 flex items-start gap-3 rounded-lg border border-dashed p-3 text-sm">
                <Checkbox
                    id="terms"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                    className="mt-0.5"
                />
                <Label htmlFor="terms" className="leading-5">
                    {t('certificationProgram.register.agreeTerms')}
                </Label>
            </div>

            <div className="mt-6 space-y-2">
                <Button
                    onClick={handlePrimaryAction}
                    disabled={
                        isLoading ||
                        showScholarshipWarning ||
                        (!isLoggedIn && !isGuestFormComplete()) ||
                        (requiresDocumentUpload && isDocumentPending) ||
                        (!!regularApplication &&
                            regularApplication.status === 'pending' &&
                            !isScholarship &&
                            requiresDocumentUpload) ||
                        scholarshipNotApproved ||
                        (displayPrice > 0 && !termsAccepted)
                    }
                    className="w-full"
                >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isLoading
                        ? t('certificationProgram.register.processing')
                        : requiresDocumentUpload && !hasApprovedDocument && !isDocumentPending
                                  ? isDocumentRejected
                                      ? t('certificationProgram.register.btnReuploadDoc')
                                      : t('certificationProgram.register.btnUploadDoc')
                              : t('certificationProgram.register.btnPayNow')}
                </Button>
                <Button asChild variant="outline" className="w-full">
                    <Link href={route('certification-programs.detail', program.slug)}>{t('certificationProgram.register.btnBackToDetail')}</Link>
                </Button>
                <p className="text-center text-xs text-gray-500 dark:text-gray-400">{t('certificationProgram.register.redirectPaymentNotice')}</p>
            </div>
        </>
    );

    return (
        <UserLayout>
            <Head title={t('certificationProgram.register.headTitle', { title: program.title })} />
            <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-zinc-900 dark:to-zinc-800">
                {/* Hero */}
                <div className="to-primary relative overflow-hidden bg-gradient-to-tl from-black px-4 py-8 md:py-12">
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 left-0 size-96 rounded-full bg-white blur-3xl" />
                        <div className="absolute right-0 bottom-0 size-96 rounded-full bg-white blur-3xl" />
                    </div>
                    <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center gap-6 text-center">
                        {program.thumbnail && (
                            <div className="overflow-hidden rounded-lg shadow-xl">
                                <img src={`/storage/${program.thumbnail}`} alt={program.title} className="h-36 object-cover md:h-56" />
                            </div>
                        )}
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold text-white md:text-4xl">{program.title}</h1>
                            <p className="text-blue-100 md:text-xl">{isScholarship ? t('certificationProgram.register.scholarshipRegistration') : t('certificationProgram.register.regularRegistration')}</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="mx-auto w-full max-w-5xl px-4 py-8">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {/* Left - Program Info, Alerts & Guest Form */}
                        <div className="space-y-4">
                            {!isLoggedIn && (
                                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-md dark:border-zinc-700 dark:bg-zinc-800">
                                    <h3 className="mb-3 font-semibold">{t('certificationProgram.register.personalDataTitle')}</h3>
                                    <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
                                        {t('certificationProgram.register.personalDataDesc')}
                                    </p>

                                    <div className="space-y-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="guest-email">{t('certificationProgram.register.labelEmail')}</Label>
                                            <Input
                                                id="guest-email"
                                                type="email"
                                                placeholder="email@example.com"
                                                value={guestFormData.email}
                                                onChange={(event) => updateGuestForm('email', event.target.value)}
                                                required
                                            />
                                            {checkingEmail && <p className="text-xs text-gray-500">{t('certificationProgram.register.checkingEmail')}</p>}
                                            {emailExists && <p className="text-xs text-green-600">{t('certificationProgram.register.emailFound')}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="guest-name">{t('certificationProgram.register.labelName')}</Label>
                                            <Input
                                                id="guest-name"
                                                type="text"
                                                placeholder={t('certificationProgram.register.placeholderName')}
                                                value={guestFormData.name}
                                                onChange={(event) => updateGuestForm('name', event.target.value)}
                                                disabled={emailExists}
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="guest-phone">{t('certificationProgram.register.labelPhone')}</Label>
                                            <Input
                                                id="guest-phone"
                                                type="tel"
                                                placeholder="08xxxxxxxxxx"
                                                value={guestFormData.phone_number}
                                                onChange={(event) => updateGuestForm('phone_number', event.target.value)}
                                                disabled={emailExists}
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="guest-instance">{t('certificationProgram.register.labelInstance')}</Label>
                                            <Input
                                                id="guest-instance"
                                                type="text"
                                                placeholder={t('certificationProgram.register.placeholderInstance')}
                                                value={guestFormData.instance}
                                                onChange={(event) => updateGuestForm('instance', event.target.value)}
                                                disabled={isLoading}
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="guest-city">{t('certificationProgram.register.labelCity')}</Label>
                                            <Input
                                                id="guest-city"
                                                type="text"
                                                placeholder={t('certificationProgram.register.placeholderCity')}
                                                value={guestFormData.city}
                                                onChange={(event) => updateGuestForm('city', event.target.value)}
                                                disabled={isLoading}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {(pendingInvoice || pendingInvoiceUrl) && !isLoading && (
                                <div className="rounded-2xl border bg-white p-6 shadow-xl dark:bg-gray-800">
                                    <div className="flex items-center gap-2 mb-2 text-yellow-600 dark:text-yellow-400">
                                        <Hourglass className="h-5 w-5" />
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                            {t('certificationProgram.register.pendingInvoiceTitle')}
                                        </h3>
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        {pendingInvoice?.invoice_code ? (
                                            <>{t('certificationProgram.register.invoiceCodeLabel')} <span className="font-semibold text-gray-800 dark:text-gray-200">{pendingInvoice.invoice_code}</span></>
                                        ) : (
                                            t('certificationProgram.register.pendingInvoiceDesc')
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
                                                    {t('certificationProgram.register.btnContinuePayment')}
                                                </a>
                                            </Button>
                                        )}
                                        <div className="flex gap-2">
                                            <Button onClick={() => window.location.reload()} variant="outline" className="flex-1" size="lg">
                                                {t('certificationProgram.register.btnCheckStatus')}
                                            </Button>
                                            {pendingInvoice?.id && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className="flex-1 text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
                                                    size="lg"
                                                    disabled={cancellingInvoice}
                                                    onClick={async () => {
                                                        if (confirm(t('certificationProgram.register.confirmCancelInvoice'))) {
                                                            setCancellingInvoice(true);
                                                            try {
                                                                await axios.post(route('invoice.cancel', pendingInvoice.id));
                                                                toast.success(t('certificationProgram.register.cancelSuccess'));
                                                                window.location.reload();
                                                            } catch (err: any) {
                                                                toast.error(err.response?.data?.message || t('certificationProgram.register.cancelFailed'));
                                                                setCancellingInvoice(false);
                                                            }
                                                        }
                                                    }}
                                                >
                                                    {cancellingInvoice ? t('certificationProgram.register.cancellingInvoice') : t('certificationProgram.register.btnCancelInvoice')}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {requiresDocumentUpload && (
                                <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
                                    <Lock className="h-4 w-4 text-amber-600" />
                                    <AlertTitle className="text-amber-900 dark:text-amber-200">{t('certificationProgram.register.docStatusTitle')}</AlertTitle>
                                    <AlertDescription className="space-y-3 text-amber-800 dark:text-amber-300">
                                        <p>
                                            {program.document_description ?? t('certificationProgram.detail.register.docRequiredDefault')}
                                        </p>
                                        {!documentStatus && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                className="w-full"
                                                variant="secondary"
                                                onClick={() => handlePrimaryAction()}
                                            >
                                                {t('certificationProgram.register.btnUploadDoc')}
                                            </Button>
                                        )}
                                        {isDocumentPending && <p>{t('certificationProgram.register.docStatusPending')}</p>}
                                        {isDocumentRejected && (
                                            <div className="space-y-2">
                                                <p className="text-red-600 dark:text-red-300 font-semibold">
                                                    {t('certificationProgram.register.docStatusRejected')}
                                                </p>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    className="w-full rounded-full border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
                                                    variant="outline"
                                                    onClick={() => handlePrimaryAction()}
                                                >
                                                    {t('certificationProgram.register.btnReuploadDoc')}
                                                </Button>
                                            </div>
                                        )}
                                    </AlertDescription>
                                </Alert>
                            )}
                            {showScholarshipWarning && (
                                <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
                                    <Lock className="h-4 w-4 text-amber-600" />
                                    <AlertTitle className="text-amber-900 dark:text-amber-200">Aplikasi Beasiswa Diperlukan</AlertTitle>
                                    <AlertDescription className="text-amber-800 dark:text-amber-300">
                                        Silakan ajukan aplikasi beasiswa dan tunggu persetujuan admin.
                                        <Button asChild size="sm" className="mt-2 w-full" variant="secondary">
                                            <Link href={route('certification-programs.scholarship-apply', program.slug)}>Ajukan Beasiswa</Link>
                                        </Button>
                                    </AlertDescription>
                                </Alert>
                            )}
                            {regularApplication && regularApplication.status !== 'approved' && (
                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Status Dokumen: {regularApplication.status}</AlertTitle>
                                    <AlertDescription>
                                        {regularApplication.status === 'pending' ? (
                                            'Dokumen Anda sedang diverifikasi oleh admin.'
                                        ) : (
                                            <div className="space-y-2">
                                                <span className="text-red-600 dark:text-red-300 font-semibold">Dokumen Anda ditolak. Silakan ajukan ulang.</span>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    className="mt-1 w-full"
                                                    variant="secondary"
                                                    onClick={() => handlePrimaryAction()}
                                                >
                                                    {t('certificationProgram.register.btnReuploadDoc')}
                                                </Button>
                                            </div>
                                        )}
                                    </AlertDescription>
                                </Alert>
                            )}
                            {scholarshipApplication && scholarshipApplication.status !== 'approved' && (
                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Status Beasiswa: {scholarshipApplication.status}</AlertTitle>
                                    <AlertDescription>
                                        {scholarshipApplication.status === 'pending' ? (
                                            'Aplikasi beasiswa Anda sedang diverifikasi oleh admin.'
                                        ) : (
                                            <span className="text-red-600 dark:text-red-300">
                                                Aplikasi beasiswa Anda ditolak. Silakan ajukan ulang.
                                            </span>
                                        )}
                                    </AlertDescription>
                                </Alert>
                            )}

                            {guestScholarshipStatus && guestScholarshipStatus !== 'approved' && (
                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Status Beasiswa: {guestScholarshipStatus}</AlertTitle>
                                    <AlertDescription>
                                        {guestScholarshipStatus === 'pending' ? (
                                            'Aplikasi beasiswa Anda sedang diverifikasi oleh admin.'
                                        ) : (
                                            <span className="text-red-600 dark:text-red-300">
                                                Aplikasi beasiswa Anda ditolak. Silakan ajukan ulang.
                                            </span>
                                        )}
                                    </AlertDescription>
                                </Alert>
                            )}

                            {guestScholarshipStatus === 'approved' && (
                                <Alert className="border-emerald-200 bg-emerald-50">
                                    <BadgeCheck className="h-4 w-4 text-emerald-600" />
                                    <AlertTitle>Status Beasiswa: Disetujui</AlertTitle>
                                    <AlertDescription>Pengajuan beasiswa Anda telah disetujui. Silakan lanjutkan pendaftaran.</AlertDescription>
                                </Alert>
                            )}

                            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-md dark:border-zinc-700 dark:bg-zinc-800">
                                <h3 className="mb-3 font-semibold">{t('certificationProgram.register.priceSummary')}</h3>
                                <ul className="space-y-2 text-sm">
                                    {program.mentors.length > 0 && (
                                        <li className="flex items-center gap-2">
                                            <BadgeCheck size="16" className="text-green-600" />
                                            <span>Mentor: {program.mentors.map((m) => m.name).join(', ')}</span>
                                        </li>
                                    )}
                                    {program.schedules.length > 0 && (
                                        <li className="flex items-center gap-2">
                                            <BadgeCheck size="16" className="text-green-600" />
                                            <span>Mulai: {format(new Date(getDate(program.schedules[0])), 'dd MMMM yyyy', { locale: dateLocaleObj })}</span>
                                        </li>
                                    )}
                                    <li className="flex items-center gap-2">
                                        <BadgeCheck size="16" className="text-green-600" />
                                        <span>Total {t('certificationProgram.detail.register.sessionsCount', { count: program.schedules.length })}</span>
                                    </li>
                                </ul>
                                {requiresDocumentUpload && (
                                    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
                                        <p className="font-semibold">{t('certificationProgram.register.docStatusTitle')}</p>
                                        <p className="mt-1 whitespace-pre-line text-amber-800 dark:text-amber-200">
                                            {program.document_description ?? t('certificationProgram.detail.register.docRequiredDefault')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right - Pricing & CTA */}
                        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-md dark:border-zinc-700 dark:bg-zinc-800">
                            <h3 className="mb-2 font-semibold">{t('certificationProgram.register.priceSummary')}</h3>
                            {!isScholarship && displayPrice > 0 && ((installmentTerms && installmentTerms.length > 0) || (activeInstallment && !activeInstallment.is_fully_paid)) ? (
                                <Tabs
                                    value={paymentTab}
                                    onValueChange={(val) => {
                                        if (val === 'full' && activeInstallment && !activeInstallment.is_fully_paid) {
                                            toast.error('Anda sedang memiliki program cicilan berjalan. Silakan selesaikan pembayaran melalui tab Cicilan.');
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
                                            {t('certificationProgram.register.tabFull')}
                                        </TabsTrigger>
                                        <TabsTrigger
                                            value="installment"
                                            disabled={isAnyTermOverdue && !activeInstallment}
                                            className="flex items-center gap-1.5"
                                        >
                                            <span>{t('certificationProgram.register.tabInstallment')}</span>
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
                                                    : activeInstallment && !activeInstallment.is_fully_paid
                                                      ? `${activeInstallment.total_terms || activeInstallment.terms?.length}x`
                                                      : `${installmentTerms.length}x`}
                                            </Badge>
                                        </TabsTrigger>
                                    </TabsList>

                                    {/* Tab Bayar Penuh */}
                                    <TabsContent value="full" className="space-y-4 m-0">
                                        {renderPaymentForm()}
                                    </TabsContent>

                                    {/* Tab Cicilan */}
                                    <TabsContent value="installment" className="space-y-4 m-0">
                                        <InstallmentOptions
                                            productType="certification_program"
                                            productId={program.id}
                                            productPrice={program.price}
                                            terms={installmentTerms}
                                            activeInstallment={activeInstallment}
                                            termsAccepted={termsAccepted}
                                            onTermsAcceptedChange={setTermsAccepted}
                                            onBeforePay={async () => {
                                                if (!activeInstallment && !termsAccepted) {
                                                    toast.error(t('bundling.checkout.errors.termsRequired'));
                                                    return false;
                                                }
                                                if (!isLoggedIn && !isGuestFormComplete()) {
                                                    toast.error(t('bundling.checkout.errors.completePersonalData'));
                                                    return false;
                                                }
                                                const authenticated = await ensureAuthenticated();
                                                return authenticated;
                                            }}
                                        />
                                        <Button asChild variant="outline" className="w-full">
                                            <Link href={route('certification-programs.detail', program.slug)}>{t('certificationProgram.register.btnBackToDetail')}</Link>
                                        </Button>
                                    </TabsContent>
                                </Tabs>
                            ) : (
                                renderPaymentForm()
                            )}
                        </div>
                    </div>
                </div>

                <Dialog open={isDocumentDialogOpen} onOpenChange={setIsDocumentDialogOpen}>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>{t('certificationProgram.register.docDialogTitle')}</DialogTitle>
                            <DialogDescription>
                                {program.document_description ?? t('certificationProgram.register.docDialogAcceptedFormats')}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
                                <p className="font-semibold">{t('certificationProgram.register.docDialogAccepted')}</p>
                                <p className="mt-1">{t('certificationProgram.register.docDialogAcceptedFormats')}</p>
                            </div>
                            <Input type="file" accept=".pdf,image/*" onChange={(event) => setDocumentAttachment(event.target.files?.[0] ?? null)} />
                            {documentAttachment && <p className="text-muted-foreground text-sm">{t('certificationProgram.register.docDialogSelected', { fileName: documentAttachment.name })}</p>}
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDocumentDialogOpen(false)}>
                                {t('certificationProgram.register.docDialogCancel')}
                            </Button>
                            <Button type="button" onClick={handleDocumentSubmit} disabled={isLoading || !documentAttachment}>
                                {isLoading ? t('certificationProgram.register.docDialogUploading') : t('certificationProgram.register.docDialogSubmit')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </UserLayout>
    );
}
