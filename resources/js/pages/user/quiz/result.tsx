import { Button } from '@/components/ui/button';
import { Head, router } from '@inertiajs/react';
import { CheckCircle, ChevronLeft, HelpCircle, XCircle } from 'lucide-react';

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
    time_taken: number;
    submitted_at: string;
}

interface QuizResultProps {
    quiz: Quiz;
    attempt: QuizAttempt;
}

export default function QuizResult({ quiz, attempt }: QuizResultProps) {
    const handleRetakeQuiz = () => {
        router.get(`/quiz/${quiz.id}/start`);
    };

    const handleViewAnswers = () => {
        router.get(`/quiz/${quiz.id}/answers`);
    };

    // const handleViewHistory = () => {
    //     router.get(`/quiz/${quiz.id}/history`);
    // };

    // const handleBackToQuiz = () => {
    //     router.get(`/quiz/${quiz.id}`);
    // };

    const handleBackToCourse = () => {
        router.get(`/learn/course/${quiz.course.slug}`);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const scoreColor = attempt.is_passed ? 'text-green-600' : 'text-red-600';
    const bgColor = attempt.is_passed ? 'bg-green-100' : 'bg-red-100';
    const iconColor = attempt.is_passed ? 'text-green-600' : 'text-red-600';

    return (
        <div className="bg-background min-h-screen">
            <Head title={`Hasil Quiz: ${quiz.title}`} />

            {/* Header */}
            <div className="bg-card/50 border-b backdrop-blur">
                <div className="mx-auto max-w-4xl px-4 py-4">
                    <div className="flex items-center justify-between gap-4">
                        <Button variant="secondary" size="sm" onClick={handleBackToCourse} className="gap-2">
                            <ChevronLeft className="h-4 w-4" />
                            Kembali ke Kelas
                        </Button>
                        <h1 className="text-xl font-semibold">Hasil: {quiz.title}</h1>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-6">
                <div className="mx-auto max-w-4xl">
                    {/* Result Card */}
                    <div className="mb-8 text-center">
                        <div className={`mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full ${bgColor}`}>
                            {attempt.is_passed ? (
                                <CheckCircle className={`h-10 w-10 ${iconColor}`} />
                            ) : (
                                <XCircle className={`h-10 w-10 ${iconColor}`} />
                            )}
                        </div>

                        <h2 className="mb-2 text-3xl font-bold">{attempt.is_passed ? 'Selamat! Anda Lulus' : 'Belum Lulus'}</h2>

                        <div className={`mb-6 text-5xl font-bold ${scoreColor}`}>{Math.round(attempt.score)}%</div>

                        {attempt.is_passed ? (
                            <p className="text-muted-foreground mb-6">
                                Hebat! Anda telah berhasil menyelesaikan quiz ini dengan nilai di atas passing grade.
                            </p>
                        ) : (
                            <p className="text-muted-foreground mb-6">
                                Jangan menyerah! Pelajari materi kembali dan coba lagi untuk mendapatkan nilai yang lebih baik.
                            </p>
                        )}
                    </div>

                    {/* Stats Grid */}
                    <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
                        {/* <div className="bg-card rounded-lg border p-4 text-center">
                            <div className="text-2xl font-bold text-blue-600">{Math.round(attempt.score)}%</div>
                            <div className="text-muted-foreground text-sm">Nilai Akhir</div>
                        </div> */}

                        <div className="bg-card rounded-lg border p-4 text-center">
                            <div className="text-2xl font-bold text-green-600">
                                {attempt.correct_answers}/{attempt.total_questions}
                            </div>
                            <div className="text-muted-foreground text-sm">Jawaban Benar</div>
                        </div>

                        {/* <div className="bg-card rounded-lg border p-4 text-center">
                            <div className="text-2xl font-bold text-amber-600">{quiz.passing_score}%</div>
                            <div className="text-muted-foreground text-sm">Nilai Lulus</div>
                        </div> */}

                        <div className="bg-card rounded-lg border p-4 text-center">
                            <div className="text-2xl font-bold text-purple-600">{formatTime(attempt.time_taken)}</div>
                            <div className="text-muted-foreground text-sm">Waktu Pengerjaan</div>
                        </div>
                    </div>

                    {/* Additional Info */}
                    <div className="bg-card mb-8 rounded-lg border p-6">
                        <h3 className="mb-4 text-lg font-semibold">Detail Hasil</h3>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <div className="text-muted-foreground text-sm">Tanggal Pengerjaan</div>
                                <div className="font-medium">
                                    {new Date(attempt.submitted_at).toLocaleDateString('id-ID', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </div>
                            </div>
                            <div>
                                <div className="text-muted-foreground text-sm">Status</div>
                                <div className={`font-medium ${attempt.is_passed ? 'text-green-600' : 'text-red-600'}`}>
                                    {attempt.is_passed ? '✅ LULUS' : '❌ BELUM LULUS'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                        <Button onClick={handleViewAnswers} variant="outline" size="lg" className="gap-2">
                            <HelpCircle className="h-4 w-4" />
                            Lihat Pembahasan
                        </Button>

                        <Button onClick={handleRetakeQuiz} size="lg" className="gap-2">
                            🔄 Ulangi Quiz
                        </Button>

                        {/* <Button onClick={handleViewHistory} variant="outline" size="lg" className="gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Riwayat Nilai
                        </Button> */}
                    </div>
                </div>
            </div>
        </div>
    );
}
