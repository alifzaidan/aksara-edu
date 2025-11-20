import UserLayout from '@/layouts/user-layout';
import { Head } from '@inertiajs/react';
import { useEffect } from 'react';
import AboutSection from './about-section';
import HeroSection from './hero-section';
import MentorSection from './mentor-section';
import RegisterSection from './register-section';
import RelatedProduct from './related-product';
import RequirementSection from './requirement-section';
import TimelineSection from './timeline-section';
import ToolsSection from './tools-section';

interface Bootcamp {
    id: string;
    title: string;
    category?: { name: string };
    category_id?: string;
    schedules?: { schedule_date: string; day: string; start_time: string; end_time: string }[];
    tools?: { name: string; description?: string | null; icon: string | null }[];
    batch?: string | null;
    strikethrough_price: number;
    price: number;
    quota: number;
    start_date: string;
    end_date: string;
    registration_deadline: string;
    status: string;
    bootcamp_url: string;
    registration_url: string;
    thumbnail?: string | null;
    description?: string | null;
    benefits?: string | null;
    instructions?: string | null;
    requirements?: string | null;
    curriculum?: string | null;
    user?: {
        id: string;
        name: string;
        bio?: string;
        avatar?: string;
    };
    created_at: string | Date;
}

interface RelatedBootcamp {
    id: string;
    title: string;
    slug: string;
    thumbnail?: string | null;
    price: number;
    strikethrough_price: number;
    start_date: string;
    end_date: string;
    category?: {
        name: string;
    };
}

interface ReferralInfo {
    code?: string;
    hasActive: boolean;
}

export default function Bootcamp({
    bootcamp,
    relatedBootcamps,
    myBootcampIds,
    referralInfo,
}: {
    bootcamp: Bootcamp;
    relatedBootcamps: RelatedBootcamp[];
    myBootcampIds: string[];
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
            <Head title={`${bootcamp.title} - Bootcamp`} />

            <HeroSection bootcamp={bootcamp} />
            <AboutSection />
            <TimelineSection bootcamp={bootcamp} />
            <RequirementSection bootcamp={bootcamp} />
            <ToolsSection bootcamp={bootcamp} />
            <MentorSection bootcamp={bootcamp} />
            <RegisterSection bootcamp={bootcamp} />
            <RelatedProduct relatedBootcamps={relatedBootcamps} myBootcampIds={myBootcampIds} />
        </UserLayout>
    );
}
