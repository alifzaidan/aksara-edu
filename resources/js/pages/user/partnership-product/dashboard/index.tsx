import UserLayout from '@/layouts/user-layout';
import { Head } from '@inertiajs/react';
import FeatureSection from './feature-section';
import HeroSection from './hero-section';
import PartnershipProductSection from './partnership-product-section';

type Category = {
    id: string;
    name: string;
};

interface PartnershipProduct {
    id: string;
    title: string;
    short_description: string | null;
    thumbnail: string | null;
    slug: string;
    strikethrough_price: number;
    price: number;
    registration_deadline: string;
    duration_days: number;
    schedule_days: string[];
    category: Category;
}

interface PartnershipProductPageProps {
    categories: Category[];
    partnershipProducts: PartnershipProduct[];
}

export default function PartnershipProductPage({ categories, partnershipProducts }: PartnershipProductPageProps) {
    return (
        <UserLayout>
            <Head title="Sertifikasi Kerjasama" />

            <HeroSection />
            <FeatureSection />
            <PartnershipProductSection categories={categories} partnershipProducts={partnershipProducts} />
        </UserLayout>
    );
}
