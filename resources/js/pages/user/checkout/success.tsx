import { Button } from '@/components/ui/button';
import UserLayout from '@/layouts/user-layout';
import { Head, Link } from '@inertiajs/react';
import { Crown, FileText, MessageCircle } from 'lucide-react';

interface CourseItem {
    course: { title: string; slug: string; thumbnail: string; group_url?: string | null };
}
interface BootcampItem {
    bootcamp: { title: string; slug: string; thumbnail: string; group_url?: string | null };
}
interface WebinarItem {
    webinar: { title: string; slug: string; thumbnail: string; group_url?: string | null };
}
interface PrivateItem {
    private_class: { title: string; slug: string; thumbnail: string; group_url?: string | null };
}

interface Invoice {
    id: string;
    amount: number;
    course_items?: CourseItem[];
    bootcamp_items?: BootcampItem[];
    webinar_items?: WebinarItem[];
    private_items?: PrivateItem[];
}

interface InvoiceProps {
    invoice: Invoice;
}

export default function CheckoutSuccess({ invoice }: InvoiceProps) {
    const courseItems = invoice.course_items ?? [];
    const bootcampItems = invoice.bootcamp_items ?? [];
    const webinarItems = invoice.webinar_items ?? [];
    const privateItems = invoice.private_items ?? [];

    let title = '';
    let link = '';
    let label = '';
    let groupUrl: string | null = null;

    if (courseItems.length > 0) {
        title = `Checkout Kelas "${courseItems[0].course.title}" Berhasil!`;
        link = `/profile/my-courses/${courseItems[0].course.slug}`;
        label = 'Akses Kelas';
        groupUrl = courseItems[0].course.group_url || null;
    } else if (bootcampItems.length > 0) {
        title = `Checkout Bootcamp "${bootcampItems[0].bootcamp.title}" Berhasil!`;
        link = `/profile/my-bootcamps/${bootcampItems[0].bootcamp.slug}`;
        label = 'Akses Bootcamp';
        groupUrl = bootcampItems[0].bootcamp.group_url || null;
    } else if (webinarItems.length > 0) {
        title = `Checkout Webinar "${webinarItems[0].webinar.title}" Berhasil!`;
        link = `/profile/my-webinars/${webinarItems[0].webinar.slug}`;
        label = 'Akses Webinar';
        groupUrl = webinarItems[0].webinar.group_url || null;
    } else if (privateItems.length > 0) {
        title = `Checkout Private Class "${privateItems[0].private_class.title}" Berhasil!`;
        link = `/private/${privateItems[0].private_class.slug}`;
        label = 'Lihat Private Class';
        groupUrl = privateItems[0].private_class.group_url || null;
    } else {
        title = 'Checkout Berhasil!';
        link = '/profile';
        label = 'Lihat Profil';
        groupUrl = null;
    }

    return (
        <UserLayout>
            <Head title="Checkout Berhasil" />
            <section className="to-primary w-full bg-gradient-to-tl from-black px-4">
                <div className="mx-auto my-16 flex w-full max-w-7xl flex-col items-center px-4">
                    <h2 className="mb-4 max-w-3xl bg-gradient-to-r from-[#71D0F7] via-white to-[#E6834A] bg-clip-text text-center text-3xl font-bold text-transparent italic sm:text-4xl">
                        {title}
                    </h2>
                    <img src="/assets/images/payment-success.webp" alt="Pembayaran Berhasil" className="mb-6 w-[300px]" />
                    <p className="mb-6 max-w-xl text-center text-gray-400">
                        Terima kasih telah menyelesaikan pembayaran. Anda sekarang dapat mengakses detail produk dengan klik tombol di bawah ini.
                        Invoice sudah dikirimkan ke nomor WA anda.
                    </p>
                    <Button variant="secondary" className="mx-auto mb-4 w-fit" asChild>
                        <Link href={link}>
                            <Crown />
                            {label}
                        </Link>
                    </Button>
                    {groupUrl && (
                        <Button variant="secondary" className="mx-auto mb-4 w-fit border-green-600 bg-green-500 hover:bg-green-600" asChild>
                            <a href={groupUrl} target="_blank" rel="noopener noreferrer">
                                <MessageCircle className="size-4" />
                                Masuk Grup WA
                            </a>
                        </Button>
                    )}
                    <Button variant="outline" asChild>
                        <a href={route('invoice.pdf', { id: invoice.id })} target="_blank" rel="noopener noreferrer">
                            <FileText className="size-4" />
                            Unduh Invoice
                        </a>
                    </Button>
                </div>
            </section>
        </UserLayout>
    );
}
