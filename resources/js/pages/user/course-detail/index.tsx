import ErrorBoundary from '@/components/error-boundary';
import { Button } from '@/components/ui/button';
import CourseLayout from '@/layouts/course-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import {
    AlertTriangle,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    ClipboardCheck,
    ExternalLink,
    FileDown,
    HelpCircle,
    Upload,
    XCircle,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface AssignmentSubmission {
    id: string;
    file_path: string;
    status: 'pending' | 'approved' | 'rejected';
    admin_note?: string | null;
}

interface Lesson {
    id: string;
    title: string;
    type: 'video' | 'text' | 'file' | 'quiz' | 'assignment';
    content?: string;
    video_url?: string;
    attachment?: string;
    is_preview?: boolean | number;
    isCompleted: boolean;
    assignment_submission?: AssignmentSubmission | null;
    quizzes?: {
        id: string;
        title: string;
        instructions: string;
        time_limit: number;
        passing_score: number;
        attempts?: {
            id: string;
            score: number;
            correct_answers: number;
            total_questions: number;
            is_passed: boolean;
            time_taken: number;
            submitted_at: string;
            answers_summary: unknown[];
        }[];
        questions: {
            id: string;
            question_text: string;
            type: 'multiple_choice' | 'true_false';
            options: {
                id: string;
                option_text: string;
                is_correct: boolean;
            }[];
        }[];
    }[];
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

interface CourseDetailProps {
    course: Course;
    auto_select_lesson_id?: string;
    progress_info?: {
        has_completed_lessons: boolean;
        has_incomplete_lessons: boolean;
        last_completed_lesson_id: string | null;
        next_incomplete_lesson_id: string | null;
    };
}

function getYouTubeEmbedUrl(url: string): string {
    if (!url) return '';
    const youtubeRegex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
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
    const { t } = useTranslation('user');
    const [hasError, setHasError] = useState(false);
    const embedUrl = getYouTubeEmbedUrl(lesson.video_url || '');

    if (hasError || !embedUrl || embedUrl === lesson.video_url) {
        return (
            <div className="bg-muted/40 flex h-full flex-col items-center justify-center rounded-lg p-8 text-center">
                <ExternalLink className="text-muted-foreground mb-4 h-16 w-16" />
                <h3 className="mb-2 text-lg font-semibold">{t('coursePlayer.externalVideo')}</h3>
                <p className="text-muted-foreground mb-4 text-sm">{t('coursePlayer.externalVideoDesc')}</p>
                <Button asChild>
                    <a href={lesson.video_url} target="_blank" rel="noopener noreferrer">
                        {t('coursePlayer.watchVideo')} <ExternalLink className="ml-2 h-4 w-4" />
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
                outline: 'none',
            }}
        />
    );
}

