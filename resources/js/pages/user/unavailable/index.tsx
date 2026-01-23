import { Button } from '@/components/ui/button';
import UserLayout from '@/layouts/user-layout';
import { Head, Link } from '@inertiajs/react';
import { AlertTriangle } from 'lucide-react';

interface UnavailableItem {
    title?: string;
    slug?: string;
    status?: string;
}

export default function UnavailablePage({
    title,
    item,
    message,
    adminWhatsappUrl,
    backUrl,
    backLabel,
}: {
    title?: string;
    item?: UnavailableItem;
    message?: string;
    adminWhatsappUrl: string;
    backUrl?: string;
    backLabel?: string;
}) {
    const pageTitle = title || 'Tidak Tersedia';
    const itemTitle = item?.title ? `"${item.title}"` : 'Halaman ini';

    return (
        <UserLayout>
            <Head title={pageTitle} />

            <section className="to-primary w-full bg-gradient-to-tl from-black px-4">
                <div className="mx-auto my-12 w-full max-w-7xl px-4">
                    <h2 className="mx-auto mb-4 max-w-3xl bg-gradient-to-r from-[#71D0F7] via-white to-[#E6834A] bg-clip-text text-center text-3xl font-bold text-transparent italic sm:text-4xl">
                        {pageTitle}
                    </h2>
                    <p className="text-center text-gray-400">{itemTitle} saat ini belum bisa diakses.</p>
                </div>
            </section>

            <section className="mx-auto my-4 w-full max-w-7xl px-4">
                <div className="flex h-full flex-col items-center justify-center space-y-4 rounded-lg border p-6 text-center">
                    <AlertTriangle size={64} className="text-yellow-500" />
                    <h2 className="text-xl font-bold">{message || 'Tidak tersedia. Silahkan hubungi admin.'}</h2>
                    <p className="text-sm text-gray-500">Jika Anda merasa ini kesalahan, silakan hubungi admin untuk bantuan lebih lanjut.</p>

                    <div className="flex w-full max-w-md gap-2">
                        <Button asChild variant="outline" className="flex-1">
                            {backUrl ? <Link href={backUrl}>{backLabel || 'Kembali'}</Link> : <Link href="/">{backLabel || 'Kembali'}</Link>}
                        </Button>
                        <Button asChild className="flex-1">
                            <a href={adminWhatsappUrl} target="_blank" rel="noopener noreferrer">
                                Hubungi Admin
                            </a>
                        </Button>
                    </div>
                </div>
            </section>
        </UserLayout>
    );
}
