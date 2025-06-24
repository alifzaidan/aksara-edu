import { Button } from '@/components/ui/button';
import UserLayout from '@/layouts/user-layout';
import { Head, Link } from '@inertiajs/react';

interface Invoice {
    id: string;
    amount: number;
    items: {
        course: {
            title: string;
            slug: string;
            thumbnail: string;
        };
    }[];
}

export default function CheckoutCourse({ invoice }: { invoice: Invoice }) {
    return (
        <UserLayout>
            <Head title="Checkout Kelas" />
            <section className="to-primary w-full bg-gradient-to-tl from-black px-4">
                <div className="mx-auto my-12 flex w-full max-w-7xl flex-col items-center px-4">
                    <h2 className="mb-4 max-w-3xl bg-gradient-to-r from-[#71D0F7] via-white to-[#E6834A] bg-clip-text text-center text-3xl font-bold text-transparent italic sm:text-4xl">
                        Checkout Kelas {invoice.items[0].course.title} Berhasil!
                    </h2>
                    <img src="/assets/images/illustration-kelas-online.svg" alt="Success" className="mb-6 w-[300px]" />
                    <p className="mb-6 text-center text-gray-400">
                        Terima kasih telah menyelesaikan pembayaran. Anda sekarang dapat mengakses materi kelas dengan klik tombol di bawah ini.
                    </p>
                    <Button variant="secondary" className="mx-auto w-fit">
                        <Link href={route('profile.courses')}>Akses Kelas</Link>
                    </Button>
                </div>
            </section>
        </UserLayout>
    );
}
