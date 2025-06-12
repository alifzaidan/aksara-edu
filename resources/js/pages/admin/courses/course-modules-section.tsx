import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { BookImage, Edit, Folder, Plus, PlusCircle, Trash } from 'lucide-react';
import { useState } from 'react';
import CreateLesson from './create-lesson';
import CreateModule from './create-module';
import EditLesson from './edit-lesson';
import EditModule from './edit-module';

interface Lesson {
    title: string;
    type: 'text' | 'video' | 'file' | 'quiz';
    description?: string;
    isFree: boolean;
    content?: string;
    video?: File | null;
    attachment?: File | null;
}

interface Module {
    id?: string;
    title: string;
    description?: string;
    lessons?: Lesson[];
}

interface CourseModulesSectionProps {
    modules: Module[];
    setModules: (modules: Module[]) => void;
    lessons: Lesson[];
    setLessons: (lessons: Lesson[]) => void;
}

export default function CourseModulesSection({ modules, setModules }: CourseModulesSectionProps) {
    const [open, setOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editIdx, setEditIdx] = useState<number | null>(null);
    const [lessonOpenIdx, setLessonOpenIdx] = useState<number | null>(null);
    const [editLessonOpenIdx, setEditLessonOpenIdx] = useState<number | null>(null);

    const handleAddModule = (module: Module) => {
        setModules([...modules, module]);
        setOpen(false);
    };

    const handleEditModule = (module: Module) => {
        if (editIdx !== null) {
            const updated = [...modules];
            updated[editIdx] = {
                ...updated[editIdx],
                ...module,
            };
            setModules(updated);
        }
        setEditOpen(false);
        setEditIdx(null);
    };

    const handleRemoveModule = (idx: number) => {
        setModules(modules.filter((_, i) => i !== idx));
    };

    const handleAddLesson = (idx: number, lesson: Lesson) => {
        const updated = [...modules];
        if (!updated[idx].lessons) updated[idx].lessons = [];
        updated[idx].lessons!.push(lesson);
        setModules(updated);
        setLessonOpenIdx(null);
    };

    const handleEditLesson = (modIdx: number, lessonIdx: number, lesson: Lesson) => {
        const updated = [...modules];
        if (updated[modIdx].lessons) {
            updated[modIdx].lessons![lessonIdx] = lesson;
            setModules(updated);
        }
        setEditLessonOpenIdx(null);
    };

    const handleRemoveLesson = (idx: number, lessonIdx: number) => {
        const updated = [...modules];
        if (updated[idx].lessons) {
            updated[idx].lessons.splice(lessonIdx, 1);
            setModules(updated);
        }
    };

    return (
        <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <BookImage size={16} />
                    <h3 className="font-medium">Materi Kelas</h3>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="size-8 hover:cursor-pointer">
                                    <Plus />
                                    <span className="sr-only">Tambah Modul</span>
                                </Button>
                            </DialogTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Tambah Modul</p>
                        </TooltipContent>
                    </Tooltip>
                    <CreateModule setOpen={setOpen} onAdd={handleAddModule} />
                </Dialog>
            </div>
            <div className="space-y-4">
                <ul className="space-y-2">
                    {modules && modules.length > 0 ? (
                        modules.map((mod, idx) => (
                            <li key={idx}>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">{mod.title}</span>
                                    <div className="flex items-center justify-center">
                                        <Dialog
                                            open={editOpen && editIdx === idx}
                                            onOpenChange={(v) => {
                                                setEditOpen(v);
                                                if (!v) setEditIdx(null);
                                            }}
                                        >
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="link"
                                                        size="icon"
                                                        className="size-8 hover:cursor-pointer"
                                                        onClick={() => {
                                                            setEditIdx(idx);
                                                            setEditOpen(true);
                                                        }}
                                                    >
                                                        <Edit />
                                                        <span className="sr-only">Edit Modul</span>
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Edit Modul</p>
                                                </TooltipContent>
                                            </Tooltip>
                                            <EditModule setOpen={setEditOpen} onEdit={handleEditModule} module={mod} />
                                        </Dialog>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="link"
                                                    size="icon"
                                                    className="size-8 text-red-500 hover:cursor-pointer"
                                                    onClick={() => handleRemoveModule(idx)}
                                                >
                                                    <Trash />
                                                    <span className="sr-only">Hapus Modul</span>
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Hapus Modul</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                </div>
                                {mod.description && <div className="text-muted-foreground text-xs">{mod.description}</div>}

                                {/* Daftar materi */}
                                {mod.lessons && mod.lessons.length > 0 && (
                                    <div className="mt-2 space-y-2">
                                        {mod.lessons.map((lesson, lidx) => (
                                            <div key={lidx} className="flex items-center justify-between">
                                                <span className="text-sm">{lesson.title}</span>
                                                <div className="flex items-center justify-center">
                                                    <Badge className="mr-2">{lesson.type.charAt(0).toUpperCase() + lesson.type.slice(1)}</Badge>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="link" size="icon" className="size-8 hover:cursor-pointer">
                                                                <Folder />
                                                                <span className="sr-only">Lihat Materi</span>
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Lihat Materi</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                    <Dialog
                                                        open={editLessonOpenIdx === lidx && lessonOpenIdx === null}
                                                        onOpenChange={(v) => {
                                                            if (!v) setEditLessonOpenIdx(null);
                                                        }}
                                                    >
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="link"
                                                                    size="icon"
                                                                    className="size-8 hover:cursor-pointer"
                                                                    onClick={() => setEditLessonOpenIdx(lidx)}
                                                                >
                                                                    <Edit />
                                                                    <span className="sr-only">Edit Materi</span>
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Edit Materi</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                        {editLessonOpenIdx === lidx && (
                                                            <EditLesson
                                                                setOpen={(v: boolean) => {
                                                                    if (!v) setEditLessonOpenIdx(null);
                                                                }}
                                                                onEdit={(lesson: Lesson) => handleEditLesson(idx, lidx, lesson)}
                                                                lesson={lesson}
                                                            />
                                                        )}
                                                    </Dialog>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="link"
                                                                size="icon"
                                                                className="size-8 text-red-500 hover:cursor-pointer"
                                                                onClick={() => handleRemoveLesson(idx, lidx)}
                                                            >
                                                                <Trash />
                                                                <span className="sr-only">Hapus Materi</span>
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Hapus Materi</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Tombol tambah materi */}
                                <Dialog open={lessonOpenIdx === idx} onOpenChange={(v: boolean) => setLessonOpenIdx(v ? idx : null)}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="mt-2 text-xs hover:cursor-pointer"
                                                onClick={() => setLessonOpenIdx(idx)}
                                            >
                                                Tambah Materi <PlusCircle />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Tambah Materi</p>
                                        </TooltipContent>
                                    </Tooltip>
                                    <CreateLesson
                                        setOpen={(v: boolean) => setLessonOpenIdx(v ? idx : null)}
                                        onAdd={(lesson: Lesson) => handleAddLesson(idx, lesson)}
                                    />
                                </Dialog>
                                <Separator className="my-4" />
                            </li>
                        ))
                    ) : (
                        <li className="text-muted-foreground text-sm">Belum ada modul. Tambahkan modul baru.</li>
                    )}
                </ul>
            </div>
        </div>
    );
}
