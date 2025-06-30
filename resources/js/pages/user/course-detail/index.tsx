import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import CourseLayout from '@/layouts/course-layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { FileDown, ExternalLink, HelpCircle, ChevronLeft, ChevronRight, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';

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

function QuizInterface({ lesson }: { lesson: Lesson }) {
    const [currentQuiz, setCurrentQuiz] = useState(0);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [showResults, setShowResults] = useState(false);
    const [quizResult, setQuizResult] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    const quiz = lesson.quizzes?.[currentQuiz];

    useEffect(() => {
        if (quiz && quiz.attempts && quiz.attempts.length > 0) {
            // Check if user has a PASSED attempt
            const passedAttempt = quiz.attempts.find(attempt => attempt.is_passed);
            if (passedAttempt) {
                // User has passed, show results
                setQuizResult(passedAttempt);
                setShowResults(true);
            } else {
                // User has attempts but hasn't passed yet, show latest attempt
                // But allow retaking the quiz
                const latestAttempt = quiz.attempts[0]; // Already sorted by created_at desc
                setQuizResult(latestAttempt);
                setShowResults(true);
            }
        } else if (quiz?.time_limit) {
            setTimeLeft(quiz.time_limit * 60); // Convert minutes to seconds
        }
    }, [quiz]);

    useEffect(() => {
        if (timeLeft > 0 && !showResults) {
            const timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        // Auto-submit when time runs out
                        handleConfirmSubmit();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [timeLeft, showResults]);

    const handleAnswerChange = (questionId: string, answerId: string) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: answerId
        }));
    };

    const handleSubmitQuiz = () => {
        // Show confirmation dialog
        setShowConfirmDialog(true);
    };

    const handleConfirmSubmit = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        setShowConfirmDialog(false);

        try {
            const response = await fetch('/quiz/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify({
                    quiz_id: quiz?.id,
                    answers: answers
                })
            });

            if (response.ok) {
                const result = await response.json();
                setQuizResult(result);
                setShowResults(true);
            } else {
                console.error('Failed to submit quiz');
            }
        } catch (error) {
            console.error('Error submitting quiz:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRetakeQuiz = () => {
        // Reset all quiz states
        setCurrentQuestion(0);
        setAnswers({});
        setShowResults(false);
        setQuizResult(null);
        setTimeLeft(quiz?.time_limit ? quiz.time_limit * 60 : 0);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!quiz) {
        return (
            <div className="bg-muted/40 flex h-full flex-col items-center justify-center rounded-lg p-8 text-center">
                <HelpCircle className="text-muted-foreground mb-4 h-16 w-16" />
                <h3 className="text-lg font-semibold mb-2">Quiz Belum Tersedia</h3>
                <p className="text-muted-foreground text-sm">Quiz untuk materi ini belum tersedia.</p>
            </div>
        );
    }

    if (showResults && quizResult) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="text-center mb-8">
                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                        quizResult.is_passed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                        {quizResult.is_passed ? <CheckCircle className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
                    </div>
                    <h2 className="text-2xl font-bold mb-2">
                        {quizResult.is_passed ? 'Selamat! Anda Lulus' : 'Belum Lulus'}
                    </h2>
                    {quiz && quiz.attempts && quiz.attempts.length > 1 && (
                        <p className="text-sm text-muted-foreground mb-2">
                            Percobaan ke-{quiz.attempts.length}
                        </p>
                    )}
                    <div className="flex justify-center gap-6 text-sm text-muted-foreground">
                        <span>Skor: {quizResult.score}%</span>
                        <span>Benar: {quizResult.correct_answers}/{quizResult.total_questions}</span>
                        <span>Waktu: {Math.floor(quizResult.time_taken / 60)}:{(quizResult.time_taken % 60).toString().padStart(2, '0')}</span>
                    </div>
                    
                    {/* Tombol Ulangi Ujian jika belum lulus */}
                    {!quizResult.is_passed && (
                        <div className="mt-6 text-center">
                            <p className="text-muted-foreground mb-4">
                                Jangan menyerah! Pelajari kembali materi dan coba lagi.
                                <br />
                                Passing score: <strong>{quiz.passing_score}%</strong>
                            </p>
                            <Button 
                                onClick={handleRetakeQuiz}
                            >
                                🔄 Ulangi Ujian
                            </Button>
                        </div>
                    )}
                    
                    {/* Pesan untuk user yang sudah lulus */}
                    {quizResult.is_passed && (
                        <div className="mt-6 text-center">
                            <p className="text-green-600 font-medium">
                                🎉 Selamat! Anda telah menyelesaikan quiz ini dengan baik.
                            </p>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <h3 className="text-lg font-semibold">Review Jawaban</h3>
                    {quizResult.answers_summary?.map((answer: any, index: number) => (
                        <div key={answer.question_id} className="border rounded-lg p-4">
                            <div className={`inline-flex items-center gap-2 text-sm font-medium mb-2 ${
                                answer.is_correct ? 'text-green-600' : 'text-red-600'
                            }`}>
                                {answer.is_correct ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                Soal {index + 1} - {answer.is_correct ? 'Benar' : 'Salah'}
                            </div>
                            <p className="font-medium mb-3">{answer.question}</p>
                            <div className="space-y-2">
                                {answer.options?.map((option: any) => (
                                    <div key={option.id} className={`p-2 rounded border ${
                                        option.is_correct ? 'bg-green-50 border-green-200' :
                                        option.id === answer.selected_option_id ? 'bg-red-50 border-red-200' :
                                        'bg-gray-50 border-gray-200'
                                    }`}>
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${
                                                option.is_correct ? 'bg-green-500' :
                                                option.id === answer.selected_option_id ? 'bg-red-500' :
                                                'bg-gray-300'
                                            }`}></span>
                                            <span>{option.option_text}</span>
                                            {option.is_correct && <span className="text-green-600 text-sm">(Jawaban Benar)</span>}
                                            {option.id === answer.selected_option_id && !option.is_correct && 
                                                <span className="text-red-600 text-sm">(Jawaban Anda)</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const currentQuestionData = quiz.questions[currentQuestion];
    const totalQuestions = quiz.questions.length;
    const answeredCount = Object.keys(answers).length;

    return (
        <div className="max-w-4xl mx-auto p-6">
            {/* Quiz Header */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">{quiz.title}</h2>
                    {quiz.time_limit && timeLeft > 0 && (
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                            timeLeft <= 60 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                            <Clock className="w-4 h-4" />
                            <span className="font-medium">{formatTime(timeLeft)}</span>
                        </div>
                    )}
                </div>
                
                {quiz.instructions && (
                    <p className="text-muted-foreground mb-4">{quiz.instructions}</p>
                )}

                {/* Progress Bar */}
                <div className="bg-gray-200 rounded-full h-2 mb-2">
                    <div 
                        className="bg-blue-900 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${((currentQuestion + 1) / totalQuestions) * 100}%` }}
                    ></div>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Soal {currentQuestion + 1} dari {totalQuestions}</span>
                    <span>{answeredCount} jawaban tersimpan</span>
                </div>
            </div>

            <div className="flex gap-6">
                {/* Question Content */}
                <div className="flex-1">
                    <div className="bg-card border rounded-lg p-6 mb-6">
                        <h3 className="text-lg font-semibold mb-4">
                            {currentQuestion + 1}. {currentQuestionData.question_text}
                        </h3>
                        
                        <div className="space-y-3">
                            {currentQuestionData.options.map((option) => (
                                <label key={option.id} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                    <input
                                        type="radio"
                                        name={`question-${currentQuestionData.id}`}
                                        value={option.id}
                                        checked={answers[currentQuestionData.id] === option.id}
                                        onChange={() => handleAnswerChange(currentQuestionData.id, option.id)}
                                        className="w-4 h-4"
                                    />
                                    <span>{option.option_text}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex justify-between">
                        <Button
                            variant="outline"
                            onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                            disabled={currentQuestion === 0}
                        >
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            Sebelumnya
                        </Button>

                        {currentQuestion === totalQuestions - 1 ? (
                            <Button
                                onClick={handleSubmitQuiz}
                                disabled={isSubmitting || answeredCount === 0}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                {isSubmitting ? 'Mengirim...' : 'Selesai Quiz'}
                            </Button>
                        ) : (
                            <Button
                                onClick={() => setCurrentQuestion(prev => Math.min(totalQuestions - 1, prev + 1))}
                                disabled={currentQuestion === totalQuestions - 1}
                            >
                                Selanjutnya
                                <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Sidebar with Question Numbers */}
                <div className="w-64">
                    <div className="bg-card border rounded-lg p-4">
                        <h4 className="font-semibold mb-3">Navigasi Soal</h4>
                        <div className="grid grid-cols-5 gap-2">
                            {quiz.questions.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentQuestion(index)}
                                    className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                                        index === currentQuestion
                                            ? 'bg-blue-900 text-white'
                                            : answers[quiz.questions[index].id]
                                            ? 'bg-green-100 text-green-700 border border-green-300'
                                            : 'bg-gray-100 hover:bg-gray-200'
                                    }`}
                                >
                                    {index + 1}
                                </button>
                            ))}
                        </div>
                        
                        <div className="mt-4 pt-4 border-t">
                            <div className="text-sm space-y-1">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-blue-900 rounded"></div>
                                    <span>Soal saat ini</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                                    <span>Sudah dijawab</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-gray-100 rounded"></div>
                                    <span>Belum dijawab</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Confirmation Dialog */}
            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            Konfirmasi Pengiriman
                        </DialogTitle>
                        <DialogDescription>
                            Setelah dikirim, Anda tidak dapat mengubah jawaban lagi.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => setShowConfirmDialog(false)}
                            disabled={isSubmitting}
                        >
                            Batal
                        </Button>
                        <Button 
                            onClick={handleConfirmSubmit}
                            disabled={isSubmitting}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {isSubmitting ? 'Mengirim...' : 'Ya, Kirim Jawaban'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
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
        case 'quiz':
            return <QuizInterface lesson={lesson} />;
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
