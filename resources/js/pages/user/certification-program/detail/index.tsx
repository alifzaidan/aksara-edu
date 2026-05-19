import UserLayout from '@/layouts/user-layout';
import { Head } from '@inertiajs/react';
import HeroSection from './hero-section';
import KeyPointsSection from './key-points-section';
import RegisterSection from './register-section';
import RelatedPrograms from './related-programs';
import ScheduleInfoSection from './schedule-info-section';

interface Mentor {
    id: string;
    name: string;
    bio?: string;
    avatar?: string;
}

interface Schedule {
    id: string;
    title?: string | null;
    schedule_date?: string;
    start_date?: string;
    day?: string;
    start_time?: string;
    end_time?: string;
}

interface Program {
    id: string;
    title: string;
    slug: string;
    short_description: string;
    description: string;
    benefits: string;
    terms_conditions?: string | null;
    scholarship_flow?: string | null;
    type: 'regular' | 'scholarship';
    status: string;
    category: { id: string; name: string };
    price: number;
    scholarship_price?: number;
    strikethrough_price?: number;
    thumbnail?: string | null;
    registration_deadline?: string;
    socialization_registration_deadline?: string;
    group_url?: string;
    batch?: string;
    document_required?: boolean;
    document_description?: string | null;
    schedules: Schedule[];
    socializationSchedules: Schedule[];
    mentors: Mentor[];
}

interface RelatedProgram {
    id: string;
    title: string;
    slug: string;
    type: 'regular' | 'scholarship';
    price: number;
    strikethrough_price?: number;
    category?: { name: string };
    thumbnail?: string | null;
    registration_deadline?: string;
}

interface DetailProps {
    program: Program;
    relatedPrograms: RelatedProgram[];
    myProgramIds: string[];
    scholarshipApplication?: { status: string } | null;
}

export default function Detail({ program, relatedPrograms, myProgramIds, scholarshipApplication }: DetailProps) {
    const isEnrolled = myProgramIds.includes(program.id);

    return (
        <UserLayout>
            <Head title={`${program.title} - Program Sertifikasi`} />

            <HeroSection program={program} />
            <KeyPointsSection program={program} />
            <ScheduleInfoSection program={program} />
            <RegisterSection program={program} isEnrolled={isEnrolled} scholarshipApplication={scholarshipApplication} />
            <RelatedPrograms relatedPrograms={relatedPrograms} />
        </UserLayout>
    );
}
