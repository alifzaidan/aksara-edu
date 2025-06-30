import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { FileDown, FileText, LogOut, PlayCircle, HelpCircle } from 'lucide-react';
import { NavFooter } from './nav-footer';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

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
}

export function AppSidebarCourse({ courseSlug, modules, selectedLesson, setSelectedLesson }: AppSidebarCourseProps) {
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

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/admin/dashboard" prefetch>
                                {/* Logo untuk light mode */}
                                <img src="/assets/images/logo-primary.png" alt="Aksademy" className="block w-32 fill-current dark:hidden" />
                                {/* Logo untuk dark mode */}
                                <img src="/assets/images/logo-secondary.png" alt="Aksademy" className="hidden w-32 fill-current dark:block" />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <Accordion className="w-full">
                    {modules.map((module) => (
                        <AccordionItem key={module.id} value={module.id}>
                            <AccordionTrigger className="px-2 text-left text-sm font-semibold hover:no-underline">{module.title}</AccordionTrigger>
                            <AccordionContent className="pb-0">
                                <ul className="space-y-1">
                                    {module.lessons.map((lesson) => (
                                        <li key={lesson.id}>
                                            <button
                                                onClick={() => setSelectedLesson(lesson)}
                                                className={`flex w-full items-center gap-3 rounded-md p-2 text-left text-sm transition-colors ${
                                                    selectedLesson?.id === lesson.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'
                                                }`}
                                            >
                                                {lessonIcons[lesson.type]}
                                                <span>{lesson.title}</span>
                                            </button>
                                        </li>
                                    ))}
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
