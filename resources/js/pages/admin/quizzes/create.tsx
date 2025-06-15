import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from '@inertiajs/react';
import { Trash } from 'lucide-react';
import { FormEventHandler, useRef, useState } from 'react';

interface CreateQuestionProps {
    setOpen: (open: boolean) => void;
    quizId: string;
}

export default function CreateQuestion({ setOpen, quizId }: CreateQuestionProps) {
    const questionInput = useRef<HTMLTextAreaElement>(null);

    const [options, setOptions] = useState([
        { option_text: '', is_correct: false },
        { option_text: '', is_correct: false },
    ]);
    const [type, setType] = useState<'multiple_choice' | 'true_false'>('multiple_choice');

    const { data, setData, post, processing, reset, errors, clearErrors } = useForm({
        question_text: '',
        type: 'multiple_choice',
        quiz_id: quizId,
        options: options as { option_text: string; is_correct: boolean }[],
    });

    // Sinkronkan options ke form data
    const updateOptions = (opts: typeof options) => {
        setOptions(opts);
        setData('options', opts);
    };

    const createQuestion: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('questions.store'), {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                reset();
                clearErrors();
                setOptions([
                    { option_text: '', is_correct: false },
                    { option_text: '', is_correct: false },
                ]);
            },
            onError: () => questionInput.current?.focus(),
        });
    };

    return (
        <DialogContent>
            <DialogTitle>Tambah Pertanyaan</DialogTitle>
            <DialogDescription>Masukkan pertanyaan dan opsi jawaban.</DialogDescription>
            <form className="space-y-4" onSubmit={createQuestion}>
                <div className="grid gap-2">
                    <Label htmlFor="question_text">Pertanyaan</Label>
                    <Textarea
                        id="question_text"
                        name="question_text"
                        ref={questionInput}
                        value={data.question_text}
                        onChange={(e) => setData('question_text', e.target.value)}
                        placeholder="Tulis pertanyaan..."
                        autoComplete="off"
                        required
                    />
                    <InputError message={errors.question_text} />

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
                                    { option_text: 'Benar', is_correct: false },
                                    { option_text: 'Salah', is_correct: false },
                                ]);
                            } else {
                                updateOptions([
                                    { option_text: '', is_correct: false },
                                    { option_text: '', is_correct: false },
                                ]);
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
                    <div className="mt-2 space-y-2">
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
                                {options.map((opt, idx) => (
                                    <div key={idx} className="mb-1 flex items-center space-x-2">
                                        <Input
                                            type="text"
                                            value={opt.option_text}
                                            onChange={(e) => {
                                                const newOpts = [...options];
                                                newOpts[idx].option_text = e.target.value;
                                                updateOptions(newOpts);
                                            }}
                                            placeholder={`Opsi ${String.fromCharCode(65 + idx)}`}
                                            required
                                            className={opt.is_correct ? 'border-green-500 ring-2 ring-green-500' : ''}
                                        />
                                        <RadioGroupItem value={idx.toString()} id={`option-${idx}`} />
                                        <Label htmlFor={`option-${idx}`} className="hover:cursor-pointer">
                                            Benar
                                        </Label>
                                        {options.length > 2 && (
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => {
                                                    const newOpts = options.filter((_, oidx) => oidx !== idx);
                                                    updateOptions(newOpts);
                                                }}
                                                className="hover:cursor-pointer"
                                            >
                                                <Trash />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </RadioGroup>
                        )}
                        {type === 'multiple_choice' && (
                            <Button
                                type="button"
                                size="sm"
                                className="hover:cursor-pointer"
                                onClick={() => updateOptions([...options, { option_text: '', is_correct: false }])}
                            >
                                + Tambah Opsi
                            </Button>
                        )}
                    </div>
                    <InputError message={errors.options} />
                </div>

                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="secondary" onClick={() => setOpen(false)} className="hover:cursor-pointer">
                            Batal
                        </Button>
                    </DialogClose>
                    <Button disabled={processing} asChild className="hover:cursor-pointer">
                        <button type="submit">Tambah Pertanyaan</button>
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}
