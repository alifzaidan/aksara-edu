import { Button } from '@/components/ui/button';
import UserLayout from '@/layouts/user-layout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, BadgeCheck } from 'lucide-react';

interface Category {
    id: string;
    name: string;
}

interface Webinar {
    id: string;
    title: string;
    slug: string;
    thumbnail: string;
    category_id: string;
    category: Category;
    start_time: string;
    end_time: string;
    webinar_url: string;
    registration_url: string;
    recording_url: string | null;
    benefits: string;
    description: string | null;
    short_description: string | null;
    group_url: string | null;
    status: string;
    user_id: string;
    created_at: string;
    updated_at: string;
}

interface EnrollmentWebinarItem {
    id: string;
    invoice_id: string;
    webinar_id: string;
    webinar: Webinar;
    progress: number;
    completed_at: string | null;
    created_at: string;
    updated_at: string;
}

interface WebinarProps {
    id: string;
    invoice_code: string;
    invoice_url: string;
    amount: number;
    status: string;
    paid_at: string | null;
    user_id: string;
    webinar_items: EnrollmentWebinarItem[];
    created_at: string;
    updated_at: string;
}

function parseList(items?: string | null): string[] {
    if (!items) return [];
    const matches = items.match(/<li>(.*?)<\/li>/g);
    if (!matches) return [];
    return matches.map((li) => li.replace(/<\/?li>/g, '').trim());
}

function getYoutubeEmbedUrl(url: string): string | null {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const videoId = match && match[2].length === 11 ? match[2] : null;
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
}

