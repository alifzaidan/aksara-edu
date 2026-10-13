import UserLayout from '@/layouts/user-layout';
import { Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
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
    approvedScholarshipProgramIds?: string[];
}

export default function Dashboard({ categories, programs, myProgramIds, approvedScholarshipProgramIds = [] }: DashboardProps) {
    const { t } = useTranslation('user');

    return (
        <UserLayout>
            <Head title={t('certificationProgram.dashboard.headTitle')} />

            <HeroSection />
            <FeatureSection />
            <CertificationProgramSection 
                categories={categories} 
                programs={programs} 
                myProgramIds={myProgramIds} 
                approvedScholarshipProgramIds={approvedScholarshipProgramIds}
            />
        </UserLayout>
    );
}
