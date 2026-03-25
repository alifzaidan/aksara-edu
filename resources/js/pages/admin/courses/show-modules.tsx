import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Link, router } from '@inertiajs/react';
import { BadgeCheck, ClipboardCheck, File, FileText, HelpCircle, Lock, Video } from 'lucide-react';
import { useState } from 'react';

interface Lesson {
    id?: string;
    title: string;
    description?: string | null;
    type: 'text' | 'video' | 'file' | 'quiz' | 'assignment';
    content?: string | null;
    attachment?: string | null;
    video_url?: string | null;
    is_free?: boolean;
    assignment_submissions?: {
        id: string;
        file_path: string;
        status: 'pending' | 'approved' | 'rejected';
        admin_note?: string | null;
        user?: {
            id: string;
            name: string;
            email: string;
        };
    }[];
    quizzes?:
        | {
              id: string;
              title: string;
              description?: string | null;
              questions?: {
                  id: string;
              }[];
          }[]
        | null;
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

export default function ShowModules({ modules, courseId }: { modules?: Module[]; courseId: string }) {
    const [open, setOpen] = useState(false);
    const [expandedModule, setExpandedModule] = useState<string | null>('mod-0');
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

    const quizzesWithoutQuestions: { moduleTitle: string; lessonTitle: string }[] = [];
    modules?.forEach((mod) => {
        mod.lessons?.forEach((lesson) => {
            if (
                lesson.type === 'quiz' &&
                lesson.quizzes &&
                lesson.quizzes.length > 0 &&
                (!lesson.quizzes[0].questions || lesson.quizzes[0].questions.length === 0)
            ) {
                quizzesWithoutQuestions.push({
                    moduleTitle: mod.title,
                    lessonTitle: lesson.title,
                });
            }
        });
    });

    const moduleCount = modules?.length ?? 0;
    const lessonCount = modules?.reduce((total, module) => total + (module.lessons?.length ?? 0), 0) ?? 0;

    const getSubmissionBadgeClass = (status: 'pending' | 'approved' | 'rejected') => {
        if (status === 'approved') return 'bg-green-100 text-green-700';
        if (status === 'rejected') return 'bg-red-100 text-red-700';
        return 'bg-yellow-100 text-yellow-700';
    };

    const getSubmissionStatusLabel = (status: 'pending' | 'approved' | 'rejected') => {
        if (status === 'approved') return 'Disetujui';
        if (status === 'rejected') return 'Ditolak';
        return 'Menunggu';
    };

    const renderLessonTitle = (lesson: Lesson) => {
        if (lesson.type === 'text') {
            return (
                <button
                    type="button"
                    disabled={!lesson.content}
                    onClick={() => lesson.content && handlePreview('text', lesson.content || undefined, lesson.title, lesson.description || null)}
                    className={
                        'font-medium hover:underline ' +
                        (lesson.content ? 'hover:cursor-pointer hover:text-blue-500' : 'cursor-not-allowed text-gray-400')
                    }
                >
                    {lesson.title}
                </button>
            );
        }

        if (lesson.type === 'file') {
            return (
                <button
                    type="button"
                    disabled={!lesson.attachment}
                    onClick={() => {
                        if (lesson.attachment) {
                            const fileUrl = `/storage/${lesson.attachment}`;
                            const fileName = lesson.attachment.split('/').pop() || '';
                            const isPdf = fileName.toLowerCase().endsWith('.pdf');

                            if (isPdf) {
                                handlePreview('file', fileUrl, lesson.title, lesson.description || null);
                            } else {
                                window.open(fileUrl, '_blank');
                            }
                        }
                    }}
                    className={
                        'font-medium hover:underline ' +
                        (lesson.attachment ? 'hover:cursor-pointer hover:text-green-500' : 'cursor-not-allowed text-gray-400')
                    }
                >
                    {lesson.title}
                </button>
            );
        }

        if (lesson.type === 'video') {
            return (
                <button
                    type="button"
                    disabled={!lesson.video_url}
                    onClick={() => lesson.video_url && handlePreview('video', lesson.video_url, lesson.title, lesson.description || null)}
                    className={
                        'font-medium hover:underline ' +
                        (lesson.video_url ? 'hover:cursor-pointer hover:text-red-500' : 'cursor-not-allowed text-gray-400')
                    }
                >
                    {lesson.title}
                </button>
            );
        }

        if (lesson.type === 'quiz') {
            if (!lesson.id) {
                return <span className="cursor-not-allowed font-medium text-gray-400">{lesson.title}</span>;
            }

            return (
                <Link
                    href={route('quizzes.show', {
                        course: courseId,
                        quiz: lesson.quizzes?.[0]?.id,
                    })}
                    className="font-medium hover:cursor-pointer hover:text-yellow-500 hover:underline"
                >
                    {lesson.title}
                </Link>
            );
        }

        return (
            <button
                type="button"
                onClick={() => handlePreview('text', lesson.content || undefined, lesson.title, lesson.description || null)}
                className="font-medium hover:cursor-pointer hover:text-purple-600 hover:underline"
            >
                {lesson.title}
            </button>
        );
    };

    return (
        <div className="space-y-4 rounded-lg border p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-semibold">Modul & Materi</h3>
                <div className="text-muted-foreground text-xs md:text-sm">
                    {moduleCount} modul • {lessonCount} materi
                </div>
            </div>

            {quizzesWithoutQuestions.length > 0 && (
                <div className="rounded border border-yellow-400 bg-yellow-50 p-3 text-sm text-yellow-800">
                    <b>Perhatian:</b> Terdapat quiz yang belum memiliki data pertanyaan:
                    <ul className="mt-1 list-disc pl-5">
                        {quizzesWithoutQuestions.map((q, i) => (
                            <li key={i}>
                                Modul: <b>{q.moduleTitle}</b>, Materi: <b>{q.lessonTitle}</b>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {modules && modules.length > 0 ? (
                <Accordion className="w-full" expandedValue={expandedModule} onValueChange={(value) => setExpandedModule(value as string | null)}>
                    {modules.map((mod, modIdx) => (
                        <AccordionItem key={modIdx} value={`mod-${modIdx}`} className="rounded-md border p-3">
                            <AccordionTrigger className="hover:no-underline">
                                <div className="text-left">
                                    <div className="font-semibold">{mod.title}</div>
                                    <div className="text-muted-foreground mt-1 text-xs">{mod.lessons?.length ?? 0} materi</div>
                                    {mod.description && <div className="text-muted-foreground mt-1 text-sm">{mod.description}</div>}
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                {mod.lessons && mod.lessons.length > 0 ? (
                                    <ol className="space-y-3">
                                        {mod.lessons.map((lesson, idx) => (
                                            <li key={idx} className="rounded-md border bg-white p-3">
                                                <div className="flex items-start gap-3">
                                                    <div className="text-muted-foreground mt-0.5 text-xs font-semibold">#{idx + 1}</div>
                                                    {lesson.type === 'text' && <FileText className="mt-1 h-4 w-4 text-blue-500" />}
                                                    {lesson.type === 'video' && <Video className="mt-1 h-4 w-4 text-red-500" />}
                                                    {lesson.type === 'file' && <File className="mt-1 h-4 w-4 text-green-500" />}
                                                    {lesson.type === 'quiz' && <HelpCircle className="mt-1 h-4 w-4 text-yellow-500" />}
                                                    {lesson.type === 'assignment' && <ClipboardCheck className="mt-1 h-4 w-4 text-purple-600" />}

                                                    <div className="flex w-full items-start justify-between gap-2">
                                                        <div className="min-w-0 flex-1 space-y-1">
                                                            {renderLessonTitle(lesson)}

                                                            {lesson.type === 'file' && lesson.attachment && (
                                                                <div className="text-muted-foreground text-xs">
                                                                    {lesson.attachment.split('/').pop()?.toLowerCase().endsWith('.pdf')
                                                                        ? 'Klik untuk preview PDF'
                                                                        : 'Klik untuk download - Tidak ada preview untuk format file ini'}
                                                                </div>
                                                            )}

                                                            {lesson.type === 'assignment' && (
                                                                <div className="rounded-md border border-purple-200 bg-purple-50 p-3">
                                                                    <div className="mb-2 flex items-center justify-between gap-2">
                                                                        <p className="text-xs font-semibold text-purple-800">Submission peserta</p>
                                                                        <span className="rounded bg-white px-2 py-0.5 text-[11px] font-semibold text-purple-700">
                                                                            {lesson.assignment_submissions?.length ?? 0} submission
                                                                        </span>
                                                                    </div>

                                                                    {lesson.assignment_submissions && lesson.assignment_submissions.length > 0 ? (
                                                                        <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                                                                            {lesson.assignment_submissions.map((submission) => (
                                                                                <div
                                                                                    key={submission.id}
                                                                                    className="rounded border bg-white p-2.5 text-xs"
                                                                                >
                                                                                    <div className="flex items-center justify-between gap-2">
                                                                                        <div className="min-w-0">
                                                                                            <p className="truncate font-medium">
                                                                                                {submission.user?.name ||
                                                                                                    submission.user?.email ||
                                                                                                    'Peserta'}
                                                                                            </p>
                                                                                            <a
                                                                                                href={`/storage/${submission.file_path}`}
                                                                                                target="_blank"
                                                                                                rel="noopener noreferrer"
                                                                                                className="text-blue-600 underline"
                                                                                            >
                                                                                                Lihat File PDF
                                                                                            </a>
                                                                                        </div>
                                                                                        <span
                                                                                            className={`rounded px-2 py-0.5 text-[11px] font-semibold ${getSubmissionBadgeClass(submission.status)}`}
                                                                                        >
                                                                                            {getSubmissionStatusLabel(submission.status)}
                                                                                        </span>
                                                                                    </div>

                                                                                    {submission.admin_note && (
                                                                                        <p className="mt-1 text-[11px] text-red-600">
                                                                                            Catatan: {submission.admin_note}
                                                                                        </p>
                                                                                    )}

                                                                                    {submission.status === 'pending' && (
                                                                                        <div className="mt-2 flex flex-wrap gap-2">
                                                                                            <Button
                                                                                                type="button"
                                                                                                size="sm"
                                                                                                className="h-7 px-2 text-xs"
                                                                                                onClick={() =>
                                                                                                    router.post(
                                                                                                        route('lesson-assignments.approve', {
                                                                                                            submission: submission.id,
                                                                                                        }),
                                                                                                    )
                                                                                                }
                                                                                            >
                                                                                                Approve
                                                                                            </Button>
                                                                                            <Button
                                                                                                type="button"
                                                                                                size="sm"
                                                                                                variant="destructive"
                                                                                                className="h-7 px-2 text-xs"
                                                                                                onClick={() => {
                                                                                                    const note =
                                                                                                        window.prompt(
                                                                                                            'Catatan penolakan (opsional):',
                                                                                                        ) || '';
                                                                                                    router.post(
                                                                                                        route('lesson-assignments.reject', {
                                                                                                            submission: submission.id,
                                                                                                        }),
                                                                                                        { admin_note: note },
                                                                                                    );
                                                                                                }}
                                                                                            >
                                                                                                Tolak
                                                                                            </Button>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    ) : (
                                                                        <p className="text-muted-foreground text-xs">
                                                                            Belum ada submission untuk materi ini.
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {lesson.description && (
                                                                <div className="text-muted-foreground text-xs">{lesson.description}</div>
                                                            )}
                                                        </div>

                                                        <div className="shrink-0">
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
