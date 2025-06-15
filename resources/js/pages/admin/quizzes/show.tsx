import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminLayout from '@/layouts/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import CreateQuestion from './create';
import QuizQuestion from './show-questions';
import QuizSubmission from './show-submissions';

interface QuizzesProps {
    course: {
        id: string;
        title: string;
    };
    quiz: {
        id: string;
        title: string;
        instructions?: string;
        time_limit: number;
        passing_score: number;
        created_at: string;
        questions: Array<{
            id: string;
            question_text: string;
            type: 'multiple_choice' | 'true_false';
            options?: Array<{
                id: string;
                option_text: string;
                is_correct: boolean;
            }>;
        }>;
    };
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function Quizzes({ course, quiz, flash }: QuizzesProps) {
    const [open, setOpen] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Kelas Online',
            href: route('courses.index'),
        },
        {
            title: course.title,
            href: route('courses.show', { course: course.id }),
        },
        {
            title: quiz.title,
            href: route('quizzes.show', { course: course.id, quiz: quiz.id }),
        },
    ];

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Kategori" />
            <div className="px-4 py-4 md:px-6">
                <h1 className="mb-4 text-2xl font-semibold">{`Detail ${course.title}`}</h1>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
                    <Tabs defaultValue="question" className="order-last lg:order-first lg:col-span-2">
                        <TabsList>
                            <TabsTrigger value="question">Daftar Pertanyaan</TabsTrigger>
                            <TabsTrigger value="submission">Riwayat Pengerjaan</TabsTrigger>
                        </TabsList>
                        <TabsContent value="question">
                            <QuizQuestion questions={quiz.questions} />
                        </TabsContent>
                        <TabsContent value="submission">
                            <QuizSubmission />
                        </TabsContent>
                    </Tabs>
                    <div className="order-first lg:order-last">
                        <h2 className="my-2 text-lg font-medium">Informasi Quiz</h2>
                        <div className="rounded-lg border p-4">
                            <Dialog open={open} onOpenChange={setOpen}>
                                <DialogTrigger asChild>
                                    <Button className="w-full hover:cursor-pointer">
                                        Tambah Pertanyaan
                                        <Plus />
                                    </Button>
                                </DialogTrigger>
                                <CreateQuestion setOpen={setOpen} quizId={quiz.id} />
                            </Dialog>
                            <h3 className="mt-4 text-lg font-semibold">{quiz.title}</h3>
                            <p className="text-muted-foreground text-sm">
                                {quiz.instructions ? quiz.instructions : 'Belum ada instruksi yang ditampilkan ke peserta.'}
                            </p>
                            <div className="mt-4 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Batas Waktu:</span>
                                    <span className="text-sm font-medium">{quiz.time_limit} menit</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Nilai Lulus:</span>
                                    <span className="text-sm font-medium">{quiz.passing_score} poin</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-4 rounded-lg border p-4">
                    <h3 className="text-muted-foreground text-center text-sm">
                        Dibuat pada : {format(new Date(quiz.created_at), 'dd MMMM yyyy HH:mm', { locale: id })}
                    </h3>
                </div>
            </div>
        </AdminLayout>
    );
}
