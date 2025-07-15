import UserLayout from '@/layouts/user-layout';
import { Head } from '@inertiajs/react';
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
    schedules?: { day: string; start_time: string; end_time: string }[];
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
    host_name?: string | null;
    host_description?: string | null;
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

export default function Bootcamp({
    bootcamp,
    relatedBootcamps,
    myBootcampIds,
}: {
    bootcamp: Bootcamp;
    relatedBootcamps: RelatedBootcamp[];
    myBootcampIds: string[];
}) {
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
