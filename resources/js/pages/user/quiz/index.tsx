import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Clock, MoveLeft, MoveRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast, Toaster } from 'sonner';

interface QuizOption {
    id: string;
    option_text: string;
    option_image?: string | null;
}

interface QuizQuestion {
    id: string;
    question_text: string;
    question_image?: string | null;
    type: 'multiple_choice' | 'true_false';
    options: QuizOption[];
}

interface Quiz {
    id: string;
    title: string;
    instructions?: string;
    time_limit: number;
    course: {
        id: string;
        slug: string;
    };
    questions: QuizQuestion[];
}

interface QuizAttempt {
    id: string;
    started_at: string;
}

interface User {
    id: string;
    name: string;
    email: string;
}

interface QuizExamProps {
    quiz: Quiz;
    attempt: QuizAttempt;
    user: User;
}

export default function QuizExam({ quiz, attempt, user }: QuizExamProps) {
    const storageKey = `quiz_${quiz.id}_${attempt.id}_${user.id}`;
    const timerKey = `${storageKey}_timer`;

    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: string }>({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [hasTimer, setHasTimer] = useState(true);
    const [showBackDialog, setShowBackDialog] = useState(false);
    const [showSubmitDialog, setShowSubmitDialog] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isTimeUp, setIsTimeUp] = useState(false);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const isSubmittingRef = useRef(false);

    const saveTimerToStorage = useCallback(
        (time: number) => {
            const timerData = {
                timeLeft: time,
                timestamp: Date.now(),
            };
            localStorage.setItem(timerKey, JSON.stringify(timerData));
        },
        [timerKey],
    );

    const clearStorageData = useCallback(() => {
        localStorage.removeItem(storageKey);
        localStorage.removeItem(timerKey);
    }, [storageKey, timerKey]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleAnswerSelect = (questionId: string, optionId: string) => {
        setSelectedAnswers((prev) => ({
            ...prev,
            [questionId]: optionId,
        }));
    };

    const goToQuestion = (index: number) => {
        setCurrentQuestion(index);
    };

    const goToNextQuestion = () => {
        if (currentQuestion < quiz.questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        }
    };

    const goToPreviousQuestion = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
        }
    };

    const getAnsweredCount = () => {
        return Object.keys(selectedAnswers).length;
    };

    const handleBack = () => {
        setShowBackDialog(true);
    };

    const confirmBack = () => {
        clearStorageData();

        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        router.delete(`/quiz/${quiz.id}/cancel`);
    };

    const submitQuiz = useCallback(() => {
        if (isSubmittingRef.current) return;

        isSubmittingRef.current = true;

        try {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }

            const answersData = Object.entries(selectedAnswers).map(([questionId, optionId]) => ({
                question_id: questionId,
                selected_option_id: optionId,
            }));

            router.post(
                `/quiz/${quiz.id}/submit`,
                {
                    attempt_id: attempt.id,
                    answers: answersData,
                },
                {
                    onSuccess: () => {
                        toast.success('Quiz berhasil dikumpulkan!');
                        clearStorageData();
                    },
                    onError: (errors) => {
                        console.error('Failed to submit quiz:', errors);
                        toast.error('Gagal mengumpulkan quiz');
                        isSubmittingRef.current = false;
                    },
                    onFinish: () => {
                        isSubmittingRef.current = false;
                    },
                },
            );
        } catch (error) {
            console.error('Failed to prepare submission:', error);
            toast.error('Gagal memproses jawaban');
            isSubmittingRef.current = false;
        }
    }, [selectedAnswers, quiz.id, attempt.id, clearStorageData, timerRef]);

    const handleAutoSubmit = useCallback(() => {
        if (isSubmittingRef.current) return;
        submitQuiz();
    }, [submitQuiz]);

    const handleSubmit = () => {
        const answeredCount = getAnsweredCount();
        if (answeredCount < quiz.questions.length) {
            toast.error('Belum Lengkap!', {
                description: `Anda baru mengerjakan ${answeredCount} dari ${quiz.questions.length} soal. Harap lengkapi semua soal terlebih dahulu.`,
            });
            return;
        }

        setShowSubmitDialog(true);
    };

    const confirmSubmit = () => {
        setShowSubmitDialog(false);
        submitQuiz();
    };

    // Initialize quiz data
    useEffect(() => {
        const initializeQuiz = () => {
            try {
                const savedData = localStorage.getItem(storageKey);
                if (savedData) {
                    const { answers, currentQuestionIndex } = JSON.parse(savedData);
                    setSelectedAnswers(answers || {});
                    setCurrentQuestion(currentQuestionIndex || 0);
                    toast.success('Data quiz sebelumnya berhasil dipulihkan');
                }

                if (quiz.time_limit === 0) {
                    setHasTimer(false);
                    setTimeLeft(0);
                    setIsLoading(false);
                    return;
                }

                setHasTimer(true);
                const savedTimer = localStorage.getItem(timerKey);
                if (savedTimer) {
                    const { timeLeft: savedTimeLeft, timestamp } = JSON.parse(savedTimer);
                    const now = Date.now();
                    const timePassed = Math.floor((now - timestamp) / 1000);
                    const remainingTime = Math.max(0, savedTimeLeft - timePassed);

                    setTimeLeft(remainingTime);

                    if (remainingTime <= 0) {
                        setIsTimeUp(true);
                    }
                } else {
                    const initialTime = quiz.time_limit * 60;
                    setTimeLeft(initialTime);
                    saveTimerToStorage(initialTime);
                }

                setIsLoading(false);
            } catch (error) {
                console.error('Failed to initialize quiz:', error);
                toast.error('Gagal memuat data quiz');
                setIsLoading(false);
            }
        };

        initializeQuiz();
    }, [quiz.id, quiz.time_limit, saveTimerToStorage, storageKey, timerKey]);

    // Save progress to localStorage
    useEffect(() => {
        if (!isLoading) {
            const dataToSave = {
                answers: selectedAnswers,
                currentQuestionIndex: currentQuestion,
                timestamp: Date.now(),
            };
            localStorage.setItem(storageKey, JSON.stringify(dataToSave));
        }
    }, [selectedAnswers, currentQuestion, storageKey, isLoading]);

    // Timer effect
    useEffect(() => {
        if (!hasTimer || isLoading || isTimeUp || isSubmittingRef.current) return;

        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                const newTime = prev - 1;
                saveTimerToStorage(newTime);

                if (newTime <= 0) {
                    setIsTimeUp(true);
                    if (timerRef.current) {
                        clearInterval(timerRef.current);
                    }
                    return 0;
                }
                return newTime;
            });
        }, 1000);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [hasTimer, isLoading, isTimeUp, saveTimerToStorage]);

    // Auto submit when time is up
    useEffect(() => {
        if (hasTimer && isTimeUp && !isSubmittingRef.current) {
            toast.error('Waktu habis! Quiz akan dikumpulkan otomatis.');
            handleAutoSubmit();
        }
    }, [hasTimer, isTimeUp, handleAutoSubmit]);

    const progressPercentage = (getAnsweredCount() / quiz.questions.length) * 100;
    const currentQuestionData = quiz.questions[currentQuestion];

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto h-32 w-32 animate-spin rounded-full border-b-2 border-gray-900"></div>
                    <p className="mt-4 text-gray-600">Memuat data quiz...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <Head title={`${quiz.title}`} />

            <header className="fixed top-0 right-0 left-0 z-50 border-b bg-white/95 shadow-sm backdrop-blur-sm">
                <div className="mx-auto max-w-7xl px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="secondary" size="sm" className="flex items-center gap-2" onClick={handleBack}>
                                <ArrowLeft className="h-4 w-4" />
                                Kembali
                            </Button>

                            <h1 className="text-lg font-semibold text-gray-900">{quiz.title}</h1>
                        </div>

                        {hasTimer ? (
                            <div
                                className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${
                                    timeLeft < 300 ? 'border-red-200 bg-red-50 text-red-800' : 'border-primary-foreground bg-gray-50 text-gray-800'
                                }`}
                            >
                                <Clock className={`h-5 w-5 ${timeLeft < 300 ? 'text-red-500' : 'text-orange-500'}`} />
                                <span className={`text-lg font-semibold ${timeLeft < 300 ? 'text-red-600' : 'text-gray-900'}`}>
                                    {formatTime(timeLeft)}
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm">
                                <Clock className="h-5 w-5 text-blue-500" />
                                <span className="text-sm font-medium text-blue-700">Tanpa Batas Waktu</span>
                            </div>
                        )}

                        <div className="hidden items-center gap-4 md:flex">
                            <div className="text-sm text-gray-600">
                                {getAnsweredCount()}/{quiz.questions.length} dikerjakan
                            </div>
                            <Progress value={progressPercentage} className="h-2 w-32 rounded-md" />
                        </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between md:hidden">
                        <div className="text-sm text-gray-600">
                            {getAnsweredCount()}/{quiz.questions.length} soal dikerjakan
                        </div>
                        <div className="flex items-center gap-2">
                            <Progress value={progressPercentage} className="h-2 w-20" />
                            <span className="text-xs text-gray-500">{Math.round(progressPercentage)}%</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="min-h-screen bg-gradient-to-tr from-[#E5EDE3] to-[#F6F0E2]">
                <div className="mx-auto max-w-7xl px-4 pt-30 pb-8 md:pt-24">
                    <div className="grid grid-cols-1 gap-12 lg:grid-cols-4 lg:gap-6">
                        <div className="lg:col-span-3">
                            <div className="rounded-lg border bg-white shadow-sm">
                                <div className="p-6">
                                    {/* Header Soal */}
                                    <div className="mb-4 flex items-center justify-between border-b pb-3">
                                        <h2 className="text-base font-semibold text-gray-900 md:text-lg">Soal No. {currentQuestion + 1}</h2>
                                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                                            {currentQuestionData?.type === 'multiple_choice' ? 'Pilihan Ganda' : 'Benar/Salah'}
                                        </span>
                                    </div>

                                    {/* Pertanyaan - Rich Text */}
                                    <div className="mb-4">
                                        <div
                                            className="prose prose-sm dark:prose-invert max-w-none"
                                            dangerouslySetInnerHTML={{ __html: currentQuestionData?.question_text || '' }}
                                        />
                                    </div>

                                    {/* Gambar Pertanyaan */}
                                    {currentQuestionData?.question_image && (
                                        <div className="mb-6">
                                            <img
                                                src={currentQuestionData.question_image}
                                                alt="Question"
                                                className="max-h-96 w-full rounded-lg border object-contain shadow-sm"
                                            />
                                        </div>
                                    )}

                                    {/* Pilihan Jawaban */}
                                    <div className="mt-6">
                                        <h3 className="mb-3 text-sm font-medium text-gray-700">Pilih Jawaban:</h3>
                                        <div className="space-y-3">
                                            {currentQuestionData?.options.map((option, optionIndex) => {
                                                const isSelected = selectedAnswers[currentQuestionData.id] === option.id;
                                                const hasText = option.option_text && option.option_text.trim() !== '';
                                                const hasImage = option.option_image;

                                                return (
                                                    <label
                                                        key={option.id}
                                                        className={`flex cursor-pointer flex-col gap-3 rounded-lg border-2 p-4 transition-all ${
                                                            isSelected
                                                                ? 'border-primary bg-primary/10 shadow-md'
                                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                        } ${hasTimer && isTimeUp ? 'cursor-not-allowed opacity-50' : ''}`}
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            {/* Radio Button */}
                                                            <input
                                                                type="radio"
                                                                name={`question-${currentQuestionData.id}`}
                                                                value={option.id}
                                                                checked={isSelected}
                                                                onChange={() => handleAnswerSelect(currentQuestionData.id, option.id)}
                                                                className="text-primary focus:ring-primary mt-1 h-4 w-4 flex-shrink-0 focus:ring-2"
                                                                disabled={hasTimer && isTimeUp}
                                                            />

                                                            {/* Label Opsi */}
                                                            <div className="flex-1">
                                                                <div className="flex items-start gap-2">
                                                                    <span className="flex-shrink-0 font-semibold text-gray-700">
                                                                        {String.fromCharCode(65 + optionIndex)}.
                                                                    </span>
                                                                    {hasText && (
                                                                        <div
                                                                            className={`prose prose-sm max-w-none ${
                                                                                isSelected ? 'font-medium text-gray-900' : 'text-gray-800'
                                                                            }`}
                                                                            dangerouslySetInnerHTML={{ __html: option.option_text }}
                                                                        />
                                                                    )}
                                                                </div>

                                                                {/* Gambar Opsi */}
                                                                {hasImage && (
                                                                    <div className="mt-3">
                                                                        <img
                                                                            src={option.option_image || ''}
                                                                            alt={`Opsi ${String.fromCharCode(65 + optionIndex)}`}
                                                                            className="max-h-48 rounded-md border object-contain shadow-sm"
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Selected Indicator */}
                                                            {isSelected && (
                                                                <div className="flex-shrink-0">
                                                                    <div className="bg-primary flex h-6 w-6 items-center justify-center rounded-full text-white">
                                                                        <svg
                                                                            className="h-4 w-4"
                                                                            fill="none"
                                                                            viewBox="0 0 24 24"
                                                                            stroke="currentColor"
                                                                        >
                                                                            <path
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                                strokeWidth={2}
                                                                                d="M5 13l4 4L19 7"
                                                                            />
                                                                        </svg>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Navigation Buttons */}
                            <div className="mt-4 flex justify-between">
                                <Button
                                    onClick={goToPreviousQuestion}
                                    disabled={currentQuestion === 0 || (hasTimer && isTimeUp)}
                                    variant="outline"
                                    className="gap-2"
                                >
                                    <MoveLeft className="h-4 w-4" /> Sebelumnya
                                </Button>

                                {currentQuestion === quiz.questions.length - 1 && getAnsweredCount() === quiz.questions.length ? (
                                    <Button onClick={handleSubmit} disabled={hasTimer && isTimeUp} className="gap-2">
                                        Kumpulkan 🚀
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={goToNextQuestion}
                                        disabled={currentQuestion === quiz.questions.length - 1 || (hasTimer && isTimeUp)}
                                        className="gap-2"
                                    >
                                        Selanjutnya <MoveRight className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Sidebar - Question Navigator */}
                        <div className="lg:col-span-1">
                            <div className="border-primary-foreground bg-accent/80 sticky top-24 rounded-lg border shadow-sm">
                                <div className="p-6">
                                    <h3 className="mb-4 text-base font-semibold md:text-lg">Nomor Soal</h3>

                                    <div className="mb-6 flex flex-wrap gap-2">
                                        {Array.from({ length: quiz.questions.length }, (_, i) => (
                                            <Button
                                                key={i}
                                                onClick={() => goToQuestion(i)}
                                                disabled={hasTimer && isTimeUp}
                                                className={`h-10 w-10 rounded text-sm font-medium transition-colors ${
                                                    selectedAnswers[quiz.questions[i]?.id] !== undefined
                                                        ? 'bg-primary hover:bg-primary text-white'
                                                        : i === currentQuestion
                                                          ? 'bg-blue-300 text-gray-700 hover:bg-blue-400 hover:text-gray-700'
                                                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-700'
                                                }`}
                                            >
                                                {i + 1}
                                            </Button>
                                        ))}
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="h-4 w-4 rounded bg-gray-200"></div>
                                            <span>Belum Dikerjakan</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="bg-primary h-4 w-4 rounded"></div>
                                            <span>Sudah Dikerjakan</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-4 w-4 rounded bg-blue-300"></div>
                                            <span>Nomor Soal Saat Ini</span>
                                        </div>
                                    </div>

                                    <Button className="mt-6 w-full" onClick={handleSubmit} disabled={hasTimer && isTimeUp}>
                                        {hasTimer && isTimeUp ? 'Waktu Habis' : 'Kumpulkan'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Dialogs */}
            <AlertDialog open={showBackDialog} onOpenChange={setShowBackDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Konfirmasi Keluar</AlertDialogTitle>
                        <AlertDialogDescription>
                            {getAnsweredCount() > 0
                                ? 'Yakin ingin keluar? Semua progress dan jawaban akan hilang dan tidak dapat dipulihkan.'
                                : 'Yakin ingin keluar dari quiz?'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmBack}>Ya, Keluar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Siap Dikumpulkan!</DialogTitle>
                        <DialogDescription>
                            {getAnsweredCount() === quiz.questions.length
                                ? 'Semua soal sudah dijawab. Yakin ingin mengumpulkan quiz?'
                                : `Anda baru mengerjakan ${getAnsweredCount()} dari ${quiz.questions.length} soal. Yakin ingin mengumpulkan quiz sekarang?`}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
                            Batal
                        </Button>
                        <Button onClick={confirmSubmit}>Ya, Kumpulkan</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Toaster position="top-center" richColors />
        </>
    );
}
