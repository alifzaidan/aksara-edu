import UserLayout from '@/layouts/user-layout';
import { Head } from '@inertiajs/react';
import FeatureSection from './feature-section';
import HeroSection from './hero-section';
import PrivateSection from './private-section';

interface Category {
    id: string;
    name: string;
}

interface PrivateClass {
    id: string;
    title: string;
    slug: string;
    thumbnail?: string | null;
    description?: string | null;
    mode: 'online' | 'offline';
    location?: string | null;
    price: number;
    strikethrough_price?: number;
    registration_deadline?: string | null;
    category?: Category;
    schedules?: { start_time: string }[];
}

interface Props {
    categories: Category[];
    privateClasses: PrivateClass[];
    myPrivateClassIds: string[];
}

export default function PrivateDashboard({ categories, privateClasses, myPrivateClassIds }: Props) {
    return (
        <UserLayout>
            <Head title="Private Class" />

            <HeroSection />
            <FeatureSection />
            <PrivateSection categories={categories} privateClasses={privateClasses} myPrivateClassIds={myPrivateClassIds} />
        </UserLayout>
    );
}
