import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spotlight } from '@/components/ui/spotlight';
import ProfileLayout from '@/layouts/profile/layout';
import UserLayout from '@/layouts/user-layout';
import { Head, Link } from '@inertiajs/react';
import { CheckCircle } from 'lucide-react';
import { useState } from 'react';

interface CertificationProgram {
    id: string;
    title: string;
    slug: string;
    thumbnail?: string | null;
}

interface EnrollmentCertificationProgram {
    id: string;
    certificationProgram: CertificationProgram;
    price: number;
    is_scholarship: boolean;
}

interface Invoice {
    id: string;
    invoice_code: string;
    invoice_url: string;
    amount: number;
    status: 'paid' | 'pending' | 'expired' | 'failed' | 'completed';
    paid_at: string | null;
    payment_channel: string | null;
    payment_method: string | null;
    certificationProgramItems: EnrollmentCertificationProgram[];
    created_at: string;
}

interface Props {
    myCertificationPrograms: Invoice[];
}

export default function CertificationProgramIndex({ myCertificationPrograms }: Props) {
    const [search, setSearch] = useState('');
    const [visibleCount, setVisibleCount] = useState(6);

    const allItems = myCertificationPrograms.flatMap((invoice) =>
        (invoice.certificationProgramItems || [])
            .map((item) => {
                if (!item?.certificationProgram) {
                    return null;
                }
                return {
                    title: item.certificationProgram.title,
                    slug: item.certificationProgram.slug,
                    thumbnail: item.certificationProgram.thumbnail,
                    price: item.price,
                    is_scholarship: item.is_scholarship,
                    invoice_id: invoice.id,
                    invoice_code: invoice.invoice_code,
                    invoice_status: invoice.status,
                    invoice_url: invoice.invoice_url,
                    paid_at: invoice.paid_at,
                    payment_channel: invoice.payment_channel,
                    payment_method: invoice.payment_method,
                    created_at: invoice.created_at,
                };
            })
            .filter((item): item is Exclude<typeof item, null> => item !== null),
    );

    const filteredItems = allItems.filter((item) => item.title.toLowerCase().includes(search.toLowerCase()));
    const visibleItems = filteredItems.slice(0, visibleCount);

    return (
        <UserLayout>
            <Head title="Sertifikasi Saya" />
            <ProfileLayout>
                <Heading title="Sertifikasi Saya" description="Lihat semua program sertifikasi yang sudah Anda beli." />
                <div className="mb-4 flex justify-between gap-2">
                    <Input type="search" placeholder="Cari program sertifikasi..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {visibleItems.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center gap-4 py-12">
                            <img src="/assets/images/not-found.webp" alt="Sertifikasi Belum Tersedia" className="w-48" />
                            <div className="text-center text-gray-500">Belum ada program sertifikasi yang tersedia saat ini.</div>
                        </div>
                    ) : (
                        visibleItems.map((item, idx) => (
                            <Link
                                key={idx}
                                href={route('profile.certification-program.detail', { program: item.slug })}
                                className="relative overflow-hidden rounded-xl bg-zinc-300/30 p-[2px] dark:bg-zinc-700/30"
                            >
                                <Spotlight className="bg-primary blur-2xl" size={284} />
                                <div className="bg-sidebar relative flex h-full w-full flex-col items-center justify-center rounded-lg dark:bg-zinc-800">
                                    <div className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-lg">
                                        <CheckCircle className="h-3 w-3" />
                                        {item.is_scholarship ? 'Beasiswa' : 'Reguler'}
                                    </div>

                                    <img
                                        src={item.thumbnail ? `/storage/${item.thumbnail}` : '/assets/images/placeholder.png'}
                                        alt={item.title}
                                        className="h-48 w-full rounded-t-lg object-cover"
                                    />
                                    <div className="h-full w-full p-4 text-left">
                                        <h2 className="mb-1 text-lg font-semibold">{item.title}</h2>
                                        <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">Invoice: {item.invoice_code}</p>

                                        <div className="mb-3 flex items-center gap-2 rounded-lg bg-green-50 p-2 dark:bg-green-900/20">
                                            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                            <span className="text-xs font-medium text-green-700 dark:text-green-300">Sudah Dibayar</span>
                                        </div>

                                        <div className="mt-2 flex justify-between text-sm">
                                            <span className="text-gray-600 dark:text-gray-400">
                                                {item.paid_at
                                                    ? new Date(item.paid_at).toLocaleDateString('id-ID', {
                                                          day: 'numeric',
                                                          month: 'short',
                                                          year: 'numeric',
                                                      })
                                                    : '-'}
                                            </span>
                                            <span className="font-semibold">Rp {item.price.toLocaleString('id-ID')}</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
                {visibleCount < filteredItems.length && (
                    <div className="mb-8 flex justify-center">
                        <Button type="button" className="mt-8 hover:cursor-pointer" onClick={() => setVisibleCount((prev) => prev + 6)}>
                            Lihat Lebih Banyak
                        </Button>
                    </div>
                )}
            </ProfileLayout>
        </UserLayout>
    );
}
