import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ChevronUp, Lock, PlayCircle } from 'lucide-react';
import { useState } from 'react';

interface Course {
    modules?: {
        title: string;
        description?: string | null;
        lessons?: {
            title: string;
            description?: string | null;
            type: 'text' | 'video' | 'file' | 'quiz';
            is_free?: boolean;
        }[];
    }[];
}

export default function ModulesSection({ course }: { course: Course }) {
    const [expanded, setExpanded] = useState<React.Key | null>('0');

    return (
        <section className="mx-auto w-full max-w-5xl px-4 pt-8" id="modules">
            <div className="mx-auto text-center">
                <h2 className="dark:text-primary-foreground mx-auto mb-8 max-w-2xl text-3xl font-bold italic md:text-4xl">Modul Pembelajaran</h2>
            </div>
            <Accordion
                className="flex w-full flex-col gap-2 divide-y divide-zinc-200 dark:divide-zinc-700"
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                expandedValue={expanded}
                onValueChange={setExpanded}
            >
                {course.modules?.map((module, idx) => (
                    <AccordionItem key={idx} value={String(idx)} className="rounded-lg border-2 border-gray-300 p-4">
                        <AccordionTrigger className="w-full text-left text-zinc-950 hover:cursor-pointer dark:text-zinc-50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="border-primary bg-primary/20 text-primary dark:text-primary-foreground rounded-full border px-3 py-1 text-sm font-medium dark:bg-zinc-800">
                                        <p>{idx + 1}</p>
                                    </div>
                                    <p className="md:text-lg">{module.title}</p>
                                </div>
                                <ChevronUp className="text-primary h-4 w-4 transition-transform duration-200 group-data-expanded:-rotate-180 dark:text-zinc-50" />
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <ul className="mt-2 text-sm text-zinc-500 md:text-base dark:text-zinc-400">
                                {module.lessons?.length ? (
                                    module.lessons.map((lesson, lidx) => (
                                        <li key={lidx} className="ms-8 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {lesson.is_free ? <PlayCircle size="14" className="text-green-500" /> : <Lock size="14" />}
                                                <p>{lesson.title}</p>
                                            </div>
                                        </li>
                                    ))
                                ) : (
                                    <li className="ms-8 text-zinc-400">Belum ada materi</li>
                                )}
                            </ul>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </section>
    );
}
