import UserLayout from '@/layouts/user-layout';
import { Head } from '@inertiajs/react';
import { useEffect } from 'react';
import AboutSection from './about-section';
import HeroSection from './hero-section';
import ModulesSection from './modules-section';
import RegisterSection from './register-section';
import RelatedProduct from './related-product';
import ToolsSection from './tools-section';
import VideoSection from './video-section';

interface Course {
    id: string;
    title: string;
    user?: { id: string; name: string; bio: string | null };
    category?: { name: string };
    category_id?: string;
    tools?: { name: string; description?: string | null; icon: string | null }[];
    images?: { image_url: string }[];
    short_description?: string | null;
    description?: string | null;
    key_points?: string | null;
    strikethrough_price: number;
    price: number;
    thumbnail?: string | null;
    course_url: string;
    registration_url: string;
    status: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    created_at: string;
    updated_at: string;
    modules?: {
        title: string;
        description?: string | null;
        lessons?: {
            title: string;
            description?: string | null;
            type: 'text' | 'video' | 'file' | 'quiz';
            attachment?: string | null;
            video_url?: string | null;
            is_free?: boolean;
        }[];
    }[];
}

interface RelatedCourse {
    id: string;
    title: string;
    slug: string;
    thumbnail?: string | null;
    price: number;
    strikethrough_price: number;
    level: 'beginner' | 'intermediate' | 'advanced';
    category?: {
        name: string;
    };
}

interface ReferralInfo {
    code?: string;
    hasActive: boolean;
}

export default function DetailCourse({
    course,
    relatedCourses,
    myCourseIds,
    referralInfo,
}: {
    course: Course;
    relatedCourses: RelatedCourse[];
    myCourseIds: string[];
    referralInfo: ReferralInfo;
}) {
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const refFromUrl = urlParams.get('ref');

        if (refFromUrl) {
            sessionStorage.setItem('referral_code', refFromUrl);
        } else if (referralInfo.code) {
            sessionStorage.setItem('referral_code', referralInfo.code);
        }
    }, [referralInfo]);

    return (
        <UserLayout>
            <Head title={`${course.title} - Kelas Online`} />

            <HeroSection course={course} />
            <VideoSection course={course} />

            <div className="mx-auto mt-8 mb-4 flex w-full max-w-7xl justify-center gap-2 px-4">
                <a
                    href="#about"
                    className="bg-background hover:bg-accent dark:hover:bg-primary/10 rounded-xl border border-gray-300 px-4 py-2 text-sm text-gray-800 transition hover:cursor-pointer dark:border-zinc-100/20 dark:bg-zinc-800 dark:text-zinc-100"
                >
                    Informasi Kelas
                </a>
                <a
                    href="#modules"
                    className="bg-background hover:bg-accent dark:hover:bg-primary/10 rounded-xl border border-gray-300 px-4 py-2 text-sm text-gray-800 transition hover:cursor-pointer dark:border-zinc-100/20 dark:bg-zinc-800 dark:text-zinc-100"
                >
                    Modul
                </a>
                <a
                    href="#tools"
                    className="bg-background hover:bg-accent dark:hover:bg-primary/10 rounded-xl border border-gray-300 px-4 py-2 text-sm text-gray-800 transition hover:cursor-pointer dark:border-zinc-100/20 dark:bg-zinc-800 dark:text-zinc-100"
                >
                    Tools
                </a>
                <a
                    href="#related"
                    className="bg-background hover:bg-accent dark:hover:bg-primary/10 rounded-xl border border-gray-300 px-4 py-2 text-sm text-gray-800 transition hover:cursor-pointer dark:border-zinc-100/20 dark:bg-zinc-800 dark:text-zinc-100"
                >
                    Kelas Serupa
                </a>
            </div>

            <AboutSection course={course} />
            <ModulesSection course={course} />
            <ToolsSection course={course} />
            <RegisterSection course={course} />
            <RelatedProduct relatedCourses={relatedCourses} myCourseIds={myCourseIds} />
        </UserLayout>
    );
}