export default function DetailMyWebinar({ webinar }: { webinar: WebinarProps }) {
    const webinarItem = webinar.webinar_items?.[0];
    const webinarData = webinarItem?.webinar;
    const webinarInvoiceStatus = webinar.status;
    const benefitList = parseList(webinarData.benefits);

    if (!webinarData || !webinarItem) {
        return (
            <UserLayout>
                <Head title="Webinar Tidak Ditemukan" />
                <div className="flex h-screen items-center justify-center">
                    <p>Detail webinar tidak dapat ditemukan.</p>
                </div>
            </UserLayout>
        );
    }

    const isWebinarFinished = new Date() > new Date(webinarData.start_time);

    return (
        <UserLayout>
            <Head title={webinarData.title} />
            <section className="to-background from-background via-tertiary dark:via-background dark:to-background relative bg-gradient-to-b py-12 text-gray-900 dark:text-white">
                <div className="pointer-events-none absolute top-1/2 left-1/2 z-0 flex -translate-x-1/2 -translate-y-1/2 animate-spin items-center gap-8 duration-[10s]">
                    <div className="bg-primary h-[300px] w-[300px] rounded-full blur-[200px]" />
                    <div className="bg-secondary h-[300px] w-[300px] rounded-full blur-[200px]" />
                </div>
                <div className="relative mx-auto max-w-7xl px-4 text-center">
                    <Button className="top-0 left-4 mb-4 rounded-full md:absolute md:mb-0" variant="secondary" asChild>
                        <Link href="/profile/my-webinars">
                            <ArrowLeft /> Kembali Ke Webinar Saya
                        </Link>
                    </Button>
                    <div className="col-span-2">
                        <div className="flex justify-center gap-4">
                            <span className="text-primary border-primary bg-background mb-4 w-fit rounded-full border bg-gradient-to-t from-[#D9E5FF] to-white px-4 py-1 text-sm font-medium shadow-xs">
                                📌 Enrollled in{' '}
                                {new Date(webinarItem.created_at).toLocaleDateString('id-ID', {
                                    month: 'long',
                                    year: 'numeric',
                                })}
                            </span>
                        </div>

                        <h1 className="mx-auto mb-4 max-w-2xl text-4xl leading-tight font-bold italic sm:text-5xl">{webinarData.title}</h1>

                        <p className="mb-6 text-lg text-gray-600 dark:text-gray-400">{webinarData.description}</p>

                        <div className="flex items-center justify-center gap-4">
                            <span className={`font-semibold ${webinarInvoiceStatus === 'paid' ? 'text-green-600' : 'text-red-600'}`}>
                                {webinarInvoiceStatus !== 'paid' ? 'Selesaikan Pembayaran Untuk Bergabung Webinar!!' : ''}
                            </span>
                        </div>
                    </div>
                </div>
            </section>
            <section className="mx-auto mb-12 w-full max-w-7xl px-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {isWebinarFinished ? (
                        <>
                            <div className="col-span-2 flex h-full flex-col rounded-xl bg-white p-6 shadow dark:bg-zinc-800">
                                <h1 className="text-lg font-semibold">Terima Kasih Telah Berpartisipasi!</h1>
                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                    Semoga ilmu yang didapat bermanfaat. Silakan akses kembali rekaman webinar di bawah ini.
                                </p>

                                {webinarData.recording_url && getYoutubeEmbedUrl(webinarData.recording_url) ? (
                                    <div className="mt-4">
                                        <div className="aspect-video w-full">
                                            <iframe
                                                className="h-full w-full rounded-lg border"
                                                src={getYoutubeEmbedUrl(webinarData.recording_url)!}
                                                title="Rekaman Webinar"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            />
                                        </div>
                                        <a
                                            href={webinarData.recording_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-2 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
                                        >
                                            Buka di YouTube
                                        </a>
                                    </div>
                                ) : (
                                    <p className="mt-12 text-center text-lg font-semibold text-gray-500 dark:text-gray-400">
                                        Rekaman akan segera tersedia. Mohon untuk menunggu beberapa saat.
                                    </p>
                                )}
                            </div>
                            <div className="col-span-1 flex h-full flex-col rounded-xl bg-white p-6 shadow dark:bg-zinc-800">
                                <h2 className="mb-4 text-center font-semibold">Sertifikat Partisipasi</h2>
                                <img
                                    src={'/assets/images/placeholder.png'}
                                    alt="Sertifikat"
                                    className="aspect-video rounded-xl border object-cover shadow-lg dark:border-zinc-700"
                                />
                                <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
                                    Unduh sertifikat Anda sebagai bukti keikutsertaan dalam webinar ini.
                                </p>
                                <Button className="mt-2 w-full" disabled>
                                    Unduh Sertifikat (Segera)
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="col-span-2 flex h-full flex-col rounded-xl bg-white p-6 shadow dark:bg-zinc-800">
                                <h1 className="text-lg font-semibold">Jadwal Webinar</h1>
                                <ul className="mt-2 mb-8 space-y-2">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {new Date(webinarData.start_time).toLocaleDateString('id-ID', {
                                            weekday: 'long',
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                        })}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {new Date(webinarData.start_time).toLocaleTimeString('id-ID', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                        -
                                        {new Date(webinarData.end_time).toLocaleTimeString('id-ID', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </p>
                                </ul>
                                <h1 className="text-lg font-semibold">Fasilitas yang Tersedia</h1>
                                <ul className="mt-4 mb-8 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                    {benefitList.map((benefit, idx) => (
                                        <li key={idx} className="flex items-center gap-2">
                                            <BadgeCheck size="18" className="text-green-600" />
                                            <p>{benefit}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="col-span-1 flex h-full flex-col rounded-xl bg-white p-6 shadow dark:bg-zinc-800">
                                <h2 className="mb-4 text-center font-semibold">{webinarData.title}</h2>
                                <img
                                    src={webinarData.thumbnail ? `/storage/${webinarData.thumbnail}` : '/assets/images/placeholder.png'}
                                    alt={webinarData.title}
                                    className="aspect-video rounded-xl object-cover shadow-lg"
                                />
                                <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">{webinarData.short_description}</p>
                                <Button
                                    className="mt-2 w-full"
                                    disabled={webinarInvoiceStatus !== 'paid'}
                                    onClick={() => window.open(webinarData.group_url ?? undefined, '_blank')}
                                >
                                    Gabung Grup WA
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </section>
        </UserLayout>
    );
}
