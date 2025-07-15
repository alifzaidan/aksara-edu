import UserLayout from '@/layouts/user-layout';
import { Head } from '@inertiajs/react';
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
    host_name?: string | null;
    host_description?: string | null;
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

export default function Webinar({
    webinar,
    relatedWebinars,
    myWebinarIds,
}: {
    webinar: Webinar;
    relatedWebinars: RelatedWebinar[];
    myWebinarIds: string[];
}) {
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
