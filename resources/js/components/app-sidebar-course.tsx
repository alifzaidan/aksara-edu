import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarTrigger } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { FileDown, FileText, LogOut, PlayCircle, HelpCircle, CheckCircle, Circle } from 'lucide-react';
import { NavFooter } from './nav-footer';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { useMemo, useState, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { useSidebar } from '@/components/ui/sidebar';

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

interface AppSidebarCourseProps {
    courseSlug: string;
    modules: Module[];
    selectedLesson: Lesson | null;
    setSelectedLesson: (lesson: Lesson) => void;
    onLessonComplete?: (lessonId: string) => void;
    onProgressUpdate?: (progress: number) => void;
}

export function AppSidebarCourse({ courseSlug, modules, selectedLesson, setSelectedLesson, onLessonComplete, onProgressUpdate }: AppSidebarCourseProps) {
    const [expandedModule, setExpandedModule] = useState<React.Key | null>(null);
    const { state } = useSidebar(); // Ambil state sidebar (expanded/collapsed)

    // Set module pertama terbuka secara default
    useEffect(() => {
        if (modules.length > 0 && expandedModule === null) {
            setExpandedModule(modules[0].id);
        }
    }, [modules, expandedModule]);

    const footerNavItems: NavItem[] = [
        {
            title: 'Keluar Kelas',
            href: `/profile/my-courses/${courseSlug}`,
            icon: LogOut,
        },
    ];

    const lessonIcons = {
        video: <PlayCircle className="text-muted-foreground h-4 w-4" />,
        text: <FileText className="text-muted-foreground h-4 w-4" />,
        file: <FileDown className="text-muted-foreground h-4 w-4" />,
        quiz: <HelpCircle className="text-muted-foreground h-4 w-4" />,
    };

    // Calculate progress
    const progressData = useMemo(() => {
        const totalLessons = modules.reduce((total, module) => total + module.lessons.length, 0);
        const completedLessons = modules.reduce((total, module) => 
            total + module.lessons.filter(lesson => lesson.isCompleted).length, 0
        );
        const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
        
        return {
            totalLessons,
            completedLessons,
            progressPercentage
        };
    }, [modules]);

    // Update enrollment progress when progress changes
    useEffect(() => {
        const updateEnrollmentProgress = async () => {
            try {
                const response = await fetch(`/enrollment/progress/${courseSlug}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                    },
                    body: JSON.stringify({
                        progress: Math.round(progressData.progressPercentage)
                    })
                });

                if (response.ok && onProgressUpdate) {
                    onProgressUpdate(Math.round(progressData.progressPercentage));
                }
            } catch (error) {
                console.error('Error updating enrollment progress:', error);
            }
        };

        if (progressData.progressPercentage > 0) {
            updateEnrollmentProgress();
        }
    }, [progressData.progressPercentage, courseSlug, onProgressUpdate]);

    // Check if all lessons in a module are completed
    const isModuleCompleted = (module: Module) => {
        return module.lessons.length > 0 && module.lessons.every(lesson => lesson.isCompleted);
    };

    // Helper: check if a lesson is accessible (all previous lessons are completed)
    const isLessonAccessible = (moduleIdx: number, lessonIdx: number) => {
        // All previous lessons in previous modules
        for (let m = 0; m < moduleIdx; m++) {
            if (modules[m].lessons.some(l => !l.isCompleted)) return false;
        }
        // All previous lessons in this module
        for (let l = 0; l < lessonIdx; l++) {
            if (!modules[moduleIdx].lessons[l].isCompleted) return false;
        }
        return true;
    };

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <div className="flex items-center justify-center">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton size="lg" asChild>
                                <Link href="/admin/dashboard" prefetch>
                                    <img src="/assets/images/logo-primary.png" alt="Aksademy" className="block w-32 fill-current dark:hidden" />
                                    {/* Logo untuk dark mode */}
                                    <img src="/assets/images/logo-secondary.png" alt="Aksademy" className="hidden w-32 fill-current dark:block" />
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </div>
            </SidebarHeader>

            <SidebarContent>
                {/* Progress Bar Section */}
                {state === 'expanded' && (
                    <div className="px-4 py-3 border-b">
                        <div className="mb-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">Progress Pembelajaran</span>
                                <span className="text-muted-foreground">
                                    {progressData.completedLessons}/{progressData.totalLessons}
                                </span>
                            </div>
                            <div className="mt-2">
                                <Progress value={progressData.progressPercentage} className="h-2 bg-white border border-gray-200" />
                            </div>
                            <div className="mt-1 text-right">
                                <span className="text-xs text-muted-foreground">
                                    {Math.round(progressData.progressPercentage)}% selesai
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                <Accordion 
                    className="w-full" 
                    expandedValue={expandedModule}
                    onValueChange={setExpandedModule}
                >
                    {modules.map((module, moduleIdx) => (
                        <AccordionItem key={module.id} value={module.id}>
                            <AccordionTrigger className="px-2 text-left text-sm font-semibold hover:no-underline">
                                <div className="flex items-center gap-2 w-full">
                                    {state === 'collapsed' ? (
                                        <span className="flex-1 truncate">
                                            {module.title.length > 4 ? module.title.slice(0, 4) + '...' : module.title}
                                        </span>
                                    ) : (
                                        <span className="flex-1">{module.title}</span>
                                    )}
                                    {isModuleCompleted(module) && (
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                    )}
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <ul className="space-y-1">
                                    {module.lessons.map((lesson, lessonIdx) => {
                                        const accessible = isLessonAccessible(moduleIdx, lessonIdx);
                                        return (
                                            <li key={lesson.id} className="group">
                                                <div className={`flex items-center gap-2 ${state === 'collapsed' ? 'justify-center' : ''}`}>
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <button
                                                                    onClick={() => accessible && setSelectedLesson(lesson)}
                                                                    className={`rounded-md p-2 text-left text-sm transition-colors ${
                                                                        state === 'collapsed'
                                                                            ? 'flex items-center justify-center w-10 h-10'
                                                                            : 'flex flex-1 items-center gap-2'
                                                                    } ${
                                                                        selectedLesson?.id === lesson.id
                                                                            ? 'bg-accent text-accent-foreground'
                                                                            : accessible
                                                                                ? 'text-muted-foreground hover:bg-accent hover:text-foreground'
                                                                                : 'text-gray-400 cursor-not-allowed opacity-60'
                                                                    }`}
                                                                    disabled={!accessible}
                                                                    tabIndex={accessible ? 0 : -1}
                                                                >
                                                                    {lessonIcons[lesson.type]}
                                                                    {state === 'expanded' && (
                                                                        <>
                                                                            <span className="flex-1">{lesson.title}</span>
                                                                            {lesson.isCompleted ? (
                                                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                                                            ) : (
                                                                                <Circle className="h-4 w-4" />
                                                                            )}
                                                                        </>
                                                                    )}
                                                                </button>
                                                            </TooltipTrigger>
                                                            {!accessible && (
                                                                <TooltipContent side="right">
                                                                    Silahkan selesaikan materi sebelumnya terlebih dahulu
                                                                </TooltipContent>
                                                            )}
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
