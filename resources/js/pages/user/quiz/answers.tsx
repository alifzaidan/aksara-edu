import { Button } from '@/components/ui/button';
import { Head, router } from '@inertiajs/react';
import { Check, ChevronLeft, HelpCircle, X } from 'lucide-react';

interface QuizOption {
    id: string;
    option_text: string;
    is_correct: boolean;
    is_selected: boolean;
}

interface QuizAnswer {
    question_id: string;
    question_text: string;
    type: 'multiple_choice' | 'true_false';
    explanation?: string;
    options: QuizOption[];
    user_answer: string;
    correct_answer: string;
    is_correct: boolean;
}

interface Quiz {
    id: string;
    title: string;
    passing_score: number;
    course: {
        id: string;
        slug: string;
    };
    lesson: {
        id: string;
        title: string;
    };
}

interface QuizAttempt {
    id: string;
    score: number;
    correct_answers: number;
    total_questions: number;
    is_passed: boolean;
    submitted_at: string;
}

interface QuizAnswersProps {
    quiz: Quiz;
    attempt: QuizAttempt;
    answers: QuizAnswer[];
}

export default function QuizAnswers({ quiz, attempt, answers }: QuizAnswersProps) {
    // const handleBackToResult = () => {
    //     router.get(`/quiz/${quiz.id}/result`);
    // };

    const handleBackToCourse = () => {
        router.get(`/learn/course/${quiz.course.slug}`);
    };

    const handleRetakeQuiz = () => {
        router.get(`/quiz/${quiz.id}/start`);
    };

    return (
        <div className="bg-background min-h-screen">
            <Head title={`Pembahasan Quiz: ${quiz.title}`} />

            {/* Header */}
            <div className="bg-card/50 border-b backdrop-blur">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between gap-4">
                        <Button variant="secondary" size="sm" onClick={handleBackToCourse} className="gap-2">
                            <ChevronLeft className="h-4 w-4" />
                            Kembali ke Kelas
                        </Button>
                        <div className="text-right">
                            <h1 className="text-xl font-semibold">Pembahasan: {quiz.title}</h1>
                            <p className="text-muted-foreground text-sm">
                                Skor: {Math.round(attempt.score)} • {attempt.correct_answers}/{attempt.total_questions} benar
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-6">
                <div className="mx-auto max-w-4xl">
                    {/* Summary */}
                    <div className="bg-card mb-8 rounded-lg border p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Ringkasan Hasil</h2>
                            <div
                                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
                                    attempt.is_passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}
                            >
                                {attempt.is_passed ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                                {attempt.is_passed ? 'LULUS' : 'BELUM LULUS'}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">{Math.round(attempt.score)}</div>
                                <div className="text-muted-foreground text-sm">Nilai Akhir</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">{attempt.correct_answers}</div>
                                <div className="text-muted-foreground text-sm">Jawaban Benar</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-red-600">{attempt.total_questions - attempt.correct_answers}</div>
                                <div className="text-muted-foreground text-sm">Jawaban Salah</div>
                            </div>
                        </div>
                    </div>

                    {/* Questions and Answers */}
                    <div className="space-y-6">
                        {answers.map((answer, index) => (
                            <div key={answer.question_id} className="bg-card rounded-lg border p-6">
                                <div className="mb-4 flex items-center justify-between">
                                    <h3 className="font-semibold">Soal {index + 1}</h3>
                                    <div
                                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
                                            answer.is_correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}
                                    >
                                        {answer.is_correct ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                                        {answer.is_correct ? 'Benar' : 'Salah'}
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <p className="font-medium text-gray-900">{answer.question_text}</p>
                                </div>

                                <div className="space-y-3">
                                    {answer.options.map((option) => {
                                        const isUserAnswer = option.is_selected;
                                        const isCorrectAnswer = option.is_correct;

                                        let optionClass = 'flex items-start gap-3 rounded-lg border p-4';
                                        let iconColor = 'text-gray-400';

                                        if (isCorrectAnswer) {
                                            optionClass += ' border-green-200 bg-green-50';
                                            iconColor = 'text-green-600';
                                        } else if (isUserAnswer && !isCorrectAnswer) {
                                            optionClass += ' border-red-200 bg-red-50';
                                            iconColor = 'text-red-600';
                                        } else {
                                            optionClass += ' border-gray-200 bg-gray-50';
                                        }

                                        return (
                                            <div key={option.id} className={optionClass}>
                                                <div className="mt-1">
                                                    {isCorrectAnswer ? (
                                                        <Check className={`h-5 w-5 ${iconColor}`} />
                                                    ) : isUserAnswer ? (
                                                        <X className={`h-5 w-5 ${iconColor}`} />
                                                    ) : (
                                                        <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-gray-800">{option.option_text}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Explanation */}
                                {answer.explanation && (
                                    <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
                                        <div className="flex items-start gap-3">
                                            <HelpCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                                            <div>
                                                <h4 className="font-medium text-blue-900">Penjelasan</h4>
                                                <p className="mt-1 text-sm text-blue-800">{answer.explanation}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
                        <Button onClick={handleRetakeQuiz} size="lg" className="gap-2">
                            🔄 Ulangi Quiz
                        </Button>
                        <Button onClick={handleBackToCourse} variant="outline" size="lg">
                            Kembali ke Kelas
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
