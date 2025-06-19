import UserLayout from '@/layouts/user-layout';
import { Head } from '@inertiajs/react';
import AboutSection from './about-section';
import HeroSection from './hero-section';
import ModulesSection from './modules-section';
import RatingSection from './rating-section';
import RegisterSection from './register-section';
import ToolsSection from './tools-section';
import VideoSection from './video-section';

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

interface DetailCourseProps {
    course: Course;
}

export default function DetailCourse({ course }: DetailCourseProps) {
    return (
        <UserLayout>
            <Head title="Kelas Online" />

            <HeroSection course={course} />
            <VideoSection />
            <div className="mx-auto mt-8 mb-4 flex w-full max-w-7xl justify-center gap-2 px-4">
                <a
                    href="#about"
                    type="button"
                    className={
                        'hover:bg-accent dark:hover:bg-primary/10 bg-background rounded-xl border border-gray-300 px-4 py-2 text-sm text-gray-800 transition hover:cursor-pointer dark:border-zinc-100/20 dark:bg-zinc-800 dark:text-zinc-100'
                    }
                >
                    Informasi Kelas
                </a>
                <a
                    href="#modules"
                    type="button"
                    className={
                        'hover:bg-accent dark:hover:bg-primary/10 bg-background rounded-xl border border-gray-300 px-4 py-2 text-sm text-gray-800 transition hover:cursor-pointer dark:border-zinc-100/20 dark:bg-zinc-800 dark:text-zinc-100'
                    }
                >
                    Modul
                </a>
                <a
                    href="#tools"
                    type="button"
                    className={
                        'hover:bg-accent dark:hover:bg-primary/10 bg-background rounded-xl border border-gray-300 px-4 py-2 text-sm text-gray-800 transition hover:cursor-pointer dark:border-zinc-100/20 dark:bg-zinc-800 dark:text-zinc-100'
                    }
                >
                    Tools
                </a>
                <a
                    href="#reviews"
                    type="button"
                    className={
                        'hover:bg-accent dark:hover:bg-primary/10 bg-background rounded-xl border border-gray-300 px-4 py-2 text-sm text-gray-800 transition hover:cursor-pointer dark:border-zinc-100/20 dark:bg-zinc-800 dark:text-zinc-100'
                    }
                >
                    Review
                </a>
            </div>
            <AboutSection />
            <ModulesSection />
            <ToolsSection />
            <RegisterSection />
            <RatingSection />
        </UserLayout>
    );
}
