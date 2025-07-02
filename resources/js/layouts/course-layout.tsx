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
    type: 'video' | 'text' | 'file' | 'quiz';
    isCompleted: boolean;
    quizzes?: any[];
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
    onLessonComplete?: (lessonId: string) => void;
    onProgressUpdate?: (progress: number) => void;
}

export default ({ 
    children, 
    breadcrumbs, 
    courseSlug, 
    modules, 
    selectedLesson, 
    setSelectedLesson,
    onLessonComplete,
    onProgressUpdate,
    ...props 
}: CourseLayoutProps) => {
    const handleLessonComplete = async (lessonId: string) => {
        try {
            const response = await fetch(`/lesson/${lessonId}/complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                }
            });

            if (response.ok) {
                onLessonComplete?.(lessonId);
            }
        } catch (error) {
            console.error('Error completing lesson:', error);
        }
    };

    return (
        <AppShell variant="sidebar" {...props}>
            <AppSidebarCourse 
                courseSlug={courseSlug} 
                modules={modules} 
                selectedLesson={selectedLesson} 
                setSelectedLesson={setSelectedLesson}
                onLessonComplete={handleLessonComplete}
                onProgressUpdate={onProgressUpdate}
            />
            <AppContent variant="sidebar">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {children}
                <Toaster />
            </AppContent>
        </AppShell>
    );
};
