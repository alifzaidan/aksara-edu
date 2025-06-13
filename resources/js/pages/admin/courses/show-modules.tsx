import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Link } from '@inertiajs/react';
import { BadgeCheck, File, FileText, HelpCircle, Lock, Video } from 'lucide-react';
import { useState } from 'react';

interface Lesson {
    id?: number;
    title: string;
    description?: string | null;
    type: 'text' | 'video' | 'file' | 'quiz';
    content?: string | null;
    attachment?: string | null;
    video_url?: string | null;
    is_free?: boolean;
}

interface Module {
    title: string;
    description?: string | null;
    lessons?: Lesson[];
}

function getYoutubeId(url: string) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : '';
}

export default function ShowModules({ modules }: { modules?: Module[] }) {
    const [open, setOpen] = useState(false);
    const [preview, setPreview] = useState<{
        type: 'video' | 'file' | 'text';
        url?: string;
        title: string;
        description?: string | null;
        content?: string;
    } | null>(null);

    const handlePreview = (type: 'video' | 'file' | 'text', urlOrContent: string | undefined, title: string, description?: string | null) => {
        if (type === 'text') {
            setPreview({ type, title, description, content: urlOrContent || '' });
        } else {
            setPreview({ type, url: urlOrContent, title, description });
        }
        setOpen(true);
    };

    return (
        <div className="mt-6 space-y-6 rounded-lg border p-4">
            <h3 className="mb-2 text-lg font-semibold">Modul & Materi</h3>
            {modules && modules.length > 0 ? (
                <Accordion type="single" collapsible className="w-full" defaultValue="mod-0">
                    {modules.map((mod, modIdx) => (
                        <AccordionItem key={modIdx} value={`mod-${modIdx}`}>
                            <AccordionTrigger>
                                <div>
                                    {mod.title}
                                    {mod.description && <div className="text-muted-foreground mb-2 text-sm">{mod.description}</div>}
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                {mod.lessons && mod.lessons.length > 0 ? (
                                    <ol className="list-decimal space-y-2 pl-2">
                                        {mod.lessons.map((lesson, idx) => (
                                            <li key={idx} className="flex items-start gap-2">
                                                {lesson.type === 'text' && <FileText className="mt-1 h-4 w-4 text-blue-500" />}
                                                {lesson.type === 'video' && <Video className="mt-1 h-4 w-4 text-red-500" />}
                                                {lesson.type === 'file' && <File className="mt-1 h-4 w-4 text-green-500" />}
                                                {lesson.type === 'quiz' && <HelpCircle className="mt-1 h-4 w-4 text-yellow-500" />}
                                                <div className="flex w-full justify-between">
                                                    <div>
                                                        {lesson.type === 'text' && (
                                                            <div className="mt-1">
                                                                <button
                                                                    type="button"
                                                                    disabled={!lesson.content}
                                                                    onClick={() =>
                                                                        lesson.content &&
                                                                        handlePreview(
                                                                            'text',
                                                                            lesson.content || undefined,
                                                                            lesson.title,
                                                                            lesson.description || null,
                                                                        )
                                                                    }
                                                                    className={
                                                                        'font-medium hover:underline ' +
                                                                        (lesson.content
                                                                            ? 'hover:cursor-pointer hover:text-blue-500'
                                                                            : 'cursor-not-allowed text-gray-400')
                                                                    }
                                                                >
                                                                    {lesson.title}
                                                                </button>
                                                            </div>
                                                        )}
                                                        {lesson.type === 'file' && (
                                                            <div className="mt-1">
                                                                <button
                                                                    type="button"
                                                                    disabled={!lesson.attachment}
                                                                    onClick={() =>
                                                                        lesson.attachment &&
                                                                        handlePreview(
                                                                            'file',
                                                                            `/storage/${lesson.attachment}`,
                                                                            lesson.title,
                                                                            lesson.description || null,
                                                                        )
                                                                    }
                                                                    className={
                                                                        'font-medium hover:underline ' +
                                                                        (lesson.attachment
                                                                            ? 'hover:cursor-pointer hover:text-green-500'
                                                                            : 'cursor-not-allowed text-gray-400')
                                                                    }
                                                                >
                                                                    {lesson.title}
                                                                </button>
                                                            </div>
                                                        )}
                                                        {lesson.type === 'video' && (
                                                            <div className="mt-1">
                                                                <button
                                                                    type="button"
                                                                    disabled={!lesson.video_url}
                                                                    onClick={() =>
                                                                        lesson.video_url &&
                                                                        handlePreview(
                                                                            'video',
                                                                            lesson.video_url!,
                                                                            lesson.title,
                                                                            lesson.description || null,
                                                                        )
                                                                    }
                                                                    className={
                                                                        'font-medium hover:underline ' +
                                                                        (lesson.video_url
                                                                            ? 'hover:cursor-pointer hover:text-red-500'
                                                                            : 'cursor-not-allowed text-gray-400')
                                                                    }
                                                                >
                                                                    {lesson.title}
                                                                </button>
                                                            </div>
                                                        )}
                                                        {lesson.type === 'quiz' && (
                                                            <div className="mt-1">
                                                                {lesson.id ? (
                                                                    <Link
                                                                        href={route('quizzes.show', { lesson: lesson.id })}
                                                                        className="font-medium hover:cursor-pointer hover:text-yellow-500 hover:underline"
                                                                    >
                                                                        {lesson.title}
                                                                    </Link>
                                                                ) : (
                                                                    <span className="cursor-not-allowed font-medium text-gray-400">
                                                                        {lesson.title}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                        {lesson.description && (
                                                            <div className="text-muted-foreground text-xs">{lesson.description}</div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        {lesson.is_free ? (
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <BadgeCheck size="14" className="hover:text-green-500" />
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Materi Gratis</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        ) : (
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Lock size="14" className="hover:text-red-500" />
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Materi Berbayar</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ol>
                                ) : (
                                    <div className="text-muted-foreground text-sm">Belum ada materi di modul ini.</div>
                                )}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            ) : (
                <div className="text-muted-foreground text-sm">Belum ada modul pada kelas ini.</div>
            )}

            {/* Modal Preview */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="w-full max-w-4xl">
                    <div className="mb-2 flex items-center justify-between">
                        <DialogTitle className="text-base">{preview?.title}</DialogTitle>
                    </div>
                    <DialogDescription>
                        {preview?.type === 'video' && preview.url && (
                            <div className="w-full">
                                <iframe
                                    className="rounded border"
                                    width="100%"
                                    height="300"
                                    src={
                                        preview.url.includes('youtube.com') || preview.url.includes('youtu.be')
                                            ? `https://www.youtube.com/embed/${getYoutubeId(preview.url)}`
                                            : preview.url
                                    }
                                    title="YouTube Preview"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>
                        )}
                        {preview?.type === 'file' && preview.url && (
                            <div className="w-full">
                                <object data={preview.url} type="application/pdf" width="100%" height="500px">
                                    <p>
                                        Preview tidak tersedia.{' '}
                                        <a href={preview.url} target="_blank" rel="noopener noreferrer">
                                            Download PDF
                                        </a>
                                    </p>
                                </object>
                            </div>
                        )}
                        {preview?.type === 'text' && (
                            <div className="prose w-full max-w-none">
                                {preview.content ? (
                                    <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: preview.content }} />
                                ) : (
                                    <div className="text-muted-foreground">Tidak ada isi materi teks.</div>
                                )}
                            </div>
                        )}
                    </DialogDescription>
                </DialogContent>
            </Dialog>
        </div>
    );
}
