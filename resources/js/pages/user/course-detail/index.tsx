import { Button } from '@/components/ui/button';
import CourseLayout from '@/layouts/course-layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { FileDown, ExternalLink } from 'lucide-react';
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

function getYouTubeEmbedUrl(url: string): string {
    if (!url) return '';
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(youtubeRegex);
    
    if (match && match[1]) {
        return `https://www.youtube-nocookie.com/embed/${match[1]}?rel=0&modestbranding=1&showinfo=0&controls=1&disablekb=1`;
    }
    
    if (url.includes('youtube.com/embed/')) {
        const baseUrl = url.replace('youtube.com', 'youtube-nocookie.com');
        const separator = baseUrl.includes('?') ? '&' : '?';
        return `${baseUrl}${separator}rel=0&modestbranding=1&showinfo=0&controls=1&disablekb=1`;
    }
    return url;
}

function VideoPlayer({ lesson }: { lesson: Lesson }) {
    const [hasError, setHasError] = useState(false);
    const embedUrl = getYouTubeEmbedUrl(lesson.video_url || '');
    
    if (hasError || !embedUrl || embedUrl === lesson.video_url) {
        return (
            <div className="bg-muted/40 flex h-full flex-col items-center justify-center rounded-lg p-8 text-center">
                <ExternalLink className="text-muted-foreground mb-4 h-16 w-16" />
                <h3 className="text-lg font-semibold mb-2">Video External</h3>
                <p className="text-muted-foreground mb-4 text-sm">Video tidak dapat ditampilkan langsung di halaman ini</p>
                <Button asChild>
                    <a href={lesson.video_url} target="_blank" rel="noopener noreferrer">
                        Tonton Video <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                </Button>
            </div>
        );
    }
    
    return (
        <iframe
            src={embedUrl}
            title={lesson.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="h-full w-full rounded-lg"
            loading="lazy"
            onError={() => setHasError(true)}
            style={{
                border: 'none',
                outline: 'none'
            }}
        />
    );
}

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
                    <VideoPlayer lesson={lesson} />
                </div>
            );
        case 'text':
            return <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: lesson.content || '' }} />;
        case 'file':
            if (!lesson.attachment) {
                return (
                    <div className="bg-muted/40 flex h-full flex-col items-center justify-center rounded-lg p-8 text-center">
                        <FileDown className="text-muted-foreground mb-4 h-16 w-16" />
                        <h3 className="text-lg font-semibold">File Tidak Tersedia</h3>
                        <p className="text-muted-foreground text-sm">File materi tidak ditemukan.</p>
                    </div>
                );
            }
            
            return (
                <div className="w-full h-[600px]">
                    <iframe
                        src={`/storage/${lesson.attachment}#toolbar=0&navpanes=0&scrollbar=0`}
                        title={lesson.title}
                        className="w-full h-full rounded-lg border"
                        style={{
                            border: 'none',
                            outline: 'none'
                        }}
                    />
                </div>
            );
        default:
            return <div>Tipe materi tidak dikenal.</div>;
    }
}

export default function CourseDetail({ course }: { course: Course }) {
    const modules = course.modules && course.modules.length > 0 ? course.modules : [];
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
