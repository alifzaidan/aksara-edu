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

interface Course {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    slug: string;
    price: number;
    key_points?: string | null;
    level: 'beginner' | 'intermediate' | 'advanced';
    modules?: {
        title: string;
        description?: string | null;
        lessons?: {
            title: string;
            description?: string | null;
            type: 'text' | 'video' | 'file' | 'quiz';
            attachment?: string | null;
            video_url?: string | null;
            is_free?: boolean;
        }[];
    }[];
}

function getYoutubeId(url: string) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : '';
}

function parseList(items?: string | null): string[] {
    if (!items) return [];
    const matches = items.match(/<li>(.*?)<\/li>/g);
    if (!matches) return [];
    return matches.map((li) => li.replace(/<\/?li>/g, '').trim());
}

export default function CheckoutCourse({ course }: { course: Course }) {
    const firstVideoLesson = course.modules?.flatMap((module) => module.lessons || []).find((lesson) => lesson.type === 'video' && lesson.video_url);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [loading, setLoading] = useState(false);
    const keyPointList = parseList(course.key_points);

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
                body: JSON.stringify({ type: 'course', id: course.id }),
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
            <Head title="Checkout Kelas" />
            <section className="to-primary w-full bg-gradient-to-tl from-black px-4">
                <div className="mx-auto my-12 w-full max-w-7xl px-4">
                    <h2 className="mx-auto mb-4 max-w-3xl bg-gradient-to-r from-[#71D0F7] via-white to-[#E6834A] bg-clip-text text-center text-3xl font-bold text-transparent italic sm:text-4xl">
                        Checkout Kelas "{course.title}"
                    </h2>
                    <p className="text-center text-gray-400">Silakan selesaikan pembayaran untuk mengakses materi kelas.</p>
                </div>
            </section>
            <section className="mx-auto my-4 w-full max-w-7xl px-4">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
                    <Tabs defaultValue="detail" className="lg:col-span-2">
                        <TabsList>
                            <TabsTrigger value="detail">Detail Kelas</TabsTrigger>
                            <TabsTrigger value="preview">Preview Video</TabsTrigger>
                        </TabsList>
                        <TabsContent value="detail">
                            <div className="h-full rounded-lg border p-4">
                                <h2 className="text-3xl font-bold italic">Yang akan kamu pelajari</h2>
                                <p className="mt-2 mb-4 text-sm text-gray-600">
                                    Berikut adalah beberapa poin penting yang akan kamu pelajari dalam kelas "{course.title}".
                                </p>
                                <ul className="space-y-2">
                                    {keyPointList.map((keyPoint, idx) => (
                                        <li key={idx} className="flex items-center gap-2">
                                            <BadgeCheck size="18" className="text-green-600" />
                                            <p>{keyPoint}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </TabsContent>
                        <TabsContent value="preview">
                            <div className="h-full rounded-lg border p-4">
                                <h2 className="text-3xl font-bold italic">Preview Video</h2>
                                <p className="mt-2 mb-4 text-sm text-gray-600">
                                    Berikut adalah preview video dari kelas "{course.title}". Silakan tonton untuk mendapatkan gambaran materi yang
                                    akan dipelajari.
                                </p>
                                <div className="aspect-video w-full">
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        src={
                                            firstVideoLesson?.video_url &&
                                            (firstVideoLesson.video_url.includes('youtube.com') || firstVideoLesson.video_url.includes('youtu.be'))
                                                ? `https://www.youtube.com/embed/${getYoutubeId(firstVideoLesson.video_url)}`
                                                : ''
                                        }
                                        title="YouTube video player"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        className="h-full w-full rounded-xl"
                                    ></iframe>
                                </div>
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
                                    <span className="text-gray-600">Harga Kelas</span>
                                    <span className="font-semibold text-gray-500">Rp {course.price.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Pajak</span>
                                    <span className="font-semibold text-gray-500">Rp 11.000</span>
                                </div>
                                <Separator className="my-2" />
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Harga Total</span>
                                    <span className="text-xl font-bold">Rp {course.price.toLocaleString()}</span>
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
