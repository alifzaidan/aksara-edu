import { Head, usePage } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

import AppearanceTabs from '@/components/appearance-tabs';
import HeadingSmall from '@/components/heading-small';
import { SharedData, type BreadcrumbItem } from '@/types';

import AdminLayout from '@/layouts/admin-layout';
import SettingsLayout from '@/layouts/settings/layout';
import UserLayout from '@/layouts/user-layout';

export default function Appearance() {
    const { t } = useTranslation('settings');
    const { auth } = usePage<SharedData>().props;
    const isAdmin = auth.role.includes('admin');
    const Layout = isAdmin ? AdminLayout : UserLayout;

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('appearance.title'),
            href: '/settings/appearance',
        },
    ];

    return (
        <Layout breadcrumbs={breadcrumbs}>
            <Head title={t('appearance.title')} />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall title={t('appearance.title')} description={t('appearance.description')} />
                    <AppearanceTabs />
                </div>
            </SettingsLayout>
        </Layout>
    );
}
