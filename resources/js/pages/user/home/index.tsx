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

            <a
                href="https://wa.me/+6285142505797?text=Halo%20Admin%20Aksademy,%20saya%20ingin%20bertanya%20tentang%20kelas%20online."
                target="_blank"
                rel="noopener noreferrer"
                className="fixed right-10 bottom-6 z-50 flex h-16 w-16 animate-bounce items-center justify-center rounded-full bg-green-100 shadow-lg transition duration-1000 hover:bg-green-200"
                aria-label="Chat WhatsApp"
            >
                <img src="/assets/images/icon-wa.svg" alt="WhatsApp" className="h-12 w-12" />
            </a>
        </UserLayout>
    );
}
