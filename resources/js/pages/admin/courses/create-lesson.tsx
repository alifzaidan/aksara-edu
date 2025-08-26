import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Editor } from '@tinymce/tinymce-react';
import { FormEventHandler, useRef, useState } from 'react';

interface Lesson {
    title: string;
    type: 'text' | 'video' | 'file' | 'quiz';
    description?: string;
    is_free: boolean;
    content?: string;
    video_url?: string;
    attachment?: File | null;
    quizzes?: {
        instructions?: string;
        time_limit?: number;
        passing_score?: number;
    }[];
    is_preview?: boolean;
}

interface CreateLessonProps {
    setOpen: (open: boolean) => void;
    onAdd: (lesson: Lesson) => void;
}

function getYoutubeId(url: string) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : '';
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export default function CreateLesson({ setOpen, onAdd }: CreateLessonProps) {
    const [title, setTitle] = useState('');
    const [type, setType] = useState<Lesson['type']>('text');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const [isFree, setIsFree] = useState(false);
    const [content, setContent] = useState('');
    const [videoUrl, setVideoUrl] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const [quizInstructions, setQuizInstructions] = useState('');
    const [quizTimeLimit, setQuizTimeLimit] = useState(0);
    const [quizPassingScore, setQuizPassingScore] = useState(0);
    const [isPreview, setIsPreview] = useState(true);
    const titleInput = useRef<HTMLInputElement>(null);

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!title.trim()) {
            setError('Judul materi harus diisi');
            titleInput.current?.focus();
            return;
        }
        
        const lessonData = {
            title,
            type,
            description,
            is_free: isFree,
            content: type === 'text' ? content : undefined,
            video_url: type === 'video' ? videoUrl : undefined,
            attachment: type === 'file' ? attachment : undefined,
            quizzes:
                type === 'quiz'
                    ? [
                          {
                              instructions: quizInstructions,
                              time_limit: quizTimeLimit,
                              passing_score: quizPassingScore,
                          },
                      ]
                    : undefined,
            is_preview: isPreview,
        };
        
        onAdd(lessonData);
        setTitle('');
        setDescription('');
        setType('text');
        setContent('');
        setVideoUrl('');
        setAttachment(null);
        setIsFree(false);
        setIsPreview(true);
        setError('');
    };

    return (
        <DialogContent>
            <DialogTitle>Tambah Materi</DialogTitle>
            <DialogDescription>Masukkan judul, tipe, dan deskripsi materi.</DialogDescription>
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
                                value={videoUrl}
                                onChange={(e) => setVideoUrl(e.target.value)}
                                autoComplete="off"
                            />
                            {/* Preview YouTube */}
                            {videoUrl && videoUrl.trim() !== '' && (
                                <div className="mt-2">
                                    <iframe
                                        className="rounded border"
                                        width="100%"
                                        height="250"
                                        src={
                                            videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')
                                                ? `https://www.youtube.com/embed/${getYoutubeId(videoUrl)}`
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
                                Upload File (Format PDF, DOCX, XLSX, PPTX)
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
                            {attachment && (
                                <div className="mt-2 rounded border p-2">
                                    <div className="mb-2 flex items-center gap-2 text-xs">
                                        <span className="font-medium">File:</span>
                                        <span>{attachment.name}</span>
                                        <span>({Math.round(attachment.size / 1024)} KB)</span>
                                        {attachment.type === 'application/pdf' && (
                                            <a
                                                href={URL.createObjectURL(attachment)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="ml-auto rounded bg-black/60 px-2 py-1 text-xs text-white hover:bg-black/80"
                                                title="Tampilkan Fullscreen"
                                            >
                                                Fullscreen
                                            </a>
                                        )}
                                    </div>
                                    {attachment.type === 'application/pdf' ? (
                                        <object data={URL.createObjectURL(attachment)} type="application/pdf" width="100%" height="200px">
                                            <p>
                                                Preview tidak tersedia.{' '}
                                                <a href={URL.createObjectURL(attachment)} target="_blank" rel="noopener noreferrer">
                                                    Download PDF
                                                </a>
                                            </p>
                                        </object>
                                    ) : (
                                        <div className="text-xs text-muted-foreground italic">Preview hanya tersedia untuk file PDF.</div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    {/* type === 'quiz' tidak ada input tambahan */}
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
                            <div className="text-muted-foreground text-xs mt-1">
                                Isi <span className="font-bold">0</span> jika quiz tidak memiliki batas waktu
                            </div>
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
                            <p className="text-muted-foreground text-sm">
                                Simpan quiz terlebih dahulu. Untuk mengakses soal-soal, silahkan mengkases melalui detail kelas.
                            </p>
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
                        Tambah Materi
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}
