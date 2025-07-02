import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import CourseLayout from '@/layouts/course-layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { FileDown, ExternalLink, HelpCircle, ChevronLeft, ChevronRight, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import ErrorBoundary from '@/components/error-boundary';

interface Lesson {
    id: string;
    title: string;
    type: 'video' | 'text' | 'file' | 'quiz';
    content?: string;
    video_url?: string;
    attachment?: string;
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

function QuizDashboard({ lesson, onStartQuiz }: { lesson: Lesson; onStartQuiz: () => void }) {
    const quiz = lesson.quizzes?.[0];
    
    if (!quiz) {
        return (
            <div className="bg-muted/40 flex h-full flex-col items-center justify-center rounded-lg p-8 text-center">
                <HelpCircle className="text-muted-foreground mb-4 h-16 w-16" />
                <h3 className="text-lg font-semibold mb-2">Quiz Belum Tersedia</h3>
                <p className="text-muted-foreground text-sm">Quiz untuk materi ini belum tersedia.</p>
            </div>
        );
    }

    const attempts = quiz.attempts || [];
    const hasPassedAttempt = attempts.find(attempt => attempt.is_passed);

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
                    <HelpCircle className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold mb-2">{quiz.title}</h2>
                {quiz.instructions && (
                    <p className="text-muted-foreground mb-4">{quiz.instructions}</p>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-card border rounded-lg p-4">
                        <div className="text-2xl font-bold text-blue-600">{quiz.questions?.length || 0}</div>
                        <div className="text-sm text-muted-foreground">Total Soal</div>
                    </div>
                    <div className="bg-card border rounded-lg p-4">
                        <div className="text-2xl font-bold text-green-600">{quiz.time_limit || 0}</div>
                        <div className="text-sm text-muted-foreground">Menit</div>
                    </div>
                    <div className="bg-card border rounded-lg p-4">
                        <div className="text-2xl font-bold text-amber-600">{quiz.passing_score}</div>
                        <div className="text-sm text-muted-foreground">Nilai Lulus</div>
                    </div>
                </div>
            </div>

            {/* History Nilai */}
            {attempts.length > 0 && (
                <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4">Riwayat Nilai</h3>
                    <div className="space-y-3">
                        {attempts.map((attempt, index) => (
                            <div key={attempt.id} className={`border rounded-lg p-4 ${
                                attempt.is_passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                            }`}>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        {attempt.is_passed ? (
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                        ) : (
                                            <XCircle className="w-5 h-5 text-red-600" />
                                        )}
                                        <div>
                                            <div className="font-medium">
                                                Percobaan {attempts.length - index}
                                                {attempt.is_passed && (
                                                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                                        LULUS
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {new Date(attempt.submitted_at).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-2xl font-bold ${
                                            attempt.is_passed ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                            {attempt.score}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {attempt.correct_answers}/{attempt.total_questions} benar
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            Waktu: {Math.floor(attempt.time_taken / 60)}:{(attempt.time_taken % 60).toString().padStart(2, '0')}
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
                        <div className="inline-flex items-center gap-2 text-green-600 bg-green-100 px-4 py-2 rounded-lg mb-4">
                            <CheckCircle className="h-5 w-5" />
                            <span className="font-medium">Anda sudah lulus quiz ini!</span>
                        </div>
                        <p className="text-muted-foreground mb-4">
                            Selamat! Anda bisa mengulang quiz ini kapan saja untuk meningkatkan pemahaman.
                        </p>
                    </div>
                ) : (
                    <div className="mb-6">
                        {attempts.length > 0 ? (
                            <div>
                                <div className="inline-flex items-center gap-2 text-amber-600 bg-amber-100 px-4 py-2 rounded-lg mb-4">
                                    <AlertTriangle className="h-5 w-5" />
                                    <span className="font-medium">Belum lulus, jangan menyerah!</span>
                                </div>
                                <p className="text-muted-foreground mb-4">
                                    Pelajari kembali materi dan coba lagi. Anda bisa mengulang quiz ini tanpa batas.
                                </p>
                            </div>
                        ) : (
                            <p className="text-muted-foreground mb-4">
                                Siap untuk mengerjakan quiz? Anda bisa mengulang quiz ini tanpa batas waktu.
                            </p>
                        )}
                    </div>
                )}

                <Button
                    onClick={onStartQuiz}
                    size="lg"
                >
                    {attempts.length > 0 ? '🔄 Ulangi Quiz' : '🚀 Mulai Quiz'}
                </Button>
            </div>
        </div>
    );
}

function QuizInterface({ lesson, onQuizComplete, onBackToDashboard }: { 
    lesson: Lesson; 
    onQuizComplete?: (lessonId: string) => void;
    onBackToDashboard?: () => void;
}) {
    // This component is kept for backward compatibility but redirects to the dedicated quiz page
    const quiz = lesson.quizzes?.[0];

    useEffect(() => {
        // Redirect to dedicated quiz page using Inertia router
        const courseSlug = window.location.pathname.split('/')[3]; // Extract course slug from URL
        if (courseSlug) {
            router.get(`/learn/course/${courseSlug}/quiz/${lesson.id}`);
        }
    }, [lesson.id]);

    return (
        <div className="bg-muted/40 flex h-full flex-col items-center justify-center rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-muted-foreground">Mengalihkan ke halaman quiz...</p>
        </div>
    );
}


function LessonContent({ lesson, onQuizComplete, courseSlug }: { lesson: Lesson | null; onQuizComplete?: (lessonId: string) => void; courseSlug?: string }) {
    const [showQuizDashboard, setShowQuizDashboard] = useState(true);
    const [showQuizInterface, setShowQuizInterface] = useState(false);

    if (!lesson) {
        return (
            <div className="bg-muted/40 flex h-full items-center justify-center rounded-lg">
                <p>Pilih materi untuk memulai belajar.</p>
            </div>
        );
    }

    const handleStartQuiz = () => {
        // Navigate to dedicated quiz page using Inertia router
        if (courseSlug) {
            router.get(`/learn/course/${courseSlug}/quiz/${lesson.id}`);
        } else {
            // Fallback to in-page quiz
            setShowQuizDashboard(false);
            setShowQuizInterface(true);
        }
    };

    const handleBackToDashboard = () => {
        setShowQuizInterface(false);
        setShowQuizDashboard(true);
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
        case 'quiz':
            // Only show quiz dashboard, actual quiz will be in separate page
            return (
                <ErrorBoundary>
                    <QuizDashboard 
                        lesson={lesson} 
                        onStartQuiz={handleStartQuiz}
                    />
                </ErrorBoundary>
            );
        default:
            return <div>Tipe materi tidak dikenal.</div>;
    }
}

export default function CourseDetail({ course }: { course: Course }) {
    const modules = course.modules && course.modules.length > 0 ? course.modules : [];
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(modules[0]?.lessons[0] || null);
    const [isQuizFullscreen, setIsQuizFullscreen] = useState(false);
    
    // Initialize completion state from database
    const [moduleData, setModuleData] = useState<Module[]>(() => {
        return modules.map(module => ({
            ...module,
            lessons: module.lessons.map(lesson => {
                // Check if lesson is completed
                let isCompleted = lesson.isCompleted || false;
                
                // For quiz lessons, check if user has passed attempt
                if (lesson.type === 'quiz' && lesson.quizzes && lesson.quizzes.length > 0) {
                    const hasPassedAttempt = lesson.quizzes.some(quiz => 
                        quiz.attempts && quiz.attempts.some(attempt => attempt.is_passed)
                    );
                    isCompleted = hasPassedAttempt;
                }
                
                return {
                    ...lesson,
                    isCompleted
                };
            })
        }));
    });

    const handleProgressUpdate = (progress: number) => {
        console.log(`Course progress updated to ${progress}%`);
        // You can add additional logic here if needed
    };

    useEffect(() => {
        const hash = window.location.hash;
        if (hash && hash.startsWith('#quiz-')) {
            const lessonId = hash.replace('#quiz-', '');

            const foundLesson = moduleData
                .flatMap(module => module.lessons)
                .find(lesson => lesson.id === lessonId);
            
            if (foundLesson) {
                setSelectedLesson(foundLesson);
                window.history.replaceState(null, '', window.location.pathname);
                console.log('Kembali ke dashboard quiz:', foundLesson.title);
            }
        }
    }, [moduleData]);

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
                setModuleData(prevModules => 
                    prevModules.map(module => ({
                        ...module,
                        lessons: module.lessons.map(lesson => 
                            lesson.id === lessonId 
                                ? { ...lesson, isCompleted: true }
                                : lesson
                        )
                    }))
                );

                // Update enrollment progress after lesson completion
                try {
                    await fetch(`/enrollment/progress/${course.slug}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                        }
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
            if (module.lessons.some(lesson => lesson.id === lessonId)) {
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

    return (
        <CourseLayout
            breadcrumbs={breadcrumbs}
            courseSlug={course.slug}
            modules={moduleData}
            selectedLesson={selectedLesson}
            setSelectedLesson={setSelectedLesson}
            onLessonComplete={handleLessonComplete}
            onProgressUpdate={handleProgressUpdate}
        >
            <Head title={selectedLesson?.title || course.title} />

            <div className="m-4 h-full">
                <div className="mb-4">
                    {selectedLesson && (
                        <div className="mb-2">
                            <span className="text-sm text-muted-foreground font-medium">
                                {getModuleName(selectedLesson.id)}
                            </span>
                        </div>
                    )}
                    <h1 className="text-2xl font-bold">{selectedLesson?.title}</h1>
                </div>
                
                <div className="bg-card rounded-lg border p-4 mb-4">
                    {currentLessonContent}
                </div>
                {selectedLesson && selectedLesson.type !== 'quiz' && (
                    <div className="flex justify-end">
                        {!moduleData.find(m => m.lessons.find(l => l.id === selectedLesson.id))?.lessons.find(l => l.id === selectedLesson.id)?.isCompleted ? (
                            <Button
                                onClick={() => handleLessonComplete(selectedLesson.id)}
                                size="lg"
                            >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Selesaikan Materi
                            </Button>
                        ) : (
                            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg">
                                <CheckCircle className="h-5 w-5" />
                                <span className="font-medium">Materi Sudah Selesai</span>
                            </div>
                        )}
                    </div>
                )}
                
                {/* Status untuk quiz */}
                {selectedLesson && selectedLesson.type === 'quiz' && (
                    <div className="flex justify-end">
                        {moduleData.find(m => m.lessons.find(l => l.id === selectedLesson.id))?.lessons.find(l => l.id === selectedLesson.id)?.isCompleted ? (
                            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg">
                                <CheckCircle className="h-5 w-5" />
                                <span className="font-medium">Quiz Sudah Lulus</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-4 py-2 rounded-lg">
                                <HelpCircle className="h-5 w-5" />
                                <span className="font-medium">Selesaikan Quiz untuk Melanjutkan</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </CourseLayout>
    );
}
