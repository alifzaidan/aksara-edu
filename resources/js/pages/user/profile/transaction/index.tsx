import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ProfileLayout from '@/layouts/profile/layout';
import UserLayout from '@/layouts/user-layout';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

interface Course {
    id: string;
    title: string;
    slug: string;
}
interface Bootcamp {
    id: string;
    title: string;
    slug: string;
}
interface Webinar {
    id: string;
    title: string;
    slug: string;
}

interface EnrollmentCourse {
    id: string;
    course: Course;
    price: number;
}
interface EnrollmentBootcamp {
    id: string;
    bootcamp: Bootcamp;
    price: number;
}
interface EnrollmentWebinar {
    id: string;
    webinar: Webinar;
    price: number;
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
    course_items: EnrollmentCourse[];
    bootcamp_items: EnrollmentBootcamp[];
    webinar_items: EnrollmentWebinar[];
    created_at: string;
}

interface Props {
    myTransactions: Invoice[];
}

export default function Transactions({ myTransactions }: Props) {
    const [search, setSearch] = useState('');

    // Gabungkan semua items dari semua invoice menjadi satu array
    const allItems = myTransactions.flatMap((invoice) => [
        ...(invoice.course_items || []).map((item) => ({
            type: 'Course',
            title: item.course.title,
            slug: item.course.slug,
            price: item.price,
            invoice_id: invoice.id,
            invoice_status: invoice.status,
            invoice_code: invoice.invoice_code,
            invoice_url: invoice.invoice_url,
            paid_at: invoice.paid_at,
            payment_channel: invoice.payment_channel,
            payment_method: invoice.payment_method,
            created_at: invoice.created_at,
        })),
        ...(invoice.bootcamp_items || []).map((item) => ({
            type: 'Bootcamp',
            title: item.bootcamp.title,
            slug: item.bootcamp.slug,
            price: item.price,
            invoice_id: invoice.id,
            invoice_status: invoice.status,
            invoice_code: invoice.invoice_code,
            invoice_url: invoice.invoice_url,
            paid_at: invoice.paid_at,
            payment_channel: invoice.payment_channel,
            payment_method: invoice.payment_method,
            created_at: invoice.created_at,
        })),
        ...(invoice.webinar_items || []).map((item) => ({
            type: 'Webinar',
            title: item.webinar.title,
            slug: item.webinar.slug,
            price: item.price,
            invoice_id: invoice.id,
            invoice_status: invoice.status,
            invoice_code: invoice.invoice_code,
            invoice_url: invoice.invoice_url,
            paid_at: invoice.paid_at,
            payment_channel: invoice.payment_channel,
            payment_method: invoice.payment_method,
            created_at: invoice.created_at,
        })),
    ]);

    const filteredItems = allItems.filter((item) => item.title.toLowerCase().includes(search.toLowerCase()));

    const getStatusComponent = (status: Invoice['status']) => {
        if (status === 'paid' || status === 'completed') {
            return <span className="font-medium text-green-600">Sudah Dibayar</span>;
        }
        if (status === 'pending') {
            return <span className="font-medium text-yellow-600">Menunggu Pembayaran</span>;
        }
        return <span className="font-medium text-red-600">Gagal/Kedaluwarsa</span>;
    };

    return (
        <UserLayout>
            <Head title="Transaksi Saya" />
            <ProfileLayout>
                <Heading title="Transaksi Saya" description="Lihat riwayat transaksi Anda di sini" />
                <div className="mb-4 flex justify-between gap-2">
                    <Input type="search" placeholder="Cari judul transaksi..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <div className="overflow-x-auto rounded-lg border">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-100 dark:bg-zinc-800">
                            <tr className="text-left">
                                <th className="p-2 font-medium">Judul</th>
                                <th className="p-2 font-medium">Tipe</th>
                                <th className="p-2 font-medium">Status</th>
                                <th className="p-2 font-medium">Metode Pembayaran</th>
                                <th className="p-2 font-medium">Kode Invoice</th>
                                <th className="p-2 font-medium">Dibayar Pada</th>
                                <th className="p-2 font-medium">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-gray-500">
                                        Belum ada transaksi.
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map((item, idx) => (
                                    <tr key={idx} className="border-t dark:border-zinc-800">
                                        <td className="p-2">
                                            <Link
                                                href={`/profile/my-${item.type.toLowerCase()}s/${item.slug}`}
                                                className="text-primary hover:underline"
                                            >
                                                {item.title}
                                            </Link>
                                        </td>
                                        <td className="p-2">{item.type === 'Course' ? 'Kelas Online' : item.type}</td>
                                        <td className="p-2">{getStatusComponent(item.invoice_status)}</td>
                                        <td className="p-2">
                                            {item.price === 0 ? (
                                                <span className="font-semibold text-green-600">GRATIS</span>
                                            ) : (
                                                item.payment_channel || item.payment_method || '-'
                                            )}
                                        </td>
                                        <td className="p-2">{item.invoice_code}</td>
                                        <td className="p-2">
                                            {item.invoice_status === 'pending' && item.invoice_url ? (
                                                <Button asChild size="sm" variant="outline">
                                                    <a href={item.invoice_url} target="_blank">
                                                        Lanjutkan Pembayaran
                                                    </a>
                                                </Button>
                                            ) : item.paid_at ? (
                                                new Date(item.paid_at).toLocaleString('id-ID')
                                            ) : (
                                                '-'
                                            )}
                                        </td>
                                        <td className="p-2">
                                            <Button asChild size="sm" variant="outline">
                                                <Link href={route('profile.transaction.detail', { invoice: item.invoice_id })}>Detail</Link>
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </ProfileLayout>
        </UserLayout>
    );
}
