import UserLayout from '@/layouts/user-layout';
import { Head } from '@inertiajs/react';
import CoursesSection from './courses-section';
import FeatureSection from './feature-section';
import HeroSection from './hero-section';
import { useTranslation } from 'react-i18next';

type Category = {
    id: string;
    name: string;
};

interface Course {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    slug: string;
    strikethrough_price: number;
    price: number;
    level: 'beginner' | 'intermediate' | 'advanced';
    category: Category;
}

interface CourseProps {
    categories: Category[];
    courses: Course[];
    myCourseIds: string[];
}

export default function Course({ categories, courses, myCourseIds }: CourseProps) {
    const { t } = useTranslation('user');
    return (
        <UserLayout>
            <Head title={t('course.title')} />

            <HeroSection />
            <FeatureSection />
            <CoursesSection categories={categories} courses={courses} myCourseIds={myCourseIds} />
        </UserLayout>
    );
}
