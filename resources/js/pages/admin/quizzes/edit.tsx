import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminLayout from '@/layouts/admin-layout';
import { BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Editor } from '@tinymce/tinymce-react';
import { ImagePlus, Trash } from 'lucide-react';
import { FormEventHandler, useRef, useState } from 'react';
import { toast } from 'sonner';

interface Option {
    id?: string;
    option_text: string;
    option_image?: string | null;
    is_correct: boolean;
}

interface Question {
    id: string;
    question_text: string;
    question_image?: string | null;
    type: 'multiple_choice' | 'true_false';
    options: Option[];
    explanation?: string;
}

interface EditQuestionPageProps {
    course: {
        id: string;
        title: string;
    };
    quiz: {
        id: string;
        title: string;
    };
    question: Question;
}

export default function EditQuestionPage({ course, quiz, question }: EditQuestionPageProps) {
    const questionInput = useRef<HTMLTextAreaElement>(null);
    const questionImageInputRef = useRef<HTMLInputElement>(null);
    const optionImageRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});

    const [options, setOptions] = useState<
        Array<{
            id?: string;
            option_text: string;
            option_image: File | null;
            option_image_preview: string | null;
            existing_option_image: string | null;
            existing_option_image_path: string | null; // ✅ Tambahkan untuk menyimpan path asli
            is_correct: boolean;
        }>
    >(
        question.options?.length
            ? question.options.map((opt) => ({
                  id: opt.id,
                  option_text: opt.option_text,
                  option_image: null,
                  option_image_preview: null,
                  existing_option_image: opt.option_image || null, // URL untuk preview
                  existing_option_image_path: opt.option_image || null, // ✅ Simpan URL asli
                  is_correct: opt.is_correct,
              }))
            : [
                  {
                      option_text: '',
                      option_image: null,
                      option_image_preview: null,
                      existing_option_image: null,
                      existing_option_image_path: null,
                      is_correct: false,
                  },
                  {
                      option_text: '',
                      option_image: null,
                      option_image_preview: null,
                      existing_option_image: null,
                      existing_option_image_path: null,
                      is_correct: false,
                  },
              ],
    );
    const [type, setType] = useState<'multiple_choice' | 'true_false'>(question.type);
    const [questionImagePreview, setQuestionImagePreview] = useState<string | null>(question.question_image || null);
    const [removeQuestionImageFlag, setRemoveQuestionImageFlag] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        _method: 'PUT',
        question_text: question.question_text,
        question_image: null as File | null,
        remove_question_image: false as boolean,
        type: question.type,
        explanation: question.explanation || '',
        options: options.map((opt) => ({
            option_text: opt.option_text,
            option_image: opt.option_image,
            remove_option_image: !opt.existing_option_image && !opt.option_image_preview,
            is_correct: opt.is_correct,
        })),
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
        {
            title: 'Edit Pertanyaan',
            href: route('questions.edit', { course: course.id, quiz: quiz.id, question: question.id }),
        },
    ];

    const MAX_FILE_SIZE = 2 * 1024 * 1024;

    const validateFileSize = (file: File): boolean => {
        if (file.size > MAX_FILE_SIZE) {
            toast.error('Ukuran file tidak boleh melebihi 2MB!');
            return false;
        }
        return true;
    };

    const updateOptions = (opts: typeof options) => {
        setOptions(opts);
        setData(
            'options',
            opts.map((opt) => ({
                option_text: opt.option_text,
                option_image: opt.option_image,
                existing_option_image: opt.existing_option_image_path,
                remove_option_image: !opt.existing_option_image && !opt.option_image_preview,
                is_correct: opt.is_correct,
            })),
        );
    };

    const handleQuestionImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!validateFileSize(file)) {
                e.target.value = '';
                return;
            }

            setData('question_image', file);
            setRemoveQuestionImageFlag(false);
            setData('remove_question_image', false);

            const reader = new FileReader();
            reader.onloadend = () => {
                setQuestionImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeQuestionImage = () => {
        setData('question_image', null);
        setData('remove_question_image', true);
        setRemoveQuestionImageFlag(true);
        setQuestionImagePreview(null);
        if (questionImageInputRef.current) {
            questionImageInputRef.current.value = '';
        }
    };

    const handleOptionImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!validateFileSize(file)) {
                e.target.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const newOpts = [...options];
                newOpts[index].option_image = file;
                newOpts[index].option_image_preview = reader.result as string;
                newOpts[index].existing_option_image = null;
                newOpts[index].existing_option_image_path = null; // ✅ Reset path juga
                updateOptions(newOpts);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeOptionImage = (index: number) => {
        const newOpts = [...options];
        newOpts[index].option_image = null;
        newOpts[index].option_image_preview = null;
        newOpts[index].existing_option_image = null;
        newOpts[index].existing_option_image_path = null; // ✅ Reset path juga
        updateOptions(newOpts);
        if (optionImageRefs.current[index]) {
            optionImageRefs.current[index]!.value = '';
        }
    };

    const updateQuestion: FormEventHandler = (e) => {
        e.preventDefault();

        if (data.question_image && data.question_image.size > MAX_FILE_SIZE) {
            toast.error('Gambar pertanyaan melebihi ukuran maksimal 2MB!');
            return;
        }

        for (let i = 0; i < options.length; i++) {
            if (options[i].option_image && options[i].option_image!.size > MAX_FILE_SIZE) {
                toast.error(`Gambar opsi ${String.fromCharCode(65 + i)} melebihi ukuran maksimal 2MB!`);
                return;
            }
        }

        post(route('questions.update', question.id), {
            preserveScroll: true,
            onError: () => questionInput.current?.focus(),
        });
    };

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Pertanyaan" />
            <div className="px-4 py-4 md:px-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Edit Pertanyaan</CardTitle>
                        <CardDescription>Ubah pertanyaan untuk quiz "{quiz.title}"</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-4" onSubmit={updateQuestion}>
                            <div className="grid gap-2">
                                <Label htmlFor="question_text">Pertanyaan</Label>
                                <Editor
                                    apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
                                    value={data.question_text}
                                    onEditorChange={(content) => setData('question_text', content)}
                                    init={{
                                        plugins: [
                                            'anchor',
                                            'autolink',
                                            'charmap',
                                            'codesample',
                                            'emoticons',
                                            'image',
                                            'link',
                                            'lists',
                                            'media',
                                            'searchreplace',
                                            'table',
                                            'visualblocks',
                                            'wordcount',
                                        ],
                                        toolbar:
                                            'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | checklist numlist bullist indent outdent | emoticons charmap | removeformat',
                                        height: 300,
                                    }}
                                />
                                <InputError message={errors.question_text} />

                                {/* Upload Gambar Pertanyaan */}
                                <Label htmlFor="question_image" className="mt-2">
                                    Gambar Pertanyaan (Opsional, Max 2MB)
                                </Label>
                                {questionImagePreview && !removeQuestionImageFlag ? (
                                    <div className="">
                                        <img src={questionImagePreview} alt="Preview" className="h-48 rounded-lg border object-cover" />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            className="mt-2 w-full md:w-fit"
                                            onClick={removeQuestionImage}
                                        >
                                            Hapus Gambar
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Input
                                            ref={questionImageInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleQuestionImageChange}
                                            className="hidden"
                                            id="question_image"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => questionImageInputRef.current?.click()}
                                            className="w-full"
                                        >
                                            <ImagePlus className="mr-2 h-4 w-4" />
                                            Upload Gambar (Max 2MB)
                                        </Button>
                                    </div>
                                )}
                                <InputError message={errors.question_image} />

                                <Label htmlFor="explanation" className="mt-2">
                                    Pembahasan (Opsional)
                                </Label>
                                <Editor
                                    apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
                                    value={data.explanation}
                                    onEditorChange={(content) => setData('explanation', content)}
                                    init={{
                                        plugins: [
                                            'anchor',
                                            'autolink',
                                            'charmap',
                                            'codesample',
                                            'emoticons',
                                            'image',
                                            'link',
                                            'lists',
                                            'media',
                                            'searchreplace',
                                            'table',
                                            'visualblocks',
                                            'wordcount',
                                        ],
                                        toolbar:
                                            'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | checklist numlist bullist indent outdent | emoticons charmap | removeformat',
                                        height: 200,
                                    }}
                                />
                                <InputError message={errors.explanation} />

                                <Label htmlFor="type" className="mt-2">
                                    Tipe Pertanyaan
                                </Label>
                                <Select
                                    value={type}
                                    onValueChange={(val) => {
                                        const newType = val as 'multiple_choice' | 'true_false';
                                        setType(newType);
                                        setData('type', newType);
                                        if (newType === 'true_false') {
                                            updateOptions([
                                                {
                                                    option_text: 'Benar',
                                                    option_image: null,
                                                    option_image_preview: null,
                                                    existing_option_image: null,
                                                    existing_option_image_path: null,
                                                    is_correct: options[0]?.is_correct ?? false,
                                                },
                                                {
                                                    option_text: 'Salah',
                                                    option_image: null,
                                                    option_image_preview: null,
                                                    existing_option_image: null,
                                                    existing_option_image_path: null,
                                                    is_correct: options[1]?.is_correct ?? false,
                                                },
                                            ]);
                                        } else {
                                            updateOptions(
                                                options.length >= 2
                                                    ? options
                                                    : [
                                                          {
                                                              option_text: '',
                                                              option_image: null,
                                                              option_image_preview: null,
                                                              existing_option_image: null,
                                                              existing_option_image_path: null,
                                                              is_correct: false,
                                                          },
                                                          {
                                                              option_text: '',
                                                              option_image: null,
                                                              option_image_preview: null,
                                                              existing_option_image: null,
                                                              existing_option_image_path: null,
                                                              is_correct: false,
                                                          },
                                                      ],
                                            );
                                        }
                                    }}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Pilih tipe pertanyaan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="multiple_choice">Pilihan Ganda</SelectItem>
                                        <SelectItem value="true_false">Benar/Salah</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label>Opsi Jawaban</Label>
                                <p className="mb-2 text-sm text-gray-500">Setiap opsi harus memiliki teks atau gambar (atau keduanya)</p>
                                <div className="mt-2 space-y-4">
                                    {type === 'true_false' ? (
                                        <RadioGroup
                                            value={options.findIndex((opt) => opt.is_correct).toString()}
                                            onValueChange={(val) => {
                                                const idx = Number(val);
                                                const newOpts = options.map((o, oidx) => ({
                                                    ...o,
                                                    is_correct: oidx === idx,
                                                }));
                                                updateOptions(newOpts);
                                            }}
                                        >
                                            <div className="mb-1 flex items-center space-x-2">
                                                <RadioGroupItem value="0" id="option-0" />
                                                <Label htmlFor="option-0">Benar</Label>
                                            </div>
                                            <div className="mb-1 flex items-center space-x-2">
                                                <RadioGroupItem value="1" id="option-1" />
                                                <Label htmlFor="option-1">Salah</Label>
                                            </div>
                                        </RadioGroup>
                                    ) : (
                                        <>
                                            {options.map((opt, idx) => (
                                                <div
                                                    key={opt.id ?? idx}
                                                    className={`rounded-lg border-2 p-4 transition-colors ${
                                                        opt.is_correct ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'
                                                    }`}
                                                >
                                                    <div className="mb-2 flex items-center justify-between">
                                                        <Label className={`text-base font-semibold ${opt.is_correct ? 'text-green-700' : ''}`}>
                                                            Opsi {String.fromCharCode(65 + idx)}
                                                            {opt.is_correct && (
                                                                <span className="ml-2 text-xs font-normal text-green-600">(Jawaban Benar)</span>
                                                            )}
                                                        </Label>
                                                        <div className="flex items-center gap-2">
                                                            <RadioGroup
                                                                value={options.findIndex((o) => o.is_correct).toString()}
                                                                onValueChange={(val) => {
                                                                    const selectedIdx = Number(val);
                                                                    const newOpts = options.map((o, oidx) => ({
                                                                        ...o,
                                                                        is_correct: oidx === selectedIdx,
                                                                    }));
                                                                    updateOptions(newOpts);
                                                                }}
                                                            >
                                                                <div className="flex items-center space-x-2">
                                                                    <RadioGroupItem value={idx.toString()} id={`correct-${idx}`} />
                                                                    <Label htmlFor={`correct-${idx}`} className="text-sm font-normal">
                                                                        Jawaban Benar
                                                                    </Label>
                                                                </div>
                                                            </RadioGroup>
                                                            {options.length > 2 && (
                                                                <Button
                                                                    type="button"
                                                                    variant="destructive"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        const newOpts = options.filter((_, oidx) => oidx !== idx);
                                                                        updateOptions(newOpts);
                                                                    }}
                                                                >
                                                                    <Trash className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <Editor
                                                        apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
                                                        value={opt.option_text}
                                                        onEditorChange={(content) => {
                                                            const newOpts = [...options];
                                                            newOpts[idx].option_text = content;
                                                            updateOptions(newOpts);
                                                        }}
                                                        init={{
                                                            plugins: [
                                                                'anchor',
                                                                'autolink',
                                                                'charmap',
                                                                'codesample',
                                                                'emoticons',
                                                                'image',
                                                                'link',
                                                                'lists',
                                                                'media',
                                                                'searchreplace',
                                                                'table',
                                                                'visualblocks',
                                                                'wordcount',
                                                            ],
                                                            toolbar:
                                                                'undo redo | blocks fontsize | bold italic underline | link image table | align | numlist bullist | emoticons charmap | removeformat',
                                                            height: 150,
                                                            menubar: false,
                                                            statusbar: false,
                                                        }}
                                                    />

                                                    {/* Upload Gambar Opsi */}
                                                    <div className="mt-3">
                                                        <Label className="text-sm">
                                                            Gambar Opsi {String.fromCharCode(65 + idx)} (Opsional, Max 2MB)
                                                        </Label>
                                                        {opt.option_image_preview || opt.existing_option_image ? (
                                                            <div className="">
                                                                <img
                                                                    src={opt.option_image_preview || opt.existing_option_image || ''}
                                                                    alt="Preview"
                                                                    className="h-32 rounded border object-cover"
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    variant="destructive"
                                                                    size="sm"
                                                                    className="mt-2 w-full text-xs md:w-fit"
                                                                    onClick={() => removeOptionImage(idx)}
                                                                >
                                                                    Hapus Gambar
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <Input
                                                                    ref={(el) => {
                                                                        optionImageRefs.current[idx] = el;
                                                                    }}
                                                                    type="file"
                                                                    accept="image/*"
                                                                    onChange={(e) => handleOptionImageChange(idx, e)}
                                                                    className="hidden"
                                                                    id={`option_image_${idx}`}
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => optionImageRefs.current[idx]?.click()}
                                                                    className="mt-2 w-full"
                                                                >
                                                                    <ImagePlus className="mr-2 h-4 w-4" />
                                                                    Upload Gambar (Max 2MB)
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                className="w-full"
                                                onClick={() =>
                                                    updateOptions([
                                                        ...options,
                                                        {
                                                            option_text: '',
                                                            option_image: null,
                                                            option_image_preview: null,
                                                            existing_option_image: null,
                                                            existing_option_image_path: null,
                                                            is_correct: false,
                                                        },
                                                    ])
                                                }
                                            >
                                                + Tambah Opsi
                                            </Button>
                                        </>
                                    )}
                                </div>
                                <InputError message={errors.options} />
                            </div>

                            <div className="flex gap-2">
                                <Button type="button" variant="outline" onClick={() => window.history.back()} className="hover:cursor-pointer">
                                    Batal
                                </Button>
                                <Button disabled={processing} type="submit" className="hover:cursor-pointer">
                                    {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
