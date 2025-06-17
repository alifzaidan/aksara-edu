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

export default function Welcome() {
    return (
        <UserLayout>
            <Head title="Dashboard" />

            <CarouselSection />
            <AboutSection />
            <ProgramSection />
            <ToolsSection />
            <BestSellerSection />
            <TestimonySection />
            <FaqSection />
            <CtaSection />
        </UserLayout>
    );
}
