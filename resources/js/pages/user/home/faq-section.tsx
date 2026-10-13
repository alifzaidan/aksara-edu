import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function FaqSection() {
    const { t } = useTranslation('home');
    const [expanded, setExpanded] = useState<React.Key | null>('getting-started');

    return (
        <section className="mx-auto w-full max-w-7xl px-4 py-8">
            <div className="mx-auto text-center">
                <p className="text-primary bg-background border-primary mx-auto mb-4 w-fit rounded-full border bg-gradient-to-t from-[#D9E5FF] to-white px-4 py-1 text-sm font-medium shadow-xs">
                    {t('faq.badge')}
                </p>
                <h2 className="dark:text-primary-foreground mx-auto mb-8 max-w-2xl text-3xl font-bold italic md:text-4xl">{t('faq.title')}</h2>
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
                            <p className="md:text-lg">{t('faq.q1')}</p>
                            <ChevronUp className="text-primary h-4 w-4 transition-transform duration-200 group-data-expanded:-rotate-180 dark:text-zinc-50" />
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <p className="text-sm text-zinc-500 md:text-base dark:text-zinc-400">
                            {t('faq.a1')}
                        </p>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="animation-properties" className="rounded-lg border-2 border-zinc-400 px-4 py-2">
                    <AccordionTrigger className="w-full text-left text-zinc-950 hover:cursor-pointer dark:text-zinc-50">
                        <div className="flex items-center justify-between">
                            <p className="md:text-lg">{t('faq.q2')}</p>
                            <ChevronUp className="text-primary h-4 w-4 transition-transform duration-200 group-data-expanded:-rotate-180 dark:text-zinc-50" />
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <p className="text-sm text-zinc-500 md:text-base dark:text-zinc-400">
                            {t('faq.a2')}
                        </p>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="advanced-usage" className="rounded-lg border-2 border-zinc-400 px-4 py-2">
                    <AccordionTrigger className="w-full text-left text-zinc-950 hover:cursor-pointer dark:text-zinc-50">
                        <div className="flex items-center justify-between">
                            <p className="md:text-lg">{t('faq.q3')}</p>
                            <ChevronUp className="text-primary h-4 w-4 transition-transform duration-200 group-data-expanded:-rotate-180 dark:text-zinc-50" />
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <p className="text-sm text-zinc-500 md:text-base dark:text-zinc-400">
                            {t('faq.a3')}
                        </p>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="community-and-support" className="rounded-lg border-2 border-zinc-400 px-4 py-2">
                    <AccordionTrigger className="w-full text-left text-zinc-950 hover:cursor-pointer dark:text-zinc-50">
                        <div className="flex items-center justify-between">
                            <p className="md:text-lg">{t('faq.q4')}</p>
                            <ChevronUp className="text-primary h-4 w-4 transition-transform duration-200 group-data-expanded:-rotate-180 dark:text-zinc-50" />
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <p className="text-sm text-zinc-500 md:text-base dark:text-zinc-400">
                            {t('faq.a4_part1')}
                            <a href="https://wa.me/+6285142505794" className="text-primary hover:underline">
                                +6285142505794
                            </a>
                            {t('faq.a4_part2')}
                        </p>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </section>
    );
}