function QuizDashboard({ lesson }: { lesson: Lesson }) {
    const { t, i18n } = useTranslation('user');
    const locale = i18n.language === 'en' ? 'en-US' : 'id-ID';
    const quiz = lesson.quizzes?.[0];

    if (!quiz) {
        return (
            <div className="bg-muted/40 flex h-full flex-col items-center justify-center rounded-lg p-8 text-center">
                <HelpCircle className="text-muted-foreground mb-4 h-16 w-16" />
                <h3 className="mb-2 text-lg font-semibold">{t('coursePlayer.quizNotAvailable')}</h3>
                <p className="text-muted-foreground text-sm">{t('coursePlayer.quizNotAvailableDesc')}</p>
            </div>
        );
    }

    const attempts = quiz.attempts || [];
    const hasPassedAttempt = attempts.find((attempt) => attempt.is_passed);

    const handleStartQuiz = () => {
        router.get(`/quiz/${quiz.id}/start`);
    };

    // Add handler for viewing answers
    const handleViewAnswers = () => {
        router.get(`/quiz/${quiz.id}/answers`);
    };

    return (
        <div className="mx-auto max-w-4xl p-6">
            <div className="mb-8 text-center">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <HelpCircle className="h-8 w-8" />
                </div>
                <h2 className="mb-2 text-2xl font-bold">{quiz.title}</h2>
                {quiz.instructions && <p className="text-muted-foreground mb-4">{quiz.instructions}</p>}

                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="bg-card rounded-lg border p-4">
                        <div className="text-2xl font-bold text-blue-600">{quiz.questions?.length || 0}</div>
                        <div className="text-muted-foreground text-sm">{t('coursePlayer.totalQuestions')}</div>
                    </div>
                    <div className="bg-card flex min-h-[72px] flex-col items-center justify-center rounded-lg border p-4">
                        {quiz.time_limit === 0 ? (
                            <div className="flex h-full min-h-[48px] items-center justify-center text-sm font-semibold text-red-600">
                                {t('coursePlayer.noTimeLimit')}
                            </div>
                        ) : (
                            <>
                                <div className="text-2xl font-bold text-green-600">{quiz.time_limit}</div>
                                <div className="text-muted-foreground text-sm">{t('coursePlayer.minutes')}</div>
                            </>
                        )}
                    </div>
                    <div className="bg-card rounded-lg border p-4">
                        <div className="text-2xl font-bold text-amber-600">{quiz.passing_score}</div>
                        <div className="text-muted-foreground text-sm">{t('coursePlayer.passingScore')}</div>
                    </div>
                </div>
            </div>

            {/* History Nilai */}
            {attempts.length > 0 && (
                <div className="mb-8">
                    <h3 className="mb-4 text-lg font-semibold">{t('coursePlayer.scoreHistory')}</h3>
                    <div className="space-y-3">
                        {attempts.map((attempt, index) => (
                            <div
                                key={attempt.id}
                                className={`rounded-lg border p-4 ${attempt.is_passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        {attempt.is_passed ? (
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                        ) : (
                                            <XCircle className="h-5 w-5 text-red-600" />
                                        )}
                                        <div>
                                            <div className="font-medium">
                                                {t('coursePlayer.attemptNumber', { number: attempts.length - index })}
                                                {attempt.is_passed && (
                                                    <span className="ml-2 rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">{t('coursePlayer.passedBadge')}</span>
                                                )}
                                            </div>
                                            <div className="text-muted-foreground text-sm">
                                                {new Date(attempt.submitted_at).toLocaleDateString(locale, {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-2xl font-bold ${attempt.is_passed ? 'text-green-600' : 'text-red-600'}`}>
                                            {Math.round(attempt.score)}%
                                        </div>
                                        <div className="text-muted-foreground text-sm">
                                            {t('coursePlayer.correctCount', {
                                                correct: attempt.correct_answers,
                                                total: attempt.total_questions,
                                            })}
                                        </div>
                                        <div className="text-muted-foreground text-sm">
                                            {t('coursePlayer.timeTaken', {
                                                time: `${Math.floor(attempt.time_taken / 60)}:${(attempt.time_taken % 60).toString().padStart(2, '0')}`,
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Status dan Tombol Mulai */}
            <div className="text-center">
                {hasPassedAttempt ? (
                    <div className="mb-6">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-green-100 px-4 py-2 text-green-600">
                            <CheckCircle className="h-5 w-5" />
                            <span className="font-medium">{t('coursePlayer.passedQuizAlert')}</span>
                        </div>
                        <p className="text-muted-foreground mb-4">{t('coursePlayer.passedQuizDesc')}</p>
                    </div>
                ) : (
                    <div className="mb-6">
                        {attempts.length > 0 ? (
                            <div>
                                <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-amber-100 px-4 py-2 text-amber-600">
                                    <AlertTriangle className="h-5 w-5" />
                                    <span className="font-medium">{t('coursePlayer.failedQuizAlert')}</span>
                                </div>
                                <p className="text-muted-foreground mb-4">
                                    {t('coursePlayer.failedQuizDesc')}
                                </p>
                            </div>
                        ) : (
                            <p className="text-muted-foreground mb-4">{t('coursePlayer.readyQuizDesc')}</p>
                        )}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <Button onClick={handleStartQuiz} size="lg" className="gap-2">
                        {attempts.length > 0 ? t('coursePlayer.retakeQuiz') : t('coursePlayer.startQuiz')}
                    </Button>

                    {attempts.length > 0 && (
                        <>
                            <Button onClick={handleViewAnswers} variant="outline" size="lg" className="gap-2">
                                <HelpCircle className="h-4 w-4" />
                                {t('coursePlayer.viewAnswers')}
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function LessonContent({
    lesson,
    onAssignmentSubmitted,
}: {
    lesson: Lesson | null;
    onAssignmentSubmitted?: (lessonId: string, submission: AssignmentSubmission) => void;
}) {
    const { t } = useTranslation('user');
    const [assignmentFile, setAssignmentFile] = useState<File | null>(null);
    const [isSubmittingAssignment, setIsSubmittingAssignment] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const assignmentInputRef = useRef<HTMLInputElement | null>(null);

    if (!lesson) {
        return (
            <div className="bg-muted/40 flex h-full items-center justify-center rounded-lg">
                <p>{t('coursePlayer.selectLessonToStart')}</p>
            </div>
        );
    }

    const handleSubmitAssignment = async () => {
        if (!lesson || lesson.type !== 'assignment') {
            return;
        }

        if (!assignmentFile) {
            toast.error(t('coursePlayer.selectPdfFirst'));
            return;
        }

        const formData = new FormData();
        formData.append('assignment_file', assignmentFile);

        setIsSubmittingAssignment(true);
        try {
            const response = await axios.post(`/lesson/${lesson.id}/assignment-submit`, formData);

            if (response.data?.submission) {
                onAssignmentSubmitted?.(lesson.id, response.data.submission as AssignmentSubmission);
            }
            setAssignmentFile(null);
            toast.success(t('coursePlayer.assignmentSubmittedSuccess'));
        } catch (err: any) {
            toast.error(err.response?.data?.message || t('coursePlayer.assignmentSubmitFailed'));
        } finally {
            setIsSubmittingAssignment(false);
        }
    };

    const handleAssignmentFileChange = (file: File | null) => {
        if (!file) {
            setAssignmentFile(null);
            return;
        }

        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        if (!isPdf) {
            toast.error(t('coursePlayer.fileMustBePdf'));
            return;
        }

        setAssignmentFile(file);
    };

    switch (lesson.type) {
        case 'video':
            return (
                <div className="aspect-video w-full">
                    <VideoPlayer lesson={lesson} />
                </div>
            );
        case 'text':
            return <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: lesson.content || '' }} />;
        case 'file': {
            if (!lesson.attachment) {
                return (
                    <div className="bg-muted/40 flex h-full flex-col items-center justify-center rounded-lg p-8 text-center">
                        <FileDown className="text-muted-foreground mb-4 h-16 w-16" />
                        <h3 className="text-lg font-semibold">{t('coursePlayer.fileNotAvailable')}</h3>
                        <p className="text-muted-foreground text-sm">{t('coursePlayer.fileNotFound')}</p>
                    </div>
                );
            }
            // Cek is_preview: 1/true = hanya preview (no download), 0/false = bisa download
            const lessonWithPreview = lesson as Lesson & { is_preview?: boolean | number };
            const isPreview = lessonWithPreview.is_preview === true || lessonWithPreview.is_preview === 1;
            const isPdf = lesson.attachment && lesson.attachment.toLowerCase().endsWith('.pdf');
            return (
                <div className="w-full">
                    {!isPreview && (
                        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-blue-900">{t('coursePlayer.downloadToContinue')}</span>
                                <Button asChild className="flex items-center gap-2">
                                    <a href={`/storage/${lesson.attachment}`} download target="_blank" rel="noopener noreferrer">
                                        <FileDown className="h-4 w-4" /> {t('coursePlayer.downloadFile')}
                                    </a>
                                </Button>
                            </div>
                        </div>
                    )}
                    <div className="h-[600px] w-full">
                        {isPdf ? (
                            <iframe
                                src={`/storage/${lesson.attachment}#toolbar=0&navpanes=0&scrollbar=0`}
                                title={lesson.title}
                                className="h-full w-full rounded-lg border"
                                style={{
                                    border: 'none',
                                    outline: 'none',
                                }}
                            />
                        ) : (
                            <div className="text-muted-foreground flex h-full items-center justify-center text-sm italic">
                                {t('coursePlayer.previewPdfOnly')}
                            </div>
                        )}
                    </div>
                </div>
            );
        }
        case 'quiz':
            return (
                <ErrorBoundary>
                    <QuizDashboard lesson={lesson} />
                </ErrorBoundary>
            );
        case 'assignment': {
            const submission = lesson.assignment_submission;

            return (
                <div className="space-y-4">
                    <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: lesson.content || '' }} />

                    <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                        <div className="mb-2 flex items-center gap-2 text-purple-700">
                            <ClipboardCheck className="h-5 w-5" />
                            <p className="font-medium">{t('coursePlayer.uploadAssignment')}</p>
                        </div>

                        {submission && (
                            <div className="mb-3 rounded border bg-white p-3 text-sm">
                                <p>
                                    {t('coursePlayer.statusLabel')}{' '}
                                    <span
                                        className={`font-semibold capitalize ${
                                            submission.status === 'approved'
                                                ? 'text-green-600'
                                                : submission.status === 'rejected'
                                                  ? 'text-red-600'
                                                  : 'text-amber-600'
                                        }`}
                                    >
                                        {submission.status}
                                    </span>
                                </p>
                                <a
                                    href={`/storage/${submission.file_path}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 underline"
                                >
                                    {t('coursePlayer.viewSubmittedFile')}
                                </a>
                                {submission.admin_note && <p className="mt-1 text-red-600">{t('coursePlayer.adminNote', { note: submission.admin_note })}</p>}
                                {submission.status === 'pending' && (
                                    <p className="mt-1 text-amber-600">{t('coursePlayer.assignmentUnderReview')}</p>
                                )}
                            </div>
                        )}

                        <input
                            ref={assignmentInputRef}
                            type="file"
                            accept="application/pdf"
                            onChange={(e) => handleAssignmentFileChange(e.target.files?.[0] ?? null)}
                            className="hidden"
                        />

                        <div
                            role="button"
                            tabIndex={0}
                            onClick={() => assignmentInputRef.current?.click()}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    assignmentInputRef.current?.click();
                                }
                            }}
                            onDragOver={(e) => {
                                e.preventDefault();
                                setIsDragOver(true);
                            }}
                            onDragLeave={(e) => {
                                e.preventDefault();
                                setIsDragOver(false);
                            }}
                            onDrop={(e) => {
                                e.preventDefault();
                                setIsDragOver(false);
                                handleAssignmentFileChange(e.dataTransfer.files?.[0] ?? null);
                            }}
                            className={`mb-2 cursor-pointer rounded-lg border-2 border-dashed p-4 text-center transition-colors ${
                                isDragOver ? 'border-purple-500 bg-purple-100' : 'border-purple-300 bg-white'
                            }`}
                        >
                            <p className="text-sm font-medium text-purple-700">{t('coursePlayer.dropzoneText')}</p>
                            {assignmentFile ? (
                                <p className="mt-1 text-xs text-green-700">{t('coursePlayer.fileSelected', { name: assignmentFile.name })}</p>
                            ) : (
                                <p className="text-muted-foreground mt-1 text-xs">{t('coursePlayer.noFileSelected')}</p>
                            )}
                        </div>

                        <Button onClick={handleSubmitAssignment} disabled={!assignmentFile || isSubmittingAssignment} className="gap-2">
                            <Upload className="h-4 w-4" />
                            {isSubmittingAssignment ? t('coursePlayer.submitting') : submission ? t('coursePlayer.reuploadAssignment') : t('coursePlayer.submitAssignment')}
                        </Button>
                    </div>
                </div>
            );
        }
        default:
            return <div>{t('coursePlayer.unknownLessonType')}</div>;
    }
}

export default function CourseDetail({ course, auto_select_lesson_id, progress_info }: CourseDetailProps) {
    const { t } = useTranslation('user');
    const modules = course.modules && course.modules.length > 0 ? course.modules : [];

    // Initialize with smart lesson selection
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(() => {
        // First check if there's a hash navigation (from quiz return)
        const hash = window.location.hash;
        if (hash && hash.startsWith('#quiz-')) {
            const lessonId = hash.replace('#quiz-', '');
            const foundLesson = modules.flatMap((module) => module.lessons).find((lesson) => lesson.id === lessonId);
            if (foundLesson) {
                return foundLesson;
            }
        }

        // Then check auto-select from controller
        if (auto_select_lesson_id) {
            const autoLesson = modules.flatMap((module) => module.lessons).find((lesson) => lesson.id === auto_select_lesson_id);
            if (autoLesson) {
                return autoLesson;
            }
        }

        // Fallback to first lesson
        return modules[0]?.lessons[0] || null;
    });

    const isQuizFullscreen = false;

    // Initialize completion state from database
    const [moduleData, setModuleData] = useState<Module[]>(() => {
        return modules.map((module) => ({
            ...module,
            lessons: module.lessons.map((lesson) => {
                // Check if lesson is completed
                let isCompleted = lesson.isCompleted || false;

                // For quiz lessons, check if user has passed attempt
                if (lesson.type === 'quiz' && lesson.quizzes && lesson.quizzes.length > 0) {
                    const hasPassedAttempt = lesson.quizzes.some((quiz) => quiz.attempts && quiz.attempts.some((attempt) => attempt.is_passed));
                    isCompleted = hasPassedAttempt;
                }

                return {
                    ...lesson,
                    isCompleted,
                };
            }),
        }));
    });

    useEffect(() => {
        const hash = window.location.hash;
        if (hash && hash.startsWith('#quiz-')) {
            const lessonId = hash.replace('#quiz-', '');

            const foundLesson = moduleData.flatMap((module) => module.lessons).find((lesson) => lesson.id === lessonId);

            if (foundLesson) {
                setSelectedLesson(foundLesson);
                window.history.replaceState(null, '', window.location.pathname);
                console.log('Kembali ke dashboard quiz:', foundLesson.title);
            }
        }
    }, [moduleData]);

    useEffect(() => {
        if (progress_info && selectedLesson) {
            if (progress_info.has_incomplete_lessons && selectedLesson.id === progress_info.next_incomplete_lesson_id) {
                toast.success(t('coursePlayer.resumingLesson', { title: selectedLesson.title }));
            } else if (progress_info.has_completed_lessons && selectedLesson.id === progress_info.last_completed_lesson_id) {
                toast.info(t('coursePlayer.returnedToLastLesson'));
            }
        }
    }, [progress_info, selectedLesson, t]);

    const handleLessonComplete = async (lessonId: string) => {
        try {
            await axios.post(`/lesson/${lessonId}/complete`);

            setModuleData((prevModules) =>
                prevModules.map((module) => ({
                    ...module,
                    lessons: module.lessons.map((lesson) => (lesson.id === lessonId ? { ...lesson, isCompleted: true } : lesson)),
                })),
            );

            // Find and move to the next lesson
            let found = false;
            for (let m = 0; m < moduleData.length; m++) {
                for (let l = 0; l < moduleData[m].lessons.length; l++) {
                    if (moduleData[m].lessons[l].id === lessonId) {
                        found = true;
                        // Next lesson in current module
                        if (l + 1 < moduleData[m].lessons.length) {
                            setSelectedLesson(moduleData[m].lessons[l + 1]);
                        } else if (m + 1 < moduleData.length && moduleData[m + 1].lessons.length > 0) {
                            // First lesson in next module
                            setSelectedLesson(moduleData[m + 1].lessons[0]);
                        }
                        break;
                    }
                }
                if (found) break;
            }

            // Update enrollment progress after lesson completion
            try {
                await axios.post(`/enrollment/progress/${course.slug}`);
            } catch (progressError) {
                console.error('Error updating enrollment progress:', progressError);
            }
        } catch (error) {
            console.error('Error completing lesson:', error);
        }
    };

    const handleAssignmentSubmitted = (lessonId: string, submission: AssignmentSubmission) => {
        setModuleData((prevModules) =>
            prevModules.map((module) => ({
                ...module,
                lessons: module.lessons.map((lesson) =>
                    lesson.id === lessonId
                        ? {
                              ...lesson,
                              assignment_submission: submission,
                              isCompleted: false,
                          }
                        : lesson,
                ),
            })),
        );

        setSelectedLesson((prevLesson) => {
            if (!prevLesson || prevLesson.id !== lessonId) {
                return prevLesson;
            }

            return {
                ...prevLesson,
                assignment_submission: submission,
                isCompleted: false,
            };
        });
    };

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: course.title,
            href: `learn/course/${course.slug}`,
        },
    ];

    // Function to get module name for selected lesson
    const getModuleName = (lessonId: string): string => {
        for (const module of moduleData) {
            if (module.lessons.some((lesson) => lesson.id === lessonId)) {
                return module.title;
            }
        }
        return '';
    };

    // Check if current lesson is quiz and in fullscreen mode
    const currentLessonContent = selectedLesson ? <LessonContent lesson={selectedLesson} onAssignmentSubmitted={handleAssignmentSubmitted} /> : null;

    // If quiz is in fullscreen mode, render without course layout
    if (selectedLesson?.type === 'quiz' && isQuizFullscreen) {
        return (
            <>
                <Head title={selectedLesson?.title || course.title} />
                {currentLessonContent}
            </>
        );
    }

    // Helper: check if all lessons are completed (100% progress)
    const isAllLessonsCompleted = moduleData.every((module) => module.lessons.every((lesson) => lesson.isCompleted));
    // Helper: check if selected lesson is the last lesson
    const isLastLesson = (() => {
        if (!selectedLesson) return false;
        if (moduleData.length === 0) return false;
        const lastModule = moduleData[moduleData.length - 1];
        if (lastModule.lessons.length === 0) return false;
        return selectedLesson.id === lastModule.lessons[lastModule.lessons.length - 1].id;
    })();

    return (
        <CourseLayout
            breadcrumbs={breadcrumbs}
            courseSlug={course.slug}
            courseTitle={course.title}
            modules={moduleData}
            selectedLesson={selectedLesson}
            setSelectedLesson={setSelectedLesson}
            onLessonComplete={handleLessonComplete}
        >
            <Head title={selectedLesson?.title || course.title} />

            <div className="m-4 h-full">
                <div className="mb-4">
                    {selectedLesson && (
                        <div className="mb-2">
                            <span className="text-muted-foreground text-sm font-medium">{getModuleName(selectedLesson.id)}</span>
                        </div>
                    )}
                    <h1 className="text-2xl font-bold">{selectedLesson?.title}</h1>
                </div>

                <div className="bg-card mb-4 rounded-lg border p-4">{currentLessonContent}</div>
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                let prevLesson: Lesson | null = null;
                                let found = false;
                                for (const module of moduleData) {
                                    for (let i = 0; i < module.lessons.length; i++) {
                                        if (module.lessons[i].id === selectedLesson?.id) {
                                            if (i > 0) {
                                                prevLesson = module.lessons[i - 1];
                                            } else {
                                                const moduleIndex = moduleData.indexOf(module);
                                                if (moduleIndex > 0) {
                                                    const prevModule = moduleData[moduleIndex - 1];
                                                    prevLesson = prevModule.lessons[prevModule.lessons.length - 1];
                                                }
                                            }
                                            found = true;
                                            break;
                                        }
                                    }
                                    if (found) break;
                                }
                                if (prevLesson) {
                                    setSelectedLesson(prevLesson);
                                }
                            }}
                            disabled={!selectedLesson || moduleData[0]?.lessons[0]?.id === selectedLesson?.id}
                            className="gap-2 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="h-4 w-4" /> {t('coursePlayer.prevLesson')}
                        </Button>
                    </div>
                    {/* Status untuk quiz atau materi */}
                    {selectedLesson && selectedLesson.type === 'quiz' ? (
                        moduleData.find((m) => m.lessons.find((l) => l.id === selectedLesson.id))?.lessons.find((l) => l.id === selectedLesson.id)
                            ?.isCompleted ? (
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2 text-green-600">
                                    <CheckCircle className="h-5 w-5" />
                                    <span className="font-medium">{t('coursePlayer.quizPassed')}</span>
                                </div>
                                {/* Tombol Next jika quiz sudah selesai dan bukan di lesson terakhir */}
                                {(() => {
                                    if (!selectedLesson) return null;
                                    if (moduleData.length === 0) return null;
                                    const lastModule = moduleData[moduleData.length - 1];
                                    if (lastModule.lessons.length === 0) return null;
                                    const isLast = selectedLesson.id === lastModule.lessons[lastModule.lessons.length - 1].id;
                                    if (isLast) return null;
                                    // Cari next lesson
                                    let nextLesson: Lesson | null = null;
                                    let found = false;
                                    for (const module of moduleData) {
                                        for (let i = 0; i < module.lessons.length; i++) {
                                            if (module.lessons[i].id === selectedLesson.id) {
                                                if (i < module.lessons.length - 1) {
                                                    nextLesson = module.lessons[i + 1];
                                                } else {
                                                    const moduleIndex = moduleData.indexOf(module);
                                                    if (moduleIndex < moduleData.length - 1) {
                                                        nextLesson = moduleData[moduleIndex + 1].lessons[0];
                                                    }
                                                }
                                                found = true;
                                                break;
                                            }
                                        }
                                        if (found) break;
                                    }
                                    if (!nextLesson) return null;
                                    return (
                                        <Button variant="outline" onClick={() => setSelectedLesson(nextLesson)} className="gap-2">
                                            {t('coursePlayer.nextLesson')} <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    );
                                })()}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-blue-600">
                                <HelpCircle className="h-5 w-5" />
                                <span className="font-medium">{t('coursePlayer.completeQuizToContinue')}</span>
                            </div>
                        )
                    ) : selectedLesson && selectedLesson.type === 'assignment' ? (
                        selectedLesson.isCompleted ? (
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2 text-green-600">
                                    <CheckCircle className="h-5 w-5" />
                                    <span className="font-medium">{t('coursePlayer.assignmentApproved')}</span>
                                </div>
                                {(() => {
                                    if (!selectedLesson) return null;
                                    if (moduleData.length === 0) return null;
                                    const lastModule = moduleData[moduleData.length - 1];
                                    if (lastModule.lessons.length === 0) return null;
                                    const isLast = selectedLesson.id === lastModule.lessons[lastModule.lessons.length - 1].id;
                                    if (isLast) return null;

                                    let nextLesson: Lesson | null = null;
                                    let found = false;
                                    for (const module of moduleData) {
                                        for (let i = 0; i < module.lessons.length; i++) {
                                            if (module.lessons[i].id === selectedLesson.id) {
                                                if (i < module.lessons.length - 1) {
                                                    nextLesson = module.lessons[i + 1];
                                                } else {
                                                    const moduleIndex = moduleData.indexOf(module);
                                                    if (moduleIndex < moduleData.length - 1) {
                                                        nextLesson = moduleData[moduleIndex + 1].lessons[0];
                                                    }
                                                }
                                                found = true;
                                                break;
                                            }
                                        }
                                        if (found) break;
                                    }

                                    if (!nextLesson) return null;
                                    return (
                                        <Button variant="outline" onClick={() => setSelectedLesson(nextLesson)} className="gap-2">
                                            {t('coursePlayer.nextLesson')} <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    );
                                })()}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-2 text-amber-700">
                                <ClipboardCheck className="h-5 w-5" />
                                <span className="font-medium">
                                    {selectedLesson.assignment_submission?.status === 'pending'
                                        ? t('coursePlayer.assignmentReviewPending')
                                        : t('coursePlayer.submitAssignmentToContinue')}
                                </span>
                            </div>
                        )
                    ) : (
                        selectedLesson &&
                        selectedLesson.type !== 'quiz' &&
                        (!moduleData.find((m) => m.lessons.find((l) => l.id === selectedLesson.id))?.lessons.find((l) => l.id === selectedLesson.id)
                            ?.isCompleted ? (
                            <Button onClick={() => handleLessonComplete(selectedLesson.id)} size="lg">
                                <CheckCircle className="mr-2 h-4 w-4" />
                                {t('coursePlayer.completeLesson')}
                            </Button>
                        ) : (
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2 text-green-600">
                                    <CheckCircle className="h-5 w-5" />
                                    <span className="font-medium">{t('coursePlayer.lessonCompleted')}</span>
                                </div>
                                {/* Tombol Next jika materi sudah selesai dan bukan di lesson terakhir */}
                                {(() => {
                                    if (!selectedLesson) return null;
                                    if (moduleData.length === 0) return null;
                                    const lastModule = moduleData[moduleData.length - 1];
                                    if (lastModule.lessons.length === 0) return null;
                                    const isLast = selectedLesson.id === lastModule.lessons[lastModule.lessons.length - 1].id;
                                    if (isLast) return null;
                                    // Cari next lesson
                                    let nextLesson: Lesson | null = null;
                                    let found = false;
                                    for (const module of moduleData) {
                                        for (let i = 0; i < module.lessons.length; i++) {
                                            if (module.lessons[i].id === selectedLesson.id) {
                                                if (i < module.lessons.length - 1) {
                                                    nextLesson = module.lessons[i + 1];
                                                } else {
                                                    const moduleIndex = moduleData.indexOf(module);
                                                    if (moduleIndex < moduleData.length - 1) {
                                                        nextLesson = moduleData[moduleIndex + 1].lessons[0];
                                                    }
                                                }
                                                found = true;
                                                break;
                                            }
                                        }
                                        if (found) break;
                                    }
                                    if (!nextLesson) return null;
                                    return (
                                        <Button variant="outline" onClick={() => setSelectedLesson(nextLesson)} className="gap-2">
                                            {t('coursePlayer.nextLesson')} <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    );
                                })()}
                            </div>
                        ))
                    )}
                </div>

                {isAllLessonsCompleted && isLastLesson && (
                    <div className="mt-4 flex flex-col items-center justify-center gap-4 md:flex-row">
                        <div className="rounded-lg bg-green-100 px-4 py-2 text-center text-sm font-medium text-green-700">
                            {t('coursePlayer.courseCompletedBanner')}
                        </div>
                        <Button asChild size="lg">
                            <Link href={`/profile/my-courses/${course.slug}`}>{t('coursePlayer.btnBackAndDownloadCert')}</Link>
                        </Button>
                    </div>
                )}
            </div>
        </CourseLayout>
    );
}
