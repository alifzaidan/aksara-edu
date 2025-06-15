import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Link } from '@inertiajs/react';
import { Check, Edit, Trash, X } from 'lucide-react';
import { useState } from 'react';
import EditQuestion from './edit';

type Option = {
    id: string;
    option_text: string;
    is_correct: boolean;
};

type Question = {
    id: string;
    question_text: string;
    type: 'multiple_choice' | 'true_false';
    options?: Option[];
};

interface QuizQuestionProps {
    questions: Question[];
}

export default function QuizQuestion({ questions }: QuizQuestionProps) {
    const [editQuestion, setEditQuestion] = useState<Question | null>(null);

    return (
        <div className="min-h-full space-y-6 rounded-lg border p-4">
            <h2 className="text-lg font-medium">Daftar Pertanyaan</h2>
            {questions.length === 0 ? (
                <div className="text-center text-sm text-gray-500">Belum ada pertanyaan. Silakan buat pertanyaan baru.</div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-1">No</TableHead>
                            <TableHead>Pertanyaan</TableHead>
                            <TableHead>Opsi Jawaban</TableHead>
                            <TableHead className="w-1">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {questions.map((q, idx) => (
                            <TableRow key={q.id}>
                                <TableCell>{idx + 1}</TableCell>
                                <TableCell>
                                    <div className="text-wrap">{q.question_text}</div>
                                </TableCell>
                                <TableCell>
                                    <ul className="space-y-1">
                                        {q.type === 'true_false' ? (
                                            <>
                                                <li className={q.options?.[0]?.is_correct ? 'flex font-bold text-green-600' : ''}>
                                                    <p className="flex items-center gap-1">
                                                        <Check size="16" /> Benar
                                                    </p>
                                                    <Badge
                                                        className={
                                                            'ml-2 border-0 bg-green-100 text-green-700' +
                                                            (q.options?.[0]?.is_correct ? '' : ' hidden')
                                                        }
                                                    >
                                                        Benar
                                                    </Badge>
                                                </li>
                                                <li className={q.options?.[1]?.is_correct ? 'flex font-bold text-green-600' : ''}>
                                                    <p className="flex items-center gap-1">
                                                        <X size="16" /> Salah
                                                    </p>
                                                    <Badge
                                                        className={
                                                            'ml-2 border-0 bg-green-100 text-green-700' +
                                                            (q.options?.[1]?.is_correct ? '' : ' hidden')
                                                        }
                                                    >
                                                        Benar
                                                    </Badge>
                                                </li>
                                            </>
                                        ) : (
                                            q.options?.map((opt, oidx) => (
                                                <li key={opt.id} className={opt.is_correct ? 'font-bold text-green-600' : ''}>
                                                    {String.fromCharCode(65 + oidx)}. {opt.option_text}{' '}
                                                    <Badge
                                                        className={'ml-2 border-0 bg-green-100 text-green-700' + (opt.is_correct ? '' : ' hidden')}
                                                    >
                                                        Benar
                                                    </Badge>
                                                </li>
                                            ))
                                        )}
                                    </ul>
                                </TableCell>
                                <TableCell>
                                    <div className="flex">
                                        <Dialog open={!!editQuestion} onOpenChange={(open) => !open && setEditQuestion(null)}>
                                            <DialogTrigger asChild>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="link"
                                                                className="hover:cursor-pointer"
                                                                onClick={() => setEditQuestion(q)}
                                                            >
                                                                <Edit className="mr-1" />
                                                                <span className="sr-only">Edit Pertanyaan</span>
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Edit Pertanyaan</TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </DialogTrigger>
                                            {editQuestion && (
                                                <EditQuestion
                                                    question={{ ...editQuestion, options: editQuestion.options ?? [] }}
                                                    setOpen={(open) => !open && setEditQuestion(null)}
                                                />
                                            )}
                                        </Dialog>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="link" size="icon" className="size-8 text-red-500 hover:cursor-pointer" asChild>
                                                    <Link method="delete" href={route('questions.destroy', q.id)}>
                                                        <Trash />
                                                        <span className="sr-only">Hapus Pertanyaan</span>
                                                    </Link>
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Hapus Pertanyaan</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </div>
    );
}
