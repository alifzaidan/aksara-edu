import UserLayout from '@/layouts/user-layout';
import { Head } from '@inertiajs/react';
import AboutSection from './about-section';
import BestSellerSection from './best-seller-section';
import CarouselSection from './carousel-section';
import CtaSection from './cta-section';
import FaqSection from './faq-section';
import ProgramSection from './program-section';
import TestimonySection from './testimony-section';
import ToolsSection from './tools-section';

interface Tool {
    id: string;
    name: string;
    description: string;
    icon: string;
}

interface Course {
    id: string;
    title: string;
    thumbnail: string;
    slug: string;
    price: number;
    level: 'beginner' | 'intermediate' | 'advanced';
}

export default function Home({ courses, tools }: { courses: Course[]; tools: Tool[] }) {
    return (
        <UserLayout>
            <Head title="Beranda" />

            <CarouselSection />
            <AboutSection />
            <ProgramSection />
            <ToolsSection tools={tools} />
            <BestSellerSection courses={courses} />
            <TestimonySection />
            <FaqSection />
            <CtaSection />
        </UserLayout>
    );
}
