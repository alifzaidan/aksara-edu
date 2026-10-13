import UserLayout from '@/layouts/user-layout';
import { Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import BundlingSection from './bundling-section';
import HeroSection from './hero-section';

interface BundleItem {
    id: string;
    bundleable_type: string;
    bundleable: {
        id: string;
        title: string;
        slug: string;
    };
    price: number;
}

interface Bundle {
    id: string;
    title: string;
    slug: string;
    short_description: string | null;
    thumbnail: string | null;
    price: number;
    strikethrough_price: number;
    registration_deadline: string | null;
    batch?: string | null;
    status: 'draft' | 'published' | 'archived';
    bundle_items: BundleItem[];
    bundle_items_count: number;
}

interface BundlingDashboardProps {
    bundles: Bundle[];
}

export default function BundlingDashboard({ bundles }: BundlingDashboardProps) {
    const { t } = useTranslation('user');

    return (
        <UserLayout>
            <Head title={t('bundling.dashboard.headTitle')} />

            <HeroSection />
            <BundlingSection bundles={bundles} />
        </UserLayout>
    );
}
