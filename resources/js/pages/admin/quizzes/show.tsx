import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminLayout from '@/layouts/admin-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Download, FileUp, LoaderCircle, Plus, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import CreateQuestion from './create';
import QuizQuestion from './show-questions';
import QuizSubmission from './show-submissions';

interface Submission {
    id: string;
    user_name: string;
    user_email: string;
    score: number;
    is_passed: boolean;
    submitted_at: string;
}

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
    submissions?: Submission[];
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function Quizzes({ course, quiz, submissions = [], flash }: QuizzesProps) {
    const [open, setOpen] = useState(false);
    const [importModalOpen, setImportModalOpen] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        quiz_id: quiz.id,
        file: null as File | null,
    });

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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setData('file', file);
    };

    const handleImportSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        post(route('questions.import'), {
            onSuccess: () => {
                setImportModalOpen(false);
                reset();
            },
            onError: () => {
                // Error sudah ditangani oleh flash message
            },
        });
    };

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
            <Head title="Detail Quiz" />
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
                            <QuizSubmission submissions={submissions} />
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
                            <div className="mt-2 flex items-center justify-between gap-2">
                                <Button
                                    variant="outline"
                                    asChild
                                    className="w-full border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                                >
                                    <a href="/assets/templates/template_import_soal.xlsx" className="">
                                        <Download className="h-4 w-4" />
                                        Template
                                    </a>
                                </Button>
                                <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" className="w-full">
                                            <FileUp className="mr-2 h-4 w-4" />
                                            Import
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[425px]">
                                        <form onSubmit={handleImportSubmit}>
                                            <DialogHeader>
                                                <DialogTitle>Import Soal dari Excel</DialogTitle>
                                                <DialogDescription>
                                                    Upload file Excel (.xlsx, .xls, .csv) yang berisi data soal untuk diimport ke dalam quiz "
                                                    {quiz.title}
                                                    ".
                                                </DialogDescription>
                                            </DialogHeader>

                                            <div className="grid gap-4 py-4">
                                                <div className="grid gap-2">
                                                    <Label htmlFor="file">File Excel</Label>
                                                    <Input
                                                        id="file"
                                                        type="file"
                                                        accept=".xlsx,.xls,.csv"
                                                        onChange={handleFileChange}
                                                        className="file:rounded file:border-0 file:bg-blue-50 file:px-2 hover:cursor-pointer hover:file:bg-blue-100"
                                                    />
                                                    {errors?.file && <p className="text-sm text-red-500">{errors.file}</p>}
                                                </div>

                                                {data.file && (
                                                    <div className="rounded-md bg-green-50 p-3">
                                                        <div className="flex items-center">
                                                            <Upload className="mr-2 h-4 w-4 text-green-600" />
                                                            <span className="text-sm font-medium text-green-700">{data.file.name}</span>
                                                        </div>
                                                        <p className="mt-1 text-xs text-green-600">File siap untuk diimport</p>
                                                    </div>
                                                )}

                                                <div className="rounded-md bg-blue-50 p-3">
                                                    <div className="flex items-start">
                                                        <div className="mr-2">
                                                            <svg className="mt-0.5 h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                                <path
                                                                    fillRule="evenodd"
                                                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                                                    clipRule="evenodd"
                                                                />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-medium text-blue-800">Format File:</p>
                                                            <ul className="mt-1 list-inside list-disc text-xs text-blue-700">
                                                                <li>Kolom: question, option_a, option_b, option_c, option_d, correct_option</li>
                                                                <li>Correct_option: A, B, C, atau D</li>
                                                                <li>Option_c dan option_d boleh kosong</li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <DialogFooter>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => setImportModalOpen(false)}
                                                    disabled={processing}
                                                >
                                                    Batal
                                                </Button>
                                                <Button type="submit" disabled={processing || !data.file}>
                                                    {processing ? (
                                                        <>
                                                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                                            Mengimport...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Upload className="mr-2 h-4 w-4" />
                                                            Import Soal
                                                        </>
                                                    )}
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>
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
