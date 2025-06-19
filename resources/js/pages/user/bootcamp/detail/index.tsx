import UserLayout from '@/layouts/user-layout';
import { Head } from '@inertiajs/react';
import AboutSection from './about-section';
import BenefitsSection from './benefits-section';
import HeroSection from './hero-section';
import MentorSection from './mentor-section';
import RegisterSection from './register-section';
import TimelineSection from './timeline-section';

type Category = {
    id: string;
    name: string;
};

interface Bootcamp {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    slug: string;
    price: number;
    start_date: string;
    end_date: string;
    category: Category;
}

interface BootcampProps {
    bootcamp: Bootcamp;
}

export default function Bootcamp({ bootcamp }: BootcampProps) {
    return (
        <UserLayout>
            <Head title="Bootcamp" />

            <HeroSection bootcamp={bootcamp} />
            <AboutSection />
            <BenefitsSection />
            <MentorSection />
            <TimelineSection />
            <RegisterSection />
        </UserLayout>
    );
}
