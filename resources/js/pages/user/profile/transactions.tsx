import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ProfileLayout from '@/layouts/profile/layout';
import UserLayout from '@/layouts/user-layout';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface InstallmentTerm {
    id: string;
    installment_number: number;
    status: 'pending' | 'paid' | 'failed';
    payment_method: string | null;
    payment_channel: string | null;
    paid_at: string | null;
}

interface Invoice {
    id: string;
    invoice_code: string;
    invoice_url: string;
    amount: number;
    status: 'paid' | 'pending' | 'expired' | 'failed' | 'completed' | 'installment_pending';
    is_installment?: boolean;
    paid_at: string | null;
    payment_channel: string | null;
    payment_method: string | null;
    installment_terms?: InstallmentTerm[];
    installmentTerms?: InstallmentTerm[];
    course_items?: { id: string; course: { id: string; title: string; slug: string }; price: number }[];
    bootcamp_items?: { id: string; bootcamp: { id: string; title: string; slug: string }; price: number }[];
    webinar_items?: { id: string; webinar: { id: string; title: string; slug: string }; price: number }[];
    private_items?: { id: string; privateClass?: { id: string; title: string; slug: string }; price: number }[];
    privateItems?: { id: string; privateClass?: { id: string; title: string; slug: string }; price: number }[];
    certificationProgramItems?: { id: string; certificationProgram: { id: string; title: string; slug: string }; price: number }[];
    bundle_enrollments?: { id: string; bundle?: { id: string; title: string; slug: string }; price: number }[];
    bundleEnrollments?: { id: string; bundle?: { id: string; title: string; slug: string }; price: number }[];
    created_at: string;
}

interface Props {
    myTransactions: Invoice[];
}

function getInstallmentPaymentMethod(invoice: Invoice): string {
    const terms = invoice.installment_terms || invoice.installmentTerms || [];
    // Kumpulkan semua termin yang sudah paid, ambil metode unik
    const paidTerms = terms.filter((t) => t.status === 'paid');
    const channels = [...new Set(paidTerms.map((t) => t.payment_channel || t.payment_method).filter(Boolean))];
    if (channels.length === 0) return '-';
    return channels.join(', ');
}

export default function Transactions({ myTransactions }: Props) {
    const { t, i18n } = useTranslation('profile');
    const [search, setSearch] = useState('');

    // Gabungkan semua items dari semua invoice menjadi satu array
    const allItems = myTransactions.flatMap((invoice) => {
        const terms = invoice.installment_terms || invoice.installmentTerms || [];
        const paidTerms = terms.filter((t) => t.status === 'paid');
        // Untuk cicilan: gunakan paid_at dari termin terakhir yang paid; jika lunas semua, gunakan invoice.paid_at
        const lastPaidTerm = paidTerms.sort((a, b) => (a.installment_number > b.installment_number ? -1 : 1))[0];
        const isInstallment = invoice.is_installment || invoice.status === 'installment_pending' || terms.length > 0;
        const installmentPaymentMethod = isInstallment ? getInstallmentPaymentMethod(invoice) : null;

        const base = {
            invoice_id: invoice.id,
            invoice_status: invoice.status,
            invoice_code: invoice.invoice_code,
            invoice_url: invoice.invoice_url,
            paid_at: isInstallment ? (invoice.paid_at ?? lastPaidTerm?.paid_at ?? null) : invoice.paid_at,
            payment_channel: isInstallment ? installmentPaymentMethod : (invoice.payment_channel || invoice.payment_method || null),
            is_installment: isInstallment,
            terms_count: terms.length,
            paid_terms_count: paidTerms.length,
            created_at: invoice.created_at,
        };

        const rows = [
            ...(invoice.course_items || []).map((item) => ({
                ...base,
                type: t('transactions.typeCourse'),
                title: item.course.title,
                slug: item.course.slug,
                price: item.price,
                profileUrl: `/profile/my-courses/${item.course.slug}`,
            })),
            ...(invoice.bootcamp_items || []).map((item) => ({
                ...base,
                type: t('transactions.typeBootcamp'),
                title: item.bootcamp.title,
                slug: item.bootcamp.slug,
                price: item.price,
                profileUrl: `/profile/my-bootcamps/${item.bootcamp.slug}`,
            })),
            ...(invoice.webinar_items || []).map((item) => ({
                ...base,
                type: t('transactions.typeWebinar'),
                title: item.webinar.title,
                slug: item.webinar.slug,
                price: item.price,
                profileUrl: `/profile/my-webinars/${item.webinar.slug}`,
            })),
            ...(invoice.certificationProgramItems || []).map((item) => ({
                ...base,
                type: t('transactions.typeCert'),
                title: item.certificationProgram.title,
                slug: item.certificationProgram.slug,
                price: item.price,
                profileUrl: route('profile.certification-program.detail', { program: item.certificationProgram.slug }),
            })),
            ...((invoice.private_items || invoice.privateItems) || []).map((item: any) => {
                const pc = item.privateClass || item.private_class;
                return {
                    ...base,
                    type: t('transactions.typePrivate'),
                    title: pc?.title || t('transactions.typePrivate'),
                    slug: pc?.slug || '',
                    price: item.price,
                    profileUrl: `/private/${pc?.slug}`,
                };
            }),
            ...((invoice.bundle_enrollments || invoice.bundleEnrollments) || []).map((item: any) => ({
                ...base,
                type: t('transactions.typeBundle'),
                title: item.bundle?.title || t('transactions.typeBundle'),
                slug: item.bundle?.slug || '',
                price: item.price,
                profileUrl: `/bundling/${item.bundle?.slug}`,
            })),
        ];

        return rows;
    });

    const filteredItems = allItems.filter((item) => item.title.toLowerCase().includes(search.toLowerCase()));

    const getStatusComponent = (status: Invoice['status'], isInstallment: boolean, paidCount: number, totalCount: number) => {
        if (isInstallment) {
            if (status === 'paid' || status === 'completed') {
                return <span className="font-medium text-green-600">{t('transactions.installmentPaid')}</span>;
            }
            return <span className="font-medium text-amber-600">{t('transactions.installmentTerm', { paid: paidCount, total: totalCount })}</span>;
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
                                            <Link
                                                href={item.profileUrl || '#'}
                                                className="text-primary hover:underline"
                                            >
                                                {item.title}
                                            </Link>
                                        </td>
                                        <td className="p-2">{item.type}</td>
                                        <td className="p-2">
                                            {getStatusComponent(item.invoice_status, item.is_installment, item.paid_terms_count, item.terms_count)}
                                        </td>
                                        <td className="p-2">
                                            {item.price === 0 ? (
                                                <span className="font-semibold text-green-600">{t('transactions.free')}</span>
                                            ) : item.is_installment ? (
                                                <span>
                                                    {item.payment_channel !== '-' && item.payment_channel
                                                        ? item.payment_channel
                                                        : <span className="text-muted-foreground text-xs">{t('transactions.noPaymentYet')}</span>
                                                    }
                                                </span>
                                            ) : (
                                                item.payment_channel || '-'
                                            )}
                                        </td>
                                        <td className="p-2">
                                            <Link href={route('invoice.show', { id: item.invoice_id })} className="text-primary hover:underline">
                                                {item.invoice_code}
                                            </Link>
                                        </td>
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
                                                <Link href={route('invoice.show', { id: item.invoice_id })}>{t('transactions.detail')}</Link>
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
