import Heading from '@/components/heading';
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
    amount: number;
    status: string;
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

    // Gabungkan semua items dari semua invoice
    const allItems = myTransactions.flatMap((invoice) => [
        ...(invoice.course_items || []).map((item) => ({
            type: 'Course',
            title: item.course.title,
            slug: item.course.slug,
            price: item.price,
            invoice_status: invoice.status,
            invoice_code: invoice.invoice_code,
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
            invoice_status: invoice.status,
            invoice_code: invoice.invoice_code,
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
            invoice_status: invoice.status,
            invoice_code: invoice.invoice_code,
            paid_at: invoice.paid_at,
            payment_channel: invoice.payment_channel,
            payment_method: invoice.payment_method,
            created_at: invoice.created_at,
        })),
    ]);

    const filteredItems = allItems.filter((item) => item.title.toLowerCase().includes(search.toLowerCase()));

    return (
        <UserLayout>
            <Head title="Transaksi Saya" />
            <ProfileLayout>
                <Heading title="Transaksi Saya" description="Lihat riwayat transaksi Anda di sini" />
                <div className="mb-4 flex justify-between gap-2">
                    <Input type="search" placeholder="Cari judul transaksi..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full border text-sm">
                        <thead>
                            <tr className="bg-gray-100 dark:bg-zinc-800">
                                <th className="border px-3 py-2">Tipe</th>
                                <th className="border px-3 py-2">Judul</th>
                                <th className="border px-3 py-2">Status</th>
                                <th className="border px-3 py-2">Metode Pembayaran</th>
                                <th className="border px-3 py-2">Kode Invoice</th>
                                <th className="border px-3 py-2">Dibayar Pada</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-gray-500">
                                        Belum ada transaksi.
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map((item, idx) => (
                                    <tr key={idx} className="border-b">
                                        <td className="border px-3 py-2">{item.type === 'Course' ? 'Kelas Online' : item.type}</td>
                                        <td className="border px-3 py-2">
                                            <Link href={`/${item.type.toLowerCase()}/${item.slug}`} className="text-primary hover:underline">
                                                {item.title}
                                            </Link>
                                        </td>
                                        <td className="border px-3 py-2">
                                            {item.invoice_status === 'paid' ? (
                                                <span className="text-green-600">Sudah Dibayar</span>
                                            ) : (
                                                <span className="text-red-600">Belum Dibayar</span>
                                            )}
                                        </td>
                                        <td className="border px-3 py-2">{item.payment_channel || '-'}</td>
                                        <td className="border px-3 py-2">{item.invoice_code}</td>
                                        <td className="border px-3 py-2">{item.paid_at || '-'}</td>
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
