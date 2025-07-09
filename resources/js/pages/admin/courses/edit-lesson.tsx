import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Editor } from '@tinymce/tinymce-react';
import { FormEventHandler, useEffect, useRef, useState } from 'react';

interface Lesson {
    id?: string | number; // Add ID field for existing lessons
    title: string;
    type: 'text' | 'video' | 'file' | 'quiz';
    description?: string;
    is_free: boolean;
    content?: string;
    video_url?: string;
    attachment?: File | null;
    quizzes?: {
        id?: string | number;
        instructions: string;
        time_limit: number;
        passing_score: number;
    }[];
    is_preview?: boolean;
}

interface EditLessonProps {
    setOpen: (open: boolean) => void;
    onEdit: (lesson: Lesson) => void;
    lesson: Lesson;
}

function getYoutubeId(url: string) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : '';
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export default function EditLesson({ setOpen, onEdit, lesson }: EditLessonProps) {
    const [title, setTitle] = useState(lesson.title);
    const [type, setType] = useState<Lesson['type']>(lesson.type);
    const [description, setDescription] = useState(lesson.description ?? '');
    const [isFree, setIsFree] = useState(lesson.is_free ?? false);
    const [content, setContent] = useState(lesson.content ?? '');
    const [video, setVideo] = useState<string>(lesson.video_url ?? '');
    const [attachment, setAttachment] = useState<File | null>(lesson.attachment ?? null);
    const [error, setError] = useState('');
    const [quizInstructions, setQuizInstructions] = useState(lesson.quizzes?.[0]?.instructions || '');
    const [quizTimeLimit, setQuizTimeLimit] = useState(lesson.quizzes?.[0]?.time_limit || 0);
    const [quizPassingScore, setQuizPassingScore] = useState(lesson.quizzes?.[0]?.passing_score || 0);
    const [isPreview, setIsPreview] = useState(lesson.is_preview !== undefined ? lesson.is_preview : true);
    const titleInput = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setTitle(lesson.title);
        setType(lesson.type);
        setDescription(lesson.description ?? '');
        setIsFree(lesson.is_free ?? false);
        setContent(lesson.content ?? '');
        setVideo(lesson.video_url ?? '');
        setAttachment(lesson.attachment ?? null);
        setQuizInstructions(lesson.quizzes?.[0]?.instructions || '');
        setQuizTimeLimit(lesson.quizzes?.[0]?.time_limit || 0);
        setQuizPassingScore(lesson.quizzes?.[0]?.passing_score || 0);
        setError('');
        setIsPreview(lesson.is_preview !== undefined ? lesson.is_preview : true);
    }, [lesson]);

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!title.trim()) {
            setError('Judul materi harus diisi');
            titleInput.current?.focus();
            return;
        }
        onEdit({
            id: lesson.id, // Preserve the lesson ID
            title,
            type,
            description,
            is_free: isFree,
            content: type === 'text' ? content : undefined,
            video_url: type === 'video' ? video : undefined,
            attachment: type === 'file' ? (attachment ?? lesson.attachment) : undefined,
            quizzes:
                type === 'quiz'
                    ? [
                          {
                              id: lesson.quizzes?.[0]?.id, // Preserve quiz ID if exists
                              instructions: quizInstructions,
                              time_limit: quizTimeLimit,
                              passing_score: quizPassingScore,
                          },
                      ]
                    : undefined,
            is_preview: type === 'file' ? isPreview : lesson.is_preview,
        });
    };

    return (
        <DialogContent>
            <DialogTitle>Edit Materi</DialogTitle>
            <DialogDescription>Ubah judul, tipe, dan deskripsi materi.</DialogDescription>
            <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid gap-2">
                    <Label htmlFor="title" className="sr-only">
                        Judul Materi
                    </Label>
                    <Input
                        id="title"
                        type="text"
                        name="title"
                        ref={titleInput}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Judul Materi"
                        autoComplete="off"
                    />
                    <InputError message={error} />

                    <Label htmlFor="description" className="sr-only">
                        Deskripsi Materi
                    </Label>
                    <Textarea
                        id="description"
                        name="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Deskripsi Materi (opsional)"
                        className="max-h-[300px] min-h-[80px] w-full resize-none break-words whitespace-pre-line"
                        style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}
                    />

                    <Label htmlFor="type" className="sr-only">
                        Tipe Materi
                    </Label>
                    <Select value={type} onValueChange={(val) => setType(val as Lesson['type'])}>
                        <SelectTrigger>
                            <SelectValue placeholder="Pilih tipe materi" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem value="text">Text</SelectItem>
                                <SelectItem value="video">Video</SelectItem>
                                <SelectItem value="file">File</SelectItem>
                                <SelectItem value="quiz">Quiz</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>

                    {/* Isi Materi */}
                    {type === 'text' && (
                        <div>
                            <Label htmlFor="content" className="mb-1 block text-sm font-medium">
                                Konten Materi
                            </Label>
                            <Editor
                                apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
                                value={content}
                                onEditorChange={(val) => setContent(val)}
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
                                    onboarding: false,
                                    toolbar:
                                        'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table mergetags | addcomment showcomments | spellcheckdialog a11ycheck typography | align lineheight | checklist numlist bullist indent outdent | emoticons charmap | removeformat',
                                    tinycomments_mode: 'embedded',
                                    tinycomments_author: 'Author name',
                                    mergetags_list: [
                                        { value: 'First.Name', title: 'First Name' },
                                        { value: 'Email', title: 'Email' },
                                    ],
                                    height: 300,
                                }}
                            />
                        </div>
                    )}
                    {type === 'video' && (
                        <div>
                            <Label htmlFor="video-link" className="mb-1 block text-sm font-medium">
                                Link YouTube Video
                            </Label>
                            <Input
                                id="video-link"
                                type="text"
                                placeholder="https://www.youtube.com/watch?v=xxxxxx"
                                value={video}
                                onChange={(e) => setVideo(e.target.value)}
                            />
                            {/* Preview YouTube */}
                            {video && video.trim() !== '' && (
                                <div className="mt-2">
                                    <iframe
                                        className="rounded border"
                                        width="100%"
                                        height="250"
                                        src={
                                            video.includes('youtube.com') || video.includes('youtu.be')
                                                ? `https://www.youtube.com/embed/${getYoutubeId(video)}`
                                                : ''
                                        }
                                        title="YouTube Preview"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                </div>
                            )}
                        </div>
                    )}
                    {type === 'file' && (
                        <div>
                            <Label htmlFor="attachment" className="mb-1 block text-sm font-medium">
                                Upload File (Format PDF)
                            </Label>
                            <Input
                                id="attachment"
                                type="file"
                                onChange={(e) => {
                                    const file = e.target.files?.[0] ?? null;
                                    if (file && file.size > MAX_FILE_SIZE) {
                                        setError('Ukuran file maksimal 50 MB');
                                        setAttachment(null);
                                        return;
                                    }
                                    setAttachment(file);
                                    // Automatically turn off switch if file is not PDF
                                    if (file && file.type !== 'application/pdf') {
                                        setIsPreview(false);
                                    }
                                }}
                            />
                            {/* Switch for file download permission */}
                            <div className="mt-2 flex items-center space-x-2">
                                <Switch 
                                    id="is-preview" 
                                    checked={isPreview} 
                                    onCheckedChange={attachment && attachment.type !== 'application/pdf' ? undefined : setIsPreview}
                                    className={attachment && attachment.type !== 'application/pdf' ? 'opacity-50 cursor-not-allowed' : ''}
                                />
                                <Label htmlFor="is-preview" className={attachment && attachment.type !== 'application/pdf' ? 'text-muted-foreground' : ''}>
                                    {isPreview ? 'File hanya bisa dilihat (preview)' : 'File bisa di-download'}
                                </Label>
                            </div>
                            {/* Show message when non-PDF file is selected */}
                            {attachment && attachment.type !== 'application/pdf' && (
                                <div className="mt-1 text-xs text-muted-foreground">
                                    Preview hanya tersedia untuk file PDF. File non-PDF otomatis bisa di-download.
                                </div>
                            )}
                            {/* Preview PDF */}
                            {(() => {
                                let preview: { type: 'file'; url: string } | null = null;
                                if (attachment instanceof File) {
                                    preview = { type: 'file', url: URL.createObjectURL(attachment) };
                                } else if (typeof attachment === 'string' && attachment) {
                                    preview = {
                                        type: 'file',
                                        url: (attachment as string).startsWith('http') ? attachment : `/storage/${attachment}`,
                                    };
                                }
                                return (
                                    preview?.type === 'file' &&
                                    preview.url && (
                                        <div className="mt-2 w-full rounded border p-2">
                                            <div className="mt-2 flex items-center gap-2 text-xs">
                                                {(attachment instanceof File && attachment.type === 'application/pdf') || 
                                                 (typeof attachment === 'string' && attachment) ? (
                                                    <a
                                                        href={preview.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="mb-2 rounded bg-black/60 px-2 py-1 text-xs text-white hover:bg-black/80"
                                                        title="Tampilkan Fullscreen"
                                                    >
                                                        {attachment instanceof File ? 'Fullscreen' : 'Lihat File Lama'}
                                                    </a>
                                                ) : null}
                                                {attachment instanceof File && (
                                                    <>
                                                        <span className="font-medium">File:</span>
                                                        <span>{attachment.name}</span>
                                                        <span>({Math.round(attachment.size / 1024)} KB)</span>
                                                    </>
                                                )}
                                            </div>
                                            {(attachment instanceof File && attachment.type === 'application/pdf') || 
                                             (typeof attachment === 'string' && attachment) ? (
                                                <object data={preview.url} type="application/pdf" width="100%" height="200px">
                                                    <p>
                                                        Preview tidak tersedia.{' '}
                                                        <a href={preview.url} target="_blank" rel="noopener noreferrer">
                                                            Download PDF
                                                        </a>
                                                    </p>
                                                </object>
                                            ) : (
                                                <div className="text-xs text-muted-foreground italic">Preview hanya tersedia untuk file PDF.</div>
                                            )}
                                        </div>
                                    )
                                );
                            })()}
                        </div>
                    )}
                    {type === 'quiz' && (
                        <div className="space-y-2">
                            <Label htmlFor="quiz-instructions" className="sr-only">
                                Instruksi Quiz
                            </Label>
                            <Textarea
                                id="quiz-instructions"
                                name="quiz-instructions"
                                value={quizInstructions}
                                onChange={(e) => setQuizInstructions(e.target.value)}
                                placeholder="Instruksi untuk quiz (opsional)"
                                className="max-h-[300px] min-h-[80px] w-full resize-none break-words whitespace-pre-line"
                                style={{ overflowWrap: 'break-word', wordBreak: 'break-word' }}
                            />
                            <Label htmlFor="quiz-time-limit" className="mb-1 block text-sm font-medium">
                                Time Limit (menit)
                            </Label>
                            <Input
                                id="quiz-time-limit"
                                type="number"
                                min={0}
                                placeholder="0 (tanpa batas waktu)"
                                value={quizTimeLimit}
                                onChange={(e) => setQuizTimeLimit(Number(e.target.value))}
                            />
                            <Label htmlFor="quiz-passing-score" className="mb-1 block text-sm font-medium">
                                Passing Score
                            </Label>
                            <Input
                                id="quiz-passing-score"
                                type="number"
                                min={0}
                                max={100}
                                placeholder="Nilai minimal lulus (0-100)"
                                value={quizPassingScore}
                                onChange={(e) => setQuizPassingScore(Number(e.target.value))}
                            />
                        </div>
                    )}
                    <div className="mt-2 flex items-center space-x-2">
                        <Switch id="is-free" checked={isFree} onCheckedChange={setIsFree} />
                        <Label htmlFor="is-free">{isFree ? 'Materi ini gratis' : 'Materi ini berbayar'}</Label>
                    </div>
                </div>
                <DialogFooter className="gap-2">
                    <DialogClose asChild>
                        <Button variant="secondary" onClick={() => setOpen(false)} className="hover:cursor-pointer">
                            Batal
                        </Button>
                    </DialogClose>
                    <Button type="submit" className="hover:cursor-pointer">
                        Simpan Perubahan
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}
