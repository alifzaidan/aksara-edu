import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Editor } from '@tinymce/tinymce-react';
import { FormEventHandler, useEffect, useRef, useState } from 'react';

interface Lesson {
    title: string;
    type: 'text' | 'video' | 'file' | 'quiz';
    description?: string;
    is_free: boolean;
    content?: string;
    video_url?: string;
    attachment?: File | null;
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

export default function EditLesson({ setOpen, onEdit, lesson }: EditLessonProps) {
    const [title, setTitle] = useState(lesson.title);
    const [type, setType] = useState<Lesson['type']>(lesson.type);
    const [description, setDescription] = useState(lesson.description ?? '');
    const [isFree, setIsFree] = useState(lesson.is_free ?? false);
    const [content, setContent] = useState(lesson.content ?? '');
    const [video, setVideo] = useState<string>(lesson.video_url ?? '');
    const [attachment, setAttachment] = useState<File | null>(lesson.attachment ?? null);
    const [error, setError] = useState('');
    const titleInput = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setTitle(lesson.title);
        setType(lesson.type);
        setDescription(lesson.description ?? '');
        setIsFree(lesson.is_free ?? false);
        setContent(lesson.content ?? '');
        setVideo(lesson.video_url ?? '');
        setAttachment(lesson.attachment ?? null);
        setError('');
    }, [lesson]);

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!title.trim()) {
            setError('Judul materi harus diisi');
            titleInput.current?.focus();
            return;
        }
        onEdit({
            title,
            type,
            description,
            is_free: isFree,
            content: type === 'text' ? content : undefined,
            video_url: type === 'video' ? video : undefined,
            attachment: type === 'file' ? (attachment ?? lesson.attachment) : undefined,
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
                    <Input
                        id="description"
                        type="text"
                        name="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Deskripsi Materi (opsional)"
                        autoComplete="off"
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
                                accept="application/pdf"
                                onChange={(e) => setAttachment(e.target.files?.[0] ?? null)}
                            />
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
                                                <a
                                                    href={preview.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="mb-2 rounded bg-black/60 px-2 py-1 text-xs text-white hover:bg-black/80"
                                                    title="Tampilkan Fullscreen"
                                                >
                                                    {attachment instanceof File ? 'Fullscreen' : 'Lihat File Lama'}
                                                </a>
                                                {attachment instanceof File && (
                                                    <>
                                                        <span>{attachment.name}</span>
                                                        <span>({Math.round(attachment.size / 1024)} KB)</span>
                                                    </>
                                                )}
                                            </div>
                                            <object data={preview.url} type="application/pdf" width="100%" height="200px">
                                                <p>
                                                    Preview tidak tersedia.{' '}
                                                    <a href={preview.url} target="_blank" rel="noopener noreferrer">
                                                        Download PDF
                                                    </a>
                                                </p>
                                            </object>
                                        </div>
                                    )
                                );
                            })()}
                        </div>
                    )}
                    {/* type === 'quiz' tidak ada input tambahan */}
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
