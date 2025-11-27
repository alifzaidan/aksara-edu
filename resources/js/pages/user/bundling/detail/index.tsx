import UserLayout from '@/layouts/user-layout';
import { Head } from '@inertiajs/react';
import BenefitsSection from './benefits-section';
import BundleItemsSection from './bundle-items-section';
import HeroSection from './hero-section';
import RegisterSection from './register-section';
import RelatedBundles from './related-bundles';

interface Product {
    id: string;
    title: string;
    slug: string;
    price: number;
}

interface BundleItem {
    id: string;
    bundleable_type: string;
    bundleable_id: string;
    bundleable: Product;
    price: number;
    order: number;
}

interface GroupedItems {
    courses: BundleItem[];
    bootcamps: BundleItem[];
    webinars: BundleItem[];
}

interface Bundle {
    id: string;
    title: string;
    slug: string;
    short_description?: string | null;
    description?: string | null;
    benefits?: string | null;
    thumbnail?: string | null;
    price: number;
    strikethrough_price: number;
    registration_deadline?: string | null;
    registration_url: string;
    status: string;
    bundle_items: BundleItem[];
    bundle_items_count: number;
}

interface BundleDetailProps {
    bundle: Bundle;
    groupedItems: GroupedItems;
    totalOriginalPrice: number;
    discountAmount: number;
    discountPercentage: number;
    relatedBundles: Bundle[];
    hasOwnedItems: boolean;
    ownedItems: Array<{
        id: string;
        title: string;
        type: string;
    }>;
}

export default function BundleDetail({
    bundle,
    groupedItems,
    totalOriginalPrice,
    discountAmount,
    discountPercentage,
    relatedBundles,
    hasOwnedItems,
    ownedItems,
}: BundleDetailProps) {
    return (
        <UserLayout>
            <Head title={`${bundle.title} - Paket Bundling`} />

            <HeroSection bundle={bundle} discountPercentage={discountPercentage} />
            <BundleItemsSection bundle={bundle} groupedItems={groupedItems} totalOriginalPrice={totalOriginalPrice} />
            <BenefitsSection bundle={bundle} />
            <RegisterSection
                bundle={bundle}
                totalOriginalPrice={totalOriginalPrice}
                discountAmount={discountAmount}
                discountPercentage={discountPercentage}
                hasOwnedItems={hasOwnedItems}
                ownedItems={ownedItems}
            />
            <RelatedBundles relatedBundles={relatedBundles} />
        </UserLayout>
    );
}
