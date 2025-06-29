import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebarCourse } from '@/components/app-sidebar-course';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { Toaster } from '@/components/ui/sonner';
import { type BreadcrumbItem } from '@/types';
import { Dispatch, SetStateAction, type ReactNode } from 'react';

interface Lesson {
    id: string;
    title: string;
    type: 'video' | 'text' | 'file';
    isCompleted: boolean;
}
interface Module {
    id: string;
    title: string;
    lessons: Lesson[];
}

interface CourseLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
    courseSlug: string;
    modules: Module[];
    selectedLesson: Lesson | null;
    setSelectedLesson: Dispatch<SetStateAction<Lesson | null>>;
}

export default ({ children, breadcrumbs, courseSlug, modules, selectedLesson, setSelectedLesson, ...props }: CourseLayoutProps) => (
    <AppShell variant="sidebar" {...props}>
        <AppSidebarCourse courseSlug={courseSlug} modules={modules} selectedLesson={selectedLesson} setSelectedLesson={setSelectedLesson} />
        <AppContent variant="sidebar">
            <AppSidebarHeader breadcrumbs={breadcrumbs} />
            {children}
            <Toaster />
        </AppContent>
    </AppShell>
);
