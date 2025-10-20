import ErrorBoundary from '@/components/error-boundary';
import { Button } from '@/components/ui/button';
import CourseLayout from '@/layouts/course-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { AlertTriangle, CheckCircle, ChevronLeft, ChevronRight, ExternalLink, FileDown, HelpCircle, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Lesson {
    id: string;
    title: string;
    type: 'video' | 'text' | 'file' | 'quiz';
    content?: string;
    video_url?: string;
    attachment?: string;
    is_preview?: boolean | number;
    isCompleted: boolean;
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
            answers_summary: any[];
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
                <h3 className="mb-2 text-lg font-semibold">Video External</h3>
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
                outline: 'none',
            }}
        />
    );
}

function QuizDashboard({ lesson, onStartQuiz }: { lesson: Lesson; onStartQuiz: () => void }) {
    const quiz = lesson.quizzes?.[0];

    if (!quiz) {
        return (
            <div className="bg-muted/40 flex h-full flex-col items-center justify-center rounded-lg p-8 text-center">
                <HelpCircle className="text-muted-foreground mb-4 h-16 w-16" />
                <h3 className="mb-2 text-lg font-semibold">Quiz Belum Tersedia</h3>
                <p className="text-muted-foreground text-sm">Quiz untuk materi ini belum tersedia.</p>
            </div>
        );
    }

    const attempts = quiz.attempts || [];
    const hasPassedAttempt = attempts.find((attempt) => attempt.is_passed);

    // Add handler for viewing quiz details
    const handleViewQuizDetails = () => {
        router.get(`/quiz/${quiz.id}`);
    };

    const handleStartQuiz = () => {
        router.get(`/quiz/${quiz.id}/start`);
    };

    // Add handler for viewing answers
    const handleViewAnswers = () => {
        router.get(`/quiz/${quiz.id}/answers`);
    };

    // Add handler for viewing history
    const handleViewHistory = () => {
        router.get(`/quiz/${quiz.id}/history`);
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
                        <div className="text-muted-foreground text-sm">Total Soal</div>
                    </div>
                    <div className="bg-card flex min-h-[72px] flex-col items-center justify-center rounded-lg border p-4">
                        {quiz.time_limit === 0 ? (
                            <div className="flex h-full min-h-[48px] items-center justify-center text-sm font-semibold text-red-600">
                                Tanpa Batas Waktu
                            </div>
                        ) : (
                            <>
                                <div className="text-2xl font-bold text-green-600">{quiz.time_limit}</div>
                                <div className="text-muted-foreground text-sm">Menit</div>
                            </>
                        )}
                    </div>
                    <div className="bg-card rounded-lg border p-4">
                        <div className="text-2xl font-bold text-amber-600">{quiz.passing_score}</div>
                        <div className="text-muted-foreground text-sm">Nilai Lulus</div>
                    </div>
                </div>
            </div>

            {/* History Nilai */}
            {attempts.length > 0 && (
                <div className="mb-8">
                    <h3 className="mb-4 text-lg font-semibold">Riwayat Nilai</h3>
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
                                                Percobaan {attempts.length - index}
                                                {attempt.is_passed && (
                                                    <span className="ml-2 rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">LULUS</span>
                                                )}
                                            </div>
                                            <div className="text-muted-foreground text-sm">
                                                {new Date(attempt.submitted_at).toLocaleDateString('id-ID', {
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
                                            {attempt.correct_answers}/{attempt.total_questions} benar
                                        </div>
                                        <div className="text-muted-foreground text-sm">
                                            Waktu Pengerjaan: {Math.floor(attempt.time_taken / 60)}:
                                            {(attempt.time_taken % 60).toString().padStart(2, '0')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {/* {attempts.length > 5 && (
                            <Button variant="outline" onClick={handleViewHistory} className="w-full">
                                Lihat Semua Riwayat ({attempts.length} percobaan)
                            </Button>
                        )} */}
                    </div>
                </div>
            )}

            {/* Status dan Tombol Mulai */}
            <div className="text-center">
                {hasPassedAttempt ? (
                    <div className="mb-6">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-green-100 px-4 py-2 text-green-600">
                            <CheckCircle className="h-5 w-5" />
                            <span className="font-medium">Anda sudah lulus quiz ini!</span>
                        </div>
                        <p className="text-muted-foreground mb-4">Selamat! Anda bisa mengulang quiz ini kapan saja untuk meningkatkan pemahaman.</p>
                    </div>
                ) : (
                    <div className="mb-6">
                        {attempts.length > 0 ? (
                            <div>
                                <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-amber-100 px-4 py-2 text-amber-600">
                                    <AlertTriangle className="h-5 w-5" />
                                    <span className="font-medium">Belum lulus, jangan menyerah!</span>
                                </div>
                                <p className="text-muted-foreground mb-4">
                                    Pelajari kembali materi dan coba lagi. Anda bisa mengulang quiz ini tanpa batas.
                                </p>
                            </div>
                        ) : (
                            <p className="text-muted-foreground mb-4">Siap untuk mengerjakan quiz? Anda bisa mengulang quiz ini tanpa batas waktu.</p>
                        )}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <Button onClick={handleStartQuiz} size="lg" className="gap-2">
                        {attempts.length > 0 ? '🔄 Ulangi Quiz' : '🚀 Mulai Quiz'}
                    </Button>

                    {attempts.length > 0 && (
                        <>
                            <Button onClick={handleViewAnswers} variant="outline" size="lg" className="gap-2">
                                <HelpCircle className="h-4 w-4" />
                                Lihat Pembahasan
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
    onQuizComplete,
    courseSlug,
}: {
    lesson: Lesson | null;
    onQuizComplete?: (lessonId: string) => void;
    courseSlug?: string;
}) {
    if (!lesson) {
        return (
            <div className="bg-muted/40 flex h-full items-center justify-center rounded-lg">
                <p>Pilih materi untuk memulai belajar.</p>
            </div>
        );
    }

    const handleStartQuiz = () => {
        const quiz = lesson.quizzes?.[0];
        if (quiz?.id) {
            router.get(`/quiz/${quiz.id}`);
        } else {
            toast.error('Quiz tidak tersedia');
        }
    };

    // const handleBackToDashboard = () => {
    //     setShowQuizInterface(false);
    //     setShowQuizDashboard(true);
    // };

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
                        <h3 className="text-lg font-semibold">File Tidak Tersedia</h3>
                        <p className="text-muted-foreground text-sm">File materi tidak ditemukan.</p>
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
                                <span className="font-medium text-blue-900">Silahkan download file ini untuk melanjutkan ke materi selanjutnya</span>
                                <Button asChild className="flex items-center gap-2">
                                    <a href={`/storage/${lesson.attachment}`} download target="_blank" rel="noopener noreferrer">
                                        <FileDown className="h-4 w-4" /> Download File
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
                                Preview hanya tersedia untuk file PDF.
                            </div>
                        )}
                    </div>
                </div>
            );
        }
        case 'quiz':
            return (
                <ErrorBoundary>
                    <QuizDashboard lesson={lesson} onStartQuiz={handleStartQuiz} />
                </ErrorBoundary>
            );
        default:
            return <div>Tipe materi tidak dikenal.</div>;
    }
}

export default function CourseDetail({ course, auto_select_lesson_id, progress_info }: CourseDetailProps) {
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

    const [isQuizFullscreen, setIsQuizFullscreen] = useState(false);

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
                toast.success(`Melanjutkan pembelajaran: ${selectedLesson.title}`);
            } else if (progress_info.has_completed_lessons && selectedLesson.id === progress_info.last_completed_lesson_id) {
                toast.info('Kembali ke materi terakhir yang diselesaikan');
            }
        }
    }, [progress_info, selectedLesson]);

    const handleLessonComplete = async (lessonId: string) => {
        try {
            const response = await fetch(`/lesson/${lessonId}/complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (response.ok) {
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
                    await fetch(`/enrollment/progress/${course.slug}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                        },
                    });
                } catch (progressError) {
                    console.error('Error updating enrollment progress:', progressError);
                }
            }
        } catch (error) {
            console.error('Error completing lesson:', error);
        }
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
    const currentLessonContent = selectedLesson ? (
        <LessonContent lesson={selectedLesson} onQuizComplete={handleLessonComplete} courseSlug={course.slug} />
    ) : null;

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
                            <ChevronLeft className="h-4 w-4" /> Sebelumnya
                        </Button>
                    </div>
                    {/* Status untuk quiz atau materi */}
                    {selectedLesson && selectedLesson.type === 'quiz' ? (
                        moduleData.find((m) => m.lessons.find((l) => l.id === selectedLesson.id))?.lessons.find((l) => l.id === selectedLesson.id)
                            ?.isCompleted ? (
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2 text-green-600">
                                    <CheckCircle className="h-5 w-5" />
                                    <span className="font-medium">Quiz Sudah Lulus</span>
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
                                            Selanjutnya <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    );
                                })()}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-blue-600">
                                <HelpCircle className="h-5 w-5" />
                                <span className="font-medium">Selesaikan Quiz untuk Melanjutkan</span>
                            </div>
                        )
                    ) : (
                        selectedLesson &&
                        selectedLesson.type !== 'quiz' &&
                        (!moduleData.find((m) => m.lessons.find((l) => l.id === selectedLesson.id))?.lessons.find((l) => l.id === selectedLesson.id)
                            ?.isCompleted ? (
                            <Button onClick={() => handleLessonComplete(selectedLesson.id)} size="lg">
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Selesaikan Materi
                            </Button>
                        ) : (
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2 text-green-600">
                                    <CheckCircle className="h-5 w-5" />
                                    <span className="font-medium">Materi Sudah Selesai</span>
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
                                            Selanjutnya <ChevronRight className="h-4 w-4" />
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
                            Anda sudah menyelesaikan kelas silahkan kembali ke halaman awal untuk mendownload sertifikat
                        </div>
                        <Button asChild size="lg">
                            <Link href={`/profile/my-courses/${course.slug}`}>Kembali ke Halaman Kelas &amp; Download Sertifikat</Link>
                        </Button>
                    </div>
                )}
            </div>
        </CourseLayout>
    );
}
