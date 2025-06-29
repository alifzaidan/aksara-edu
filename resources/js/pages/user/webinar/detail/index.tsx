import UserLayout from '@/layouts/user-layout';
import { Head } from '@inertiajs/react';
import AboutSection from './about-section';
import BenefitsSection from './benefits-section';
import HeroSection from './hero-section';
import MentorSection from './mentor-section';
import RegisterSection from './register-section';
import ToolsSection from './tools-section';

interface Webinar {
    id: string;
    title: string;
    category?: { name: string };
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

export default function Webinar({ webinar }: { webinar: Webinar }) {
    return (
        <UserLayout>
            <Head title="Webinar" />

            <HeroSection webinar={webinar} />
            <AboutSection />
            <BenefitsSection webinar={webinar} />
            <ToolsSection webinar={webinar} />
            <MentorSection webinar={webinar} />
            <RegisterSection webinar={webinar} />
        </UserLayout>
    );
}
