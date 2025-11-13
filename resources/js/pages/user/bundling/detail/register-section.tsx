import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { rupiahFormatter } from '@/lib/utils';
import { SharedData } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Calendar, Check, LogIn, Package, Sparkles } from 'lucide-react';

interface Bundle {
    id: string;
    title: string;
    slug: string;
    price: number;
    thumbnail?: string | null;
    registration_deadline?: string | null;
    bundle_items_count: number;
}

interface RegisterSectionProps {
    bundle: Bundle;
    totalOriginalPrice: number;
    discountAmount: number;
    discountPercentage: number;
}

export default function RegisterSection({ bundle, totalOriginalPrice, discountAmount, discountPercentage }: RegisterSectionProps) {
    const { auth } = usePage<SharedData>().props;
    const isAuthenticated = !!auth.user;

    const deadline = bundle.registration_deadline ? new Date(bundle.registration_deadline) : null;
    const isRegistrationOpen = deadline ? new Date() < deadline : true;
    const canRegister = isAuthenticated && isRegistrationOpen;

    const handleRegister = () => {
        // TODO: Implement checkout flow
        router.visit(route('bundle.checkout', bundle.slug));
    };

    return (
        <section className="mx-auto my-12 w-full max-w-5xl px-4" id="register">
            <h2 className="dark:text-primary-foreground mb-4 text-center text-3xl font-bold text-gray-900 italic md:text-4xl">
                Informasi Pendaftaran
            </h2>
            <p className="mb-8 text-center text-gray-600 dark:text-gray-400">
                Daftar sekarang dan dapatkan akses ke semua program pembelajaran dalam paket bundling ini.
            </p>

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

                    {/* Registration CTA */}
                    <div className="mt-auto space-y-3">
                        {/* Warning Messages */}
                        {!isRegistrationOpen && (
                            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center dark:border-red-800 dark:bg-red-900/20">
                                <p className="text-sm font-medium text-red-600 dark:text-red-400">⚠️ Pendaftaran sudah ditutup</p>
                            </div>
                        )}

                        {!isAuthenticated && isRegistrationOpen && (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-center dark:border-amber-800 dark:bg-amber-900/20">
                                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">🔒 Login terlebih dahulu untuk mendaftar</p>
                            </div>
                        )}

                        {/* Registration Button */}
                        {!isAuthenticated ? (
                            <Button className="w-full" size="lg" asChild>
                                <Link href={route('login')}>
                                    <LogIn className="mr-2 h-4 w-4" />
                                    Login untuk Mendaftar
                                </Link>
                            </Button>
                        ) : (
                            <Button className="w-full" size="lg" onClick={handleRegister} disabled={!canRegister}>
                                <Package className="mr-2 h-4 w-4" />
                                {canRegister ? 'Daftar Sekarang' : 'Pendaftaran Ditutup'}
                            </Button>
                        )}

                        <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                            {isAuthenticated ? 'Anda akan diarahkan ke halaman checkout' : 'Login terlebih dahulu untuk melanjutkan'}
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
