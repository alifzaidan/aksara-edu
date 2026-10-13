import { Button } from '@/components/ui/button';
import { Head, router } from '@inertiajs/react';
import { AlertTriangle, CheckCircle, ChevronLeft, HelpCircle, TrendingUp, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface QuizOption {
    id: string;
    option_text: string;
}

interface QuizQuestion {
    id: string;
    question_text: string;
    type: 'multiple_choice' | 'true_false';
    explanation?: string;
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
}

interface Quiz {
    id: string;
    title: string;
    instructions?: string;
    time_limit: number;
    passing_score: number;
    lesson: {
        id: string;
        title: string;
    };
    questions: QuizQuestion[];
    attempts?: QuizAttempt[];
}

interface QuizShowProps {
    quiz: Quiz;
}

export default function QuizShow({ quiz }: QuizShowProps) {
    const { t, i18n } = useTranslation('user');
    const localeCode = i18n.language === 'en' ? 'en-US' : 'id-ID';
    const attempts = quiz.attempts || [];
    const hasPassedAttempt = attempts.find((attempt) => attempt.is_passed);

    const handleStartQuiz = () => {
        router.get(`/quiz/${quiz.id}/start`);
    };

    const handleViewAnswers = () => {
        router.get(`/quiz/${quiz.id}/answers`);
    };

    const handleViewHistory = () => {
        router.get(`/quiz/${quiz.id}/history`);
    };

    const handleBackToLesson = () => {
        window.history.back();
    };

    return (
        <div className="bg-background min-h-screen">
            <Head title={`Quiz: ${quiz.title}`} />

            {/* Header */}
            <div className="bg-card/50 border-b backdrop-blur">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={handleBackToLesson} className="gap-2">
                            <ChevronLeft className="h-4 w-4" />
                            {t('quiz.backToLesson')}
                        </Button>
                        <div className="flex-1">
                            <h1 className="text-xl font-semibold">{quiz.title}</h1>
                            <p className="text-muted-foreground text-sm">{quiz.lesson.title}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-6">
                <div className="mx-auto max-w-4xl">
                    <div className="mb-8 text-center">
                        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                            <HelpCircle className="h-8 w-8" />
                        </div>
                        <h2 className="mb-2 text-2xl font-bold">{quiz.title}</h2>
                        {quiz.instructions && <p className="text-muted-foreground mx-auto mb-4 max-w-2xl">{quiz.instructions}</p>}

                        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div className="bg-card rounded-lg border p-4">
                                <div className="text-2xl font-bold text-blue-600">{quiz.questions.length}</div>
                                <div className="text-muted-foreground text-sm">{t('quiz.totalQuestions')}</div>
                            </div>
                            <div className="bg-card flex min-h-[72px] flex-col items-center justify-center rounded-lg border p-4">
                                {quiz.time_limit === 0 ? (
                                    <div className="flex h-full min-h-[48px] items-center justify-center text-sm font-semibold text-red-600">
                                        {t('quiz.noTimeLimit')}
                                    </div>
                                ) : (
                                    <>
                                        <div className="text-2xl font-bold text-green-600">{quiz.time_limit}</div>
                                        <div className="text-muted-foreground text-sm">{t('quiz.minutes')}</div>
                                    </>
                                )}
                            </div>
                            <div className="bg-card rounded-lg border p-4">
                                <div className="text-2xl font-bold text-amber-600">{quiz.passing_score}</div>
                                <div className="text-muted-foreground text-sm">{t('quiz.passingScore')}</div>
                            </div>
                        </div>
                    </div>

                    {/* History Nilai */}
                    {attempts.length > 0 && (
                        <div className="mb-8">
                            <h3 className="mb-4 text-lg font-semibold">{t('quiz.scoreHistory')}</h3>
                            <div className="space-y-3">
                                {attempts.slice(0, 5).map((attempt, index) => (
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
                                                        {t('quiz.attemptNumber', { number: attempts.length - index })}
                                                        {attempt.is_passed && (
                                                            <span className="ml-2 rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
                                                                {t('quiz.passedBadge')}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-muted-foreground text-sm">
                                                        {new Date(attempt.submitted_at).toLocaleDateString(localeCode, {
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
                                                    {t('quiz.correctCount', { correct: attempt.correct_answers, total: attempt.total_questions })}
                                                </div>
                                                <div className="text-muted-foreground text-sm">
                                                    {t('quiz.time', {
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

                    {/* Quiz Info */}
                    <div className="bg-card mb-6 rounded-lg border p-6">
                        <h3 className="mb-4 text-lg font-semibold">{t('quiz.instructionsTitle')}</h3>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600">•</span>
                                <span>{t('quiz.instruction1')}</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600">•</span>
                                <span>{t('quiz.instruction2')}</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-600">•</span>
                                <span>{t('quiz.instruction3')}</span>
                            </li>
                            {quiz.time_limit > 0 && (
                                <li className="flex items-start gap-2">
                                    <span className="text-red-600">•</span>
                                    <span>{t('quiz.instructionTimeLimit', { time: quiz.time_limit })}</span>
                                </li>
                            )}
                            <li className="flex items-start gap-2">
                                <span className="text-amber-600">•</span>
                                <span>{t('quiz.instructionPassingScore', { score: quiz.passing_score })}</span>
                            </li>
                        </ul>
                    </div>

                    {/* Status dan Tombol Mulai */}
                    <div className="text-center">
                        {hasPassedAttempt ? (
                            <div className="mb-6">
                                <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-green-100 px-4 py-2 text-green-600">
                                    <CheckCircle className="h-5 w-5" />
                                    <span className="font-medium">{t('quiz.passedMessage')}</span>
                                </div>
                                <p className="text-muted-foreground mb-4">
                                    {t('quiz.passedSubMessage')}
                                </p>
                            </div>
                        ) : (
                            <div className="mb-6">
                                {attempts.length > 0 ? (
                                    <div>
                                        <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-amber-100 px-4 py-2 text-amber-600">
                                            <AlertTriangle className="h-5 w-5" />
                                            <span className="font-medium">{t('quiz.failedMessage')}</span>
                                        </div>
                                        <p className="text-muted-foreground mb-4">
                                            {t('quiz.failedSubMessage')}
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground mb-4">
                                        {t('quiz.readyMessage')}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                            <Button onClick={handleStartQuiz} size="lg" className="px-8">
                                {attempts.length > 0 ? t('quiz.retakeQuiz') : t('quiz.startQuiz')}
                            </Button>

                            {attempts.length > 0 && (
                                <>
                                    <Button onClick={handleViewAnswers} variant="outline" size="lg" className="gap-2 px-8">
                                        <HelpCircle className="h-4 w-4" />
                                        {t('quiz.viewAnswers')}
                                    </Button>
                                    <Button onClick={handleViewHistory} variant="outline" size="lg" className="gap-2 px-8">
                                        <TrendingUp className="h-4 w-4" />
                                        {t('quiz.quizHistory')}
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
