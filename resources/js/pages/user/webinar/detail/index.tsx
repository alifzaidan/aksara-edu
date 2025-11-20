import UserLayout from '@/layouts/user-layout';
import { Head } from '@inertiajs/react';
import { useEffect } from 'react';
import AboutSection from './about-section';
import BenefitsSection from './benefits-section';
import HeroSection from './hero-section';
import MentorSection from './mentor-section';
import RegisterSection from './register-section';
import RelatedProduct from './related-product';
import ToolsSection from './tools-section';

interface Webinar {
    id: string;
    title: string;
    category?: { name: string };
    category_id?: string;
    tools?: { name: string; description?: string | null; icon: string | null }[];
    batch?: string | null;
    strikethrough_price: number;
    price: number;
    quota: number;
    start_time: string;
    end_time: string;
    registration_deadline: string;
    status: string;
    webinar_url: string;
    registration_url: string;
    thumbnail?: string | null;
    description?: string | null;
    benefits?: string | null;
    instructions?: string | null;
    user?: {
        id: string;
        name: string;
        bio?: string;
        avatar?: string;
    };
    created_at: string | Date;
}

interface RelatedWebinar {
    id: string;
    title: string;
    slug: string;
    thumbnail?: string | null;
    price: number;
    strikethrough_price: number;
    start_time: string;
    category?: {
        name: string;
    };
}

interface ReferralInfo {
    code?: string;
    hasActive: boolean;
}

export default function Webinar({
    webinar,
    relatedWebinars,
    myWebinarIds,
    referralInfo,
}: {
    webinar: Webinar;
    relatedWebinars: RelatedWebinar[];
    myWebinarIds: string[];
    referralInfo: ReferralInfo;
}) {
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const refFromUrl = urlParams.get('ref');

        if (refFromUrl) {
            sessionStorage.setItem('referral_code', refFromUrl);
        } else if (referralInfo.code) {
            sessionStorage.setItem('referral_code', referralInfo.code);
        }
    }, [referralInfo]);

    return (
        <UserLayout>
            <Head title={`${webinar.title} - Webinar`} />

            <HeroSection webinar={webinar} />
            <AboutSection />
            <BenefitsSection webinar={webinar} />
            <ToolsSection webinar={webinar} />
            <MentorSection webinar={webinar} />
            <RegisterSection webinar={webinar} />
            <RelatedProduct relatedWebinars={relatedWebinars} myWebinarIds={myWebinarIds} />
        </UserLayout>
    );
}
