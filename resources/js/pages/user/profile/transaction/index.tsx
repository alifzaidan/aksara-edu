import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ProfileLayout from '@/layouts/profile/layout';
import UserLayout from '@/layouts/user-layout';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

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
interface PrivateClass {
    id: string;
    title: string;
    slug: string;
}
interface Bundle {
    id: string;
    title: string;
    slug: string;
}

interface CertificationProgram {
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
interface EnrollmentPrivate {
    id: string;
    privateClass?: PrivateClass;
    private_class?: PrivateClass;
    price: number;
}
interface EnrollmentBundle {
    id: string;
    bundle?: Bundle;
    price?: number;
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
    status: 'paid' | 'pending' | 'expired' | 'failed' | 'completed' | 'installment_pending';
    is_installment?: boolean;
    access_suspended_at?: string | null;
    installment_terms?: any[];
    installmentTerms?: any[];
    paid_at: string | null;
    payment_channel: string | null;
    payment_method: string | null;
    course_items?: EnrollmentCourse[];
    courseItems?: EnrollmentCourse[];
    bootcamp_items?: EnrollmentBootcamp[];
    bootcampItems?: EnrollmentBootcamp[];
    webinar_items?: EnrollmentWebinar[];
    webinarItems?: EnrollmentWebinar[];
    private_items?: EnrollmentPrivate[];
    privateItems?: EnrollmentPrivate[];
    bundle_enrollments?: EnrollmentBundle[];
    bundleEnrollments?: EnrollmentBundle[];
    certificationProgramItems?: EnrollmentCertificationProgram[];
    certification_program_items?: EnrollmentCertificationProgram[];
    created_at: string;
}

interface TransactionItem {
    type: string;
    title: string;
    slug: string;
    price: number;
    invoice_id: string;
    invoice_status: Invoice['status'];
    invoice_code: string;
    invoice_url: string;
    is_installment?: boolean;
    access_suspended_at?: string | null;
    installment_terms?: any[];
    paid_at: string | null;
    payment_channel: string | null;
    payment_method: string | null;
    created_at: string;
    is_scholarship?: boolean;
}

interface Props {
    myTransactions: Invoice[];
}

export default function Transactions({ myTransactions }: Props) {
    const { t, i18n } = useTranslation('profile');
    const [search, setSearch] = useState('');

    const getCertificationProgram = (item: EnrollmentCertificationProgram) => {
        return (
            item.certificationProgram ||
            (item as EnrollmentCertificationProgram & { certification_program?: CertificationProgram }).certification_program
        );
    };

    const getItemHref = (type: string, slug: string, status: Invoice['status'], item?: TransactionItem) => {
        const isAccessible =
            status === 'paid' ||
            status === 'completed' ||
            (status === 'installment_pending' && !item?.access_suspended_at);

        switch (type) {
            case 'Course':
                return isAccessible ? `/profile/my-courses/${slug}` : `/course/${slug}`;
            case 'Bootcamp':
                return isAccessible ? `/profile/my-bootcamps/${slug}` : `/bootcamp/${slug}`;
            case 'Webinar':
                return isAccessible ? `/profile/my-webinars/${slug}` : `/webinar/${slug}`;
            case 'Private':
                return `/private/${slug}`;
            case 'Bundle':
                return `/bundling/${slug}`;
            case 'Certification Program':
                return isAccessible
                    ? route('profile.certification-program.detail', { program: slug })
                    : `/certification-program/${slug}`;
            default:
                return '#';
        }
    };

    // Gabungkan semua items dari semua invoice menjadi satu array
    const allItems: TransactionItem[] = myTransactions.flatMap((invoice) => {
        const courseItems = invoice.course_items || invoice.courseItems || [];
        const bootcampItems = invoice.bootcamp_items || invoice.bootcampItems || [];
        const webinarItems = invoice.webinar_items || invoice.webinarItems || [];
        const privateItems = invoice.private_items || invoice.privateItems || [];
        const bundleItems = invoice.bundle_enrollments || invoice.bundleEnrollments || [];
        const certificationItems =
            invoice.certificationProgramItems || invoice.certification_program_items || [];
        const installmentTerms = invoice.installment_terms || invoice.installmentTerms || [];

        const items: TransactionItem[] = [
            ...courseItems.map((item): TransactionItem => ({
                type: 'Course',
                title: item.course?.title || 'Kelas Online',
                slug: item.course?.slug || '',
                price: item.price,
                invoice_id: invoice.id,
                invoice_status: invoice.status,
                invoice_code: invoice.invoice_code,
                invoice_url: invoice.invoice_url,
                is_installment: invoice.is_installment,
                access_suspended_at: invoice.access_suspended_at,
                installment_terms: installmentTerms,
                paid_at: invoice.paid_at,
                payment_channel: invoice.payment_channel,
                payment_method: invoice.payment_method,
                created_at: invoice.created_at,
            })),
            ...bootcampItems.map((item): TransactionItem => ({
                type: 'Bootcamp',
                title: item.bootcamp?.title || 'Bootcamp',
                slug: item.bootcamp?.slug || '',
                price: item.price,
                invoice_id: invoice.id,
                invoice_status: invoice.status,
                invoice_code: invoice.invoice_code,
                invoice_url: invoice.invoice_url,
                is_installment: invoice.is_installment,
                access_suspended_at: invoice.access_suspended_at,
                installment_terms: installmentTerms,
                paid_at: invoice.paid_at,
                payment_channel: invoice.payment_channel,
                payment_method: invoice.payment_method,
                created_at: invoice.created_at,
            })),
            ...webinarItems.map((item): TransactionItem => ({
                type: 'Webinar',
                title: item.webinar?.title || 'Webinar',
                slug: item.webinar?.slug || '',
                price: item.price,
                invoice_id: invoice.id,
                invoice_status: invoice.status,
                invoice_code: invoice.invoice_code,
                invoice_url: invoice.invoice_url,
                is_installment: invoice.is_installment,
                access_suspended_at: invoice.access_suspended_at,
                installment_terms: installmentTerms,
                paid_at: invoice.paid_at,
                payment_channel: invoice.payment_channel,
                payment_method: invoice.payment_method,
                created_at: invoice.created_at,
            })),
            ...privateItems.map((item): TransactionItem => {
                const pc = item.privateClass || item.private_class;
                return {
                    type: 'Private',
                    title: pc?.title || 'Private Class',
                    slug: pc?.slug || '',
                    price: item.price || invoice.amount,
                    invoice_id: invoice.id,
                    invoice_status: invoice.status,
                    invoice_code: invoice.invoice_code,
                    invoice_url: invoice.invoice_url,
                    is_installment: invoice.is_installment,
                    access_suspended_at: invoice.access_suspended_at,
                    installment_terms: installmentTerms,
                    paid_at: invoice.paid_at,
                    payment_channel: invoice.payment_channel,
                    payment_method: invoice.payment_method,
                    created_at: invoice.created_at,
                };
            }),
            ...bundleItems.map((item): TransactionItem => ({
                type: 'Bundle',
                title: item.bundle?.title || 'Paket Bundling',
                slug: item.bundle?.slug || '',
                price: item.price || invoice.amount,
                invoice_id: invoice.id,
                invoice_status: invoice.status,
                invoice_code: invoice.invoice_code,
                invoice_url: invoice.invoice_url,
                is_installment: invoice.is_installment,
                access_suspended_at: invoice.access_suspended_at,
                installment_terms: installmentTerms,
                paid_at: invoice.paid_at,
                payment_channel: invoice.payment_channel,
                payment_method: invoice.payment_method,
                created_at: invoice.created_at,
            })),
            ...certificationItems.flatMap((item): TransactionItem[] => {
                const certificationProgram = getCertificationProgram(item);

                if (!certificationProgram) {
                    return [];
                }

                return [
                    {
                        type: 'Certification Program',
                        title: certificationProgram.title,
                        slug: certificationProgram.slug,
                        price: item.price,
                        invoice_id: invoice.id,
                        invoice_status: invoice.status,
                        invoice_code: invoice.invoice_code,
                        invoice_url: invoice.invoice_url,
                        is_installment: invoice.is_installment,
                        access_suspended_at: invoice.access_suspended_at,
                        installment_terms: installmentTerms,
                        paid_at: invoice.paid_at,
                        payment_channel: invoice.payment_channel,
                        payment_method: invoice.payment_method,
                        created_at: invoice.created_at,
                        is_scholarship: item.is_scholarship,
                    },
                ];
            }),
        ];
        return items;
    });

    const filteredItems = allItems.filter((item) => item.title.toLowerCase().includes(search.toLowerCase()));

    const getStatusComponent = (status: Invoice['status'], item?: TransactionItem) => {
        const isInstallment =
            item?.is_installment ||
            status === 'installment_pending' ||
            (item?.installment_terms && item.installment_terms.length > 0);

        if (isInstallment) {
            const terms = item?.installment_terms || [];
            const paidCount = terms.filter((t: any) => t.status === 'paid').length;
            const totalCount = terms.length;
            const isFullyPaid = totalCount > 0 && paidCount === totalCount;
            const isSuspended = !!item?.access_suspended_at;

            if (isFullyPaid || status === 'paid' || status === 'completed') {
                return <span className="font-medium text-emerald-600">{t('transactions.installmentPaid')}</span>;
            }
            if (isSuspended) {
                return <span className="font-medium text-red-600">{t('transactions.installmentSuspended')}</span>;
            }
            return (
                <span className="font-medium text-amber-600">
                    {t('transactions.installmentTerm', { paid: paidCount, total: totalCount || '?' })}
                </span>
            );
        }

        if (status === 'paid' || status === 'completed') {
            return <span className="font-medium text-green-600">{t('transactions.statusPaid')}</span>;
        }
        if (status === 'pending') {
            return <span className="font-medium text-yellow-600">{t('transactions.statusPending')}</span>;
        }
        return <span className="font-medium text-red-600">{t('transactions.statusFailed')}</span>;
    };

    return (
        <UserLayout>
            <Head title={t('transactions.headTitle')} />
            <ProfileLayout>
                <Heading title={t('transactions.title')} description={t('transactions.description')} />
                <div className="mb-4 flex justify-between gap-2">
                    <Input type="search" placeholder={t('transactions.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <div className="overflow-x-auto rounded-lg border">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-100 dark:bg-zinc-800">
                            <tr className="text-left">
                                <th className="p-2 font-medium">{t('transactions.colTitle')}</th>
                                <th className="p-2 font-medium">{t('transactions.colType')}</th>
                                <th className="p-2 font-medium">{t('transactions.colStatus')}</th>
                                <th className="p-2 font-medium">{t('transactions.colPaymentMethod')}</th>
                                <th className="p-2 font-medium">{t('transactions.colInvoice')}</th>
                                <th className="p-2 font-medium">{t('transactions.colPaidAt')}</th>
                                <th className="p-2 font-medium">{t('transactions.colAction')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-gray-500">
                                        {t('transactions.empty')}
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map((item, idx) => (
                                    <tr key={idx} className="border-t dark:border-zinc-800">
                                        <td className="p-2">
                                            <Link href={getItemHref(item.type, item.slug, item.invoice_status, item)} className="text-primary hover:underline">
                                                {item.title}
                                            </Link>
                                        </td>
                                        <td className="p-2">
                                            {item.type === 'Course'
                                                ? t('transactions.typeCourse')
                                                : item.type === 'Certification Program'
                                                  ? t('transactions.typeCert')
                                                  : item.type === 'Bootcamp'
                                                    ? t('transactions.typeBootcamp')
                                                    : item.type === 'Webinar'
                                                      ? t('transactions.typeWebinar')
                                                      : item.type === 'Private'
                                                        ? t('transactions.typePrivate')
                                                        : item.type === 'Bundle'
                                                          ? t('transactions.typeBundle')
                                                          : item.type}
                                        </td>
                                        <td className="p-2">{getStatusComponent(item.invoice_status, item)}</td>
                                        <td className="p-2">
                                            {item.price === 0 ? (
                                                <span className="font-semibold text-green-600">{t('transactions.free')}</span>
                                            ) : (() => {
                                                const terms: any[] = item.installment_terms || [];
                                                const isInstallmentItem =
                                                    item.is_installment ||
                                                    item.invoice_status === 'installment_pending' ||
                                                    terms.length > 0;

                                                if (isInstallmentItem && terms.length > 0) {
                                                    const paidTerms = terms.filter((t: any) => t.status === 'paid');
                                                    const channels = [...new Set(
                                                        paidTerms
                                                            .map((t: any) => t.payment_channel || t.payment_method)
                                                            .filter(Boolean)
                                                    )];
                                                    if (channels.length === 0) {
                                                        return <span className="text-xs text-muted-foreground">{t('transactions.noPaymentYet')}</span>;
                                                    }
                                                    return <span>{channels.join(', ')}</span>;
                                                }

                                                return item.payment_channel || item.payment_method || '-';
                                            })()}
                                        </td>
                                        <td className="p-2">{item.invoice_code}</td>
                                        <td className="p-2">
                                            {item.invoice_status === 'pending' && item.invoice_url ? (
                                                <Button asChild size="sm" variant="outline">
                                                    <a href={item.invoice_url} target="_blank">
                                                        {t('transactions.continuePayment')}
                                                    </a>
                                                </Button>
                                            ) : item.paid_at ? (
                                                new Date(item.paid_at).toLocaleString(i18n.language === 'en' ? 'en-US' : 'id-ID')
                                            ) : (
                                                '-'
                                            )}
                                        </td>
                                        <td className="p-2">
                                            <Button asChild size="sm" variant="outline">
                                                <Link href={route('profile.transaction.detail', { invoice: item.invoice_id })}>{t('transactions.detail')}</Link>
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
