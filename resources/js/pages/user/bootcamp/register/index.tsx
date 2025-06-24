import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserLayout from '@/layouts/user-layout';
import { Head } from '@inertiajs/react';
import { BadgeCheck } from 'lucide-react';
import { useState } from 'react';

interface Bootcamp {
    id: string;
    title: string;
    schedules?: { day: string; start_time: string; end_time: string }[];
    start_date: string;
    end_date: string;
    price: number;
    thumbnail?: string | null;
    description?: string | null;
    benefits?: string | null;
    requirements?: string | null;
    curriculum?: string | null;
}

function parseList(items?: string | null): string[] {
    if (!items) return [];
    const matches = items.match(/<li>(.*?)<\/li>/g);
    if (!matches) return [];
    return matches.map((li) => li.replace(/<\/?li>/g, '').trim());
}

export default function RegisterBootcamp({ bootcamp }: { bootcamp: Bootcamp }) {
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [loading, setLoading] = useState(false);
    const requirementList = parseList(bootcamp.requirements);
    const benefitList = parseList(bootcamp.benefits);
    const curriculumList = parseList(bootcamp.curriculum);

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!termsAccepted) {
            alert('Anda harus menyetujui syarat dan ketentuan!');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(route('invoice.store'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                credentials: 'same-origin',
                body: JSON.stringify({ type: 'bootcamp', id: bootcamp.id }),
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
                                            <p>{benefit}</p>
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
                                            <p>{requirement}</p>
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
                                            <p>{curriculum}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </TabsContent>
                    </Tabs>

                    <form onSubmit={handleCheckout}>
                        <h2 className="my-2 text-xl font-bold italic">Detail Pembayaran</h2>
                        <div className="space-y-4 rounded-lg border p-4">
                            <Input type="text" placeholder="Masukkan Kode Promo (Opsional)" className="w-full" />
                            <div className="space-y-2 rounded-lg border p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Harga Normal</span>
                                    <span className="font-semibold text-gray-500">Rp 999.000</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Harga Bootcamp</span>
                                    <span className="font-semibold text-gray-500">Rp {bootcamp.price.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Pajak</span>
                                    <span className="font-semibold text-gray-500">Rp 11.000</span>
                                </div>
                                <Separator className="my-2" />
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Harga Total</span>
                                    <span className="text-xl font-bold">Rp {bootcamp.price.toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Checkbox id="terms" checked={termsAccepted} onCheckedChange={(checked) => setTermsAccepted(checked === true)} />
                                <Label htmlFor="terms">Accept terms and conditions</Label>
                            </div>
                            <Button className="w-full" type="submit" disabled={!termsAccepted || loading}>
                                {loading ? 'Memproses...' : 'Bayar Sekarang'}
                            </Button>
                        </div>
                    </form>
                </div>
            </section>
        </UserLayout>
    );
}
