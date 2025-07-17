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

interface Bootcamp {
    id: string;
    title: string;
    schedules?: { day: string; start_time: string; end_time: string }[];
    start_date: string;
    end_date: string;
    strikethrough_price: number;
    price: number;
    thumbnail?: string | null;
    description?: string | null;
    benefits?: string | null;
    requirements?: string | null;
    curriculum?: string | null;
    group_url?: string | null;
}

function parseList(items?: string | null): string[] {
    if (!items) return [];
    const matches = items.match(/<li>(.*?)<\/li>/g);
    if (!matches) return [];
    return matches.map((li) => li.replace(/<\/?li>/g, '').trim());
}

export default function RegisterBootcamp({
    bootcamp,
    hasAccess,
    pendingInvoiceUrl,
}: {
    bootcamp: Bootcamp;
    hasAccess: boolean;
    pendingInvoiceUrl?: string | null;
}) {
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [loading, setLoading] = useState(false);

    const [showFreeForm, setShowFreeForm] = useState(false);
    const [freeFormData, setFreeFormData] = useState({
        ig_follow_proof: null as File | null,
        tiktok_follow_proof: null as File | null,
        tag_friend_proof: null as File | null,
    });

    const requirementList = parseList(bootcamp.requirements);
    const benefitList = parseList(bootcamp.benefits);
    const curriculumList = parseList(bootcamp.curriculum);
    const isFree = bootcamp.price === 0;

    const transactionFee = 5000;
    const totalPrice = isFree ? 0 : bootcamp.price + transactionFee;

    const handleFreeCheckout = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!freeFormData.ig_follow_proof || !freeFormData.tiktok_follow_proof || !freeFormData.tag_friend_proof) {
            alert('Harap upload semua bukti yang diperlukan!');
            return;
        }

        setLoading(true);

        const formData = new FormData();
        formData.append('type', 'bootcamp');
        formData.append('id', bootcamp.id);
        formData.append('ig_follow_proof', freeFormData.ig_follow_proof);
        formData.append('tiktok_follow_proof', freeFormData.tiktok_follow_proof);
        formData.append('tag_friend_proof', freeFormData.tag_friend_proof);

        try {
            const res = await fetch(route('enroll.free'), {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: formData,
            });
            const data = await res.json();
            if (res.ok && data.redirect_url) {
                window.location.href = data.redirect_url;
            } else {
                alert(data.message || 'Gagal mendaftar bootcamp gratis.');
            }
        } catch {
            alert('Terjadi kesalahan saat proses pendaftaran.');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!termsAccepted && !isFree) {
            alert('Anda harus menyetujui syarat dan ketentuan!');
            return;
        }
        setLoading(true);

        if (isFree) {
            setShowFreeForm(true);
            setLoading(false);
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
                body: JSON.stringify({
                    type: 'bootcamp',
                    id: bootcamp.id,
                    discount_amount: bootcamp.strikethrough_price || 0,
                    nett_amount: bootcamp.price,
                    transaction_fee: transactionFee,
                    total_amount: totalPrice,
                }),
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
            <Head title="Daftar Bootcamp" />
            <section className="to-primary w-full bg-gradient-to-tl from-black px-4">
                <div className="mx-auto my-12 w-full max-w-7xl px-4">
                    <h2 className="mx-auto mb-4 max-w-3xl bg-gradient-to-r from-[#71D0F7] via-white to-[#E6834A] bg-clip-text text-center text-3xl font-bold text-transparent italic sm:text-4xl">
                        Daftar Bootcamp "{bootcamp.title}"
                    </h2>
                    <p className="text-center text-gray-400">Silakan selesaikan pembayaran untuk mendaftar bootcamp.</p>
                </div>
            </section>
            <section className="mx-auto my-4 w-full max-w-7xl px-4">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
                    <Tabs defaultValue="detail" className="lg:col-span-2">
                        <TabsList>
                            <TabsTrigger value="detail">Detail Bootcamp</TabsTrigger>
                            <TabsTrigger value="curriculum">Kurikulum Bootcamp</TabsTrigger>
                        </TabsList>
                        <TabsContent value="detail">
                            <div className="h-full rounded-lg border p-4">
                                <h2 className="text-3xl font-bold italic">Yang akan kamu dapatkan</h2>
                                <p className="mt-2 mb-4 text-sm text-gray-600">Manfaat yang akan kamu peroleh setelah mengikuti bootcamp ini.</p>
                                <ul className="space-y-2">
                                    {benefitList.map((benefit, idx) => (
                                        <li key={idx} className="flex items-center gap-2">
                                            <BadgeCheck size="18" className="text-green-600" />
                                            <p className="text-sm md:text-base">{benefit}</p>
                                        </li>
                                    ))}
                                </ul>
                                <h2 className="mt-6 text-3xl font-bold italic">Persyaratan Peserta</h2>
                                <p className="mt-2 mb-4 text-sm text-gray-600">
                                    Pastikan kamu memenuhi persyaratan berikut sebelum mendaftar bootcamp ini.
                                </p>
                                <ul className="space-y-2">
                                    {requirementList.map((requirement, idx) => (
                                        <li key={idx} className="flex items-center gap-2">
                                            <BadgeCheck size="18" className="text-green-600" />
                                            <p className="text-sm md:text-base">{requirement}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </TabsContent>
                        <TabsContent value="curriculum">
                            <div className="h-full rounded-lg border p-4">
                                <h2 className="text-3xl font-bold italic">Kurikulum</h2>
                                <p className="mt-2 mb-4 text-sm text-gray-600">
                                    Berikut adalah daftar materi yang akan dipelajari selama bootcamp ini.
                                </p>
                                <ul className="space-y-2">
                                    {curriculumList.map((curriculum, idx) => (
                                        <li key={idx} className="flex items-center gap-2">
                                            <p className="font-semibold">{idx + 1}.</p>
                                            <p className="text-sm md:text-base">{curriculum}</p>
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
                            <p className="text-sm text-gray-500">Anda sudah terdaftar di bootcamp ini. Silakan masuk ke dalam grup.</p>
                            <Button asChild className="w-full">
                                <a href={bootcamp.group_url ?? ''} target="_blank" rel="noopener noreferrer">
                                    Masuk Group Bootcamp
                                </a>
                            </Button>
                        </div>
                    ) : pendingInvoiceUrl ? (
                        <div className="flex h-full flex-col items-center justify-center space-y-4 rounded-lg border p-6 text-center">
                            <Hourglass size={64} className="text-yellow-500" />
                            <h2 className="text-xl font-bold">Pembayaran Tertunda</h2>
                            <p className="text-sm text-gray-500">
                                Anda memiliki pembayaran yang belum selesai untuk bootcamp ini. Silakan lanjutkan untuk membayar.
                            </p>
                            <Button asChild className="w-full">
                                <a href={pendingInvoiceUrl}>Lanjutkan Pembayaran</a>
                            </Button>
                        </div>
                    ) : !showFreeForm ? (
                        <form onSubmit={handleCheckout}>
                            <h2 className="my-2 text-xl font-bold italic">Detail {isFree ? 'Pendaftaran' : 'Pembayaran'}</h2>
                            <div className="space-y-4 rounded-lg border p-4">
                                {isFree ? (
                                    <div className="space-y-2 text-center">
                                        <div className="flex items-center justify-between p-4">
                                            <span className="w-full text-2xl font-bold text-green-600">BOOTCAMP GRATIS</span>
                                        </div>
                                        <p className="text-sm text-gray-600">Untuk mendapatkan akses gratis, Anda perlu:</p>
                                        <ul className="space-y-1 text-left text-sm">
                                            <li>• Follow Instagram kami</li>
                                            <li>• Follow TikTok kami</li>
                                            <li>• Tag 3 teman di postingan Instagram kami</li>
                                        </ul>
                                        <p className="text-xs text-gray-500">Upload bukti follow dan tag untuk mendapatkan akses</p>
                                    </div>
                                ) : (
                                    <>
                                        <Input type="text" placeholder="Masukkan Kode Promo (Opsional)" className="w-full" />
                                        <div className="space-y-2 rounded-lg border p-4">
                                            {bootcamp.strikethrough_price > 0 && (
                                                <>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-gray-600">Harga Asli</span>
                                                        <span className="font-semibold text-gray-500 line-through">
                                                            Rp {bootcamp.strikethrough_price.toLocaleString('id-ID')}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-gray-600">Diskon</span>
                                                        <span className="font-semibold text-red-500">
                                                            -Rp {(bootcamp.strikethrough_price - bootcamp.price).toLocaleString('id-ID')}
                                                        </span>
                                                    </div>
                                                    <Separator className="my-2" />
                                                </>
                                            )}
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-600">Harga Bootcamp</span>
                                                <span className="font-semibold text-gray-500">Rp {bootcamp.price.toLocaleString('id-ID')}</span>
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
                                    </>
                                )}

                                {!isFree && (
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
                                )}
                                <Button className="w-full" type="submit" disabled={(isFree ? false : !termsAccepted) || loading}>
                                    {loading ? 'Memproses...' : isFree ? 'Upload Bukti Follow' : 'Lanjutkan Pembayaran'}
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleFreeCheckout}>
                            <h2 className="my-2 text-xl font-bold italic">Upload Bukti Follow & Tag</h2>
                            <div className="space-y-4 rounded-lg border p-4">
                                <div>
                                    <Label>Bukti Follow Instagram</Label>
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) =>
                                            setFreeFormData((prev) => ({
                                                ...prev,
                                                ig_follow_proof: e.target.files?.[0] || null,
                                            }))
                                        }
                                        required
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Screenshot halaman profil Instagram kami yang menunjukkan Anda sudah follow
                                    </p>
                                </div>

                                <div>
                                    <Label>Bukti Follow TikTok</Label>
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) =>
                                            setFreeFormData((prev) => ({
                                                ...prev,
                                                tiktok_follow_proof: e.target.files?.[0] || null,
                                            }))
                                        }
                                        required
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Screenshot halaman profil TikTok kami yang menunjukkan Anda sudah follow
                                    </p>
                                </div>

                                <div>
                                    <Label>Bukti Tag 3 Teman di Instagram</Label>
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) =>
                                            setFreeFormData((prev) => ({
                                                ...prev,
                                                tag_friend_proof: e.target.files?.[0] || null,
                                            }))
                                        }
                                        required
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Screenshot postingan Instagram kami yang menunjukkan Anda sudah tag 3 teman di komentar
                                    </p>
                                </div>

                                <div className="flex gap-2">
                                    <Button type="button" variant="outline" onClick={() => setShowFreeForm(false)} className="flex-1">
                                        Kembali
                                    </Button>
                                    <Button type="submit" disabled={loading} className="flex-1">
                                        {loading ? 'Memproses...' : 'Dapatkan Akses Gratis'}
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
