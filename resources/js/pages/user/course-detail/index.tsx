import { Button } from '@/components/ui/button';
import CourseLayout from '@/layouts/course-layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { FileDown } from 'lucide-react';
import { useState } from 'react';

interface Lesson {
    id: string;
    title: string;
    type: 'video' | 'text' | 'file';
    content?: string;
    video_url?: string;
    attachment?: string;
    isCompleted: boolean;
}

interface Module {
    id: string;
    title: string;
    lessons: Lesson[];
}

interface Course {
    id: string;
    title: string;
    slug: string;
    modules: Module[];
}

// Contoh data modul dan pelajaran (sementara)
const mockModules: Module[] = [
    {
        id: 'mod1',
        title: 'Modul 1: Pengenalan Dasar',
        lessons: [
            {
                id: 'les1',
                title: 'Selamat Datang di Kelas!',
                type: 'video',
                video_url: 'https://www.youtube.com/embed/xdYyMJ2VRKE?si=d7s6rsTACVRdcerJ',
                isCompleted: true,
            },
            {
                id: 'les2',
                title: 'Instalasi & Setup',
                type: 'text',
                content: 'Ini adalah panduan instalasi dalam bentuk teks...',
                isCompleted: false,
            },
            { id: 'les3', title: 'Studi Kasus (PDF)', type: 'file', attachment: '#', isCompleted: false },
        ],
    },
    {
        id: 'mod2',
        title: 'Modul 2: Konsep Inti',
        lessons: [
            {
                id: 'les4',
                title: 'Memahami Komponen',
                type: 'video',
                video_url: 'https://www.youtube.com/embed/xdYyMJ2VRKE?si=d7s6rsTACVRdcerJ',
                isCompleted: false,
            },
            { id: 'les5', title: 'State & Props', type: 'text', content: 'Penjelasan mendalam tentang state dan props...', isCompleted: false },
        ],
    },
    {
        id: 'mod3',
        title: 'Modul 3: Proyek Akhir',
        lessons: [
            {
                id: 'les6',
                title: 'Membangun Aplikasi',
                type: 'video',
                video_url: 'https://www.youtube.com/embed/xdYyMJ2VRKE?si=d7s6rsTACVRdcerJ',
                isCompleted: false,
            },
        ],
    },
];

function LessonContent({ lesson }: { lesson: Lesson | null }) {
    if (!lesson) {
        return (
            <div className="bg-muted/40 flex h-full items-center justify-center rounded-lg">
                <p>Pilih materi untuk memulai belajar.</p>
            </div>
        );
    }

    switch (lesson.type) {
        case 'video':
            return (
                <div className="aspect-video w-full">
                    <iframe
                        src={lesson.video_url}
                        title={lesson.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="h-full w-full rounded-lg"
                    ></iframe>
                </div>
            );
        case 'text':
            return <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: lesson.content || '' }} />;
        case 'file':
            return (
                <div className="bg-muted/40 flex h-full flex-col items-center justify-center rounded-lg p-8 text-center">
                    <FileDown className="text-muted-foreground mb-4 h-16 w-16" />
                    <h3 className="text-lg font-semibold">Materi Siap Diunduh</h3>
                    <p className="text-muted-foreground mb-6 text-sm">Klik tombol di bawah untuk mengunduh file materi.</p>
                    <Button asChild>
                        <a href={lesson.attachment} download>
                            Unduh {lesson.title}
                        </a>
                    </Button>
                </div>
            );
        default:
            return <div>Tipe materi tidak dikenal.</div>;
    }
}

export default function CourseDetail({ course }: { course: Course }) {
    const modules = course.modules && course.modules.length > 0 ? course.modules : mockModules;
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(modules[0]?.lessons[0] || null);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: course.title,
            href: `learn/course/${course.slug}`,
        },
    ];

    return (
        <CourseLayout
            breadcrumbs={breadcrumbs}
            courseSlug={course.slug}
            modules={modules}
            selectedLesson={selectedLesson}
            setSelectedLesson={setSelectedLesson}
        >
            <Head title={selectedLesson?.title || course.title} />

            <div className="m-4 h-full">
                <div className="mb-4">
                    <h1 className="text-2xl font-bold">{selectedLesson?.title}</h1>
                </div>
                <div className="bg-card rounded-lg border p-4">
                    <LessonContent lesson={selectedLesson} />
                </div>
            </div>
        </CourseLayout>
    );
}
