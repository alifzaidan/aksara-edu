import UserLayout from '@/layouts/user-layout';
import { Head } from '@inertiajs/react';
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
    status: 'draft' | 'published' | 'archived';
    bundle_items: BundleItem[];
    bundle_items_count: number;
}

interface BundlingDashboardProps {
    bundles: Bundle[];
}

export default function BundlingDashboard({ bundles }: BundlingDashboardProps) {
    return (
        <UserLayout>
            <Head title="Paket Bundling - Hemat Lebih Banyak" />

            <HeroSection />
            <BundlingSection bundles={bundles} />
        </UserLayout>
    );
}
