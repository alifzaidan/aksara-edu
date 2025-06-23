import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ChevronUp } from 'lucide-react';
import { useState } from 'react';

export default function FaqSection() {
    const [expanded, setExpanded] = useState<React.Key | null>('getting-started');

    return (
        <section className="mx-auto w-full max-w-7xl px-4 py-8">
            <div className="mx-auto text-center">
                <p className="text-primary bg-background border-primary mx-auto mb-4 w-fit rounded-full border bg-gradient-to-t from-[#D9E5FF] to-white px-4 py-1 text-sm font-medium shadow-xs">
                    Pertanyaan yang sering ditanyakan
                </p>
                <h2 className="dark:text-primary-foreground mx-auto mb-8 max-w-2xl text-3xl font-bold italic md:text-4xl">FAQ</h2>
            </div>
            <Accordion
                className="flex w-full flex-col gap-2 divide-y divide-zinc-200 dark:divide-zinc-700"
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                expandedValue={expanded}
                onValueChange={setExpanded}
            >
                <AccordionItem value="getting-started" className="rounded-lg border-2 border-zinc-400 px-4 py-2">
                    <AccordionTrigger className="w-full text-left text-zinc-950 hover:cursor-pointer dark:text-zinc-50">
                        <div className="flex items-center justify-between">
                            <p className="md:text-lg">Apa itu Aksademi?</p>
                            <ChevronUp className="text-primary h-4 w-4 transition-transform duration-200 group-data-expanded:-rotate-180 dark:text-zinc-50" />
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <p className="text-sm text-zinc-500 md:text-base dark:text-zinc-400">
                            Aksademy adalah platform edukasi digital yang dikembangkan oleh CV. Aksara Teknologi Mandiri dan dirancang untuk mendukung
                            pengembangan skill di era modern mulai dari teknologi, desain, hingga bisnis.
                        </p>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="animation-properties" className="rounded-lg border-2 border-zinc-400 px-4 py-2">
                    <AccordionTrigger className="w-full text-left text-zinc-950 hover:cursor-pointer dark:text-zinc-50">
                        <div className="flex items-center justify-between">
                            <p className="md:text-lg">Apa saja fitur yang tersedia di Aksademi?</p>
                            <ChevronUp className="text-primary h-4 w-4 transition-transform duration-200 group-data-expanded:-rotate-180 dark:text-zinc-50" />
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <p className="text-sm text-zinc-500 md:text-base dark:text-zinc-400">
                            Aksademi menawarkan berbagai fitur seperti Kelas Online, Bootcamp, dan pelatihan dalam bentuk Webinar yang mencakup
                            berbagai disiplin ilmu. Setiap fitur dirancang untuk memberikan pengalaman belajar yang interaktif dan mendalam,
                            memungkinkan pengguna untuk mengembangkan keterampilan mereka secara efektif.
                        </p>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="advanced-usage" className="rounded-lg border-2 border-zinc-400 px-4 py-2">
                    <AccordionTrigger className="w-full text-left text-zinc-950 hover:cursor-pointer dark:text-zinc-50">
                        <div className="flex items-center justify-between">
                            <p className="md:text-lg">Bagaimana alur belajar di Aksademy?</p>
                            <ChevronUp className="text-primary h-4 w-4 transition-transform duration-200 group-data-expanded:-rotate-180 dark:text-zinc-50" />
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <p className="text-sm text-zinc-500 md:text-base dark:text-zinc-400">
                            Alur belajar di Aksademy dimulai dengan memilih kelas atau bootcamp yang sesuai dengan minat dan kebutuhan Anda. Setelah
                            mendaftar, Anda akan mendapatkan akses ke materi pembelajaran yang dapat diakses kapan saja. Setiap kelas dilengkapi
                            dengan modul, quiz, dan forum diskusi untuk mendukung proses belajar Anda.
                        </p>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="community-and-support" className="rounded-lg border-2 border-zinc-400 px-4 py-2">
                    <AccordionTrigger className="w-full text-left text-zinc-950 hover:cursor-pointer dark:text-zinc-50">
                        <div className="flex items-center justify-between">
                            <p className="md:text-lg">Kemana saya bisa mendapatkan informasi lebih lanjut tentang Aksademi?</p>
                            <ChevronUp className="text-primary h-4 w-4 transition-transform duration-200 group-data-expanded:-rotate-180 dark:text-zinc-50" />
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <p className="text-sm text-zinc-500 md:text-base dark:text-zinc-400">
                            Untuk informasi lebih lanjut tentang Aksademi, Anda dapat menghubungi admin kami di{' '}
                            <a href="https://wa.me/+6285142505797" className="text-primary hover:underline">
                                +6285142505797
                            </a>
                            . Kami juga aktif di media sosial, jadi pastikan untuk mengikuti kami di platform seperti Instagram, Tiktok, dan Linkedin
                            untuk update terbaru dan tips belajar.
                        </p>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </section>
    );
}
