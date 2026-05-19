import UserLayout from '@/layouts/user-layout';
import { Head } from '@inertiajs/react';
import CertificationProgramSection from './certification-program-section';
import FeatureSection from './feature-section';
import HeroSection from './hero-section';

type Category = {
    id: string;
    name: string;
};

interface Program {
    id: string;
    title: string;
    slug: string;
    short_description: string;
    type: 'regular' | 'scholarship';
    category: Category;
    price: number;
    scholarship_price?: number;
    strikethrough_price?: number;
    thumbnail?: string | null;
    registration_deadline?: string;
}

interface DashboardProps {
    categories: Category[];
    programs: Program[];
    myProgramIds: string[];
}

export default function Dashboard({ categories, programs, myProgramIds }: DashboardProps) {
    return (
        <UserLayout>
            <Head title="Program Sertifikasi" />

            <HeroSection />
            <FeatureSection />
            <CertificationProgramSection categories={categories} programs={programs} myProgramIds={myProgramIds} />
        </UserLayout>
    );
}
