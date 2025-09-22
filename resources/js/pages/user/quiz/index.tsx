import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Head, router } from '@inertiajs/react';
import { AlertTriangle, CheckCircle, ChevronLeft, ChevronRight, Clock, HelpCircle, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface QuizOption {
    id: string;
    option_text: string;
    is_correct: boolean;
}

interface QuizQuestion {
    id: string;
    question_text: string;
    type: 'multiple_choice' | 'true_false';
    options: QuizOption[];
    explanation?: string;
}

interface QuizAttempt {
    id: string;
    score: number;
    correct_answers: number;
    total_questions: number;
    is_passed: boolean;
    time_taken: number;
    submitted_at: string;
    answers_summary: any[];
}

interface Quiz {
    id: string;
    title: string;
    instructions: string;
    time_limit: number;
    passing_score: number;
    attempts?: QuizAttempt[];
    questions: QuizQuestion[];
}

interface Lesson {
    id: string;
    title: string;
    type: 'quiz';
    quizzes: Quiz[];
}

interface QuizPageProps {
    lesson: Lesson;
    courseSlug: string;
}

export default function QuizPage({ lesson, courseSlug }: QuizPageProps) {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [showResults, setShowResults] = useState(false);
    const [quizResult, setQuizResult] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [showConfirmExitDialog, setShowConfirmExitDialog] = useState(false);

    const quiz = lesson.quizzes?.[0];
    const saveTimeout = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Initialize timer for quiz
        if (quiz?.time_limit && !showResults) {
            setTimeLeft(quiz.time_limit * 60);
        }
    }, [quiz]);

    useEffect(() => {
        try {
            if (timeLeft > 0 && !showResults) {
                const timer = setInterval(() => {
                    setTimeLeft((prev) => {
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
        } catch (error) {
            console.error('Error in timer useEffect:', error);
        }
    }, [timeLeft, showResults]);

    // Simpan progress ke backend setiap answers berubah (debounce 1 detik)
    useEffect(() => {
        if (!quiz?.id || showResults) return;
        if (saveTimeout.current) clearTimeout(saveTimeout.current);
        saveTimeout.current = setTimeout(() => {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
            fetch('/quiz/save-progress', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({ quiz_id: quiz.id, answers }),
                credentials: 'same-origin',
            });
        }, 1000);
        return () => {
            if (saveTimeout.current) clearTimeout(saveTimeout.current);
        };
    }, [answers, quiz?.id, showResults]);

    // Ambil progress dari backend saat quiz dibuka
    useEffect(() => {
        if (!quiz?.id) return;
        fetch(`/quiz/get-progress?quiz_id=${quiz.id}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.answers) setAnswers(data.answers);
            });
    }, [quiz?.id]);

    const handleAnswerChange = (questionId: string, answerId: string) => {
        setAnswers((prev) => ({
            ...prev,
            [questionId]: answerId,
        }));
    };

    const handleSubmitQuiz = () => {
        setShowConfirmDialog(true);
    };

    const clearQuizProgress = async () => {
        if (!quiz?.id) return;
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
        await fetch('/quiz/clear-progress', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
            },
            body: JSON.stringify({ quiz_id: quiz.id }),
            credentials: 'same-origin',
        });
    };

    const handleConfirmSubmit = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        setShowConfirmDialog(false);

        console.log('Submitting quiz with data:', {
            quiz_id: quiz?.id,
            answers: answers,
        });

        try {
            const response = await fetch('/quiz/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    quiz_id: quiz?.id,
                    answers: answers,
                }),
            });

            const responseData = await response.json();
            console.log('Quiz submission response:', responseData);

            if (response.ok) {
                await clearQuizProgress(); // clear progress after successful submit
                setQuizResult(responseData);
                setShowResults(true);
            } else {
                console.error('Failed to submit quiz:', responseData);
                alert('Gagal mengirim quiz: ' + (responseData.message || responseData.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error submitting quiz:', error);
            alert('Terjadi kesalahan saat mengirim quiz. Silakan coba lagi.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBackToCourse = async () => {
        // Konfirmasi sebelum keluar dari quiz
        if (!showResults) {
            setShowConfirmExitDialog(true);
            return;
        }
        await clearQuizProgress(); // clear progress when leaving after submit
        setAnswers({}); // clear local state as well
        // Kembali ke course dan set URL hash agar menampilkan quiz dashboard
        router.get(`/learn/course/${courseSlug}#quiz-${lesson.id}`);
    };

    // Tombol kembali di header
    const handleHeaderBack = async () => {
        await clearQuizProgress(); // clear progress on header back
        setAnswers({});
        router.get(`/learn/course/${courseSlug}#quiz-${lesson.id}`);
    };

    const handleRetakeQuiz = async () => {
        await clearQuizProgress(); // clear progress on retake
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
            <div className="bg-background flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <HelpCircle className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
                    <h3 className="mb-2 text-lg font-semibold">Quiz Belum Tersedia</h3>
                    <p className="text-muted-foreground mb-4 text-sm">Quiz untuk materi ini belum tersedia.</p>
                    <Button onClick={handleBackToCourse}>Kembali ke Dashboard</Button>
                </div>
            </div>
        );
    }

    if (!quiz.questions || quiz.questions.length === 0) {
        return (
            <div className="bg-background flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <HelpCircle className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
                    <h3 className="mb-2 text-lg font-semibold">Soal Quiz Belum Tersedia</h3>
                    <p className="text-muted-foreground mb-4 text-sm">Belum ada soal untuk quiz ini.</p>
                    <Button onClick={handleBackToCourse}>Kembali ke Dashboard</Button>
                </div>
            </div>
        );
    }

    if (showResults && quizResult) {
        return (
            <div className="bg-background min-h-screen">
                <Head title={`Hasil Quiz: ${quiz.title}`} />

                {/* Header */}
                <div className="bg-card/50 supports-[backdrop-filter]:bg-card/50 border-b backdrop-blur">
                    <div className="container mx-auto px-4 py-4">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="sm" onClick={handleBackToCourse} className="gap-2">
                                <ChevronLeft className="h-4 w-4" />
                                Kembali ke Dashboard
                            </Button>
                            <div className="flex-1">
                                <h1 className="text-xl font-semibold">Hasil Quiz: {quiz.title}</h1>
                                <p className="text-muted-foreground text-sm">{lesson.title}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="container mx-auto px-4 py-6">
                    <div className="mx-auto max-w-4xl">
                        <div className="mb-8 text-center">
                            <div
                                className={`mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full ${
                                    quizResult.is_passed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                }`}
                            >
                                {quizResult.is_passed ? <CheckCircle className="h-8 w-8" /> : <XCircle className="h-8 w-8" />}
                            </div>
                            <h2 className="mb-2 text-2xl font-bold">{quizResult.is_passed ? 'Selamat! Anda Lulus' : 'Belum Lulus'}</h2>
                            <div className="text-muted-foreground flex justify-center gap-6 text-sm">
                                <span>Skor: {quizResult.score}%</span>
                                <span>
                                    Benar: {quizResult.correct_answers}/{quizResult.total_questions}
                                </span>
                                <span>
                                    Waktu: {Math.floor(quizResult.time_taken / 60)}:{(quizResult.time_taken % 60).toString().padStart(2, '0')}
                                </span>
                            </div>

                            <div className="mt-6 text-center">
                                <div className="flex justify-center gap-3">
                                    <Button variant="outline" onClick={handleBackToCourse}>
                                        ← Kembali ke Dashboard Quiz
                                    </Button>
                                    <Button onClick={handleRetakeQuiz}>🔄 Ulangi Quiz</Button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold">Review Jawaban</h3>
                            {quizResult.answers_summary?.map((answer: any, index: number) => {
                                const question = quiz.questions.find((q) => q.id === answer.question_id);

                                return (
                                    <div key={answer.question_id} className="rounded-lg border p-4">
                                        <div
                                            className={`mb-2 inline-flex items-center gap-2 text-sm font-medium ${
                                                answer.is_correct ? 'text-green-600' : 'text-red-600'
                                            }`}
                                        >
                                            {answer.is_correct ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                            Soal {index + 1} - {answer.is_correct ? 'Benar' : 'Salah'}
                                        </div>
                                        <p className="mb-3 font-medium">{answer.question}</p>
                                        <div className="space-y-2">
                                            {answer.options?.map((option: any) => (
                                                <div
                                                    key={option.id}
                                                    className={`rounded border p-2 ${
                                                        option.is_correct
                                                            ? 'border-green-200 bg-green-50'
                                                            : option.id === answer.selected_option_id
                                                              ? 'border-red-200 bg-red-50'
                                                              : 'border-gray-200 bg-gray-50'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className={`h-2 w-2 rounded-full ${
                                                                option.is_correct
                                                                    ? 'bg-green-500'
                                                                    : option.id === answer.selected_option_id
                                                                      ? 'bg-red-500'
                                                                      : 'bg-gray-300'
                                                            }`}
                                                        ></span>
                                                        <span>{option.option_text}</span>
                                                        {option.is_correct && <span className="text-sm text-green-600">(Jawaban Benar)</span>}
                                                        {option.id === answer.selected_option_id && !option.is_correct && (
                                                            <span className="text-sm text-red-600">(Jawaban Anda)</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            {question?.explanation && (
                                                <div className="mt-3 rounded border border-blue-200 bg-blue-50 p-3">
                                                    <div className="flex items-start gap-2">
                                                        <div className="text-sm font-medium text-blue-600">💡 Pembahasan:</div>
                                                    </div>
                                                    <p className="mt-1 text-sm text-blue-800">{question.explanation}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const currentQuestionData = quiz.questions[currentQuestion];
    const totalQuestions = quiz.questions.length;
    const answeredCount = Object.keys(answers).length;

    if (!currentQuestionData) {
        return (
            <div className="bg-background flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <HelpCircle className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
                    <h3 className="mb-2 text-lg font-semibold">Error Loading Question</h3>
                    <p className="text-muted-foreground mb-4 text-sm">Terjadi kesalahan saat memuat soal.</p>
                    <Button onClick={handleBackToCourse}>Kembali ke Dashboard</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-background min-h-screen">
            <Head title={`Quiz: ${quiz.title}`} />

            {/* Header */}
            <div className="bg-card/50 supports-[backdrop-filter]:bg-card/50 border-b backdrop-blur">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={handleHeaderBack} className="gap-2">
                            <ChevronLeft className="h-4 w-4" />
                            Kembali
                        </Button>
                        <div className="flex-1">
                            <h1 className="text-xl font-semibold">{quiz.title}</h1>
                            <p className="text-muted-foreground text-sm">{lesson.title}</p>
                        </div>
                        {quiz.time_limit && timeLeft > 0 ? (
                            <div
                                className={`flex items-center gap-2 rounded-full px-4 py-2 ${
                                    timeLeft <= 60 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                }`}
                            >
                                <Clock className="h-5 w-5" />
                                <span className="text-lg font-medium">{formatTime(timeLeft)}</span>
                            </div>
                        ) : (
                            quiz.time_limit === 0 && (
                                <div className="rounded border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600">
                                    Quiz ini tidak memiliki durasi pengerjaan
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-6">
                <div className="mx-auto max-w-4xl">
                    {/* Quiz Header */}
                    <div className="mb-6">
                        {quiz.instructions && <p className="text-muted-foreground mb-4">{quiz.instructions}</p>}

                        {/* Progress Bar */}
                        <div className="mb-2 h-3 rounded-full bg-gray-200">
                            <div
                                className="h-3 rounded-full bg-blue-900 transition-all duration-300"
                                style={{ width: `${((currentQuestion + 1) / totalQuestions) * 100}%` }}
                            ></div>
                        </div>
                        <div className="text-muted-foreground flex justify-between text-sm">
                            <span>
                                Soal {currentQuestion + 1} dari {totalQuestions}
                            </span>
                            <span>{answeredCount} jawaban tersimpan</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-6 md:flex-row">
                        {/* Question Content */}
                        <div className="flex-1">
                            <div className="bg-card mb-6 rounded-lg border p-6">
                                <h3 className="mb-6 text-xl font-semibold">
                                    {currentQuestion + 1}. {currentQuestionData.question_text}
                                </h3>

                                <div className="space-y-4">
                                    {currentQuestionData.options && currentQuestionData.options.length > 0 ? (
                                        currentQuestionData.options.map((option) => (
                                            <label
                                                key={option.id}
                                                className="flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-gray-50"
                                            >
                                                <input
                                                    type="radio"
                                                    name={`question-${currentQuestionData.id}`}
                                                    value={option.id}
                                                    checked={answers[currentQuestionData.id] === option.id}
                                                    onChange={() => handleAnswerChange(currentQuestionData.id, option.id)}
                                                    className="h-5 w-5"
                                                />
                                                <span className="text-base">{option.option_text}</span>
                                            </label>
                                        ))
                                    ) : (
                                        <div className="text-muted-foreground p-4 text-center">
                                            <p>Pilihan jawaban belum tersedia untuk soal ini.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Navigation Buttons */}
                            <div className="flex flex-col gap-4">
                                <div className="flex justify-between">
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
                                        disabled={currentQuestion === 0}
                                    >
                                        <ChevronLeft className="mr-2 h-4 w-4" />
                                        Sebelumnya
                                    </Button>

                                    {currentQuestion === totalQuestions - 1 ? (
                                        <Button size="lg" onClick={handleSubmitQuiz} disabled={isSubmitting || answeredCount === 0}>
                                            {isSubmitting ? 'Mengirim...' : 'Selesai Quiz'}
                                        </Button>
                                    ) : (
                                        <Button
                                            size="lg"
                                            onClick={() => setCurrentQuestion((prev) => Math.min(totalQuestions - 1, prev + 1))}
                                            disabled={currentQuestion === totalQuestions - 1}
                                        >
                                            Selanjutnya
                                            <ChevronRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                                {/* Navigasi Soal untuk mobile */}
                                <div className="block md:hidden">
                                    <div className="bg-card mt-2 rounded-lg border p-4">
                                        <h4 className="mb-4 font-semibold">Navigasi Soal</h4>
                                        <div className="mb-4 grid grid-cols-6 gap-2">
                                            {quiz.questions.map((_, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => setCurrentQuestion(index)}
                                                    className={`h-10 w-10 rounded text-sm font-medium transition-colors ${
                                                        index === currentQuestion
                                                            ? 'bg-blue-900 text-white'
                                                            : answers[quiz.questions[index]?.id]
                                                              ? 'border border-green-300 bg-green-100 text-green-700'
                                                              : 'bg-gray-100 hover:bg-gray-200'
                                                    }`}
                                                >
                                                    {index + 1}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Sidebar with Question Numbers (desktop only) */}
                        <div className="hidden w-80 md:block">
                            <div className="bg-card sticky top-6 rounded-lg border p-6">
                                <h4 className="mb-4 font-semibold">Navigasi Soal</h4>
                                <div className="mb-6 grid grid-cols-6 gap-2">
                                    {quiz.questions.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentQuestion(index)}
                                            className={`h-10 w-10 rounded text-sm font-medium transition-colors ${
                                                index === currentQuestion
                                                    ? 'bg-blue-900 text-white'
                                                    : answers[quiz.questions[index]?.id]
                                                      ? 'border border-green-300 bg-green-100 text-green-700'
                                                      : 'bg-gray-100 hover:bg-gray-200'
                                            }`}
                                        >
                                            {index + 1}
                                        </button>
                                    ))}
                                </div>
                                <div className="border-t pt-4">
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="h-4 w-4 rounded bg-blue-900"></div>
                                            <span>Soal saat ini</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="h-4 w-4 rounded border border-green-300 bg-green-100"></div>
                                            <span>Sudah dijawab</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="h-4 w-4 rounded bg-gray-100"></div>
                                            <span>Belum dijawab</span>
                                        </div>
                                    </div>
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
                        <DialogDescription>Setelah dikirim, Anda tidak dapat mengubah jawaban lagi.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={isSubmitting}>
                            Batal
                        </Button>
                        <Button onClick={handleConfirmSubmit} disabled={isSubmitting}>
                            {isSubmitting ? 'Mengirim...' : 'Ya, Kirim Jawaban'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Confirmation Dialog for Exit */}
            <Dialog open={showConfirmExitDialog} onOpenChange={setShowConfirmExitDialog}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                            Konfirmasi Keluar Quiz
                        </DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin keluar? <span className="font-semibold text-red-600">Jawaban Anda tidak akan terekam.</span>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowConfirmExitDialog(false)} disabled={isSubmitting}>
                            Batal
                        </Button>
                        <Button
                            onClick={() => {
                                setShowConfirmExitDialog(false);
                                router.get(`/learn/course/${courseSlug}#quiz-${lesson.id}`);
                            }}
                            disabled={isSubmitting}
                        >
                            Ya, Keluar Quiz
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
