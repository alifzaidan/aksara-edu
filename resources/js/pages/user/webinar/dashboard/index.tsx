import UserLayout from '@/layouts/user-layout';
import { Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import FeatureSection from './feature-section';
import HeroSection from './hero-section';
import WebinarSection from './webinar-section';

type Category = {
    id: string;
    name: string;
};

interface Webinar {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    slug: string;
    strikethrough_price: number;
    price: number;
    start_time: string;
    category: Category;
}

interface WebinarProps {
    categories: Category[];
    webinars: Webinar[];
    myWebinarIds: string[];
}

export default function Webinar({ categories, webinars, myWebinarIds }: WebinarProps) {
    const { t } = useTranslation('user');

    return (
        <UserLayout>
            <Head title={t('webinar.title')} />

            <HeroSection />
            <FeatureSection />
            <WebinarSection categories={categories} webinars={webinars} myWebinarIds={myWebinarIds} />
        </UserLayout>
    );
}
