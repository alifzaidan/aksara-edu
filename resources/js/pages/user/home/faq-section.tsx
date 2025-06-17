import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ChevronUp } from 'lucide-react';
import { useState } from 'react';

export default function FaqSection() {
    const [expanded, setExpanded] = useState<React.Key | null>('getting-started');

    return (
        <section className="mx-auto w-full max-w-7xl px-4 py-8">
            <div className="mx-auto text-center">
                <p className="text-primary mx-auto mb-2 font-medium md:text-xl">Pertanyaan yang sering diajukan</p>
                <h2 className="mx-auto mb-8 max-w-2xl text-3xl font-bold text-gray-900 italic md:text-4xl">FAQ</h2>
            </div>
            <Accordion
                className="flex w-full flex-col gap-2 divide-y divide-zinc-200 dark:divide-zinc-700"
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                expandedValue={expanded}
                onValueChange={setExpanded}
            >
                <AccordionItem value="getting-started" className="border-primary rounded-lg border-2 px-4 py-2">
                    <AccordionTrigger className="w-full text-left text-zinc-950 hover:cursor-pointer dark:text-zinc-50">
                        <div className="flex items-center justify-between">
                            <p className="md:text-lg">Apa itu Aksademi?</p>
                            <ChevronUp className="text-primary h-4 w-4 transition-transform duration-200 group-data-expanded:-rotate-180 dark:text-zinc-50" />
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <p className="text-sm text-zinc-500 md:text-base dark:text-zinc-400">
                            Aksademy adalah platform belajar online yang memiliki berbagai learning path, mulai dari level Beginner, Intermediate,
                            hingga Expert. belajar dengan mentor yang ahli dan berpengalaman dibidangnya membantu proses belajar lebih berkualitas
                        </p>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="animation-properties" className="border-primary rounded-lg border-2 px-4 py-2">
                    <AccordionTrigger className="w-full text-left text-zinc-950 hover:cursor-pointer dark:text-zinc-50">
                        <div className="flex items-center justify-between">
                            <p className="md:text-lg">Apa saja fitur yang tersedia di Aksademi?</p>
                            <ChevronUp className="text-primary h-4 w-4 transition-transform duration-200 group-data-expanded:-rotate-180 dark:text-zinc-50" />
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <p className="text-sm text-zinc-500 md:text-base dark:text-zinc-400">
                            Explore the comprehensive range of animation properties available in Motion-Primitives. Understand how to manipulate
                            timing, easing, and delays to create smooth, dynamic animations. This segment also covers the customization of animations
                            to fit the flow and style of your web applications.
                        </p>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="advanced-usage" className="border-primary rounded-lg border-2 px-4 py-2">
                    <AccordionTrigger className="w-full text-left text-zinc-950 hover:cursor-pointer dark:text-zinc-50">
                        <div className="flex items-center justify-between">
                            <p className="md:text-lg">Bagaimana alur belajar di Aksademy?</p>
                            <ChevronUp className="text-primary h-4 w-4 transition-transform duration-200 group-data-expanded:-rotate-180 dark:text-zinc-50" />
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <p className="text-sm text-zinc-500 md:text-base dark:text-zinc-400">
                            Dive deeper into advanced techniques and features of Motion-Primitives. Learn about chaining animations, creating complex
                            sequences, and utilizing motion sensors for interactive animations. Gain insights on how to leverage these advanced
                            features to enhance user experience and engagement.
                        </p>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="community-and-support" className="border-primary rounded-lg border-2 px-4 py-2">
                    <AccordionTrigger className="w-full text-left text-zinc-950 hover:cursor-pointer dark:text-zinc-50">
                        <div className="flex items-center justify-between">
                            <p className="md:text-lg">Kemana saya bisa mendapatkan informasi lebih lanjut tentang Aksademi?</p>
                            <ChevronUp className="text-primary h-4 w-4 transition-transform duration-200 group-data-expanded:-rotate-180 dark:text-zinc-50" />
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <p className="text-sm text-zinc-500 md:text-base dark:text-zinc-400">
                            Engage with the Motion-Primitives community to gain additional support and insight. Find out how to participate in
                            discussions, contribute to the project, and access a wealth of shared knowledge and resources. Learn about upcoming
                            features, best practices, and how to get help with your specific use cases.
                        </p>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </section>
    );
}
