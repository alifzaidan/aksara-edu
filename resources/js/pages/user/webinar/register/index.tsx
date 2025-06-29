import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserLayout from '@/layouts/user-layout';
import { Head } from '@inertiajs/react';
import { BadgeCheck, Hourglass } from 'lucide-react';
import { useState } from 'react';

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
}

function parseList(items?: string | null): string[] {
    if (!items) return [];
    const matches = items.match(/<li>(.*?)<\/li>/g);
    if (!matches) return [];
    return matches.map((li) => li.replace(/<\/?li>/g, '').trim());
}

export default function RegisterWebinar({
    webinar,
    hasAccess,
    pendingInvoiceUrl,
}: {
    webinar: Webinar;
    hasAccess: boolean;
    pendingInvoiceUrl?: string | null;
}) {
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [loading, setLoading] = useState(false);
    const benefitList = parseList(webinar.benefits);
    const isFree = webinar.price === 0;

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!termsAccepted && !isFree) {
            alert('Anda harus menyetujui syarat dan ketentuan!');
            return;
        }
        setLoading(true);

        if (isFree) {
            try {
                const res = await fetch(route('enroll.free'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                    },
                    body: JSON.stringify({ type: 'webinar', id: webinar.id }),
                });
                const data = await res.json();
                if (res.ok && data.redirect_url) {
                    window.location.href = data.redirect_url;
                } else {
                    alert(data.message || 'Gagal mendaftar kelas gratis.');
                }
            } catch {
                alert('Terjadi kesalahan saat proses pendaftaran.');
            } finally {
                setLoading(false);
            }
            return;
        }

        try {
            const res = await fetch(route('invoice.store'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                credentials: 'same-origin',
                body: JSON.stringify({ type: 'webinar', id: webinar.id }),
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert('Gagal membuat invoice.');
            }
        } catch {
            alert('Terjadi kesalahan saat proses pembayaran.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <UserLayout>
            <Head title="Daftar Webinar" />
            <section className="to-primary w-full bg-gradient-to-tl from-black px-4">
                <div className="mx-auto my-12 w-full max-w-7xl px-4">
                    <h2 className="mx-auto mb-4 max-w-3xl bg-gradient-to-r from-[#71D0F7] via-white to-[#E6834A] bg-clip-text text-center text-3xl font-bold text-transparent italic sm:text-4xl">
                        Daftar Webinar "{webinar.title}"
                    </h2>
                    <p className="text-center text-gray-400">Silakan selesaikan pembayaran untuk mendaftar webinar.</p>
                </div>
            </section>
            <section className="mx-auto my-4 w-full max-w-7xl px-4">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
                    <Tabs defaultValue="detail" className="lg:col-span-2">
                        <TabsList>
                            <TabsTrigger value="detail">Detail Webinar</TabsTrigger>
                        </TabsList>
                        <TabsContent value="detail">
                            <div className="h-full rounded-lg border p-4">
                                <h2 className="text-3xl font-bold italic">Yang akan kamu dapatkan</h2>
                                <p className="mt-2 mb-4 text-sm text-gray-600">Manfaat yang akan kamu peroleh setelah mengikuti webinar ini.</p>
                                <ul className="space-y-2">
                                    {benefitList.map((benefit, idx) => (
                                        <li key={idx} className="flex items-center gap-2">
                                            <BadgeCheck size="18" className="text-green-600" />
                                            <p>{benefit}</p>
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
                            <p className="text-sm text-gray-500">Anda sudah terdaftar di webinar ini. Silakan masuk ke dalam grup.</p>
                            <Button asChild className="w-full">
                                <a href={webinar.group_url ?? ''} target="_blank" rel="noopener noreferrer">
                                    Masuk Group Webinar
                                </a>
                            </Button>
                        </div>
                    ) : pendingInvoiceUrl ? (
                        <div className="flex h-full flex-col items-center justify-center space-y-4 rounded-lg border p-6 text-center">
                            <Hourglass size={64} className="text-yellow-500" />
                            <h2 className="text-xl font-bold">Pembayaran Tertunda</h2>
                            <p className="text-sm text-gray-500">
                                Anda memiliki pembayaran yang belum selesai untuk kelas ini. Silakan lanjutkan untuk membayar.
                            </p>
                            <Button asChild className="w-full">
                                <a href={pendingInvoiceUrl}>Lanjutkan Pembayaran</a>
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleCheckout}>
                            <h2 className="my-2 text-xl font-bold italic">Detail Pembayaran</h2>
                            <div className="space-y-4 rounded-lg border p-4">
                                {isFree ? (
                                    <div className="flex items-center justify-between p-4 text-center">
                                        <span className="w-full text-2xl font-bold text-green-600">KELAS GRATIS</span>
                                    </div>
                                ) : (
                                    <>
                                        <Input type="text" placeholder="Masukkan Kode Promo (Opsional)" className="w-full" />
                                        <div className="space-y-2 rounded-lg border p-4">
                                            {webinar.strikethrough_price > 0 && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-600">Harga Asli</span>
                                                    <span className="font-semibold text-gray-500">
                                                        Rp {webinar.strikethrough_price.toLocaleString('id-ID')}
                                                    </span>
                                                </div>
                                            )}
                                            {webinar.strikethrough_price > 0 && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-600">Diskon</span>
                                                    <span className="font-semibold text-red-500">
                                                        -Rp {(webinar.strikethrough_price - webinar.price).toLocaleString('id-ID')}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-600">Harga Kelas</span>
                                                <span className="font-semibold text-gray-500">Rp {webinar.price.toLocaleString('id-ID')}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-600">Pajak</span>
                                                <span className="font-semibold text-gray-500">+Rp 0</span>
                                            </div>
                                            <Separator className="my-2" />
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-600">Harga Total</span>
                                                <span className="text-xl font-bold">Rp {webinar.price.toLocaleString('id-ID')}</span>
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
                                        <Label htmlFor="terms">Saya menyetujui syarat dan ketentuan</Label>
                                    </div>
                                )}
                                <Button className="w-full" type="submit" disabled={(isFree ? false : !termsAccepted) || loading}>
                                    {loading ? 'Memproses...' : isFree ? 'Dapatkan Akses Gratis Sekarang' : 'Bayar Sekarang'}
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </section>
        </UserLayout>
    );
}
