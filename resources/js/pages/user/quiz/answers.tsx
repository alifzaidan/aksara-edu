import { Button } from '@/components/ui/button';
import { Head, router } from '@inertiajs/react';
import { Check, ChevronLeft, HelpCircle, X } from 'lucide-react';

interface QuizOption {
    id: string;
    option_text: string;
    option_image?: string | null;
    is_correct: boolean;
    is_selected: boolean;
}

interface QuizAnswer {
    question_id: string;
    question_text: string;
    question_image?: string | null;
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
                <div className="mx-auto max-w-7xl px-4 py-4">
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

                                {/* Question Text - Rich Text */}
                                <div className="mb-4">
                                    <div
                                        className="prose prose-sm dark:prose-invert max-w-none font-medium text-gray-900"
                                        dangerouslySetInnerHTML={{ __html: answer.question_text }}
                                    />
                                </div>

                                {/* Question Image */}
                                {answer.question_image && (
                                    <div className="mb-6">
                                        <img
                                            src={answer.question_image}
                                            alt="Question"
                                            className="max-h-80 w-full rounded-lg border object-contain shadow-sm"
                                        />
                                    </div>
                                )}

                                {/* Options */}
                                <div className="space-y-3">
                                    {answer.options.map((option, optionIndex) => {
                                        const isUserAnswer = option.is_selected;
                                        const isCorrectAnswer = option.is_correct;

                                        let optionClass = 'flex flex-col gap-3 rounded-lg border p-4';
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
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-1 flex-shrink-0">
                                                        {isCorrectAnswer ? (
                                                            <Check className={`h-5 w-5 ${iconColor}`} />
                                                        ) : isUserAnswer ? (
                                                            <X className={`h-5 w-5 ${iconColor}`} />
                                                        ) : (
                                                            <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-start gap-2">
                                                            <span className="flex-shrink-0 font-semibold text-gray-700">
                                                                {String.fromCharCode(65 + optionIndex)}.
                                                            </span>
                                                            {/* Option Text - Rich Text */}
                                                            {option.option_text && option.option_text.trim() !== '' && (
                                                                <div
                                                                    className={`prose prose-sm max-w-none ${
                                                                        isCorrectAnswer
                                                                            ? 'font-semibold text-green-800'
                                                                            : isUserAnswer
                                                                              ? 'font-medium text-red-700'
                                                                              : 'text-gray-800'
                                                                    }`}
                                                                    dangerouslySetInnerHTML={{ __html: option.option_text }}
                                                                />
                                                            )}
                                                        </div>

                                                        {/* Option Image */}
                                                        {option.option_image && (
                                                            <div className="mt-3 ml-6">
                                                                <img
                                                                    src={option.option_image}
                                                                    alt={`Opsi ${String.fromCharCode(65 + optionIndex)}`}
                                                                    className="max-h-48 rounded-md border object-contain shadow-sm"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Explanation - Rich Text */}
                                {answer.explanation && (
                                    <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
                                        <div className="flex items-start gap-3">
                                            <HelpCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                                            <div className="flex-1">
                                                <h4 className="mb-2 font-medium text-blue-900">Pembahasan</h4>
                                                <div
                                                    className="prose prose-sm max-w-none text-blue-800"
                                                    dangerouslySetInnerHTML={{ __html: answer.explanation }}
                                                />
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
