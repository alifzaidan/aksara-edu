import { Button } from '@/components/ui/button';
import UserLayout from '@/layouts/user-layout';
import { Head, Link } from '@inertiajs/react';
import { Crown, FileText, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
interface CertificationProgramItem {
    certification_program: { title: string; slug: string; thumbnail: string; group_url?: string | null };
}

interface Invoice {
    id: string;
    amount: number;
    course_items?: CourseItem[];
    bootcamp_items?: BootcampItem[];
    webinar_items?: WebinarItem[];
    private_items?: PrivateItem[];
    certification_program_items?: CertificationProgramItem[];
}

interface InvoiceProps {
    invoice: Invoice;
}

export default function CheckoutSuccess({ invoice }: InvoiceProps) {
    const { t } = useTranslation('user');
    const courseItems = invoice.course_items ?? [];
    const bootcampItems = invoice.bootcamp_items ?? [];
    const webinarItems = invoice.webinar_items ?? [];
    const privateItems = invoice.private_items ?? [];
    const certificationProgramItems = invoice.certification_program_items ?? [];

    let title = '';
    let link = '';
    let label = '';
    let groupUrl: string | null = null;

    if (courseItems.length > 0) {
        title = t('checkoutSuccess.courseTitle', { title: courseItems[0].course.title });
        link = `/profile/my-courses/${courseItems[0].course.slug}`;
        label = t('checkoutSuccess.accessCourse');
        groupUrl = courseItems[0].course.group_url || null;
    } else if (bootcampItems.length > 0) {
        title = t('checkoutSuccess.bootcampTitle', { title: bootcampItems[0].bootcamp.title });
        link = `/profile/my-bootcamps/${bootcampItems[0].bootcamp.slug}`;
        label = t('checkoutSuccess.accessBootcamp');
        groupUrl = bootcampItems[0].bootcamp.group_url || null;
    } else if (webinarItems.length > 0) {
        title = t('checkoutSuccess.webinarTitle', { title: webinarItems[0].webinar.title });
        link = `/profile/my-webinars/${webinarItems[0].webinar.slug}`;
        label = t('checkoutSuccess.accessWebinar');
        groupUrl = webinarItems[0].webinar.group_url || null;
    } else if (privateItems.length > 0) {
        title = t('checkoutSuccess.privateTitle', { title: privateItems[0].private_class.title });
        link = `/private/${privateItems[0].private_class.slug}`;
        label = t('checkoutSuccess.viewPrivate');
        groupUrl = privateItems[0].private_class.group_url || null;
    } else if (certificationProgramItems.length > 0) {
        title = t('checkoutSuccess.certificationTitle', { title: certificationProgramItems[0].certification_program.title });
        link = `/profile/my-certification-programs/${certificationProgramItems[0].certification_program.slug}`;
        label = t('checkoutSuccess.accessCertification');
        groupUrl = certificationProgramItems[0].certification_program.group_url || null;
    } else {
        title = t('checkoutSuccess.title');
        link = '/profile';
        label = t('checkoutSuccess.viewProfile');
        groupUrl = null;
    }

    return (
        <UserLayout>
            <Head title={t('checkoutSuccess.title')} />
            <section className="to-primary w-full bg-gradient-to-tl from-black px-4">
                <div className="mx-auto my-16 flex w-full max-w-7xl flex-col items-center px-4">
                    <h2 className="mb-4 max-w-3xl bg-gradient-to-r from-[#71D0F7] via-white to-[#E6834A] bg-clip-text text-center text-3xl font-bold text-transparent italic sm:text-4xl">
                        {title}
                    </h2>
                    <img src="/assets/images/payment-success.webp" alt="Payment Success" className="mb-6 w-[300px]" />
                    <p className="mb-6 max-w-xl text-center text-gray-400">
                        {t('checkoutSuccess.description')}
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
                                {t('checkoutSuccess.joinWaGroup')}
                            </a>
                        </Button>
                    )}
                    <Button variant="outline" asChild>
                        <a href={route('invoice.pdf', { id: invoice.id })} target="_blank" rel="noopener noreferrer">
                            <FileText className="size-4" />
                            {t('checkoutSuccess.downloadInvoice')}
                        </a>
                    </Button>
                </div>
            </section>
        </UserLayout>
    );
}
