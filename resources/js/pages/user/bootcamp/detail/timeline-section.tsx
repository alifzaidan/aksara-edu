import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ChevronUp } from 'lucide-react';
import { useState } from 'react';

export default function TimelineSection() {
    const [expanded, setExpanded] = useState<React.Key | null>('getting-started');

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
                <AccordionItem value="getting-started" className="rounded-lg border-2 border-gray-300 p-4">
                    <AccordionTrigger className="w-full text-left text-zinc-950 hover:cursor-pointer dark:text-zinc-50">
                        <div className="flex items-center justify-between">
                            <p className="font-bold italic md:text-xl">Minggu 1-2</p>
                            <ChevronUp className="text-primary h-4 w-4 transition-transform duration-200 group-data-expanded:-rotate-180 dark:text-zinc-50" />
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <p className="mt-2 text-sm text-zinc-500 md:text-base dark:text-zinc-400">
                            Siswa akan mempelajari dasar pemrograman untuk membuat website serta algoritma dasar pemrograman.
                        </p>
                        <p className="mt-2 font-semibold">Kurikulum yang Dipelajari</p>
                        <ul className="ms-8 mt-2 list-disc space-y-1 text-sm text-zinc-500 md:text-base dark:text-zinc-400">
                            <li>Pengantar Pemrograman</li>
                            <li>Algoritma Dasar</li>
                            <li>Pengenalan HTML, CSS, dan JavaScript</li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="getting-started-2" className="rounded-lg border-2 border-gray-300 p-4">
                    <AccordionTrigger className="w-full text-left text-zinc-950 hover:cursor-pointer dark:text-zinc-50">
                        <div className="flex items-center justify-between">
                            <p className="font-bold italic md:text-xl">Minggu 1-2</p>
                            <ChevronUp className="text-primary h-4 w-4 transition-transform duration-200 group-data-expanded:-rotate-180 dark:text-zinc-50" />
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <p className="mt-2 text-sm text-zinc-500 md:text-base dark:text-zinc-400">
                            Siswa akan mempelajari dasar pemrograman untuk membuat website serta algoritma dasar pemrograman.
                        </p>
                        <p className="mt-2 font-semibold">Kurikulum yang Dipelajari</p>
                        <ul className="ms-8 mt-2 list-disc space-y-1 text-sm text-zinc-500 md:text-base dark:text-zinc-400">
                            <li>Pengantar Pemrograman</li>
                            <li>Algoritma Dasar</li>
                            <li>Pengenalan HTML, CSS, dan JavaScript</li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="getting-started-2" className="rounded-lg border-2 border-gray-300 p-4">
                    <AccordionTrigger className="w-full text-left text-zinc-950 hover:cursor-pointer dark:text-zinc-50">
                        <div className="flex items-center justify-between">
                            <p className="font-bold italic md:text-xl">Minggu 1-2</p>
                            <ChevronUp className="text-primary h-4 w-4 transition-transform duration-200 group-data-expanded:-rotate-180 dark:text-zinc-50" />
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <p className="mt-2 text-sm text-zinc-500 md:text-base dark:text-zinc-400">
                            Siswa akan mempelajari dasar pemrograman untuk membuat website serta algoritma dasar pemrograman.
                        </p>
                        <p className="mt-2 font-semibold">Kurikulum yang Dipelajari</p>
                        <ul className="ms-8 mt-2 list-disc space-y-1 text-sm text-zinc-500 md:text-base dark:text-zinc-400">
                            <li>Pengantar Pemrograman</li>
                            <li>Algoritma Dasar</li>
                            <li>Pengenalan HTML, CSS, dan JavaScript</li>
                        </ul>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </section>
    );
}
