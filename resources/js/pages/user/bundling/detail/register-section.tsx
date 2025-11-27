import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { rupiahFormatter } from '@/lib/utils';
import { SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { AlertTriangle, Calendar, Check, Package, Sparkles } from 'lucide-react';

interface Bundle {
    id: string;
    title: string;
    slug: string;
    price: number;
    thumbnail?: string | null;
    registration_deadline?: string | null;
    registration_url: string;
    bundle_items_count: number;
}

interface OwnedItem {
    id: string;
    title: string;
    type: string;
}

interface RegisterSectionProps {
    bundle: Bundle;
    totalOriginalPrice: number;
    discountAmount: number;
    discountPercentage: number;
    hasOwnedItems: boolean;
    ownedItems: OwnedItem[];
}

export default function RegisterSection({
    bundle,
    totalOriginalPrice,
    discountAmount,
    discountPercentage,
    hasOwnedItems,
    ownedItems,
}: RegisterSectionProps) {
    const { auth } = usePage<SharedData>().props;

    const deadline = bundle.registration_deadline ? new Date(bundle.registration_deadline) : null;

    const isLoggedIn = !!auth.user;
    const isProfileComplete = isLoggedIn && auth.user?.phone_number;

    let registrationUrl: string;
    let buttonText: string;
    let warningMessage: string | null = null;
    let isDisabled = false;

    if (hasOwnedItems) {
        registrationUrl = '#';
        buttonText = 'Tidak Dapat Mendaftar';
        warningMessage = 'Anda sudah memiliki beberapa produk dalam bundle ini!';
        isDisabled = true;
    } else if (!isLoggedIn) {
        registrationUrl = bundle.registration_url;
        buttonText = 'Login untuk Mendaftar';
        warningMessage = 'Anda harus login terlebih dahulu!';
    } else if (!isProfileComplete) {
        registrationUrl = route('profile.edit', { redirect: window.location.href });
        buttonText = 'Lengkapi Profil untuk Mendaftar';
        warningMessage = 'Profil Anda belum lengkap!';
    } else {
        registrationUrl = bundle.registration_url;
        buttonText = 'Daftar Sekarang';
        warningMessage = null;
    }

    return (
        <section className="mx-auto my-12 w-full max-w-5xl px-4" id="register">
            <h2 className="dark:text-primary-foreground mb-4 text-center text-3xl font-bold text-gray-900 italic md:text-4xl">
                Informasi Pendaftaran
            </h2>
            <p className="mb-8 text-center text-gray-600 dark:text-gray-400">
                Daftar sekarang dan dapatkan akses ke semua program pembelajaran dalam paket bundling ini.
            </p>

            {/* ✅ Warning if user already owns items */}
            {hasOwnedItems && (
                <Alert variant="destructive" className="mb-6">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        <p className="mb-2 font-semibold">Anda sudah memiliki produk berikut dalam bundle ini:</p>
                        <ul className="ml-4 list-disc space-y-1">
                            {ownedItems.map((item) => (
                                <li key={item.id}>
                                    <span className="font-medium">{item.type}:</span> {item.title}
                                </li>
                            ))}
                        </ul>
                        <p className="mt-2 text-sm">Untuk menghindari duplikasi, Anda tidak dapat membeli bundle ini.</p>
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Left Column - Image & Benefits */}
                <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-md dark:border-zinc-700 dark:bg-zinc-800">
                    <img
                        src={bundle.thumbnail ? `/storage/${bundle.thumbnail}` : '/assets/images/placeholder.png'}
                        alt={bundle.title}
                        className="rounded-lg border border-gray-200 shadow-md"
                    />

                    <div className="space-y-3">
                        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                            <Sparkles className="text-primary h-5 w-5" />
                            Keuntungan Paket Bundling
                        </h3>
                        <ul className="space-y-2">
                            <li className="flex items-start gap-2 text-sm">
                                <Check size="16" className="mt-0.5 flex-shrink-0 text-green-600" />
                                <p>Hemat {discountPercentage}% dari harga normal</p>
                            </li>
                            <li className="flex items-start gap-2 text-sm">
                                <Check size="16" className="mt-0.5 flex-shrink-0 text-green-600" />
                                <p>Akses ke {bundle.bundle_items_count} program pembelajaran sekaligus</p>
                            </li>
                            <li className="flex items-start gap-2 text-sm">
                                <Check size="16" className="mt-0.5 flex-shrink-0 text-green-600" />
                                <p>Sertifikat untuk semua program yang diselesaikan</p>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Right Column - Price & Registration */}
                <div className="flex flex-col rounded-lg border border-gray-200 bg-white p-6 shadow-md dark:border-zinc-700 dark:bg-zinc-800">
                    <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Detail Harga Paket</h3>

                    {/* Price Comparison */}
                    <div className="mb-4 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Harga Normal:</span>
                            <span className="text-sm text-gray-500 line-through dark:text-gray-400">
                                {rupiahFormatter.format(totalOriginalPrice)}
                            </span>
                        </div>

                        {discountAmount > 0 && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Hemat:</span>
                                <Badge className="bg-green-500 text-white">
                                    - {rupiahFormatter.format(discountAmount)} ({discountPercentage}%)
                                </Badge>
                            </div>
                        )}
                    </div>

                    <Separator className="my-4" />

                    {/* Final Price */}
                    <div className="mb-6">
                        <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">Harga Bundling:</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-primary text-4xl font-bold italic">{rupiahFormatter.format(bundle.price)}</span>
                        </div>
                    </div>

                    <Separator className="my-4" />

                    {/* Bundle Info */}
                    <ul className="mb-6 space-y-3">
                        <li className="flex items-center gap-2 text-sm">
                            <Package size="16" className="text-primary dark:text-secondary flex-shrink-0" />
                            <p>
                                Total: <span className="font-medium">{bundle.bundle_items_count} Program Pembelajaran</span>
                            </p>
                        </li>

                        {deadline && (
                            <li className="flex items-start gap-2 text-sm">
                                <Calendar size="16" className="text-primary dark:text-secondary mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-medium">Batas Pendaftaran:</p>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        {format(deadline, "EEEE, dd MMMM yyyy 'pukul' HH:mm", { locale: id })} WIB
                                    </p>
                                </div>
                            </li>
                        )}
                    </ul>

                    <div className="mt-auto">
                        {warningMessage && (
                            <p className={`mb-2 text-center text-sm ${hasOwnedItems ? 'font-semibold text-red-600' : 'text-red-500'}`}>
                                {warningMessage}
                            </p>
                        )}
                        <Button className="w-full" asChild={!isDisabled} disabled={isDisabled}>
                            {isDisabled ? <span>{buttonText}</span> : <Link href={registrationUrl}>{buttonText}</Link>}
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}
