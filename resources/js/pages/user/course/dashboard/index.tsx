import UserLayout from '@/layouts/user-layout';
import { Head } from '@inertiajs/react';
import CoursesSection from './courses-section';
import FeatureSection from './feature-section';
import HeroSection from './hero-section';

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
    price: number;
    level: 'beginner' | 'intermediate' | 'advanced';
    category: Category;
}

interface CourseProps {
    categories: Category[];
    courses: Course[];
}

export default function Course({ categories, courses }: CourseProps) {
    return (
        <UserLayout>
            <Head title="Kelas Online" />

            <HeroSection />
            <FeatureSection />
            <CoursesSection categories={categories} courses={courses} />
        </UserLayout>
    );
}
