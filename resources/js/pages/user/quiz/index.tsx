import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Head } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Clock, CheckCircle, XCircle, AlertTriangle, HelpCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';

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
            .then(res => res.json())
            .then(data => {
                if (data.answers) setAnswers(data.answers);
            });
    }, [quiz?.id]);

    const handleAnswerChange = (questionId: string, answerId: string) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: answerId
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
            answers: answers
        });

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
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <HelpCircle className="text-muted-foreground mb-4 h-16 w-16 mx-auto" />
                    <h3 className="text-lg font-semibold mb-2">Quiz Belum Tersedia</h3>
                    <p className="text-muted-foreground text-sm mb-4">Quiz untuk materi ini belum tersedia.</p>
                    <Button onClick={handleBackToCourse}>
                        Kembali ke Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    if (!quiz.questions || quiz.questions.length === 0) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <HelpCircle className="text-muted-foreground mb-4 h-16 w-16 mx-auto" />
                    <h3 className="text-lg font-semibold mb-2">Soal Quiz Belum Tersedia</h3>
                    <p className="text-muted-foreground text-sm mb-4">Belum ada soal untuk quiz ini.</p>
                    <Button onClick={handleBackToCourse}>
                        Kembali ke Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    if (showResults && quizResult) {
        return (
            <div className="min-h-screen bg-background">
                <Head title={`Hasil Quiz: ${quiz.title}`} />
                
                {/* Header */}
                <div className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
                    <div className="container mx-auto px-4 py-4">
                        <div className="flex items-center gap-4">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={handleBackToCourse}
                                className="gap-2"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Kembali ke Dashboard
                            </Button>
                            <div className="flex-1">
                                <h1 className="text-xl font-semibold">Hasil Quiz: {quiz.title}</h1>
                                <p className="text-sm text-muted-foreground">
                                    {lesson.title}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="container mx-auto px-4 py-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center mb-8">
                            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                                quizResult.is_passed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                            }`}>
                                {quizResult.is_passed ? <CheckCircle className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
                            </div>
                            <h2 className="text-2xl font-bold mb-2">
                                {quizResult.is_passed ? 'Selamat! Anda Lulus' : 'Belum Lulus'}
                            </h2>
                            <div className="flex justify-center gap-6 text-sm text-muted-foreground">
                                <span>Skor: {quizResult.score}%</span>
                                <span>Benar: {quizResult.correct_answers}/{quizResult.total_questions}</span>
                                <span>Waktu: {Math.floor(quizResult.time_taken / 60)}:{(quizResult.time_taken % 60).toString().padStart(2, '0')}</span>
                            </div>
                            
                            <div className="mt-6 text-center">
                                <div className="flex gap-3 justify-center">
                                    <Button 
                                        variant="outline"
                                        onClick={handleBackToCourse}
                                    >
                                        ← Kembali ke Dashboard Quiz
                                    </Button>
                                    <Button 
                                        onClick={handleRetakeQuiz}
                                    >
                                        🔄 Ulangi Quiz
                                    </Button>
                                </div>
                            </div>
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
                </div>
            </div>
        );
    }

    const currentQuestionData = quiz.questions[currentQuestion];
    const totalQuestions = quiz.questions.length;
    const answeredCount = Object.keys(answers).length;

    if (!currentQuestionData) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <HelpCircle className="text-muted-foreground mb-4 h-16 w-16 mx-auto" />
                    <h3 className="text-lg font-semibold mb-2">Error Loading Question</h3>
                    <p className="text-muted-foreground text-sm mb-4">Terjadi kesalahan saat memuat soal.</p>
                    <Button onClick={handleBackToCourse}>
                        Kembali ke Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Head title={`Quiz: ${quiz.title}`} />
            
            {/* Header */}
            <div className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={handleHeaderBack}
                            className="gap-2"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Kembali
                        </Button>
                        <div className="flex-1">
                            <h1 className="text-xl font-semibold">{quiz.title}</h1>
                            <p className="text-sm text-muted-foreground">
                                {lesson.title}
                            </p>
                        </div>
                        {quiz.time_limit && timeLeft > 0 ? (
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                                timeLeft <= 60 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                                <Clock className="w-5 h-5" />
                                <span className="font-medium text-lg">{formatTime(timeLeft)}</span>
                            </div>
                        ) : quiz.time_limit === 0 && (
                            <div className="text-red-600 text-sm font-semibold px-4 py-2 border border-red-200 bg-red-50 rounded">
                                Quiz ini tidak memiliki durasi pengerjaan
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-6">
                <div className="max-w-4xl mx-auto">
                    {/* Quiz Header */}
                    <div className="mb-6">                
                        {quiz.instructions && (
                            <p className="text-muted-foreground mb-4">{quiz.instructions}</p>
                        )}

                        {/* Progress Bar */}
                        <div className="bg-gray-200 rounded-full h-3 mb-2">
                            <div 
                                className="bg-blue-900 h-3 rounded-full transition-all duration-300" 
                                style={{ width: `${((currentQuestion + 1) / totalQuestions) * 100}%` }}
                            ></div>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Soal {currentQuestion + 1} dari {totalQuestions}</span>
                            <span>{answeredCount} jawaban tersimpan</span>
                        </div>
                    </div>

                    <div className="flex gap-6 flex-col md:flex-row">
                        {/* Question Content */}
                        <div className="flex-1">
                            <div className="bg-card border rounded-lg p-6 mb-6">
                                <h3 className="text-xl font-semibold mb-6">
                                    {currentQuestion + 1}. {currentQuestionData.question_text}
                                </h3>
                                
                                <div className="space-y-4">
                                    {currentQuestionData.options && currentQuestionData.options.length > 0 ? (
                                        currentQuestionData.options.map((option) => (
                                            <label key={option.id} className="flex items-center gap-4 p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                                <input
                                                    type="radio"
                                                    name={`question-${currentQuestionData.id}`}
                                                    value={option.id}
                                                    checked={answers[currentQuestionData.id] === option.id}
                                                    onChange={() => handleAnswerChange(currentQuestionData.id, option.id)}
                                                    className="w-5 h-5"
                                                />
                                                <span className="text-base">{option.option_text}</span>
                                            </label>
                                        ))
                                    ) : (
                                        <div className="text-center p-4 text-muted-foreground">
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
                                        onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                                        disabled={currentQuestion === 0}
                                    >
                                        <ChevronLeft className="w-4 h-4 mr-2" />
                                        Sebelumnya
                                    </Button>

                                    {currentQuestion === totalQuestions - 1 ? (
                                        <Button
                                            size="lg"
                                            onClick={handleSubmitQuiz}
                                            disabled={isSubmitting || answeredCount === 0}
                                        >
                                            {isSubmitting ? 'Mengirim...' : 'Selesai Quiz'}
                                        </Button>
                                    ) : (
                                        <Button
                                            size="lg"
                                            onClick={() => setCurrentQuestion(prev => Math.min(totalQuestions - 1, prev + 1))}
                                            disabled={currentQuestion === totalQuestions - 1}
                                        >
                                            Selanjutnya
                                            <ChevronRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    )}
                                </div>
                                {/* Navigasi Soal untuk mobile */}
                                <div className="block md:hidden">
                                    <div className="bg-card border rounded-lg p-4 mt-2">
                                        <h4 className="font-semibold mb-4">Navigasi Soal</h4>
                                        <div className="grid grid-cols-6 gap-2 mb-4">
                                            {quiz.questions.map((_, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => setCurrentQuestion(index)}
                                                    className={`w-10 h-10 rounded text-sm font-medium transition-colors ${
                                                        index === currentQuestion
                                                            ? 'bg-blue-900 text-white'
                                                            : answers[quiz.questions[index]?.id]
                                                            ? 'bg-green-100 text-green-700 border border-green-300'
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
                        <div className="w-80 hidden md:block">
                            <div className="bg-card border rounded-lg p-6 sticky top-6">
                                <h4 className="font-semibold mb-4">Navigasi Soal</h4>
                                <div className="grid grid-cols-6 gap-2 mb-6">
                                    {quiz.questions.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentQuestion(index)}
                                            className={`w-10 h-10 rounded text-sm font-medium transition-colors ${
                                                index === currentQuestion
                                                    ? 'bg-blue-900 text-white'
                                                    : answers[quiz.questions[index]?.id]
                                                    ? 'bg-green-100 text-green-700 border border-green-300'
                                                    : 'bg-gray-100 hover:bg-gray-200'
                                            }`}
                                        >
                                            {index + 1}
                                        </button>
                                    ))}
                                </div>
                                <div className="pt-4 border-t">
                                    <div className="text-sm space-y-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-4 h-4 bg-blue-900 rounded"></div>
                                            <span>Soal saat ini</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                                            <span>Sudah dijawab</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-4 h-4 bg-gray-100 rounded"></div>
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
                        >
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
                        <Button 
                            variant="outline" 
                            onClick={() => setShowConfirmExitDialog(false)}
                            disabled={isSubmitting}
                        >
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
