import UserLayout from '@/layouts/user-layout';
import { Head } from '@inertiajs/react';
import { useEffect } from 'react';
import AboutSection from './about-section';
import HeroSection from './hero-section';
import MentorSection from './mentor-section';
import RegisterSection from './register-section';
import RelatedProduct from './related-product';
import ScheduleSection from './schedule-section';

interface Schedule {
    id: string;
    start_time: string;
    end_time: string;
    registration_deadline?: string | null;
    max_participants?: number;
}

interface PrivateClass {
    id: string;
    title: string;
    slug: string;
    description?: string | null;
    benefits?: string | null;
    mode: 'online' | 'offline';
    location?: string | null;
    price: number;
    strikethrough_price?: number;
    thumbnail?: string | null;
    schedules?: Schedule[];
    category?: { id: string; name: string };
    user?: { id: string; name: string; bio?: string; avatar?: string };
}

interface RelatedPrivateClass {
    id: string;
    title: string;
    slug: string;
    thumbnail?: string | null;
    price: number;
    strikethrough_price: number;
    mode: 'online' | 'offline';
    category?: { name: string };
    schedules?: { start_time: string }[];
}

interface ReferralInfo {
    code?: string;
    hasActive: boolean;
}

interface Props {
    privateClass: PrivateClass;
    relatedPrivateClasses: RelatedPrivateClass[];
    myPrivateClassIds: string[];
    referralInfo: ReferralInfo;
}

export default function PrivateDetail({ privateClass, relatedPrivateClasses, myPrivateClassIds, referralInfo }: Props) {
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const refFromUrl = urlParams.get('ref');

        if (refFromUrl) {
            sessionStorage.setItem('affiliate_code', refFromUrl);
            sessionStorage.setItem('referral_code', refFromUrl);
        } else if (referralInfo?.code) {
            sessionStorage.setItem('affiliate_code', referralInfo.code);
            sessionStorage.setItem('referral_code', referralInfo.code);
        }
    }, [referralInfo]);

    return (
        <UserLayout>
            <Head title={`${privateClass.title} - Private Class`} />

            <HeroSection privateClass={privateClass} />
            <AboutSection />
            <ScheduleSection privateClass={privateClass} />
            <MentorSection privateClass={privateClass} />
            <RegisterSection privateClass={privateClass} myPrivateClassIds={myPrivateClassIds} />
            <RelatedProduct relatedPrivateClasses={relatedPrivateClasses} myPrivateClassIds={myPrivateClassIds} />
        </UserLayout>
    );
}
