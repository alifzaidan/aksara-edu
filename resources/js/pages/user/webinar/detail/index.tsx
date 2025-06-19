import UserLayout from '@/layouts/user-layout';
import { Head } from '@inertiajs/react';
import AboutSection from './about-section';
import BenefitsSection from './benefits-section';
import HeroSection from './hero-section';
import MentorSection from './mentor-section';
import RegisterSection from './register-section';

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
    price: number;
    start_time: string;
    category: Category;
}

interface WebinarProps {
    webinar: Webinar;
}

export default function Webinar({ webinar }: WebinarProps) {
    return (
        <UserLayout>
            <Head title="Webinar" />

            <HeroSection webinar={webinar} />
            <AboutSection />
            <BenefitsSection />
            <MentorSection />
            <RegisterSection />
        </UserLayout>
    );
}
