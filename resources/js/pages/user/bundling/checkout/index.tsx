import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import UserLayout from '@/layouts/user-layout';
import { rupiahFormatter } from '@/lib/utils';
import { SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { BadgeCheck, Check, Hourglass, LoaderCircle, Package, RefreshCw, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Input } from '@/components/ui/input';
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

export default function CheckoutBundle({ bundle, hasAccess, pendingInvoiceUrl, referralInfo }: CheckoutBundleProps) {
    const { auth } = usePage<SharedData>().props;
    const isLoggedIn = !!auth.user;
    const isProfileComplete = isLoggedIn && auth.user?.phone_number;

    const [termsAccepted, setTermsAccepted] = useState(false);
    const [loading, setLoading] = useState(false);

    const transactionFee = 5000;
    const bundleDiscount = bundle.strikethrough_price - bundle.price;
    const [discountData, setDiscountData] = useState<DiscountData | null>(null);
    const discountAmount = discountData?.valid ? discountData.discount_amount : 0;
    const finalBundle = bundle.price - discountAmount;

    const [promoCode, setPromoCode] = useState('');
    const [promoLoading, setPromoLoading] = useState(false);
    const [promoError, setPromoError] = useState('');
    const totalPrice = finalBundle + transactionFee;

    useEffect(() => {
        if (!promoCode.trim()) {
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
        if (!promoCode.trim()) return;

        setPromoLoading(true);
        setPromoError('');

        try {
            const requestData: any = {
                code: promoCode,
                amount: bundle.price,
                product_type: 'bundle',
                product_id: bundle.id,
            };

            const response = await axios.post('/api/discount-codes/validate', requestData);

            if (response.data.valid) {
                setDiscountData(response.data);
                setPromoError('');
            } else {
                setDiscountData(null);
                setPromoError(response.data.message || 'Kode promo tidak valid');
            }
        } catch (error: any) {
            setDiscountData(null);
            setPromoError(error.response?.data?.message || 'Terjadi kesalahan saat memvalidasi kode promo');
        } finally {
            setPromoLoading(false);
        }
    };


    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const refFromUrl = urlParams.get('ref');

        if (refFromUrl) {
            sessionStorage.setItem('referral_code', refFromUrl);
        } else if (referralInfo.code) {
            sessionStorage.setItem('referral_code', referralInfo.code);
        }
    }, [referralInfo]);

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

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isProfileComplete) {
            alert('Profil Anda belum lengkap! Harap lengkapi nomor telepon terlebih dahulu.');
            window.location.href = route('profile.edit');
            return;
        }

        if (!termsAccepted) {
            alert('Anda harus menyetujui syarat dan ketentuan!');
            return;
        }

        setLoading(true);

        const submitPayment = async (retryCount = 0): Promise<void> => {
            const invoiceData: any = {
                bundle_id: bundle.id,
                discount_amount: bundleDiscount,
                nett_amount: finalBundle,
                transaction_fee: transactionFee,
                total_amount: totalPrice,
            };
            if (discountData?.valid) {
                invoiceData.discount_code_id = discountData.discount_code.id;
                invoiceData.discount_code_amount = discountData.discount_amount;
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
                            Checkout Paket Bundling "{bundle.title}"
                        </h2>
                        <p className="text-center text-gray-400">Silakan login terlebih dahulu untuk membeli paket bundling.</p>
                    </div>
                </section>
                <section className="mx-auto my-4 w-full max-w-7xl px-4">
                    <div className="flex h-full flex-col items-center justify-center space-y-4 rounded-lg border p-6 text-center">
                        <User size={64} className="text-blue-500" />
                        <h2 className="text-xl font-bold">Login Diperlukan</h2>
                        <p className="text-sm text-gray-500">
                            Anda perlu login terlebih dahulu untuk membeli paket bundling ini.
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
                            Profil Anda belum lengkap! Harap lengkapi nomor telepon terlebih dahulu untuk membeli paket bundling.
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
                                    <div className="space-y-2">
                                        <Label htmlFor="promo-code" className="text-sm font-medium">
                                            Punya Kode Promo?
                                        </Label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Input
                                                    id="promo-code"
                                                    type="text"
                                                    placeholder="Masukkan kode promo"
                                                    value={promoCode}
                                                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                                    className="pr-10"
                                                />
                                                {promoLoading && (
                                                    <div className="absolute top-1/2 right-3 -translate-y-1/2">
                                                        <LoaderCircle className="h-4 w-4 animate-spin text-gray-400" />
                                                    </div>
                                                )}
                                                {!promoLoading && promoCode && (
                                                    <div className="absolute top-1/2 right-3 -translate-y-1/2">
                                                        {discountData?.valid ? (
                                                            <Check className="h-5 w-5 text-green-600" />
                                                        ) : promoError ? (
                                                            <X className="h-5 w-5 text-red-600" />
                                                        ) : null}
                                                    </div>
                                                )}
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={async () => {
                                                    if (!promoCode.trim()) {
                                                        toast.error('Masukkan kode promo terlebih dahulu');
                                                        return;
                                                    }
                                                    await validatePromoCode();
                                                }}
                                                disabled={promoLoading || !promoCode.trim()}
                                                className="flex-shrink-0"
                                            >
                                                <RefreshCw className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        {promoError && <p className="text-sm text-red-600">{promoError}</p>}
                                        {discountData?.valid && (
                                            <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
                                                <div className="flex items-center gap-2">
                                                    <Check className="h-4 w-4 text-green-600" />
                                                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                                        Promo "{discountData.discount_code.code}" diterapkan!
                                                    </p>
                                                </div>
                                                <p className="mt-1 text-xs text-green-600 dark:text-green-300">
                                                    {discountData.discount_code.name}
                                                </p>
                                            </div>
                                        )}
                                    </div>

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

                                        {discountData?.valid && (
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600 dark:text-gray-400">
                                                    Diskon Promo ({discountData.discount_code.code})
                                                </span>
                                                <span className="font-semibold text-green-600">
                                                    -Rp {discountData.discount_amount.toLocaleString('id-ID')}
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
