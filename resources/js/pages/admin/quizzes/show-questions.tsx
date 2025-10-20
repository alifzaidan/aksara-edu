import DeleteConfirmDialog from '@/components/delete-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { router } from '@inertiajs/react';
import { Check, ChevronDown, ChevronRight, Edit, FileText, Search, Trash, X } from 'lucide-react';
import { useEffect, useState } from 'react';
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
    explanation?: string;
};

interface QuizQuestionProps {
    questions: Question[];
}

export default function QuizQuestion({ questions }: QuizQuestionProps) {
    const [editQuestion, setEditQuestion] = useState<Question | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

    const handleDelete = (questionId: string) => {
        router.delete(route('questions.destroy', questionId), {
            preserveScroll: true,
        });
    };

    const toggleExpanded = (questionId: string) => {
        const newExpanded = new Set(expandedQuestions);
        if (newExpanded.has(questionId)) {
            newExpanded.delete(questionId);
        } else {
            newExpanded.add(questionId);
        }
        setExpandedQuestions(newExpanded);
    };

    const normalizedQuery = searchTerm.trim().toLowerCase();
    const filteredQuestions = normalizedQuery
        ? questions.filter((q) => {
              const questionText = (q.question_text || '').toLowerCase();
              const matchText = questionText.includes(normalizedQuery);
              const matchOptions = q.options?.some((o) => (o.option_text || '').toLowerCase().includes(normalizedQuery));
              const matchExplanation = (q.explanation || '').toLowerCase().includes(normalizedQuery);
              return matchText || matchOptions || matchExplanation;
          })
        : questions;

    const totalItems = filteredQuestions.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);
    const paginatedQuestions = filteredQuestions.slice(startIndex, endIndex);

    useEffect(() => {
        const newTotalPages = Math.max(1, Math.ceil(totalItems / pageSize));
        if (currentPage > newTotalPages) setCurrentPage(newTotalPages);
        if (currentPage < 1 && newTotalPages >= 1) setCurrentPage(1);
    }, [totalItems, pageSize, currentPage]);

    const goToPage = (page: number) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };

    const getPageItems = (): (number | 'ellipsis')[] => {
        const items: (number | 'ellipsis')[] = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) items.push(i);
            return items;
        }

        if (currentPage <= 4) {
            items.push(1, 2, 3, 4, 5, 'ellipsis', totalPages);
            return items;
        }

        if (currentPage >= totalPages - 3) {
            items.push(1, 'ellipsis', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            return items;
        }

        items.push(1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages);
        return items;
    };

    return (
        <div className="min-h-full space-y-6 rounded-lg border p-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">Daftar Pertanyaan ({totalItems})</h2>
                <div className="relative w-full sm:w-64">
                    <Input
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        placeholder="Cari pertanyaan..."
                        className="h-9 pl-9"
                    />
                    <Search className="text-muted-foreground absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2" />
                </div>
            </div>

            {/* Empty States */}
            {questions.length === 0 ? (
                <div className="py-12 text-center">
                    <FileText className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                    <h3 className="mb-2 text-lg font-medium text-gray-900">Belum ada pertanyaan</h3>
                    <p className="text-sm text-gray-500">Silakan buat pertanyaan baru untuk quiz ini.</p>
                </div>
            ) : filteredQuestions.length === 0 ? (
                <div className="py-12 text-center">
                    <FileText className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                    <h3 className="mb-2 text-lg font-medium text-gray-900">Tidak ada hasil</h3>
                    <p className="mb-4 text-sm text-gray-500">Tidak ada pertanyaan yang cocok dengan kata kunci pencarian.</p>
                    <Button variant="outline" onClick={() => setSearchTerm('')}>
                        Hapus Pencarian
                    </Button>
                </div>
            ) : (
                <>
                    {/* Question List with Accordion */}
                    <div className="space-y-4">
                        {paginatedQuestions.map((question, index) => (
                            <div key={question.id} className="overflow-hidden rounded-lg border">
                                {/* Question Header */}
                                <div className="p-4 hover:bg-gray-50">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            {/* Badges */}
                                            <div className="mb-2 flex items-center gap-2">
                                                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Soal {startIndex + index + 1}</Badge>
                                                <Badge variant="outline">
                                                    {question.type === 'multiple_choice' ? 'Pilihan Ganda' : 'Benar/Salah'}
                                                </Badge>
                                            </div>

                                            {/* Question Text */}
                                            <h3 className="mb-2 font-medium text-gray-900">{question.question_text}</h3>

                                            {/* Meta Info */}
                                            <div className="flex items-center gap-4">
                                                <p className="text-sm text-gray-600">
                                                    {question.type === 'multiple_choice'
                                                        ? `${question.options?.length || 0} pilihan jawaban`
                                                        : 'Soal Benar/Salah'}
                                                </p>

                                                {/* Toggle Expand Button */}
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => toggleExpanded(question.id)}
                                                    className="h-auto p-1 text-gray-500 hover:text-gray-700"
                                                >
                                                    {expandedQuestions.has(question.id) ? (
                                                        <>
                                                            <ChevronDown className="h-4 w-4" />
                                                            <span className="ml-1 text-xs">Sembunyikan Jawaban</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ChevronRight className="h-4 w-4" />
                                                            <span className="ml-1 text-xs">Lihat Jawaban</span>
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="ml-4 flex items-center gap-2">
                                            <Dialog
                                                open={!!editQuestion && editQuestion.id === question.id}
                                                onOpenChange={(open) => !open && setEditQuestion(null)}
                                            >
                                                <DialogTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="border-blue-200 text-blue-600 hover:bg-blue-50"
                                                        onClick={() => setEditQuestion(question)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                        Edit
                                                    </Button>
                                                </DialogTrigger>
                                                {editQuestion && editQuestion.id === question.id && (
                                                    <EditQuestion
                                                        question={{ ...editQuestion, options: editQuestion.options ?? [] }}
                                                        setOpen={(open) => !open && setEditQuestion(null)}
                                                    />
                                                )}
                                            </Dialog>

                                            <DeleteConfirmDialog
                                                trigger={
                                                    <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50">
                                                        <Trash className="h-4 w-4" />
                                                        Hapus
                                                    </Button>
                                                }
                                                title="Apakah Anda yakin ingin menghapus pertanyaan ini?"
                                                itemName={
                                                    question.question_text.length > 50
                                                        ? question.question_text.substring(0, 50) + '...'
                                                        : question.question_text
                                                }
                                                onConfirm={() => handleDelete(question.id)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Content - Options/Answers */}
                                {expandedQuestions.has(question.id) && (
                                    <div className="border-t bg-gray-50 p-4">
                                        {/* Multiple Choice Options */}
                                        {question.type === 'multiple_choice' && question.options && (
                                            <div>
                                                <h4 className="mb-3 text-sm font-medium text-gray-700">Pilihan Jawaban:</h4>
                                                <div className="space-y-2">
                                                    {question.options.map((option, optionIndex) => (
                                                        <div
                                                            key={option.id}
                                                            className={`flex items-start gap-2 rounded p-2 ${
                                                                option.is_correct
                                                                    ? 'border border-green-200 bg-green-100'
                                                                    : 'border border-gray-200 bg-white'
                                                            }`}
                                                        >
                                                            <span className="mt-0.5 text-sm font-medium text-gray-600">
                                                                {String.fromCharCode(65 + optionIndex)}.
                                                            </span>
                                                            <span
                                                                className={`text-sm ${
                                                                    option.is_correct ? 'font-bold text-green-800' : 'text-gray-700'
                                                                }`}
                                                            >
                                                                {option.option_text}
                                                            </span>
                                                            {option.is_correct && (
                                                                <Badge className="ml-auto border-0 bg-green-600 text-white">Jawaban Benar</Badge>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* True/False Options */}
                                        {question.type === 'true_false' && question.options && (
                                            <div>
                                                <h4 className="mb-3 text-sm font-medium text-gray-700">Jawaban:</h4>
                                                <div className="space-y-2">
                                                    {question.options.map((option, optionIndex) => (
                                                        <div
                                                            key={option.id}
                                                            className={`flex items-center gap-2 rounded p-2 ${
                                                                option.is_correct
                                                                    ? 'border border-green-200 bg-green-100'
                                                                    : 'border border-gray-200 bg-white'
                                                            }`}
                                                        >
                                                            {optionIndex === 0 ? (
                                                                <Check className="h-4 w-4 text-green-600" />
                                                            ) : (
                                                                <X className="h-4 w-4 text-red-600" />
                                                            )}
                                                            <span
                                                                className={`text-sm ${
                                                                    option.is_correct ? 'font-bold text-green-800' : 'text-gray-700'
                                                                }`}
                                                            >
                                                                {option.option_text}
                                                            </span>
                                                            {option.is_correct && (
                                                                <Badge className="ml-auto border-0 bg-green-600 text-white">Jawaban Benar</Badge>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Explanation */}
                                        {question.explanation && (
                                            <div className="mt-4 rounded-md border border-blue-200 bg-blue-50 p-3">
                                                <h4 className="mb-1 text-sm font-medium text-blue-800">Pembahasan:</h4>
                                                <p className="text-sm text-blue-700">{question.explanation}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Pagination Footer */}
                    <div className="flex flex-col items-center gap-3 pt-4 sm:flex-row sm:justify-between">
                        <p className="text-muted-foreground text-sm">
                            Menampilkan <span className="text-foreground font-medium">{totalItems === 0 ? 0 : startIndex + 1}</span>–
                            <span className="text-foreground font-medium">{endIndex}</span> dari{' '}
                            <span className="text-foreground font-medium">{totalItems}</span> pertanyaan
                        </p>

                        <div className="flex flex-col items-center gap-3 sm:flex-row">
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground text-sm">Per halaman:</span>
                                <Select
                                    value={String(pageSize)}
                                    onValueChange={(v) => {
                                        const n = parseInt(v, 10);
                                        if (!isNaN(n)) {
                                            setPageSize(n);
                                            setCurrentPage(1);
                                        }
                                    }}
                                >
                                    <SelectTrigger className="h-8 w-[90px]">
                                        <SelectValue placeholder="10" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="20">20</SelectItem>
                                        <SelectItem value="30">30</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                goToPage(currentPage - 1);
                                            }}
                                            className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                                            size="default"
                                        />
                                    </PaginationItem>

                                    {getPageItems().map((item, idx) => (
                                        <PaginationItem key={`${item}-${idx}`}>
                                            {item === 'ellipsis' ? (
                                                <PaginationEllipsis />
                                            ) : (
                                                <PaginationLink
                                                    href="#"
                                                    isActive={item === currentPage}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        goToPage(item as number);
                                                    }}
                                                    size="default"
                                                >
                                                    {item}
                                                </PaginationLink>
                                            )}
                                        </PaginationItem>
                                    ))}
                                    <PaginationItem>
                                        <PaginationNext
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                goToPage(currentPage + 1);
                                            }}
                                            className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                                            size="default"
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
