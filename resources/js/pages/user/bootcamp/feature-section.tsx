import { TransitionPanel } from '@/components/ui/transition-panel';
import { useState } from 'react';

export default function FeatureSection() {
    const [activeIndex, setActiveIndex] = useState(0);

    const items = [
        {
            title: 'Belajar Fleksibel & Bersertifikat.',
            subtitle:
                'Kuasai dengan kurikulum up-to-date yang sesuai kebutuhan industri. Fleksibel untuk profesional yang ingin upskill tanpa mengganggu jam kerja.',
            image: '/assets/images/illustration-kelas-online.svg',
        },
        {
            title: 'Fokus Bantu Kembangkan Skill dan Portfolio.',
            subtitle: 'Belajar sambil praktek dengan ragam case study, worksheet, dan framework. Didasarkan pada kebutuhan industri dan profesi',
            image: '/assets/images/illustration-bootcamp.svg',
        },
        {
            title: 'Peluang Karir Menjanjikan.',
            subtitle: 'Membuka peluang karir yang menjanjikan di industri teknologi dan mendapat proyek-proyek menarik.',
            image: '/assets/images/illustration-webinar.svg',
        },
    ];

    return (
        <section className="mx-auto w-full max-w-7xl px-4">
            <p className="text-primary border-primary bg-background mx-auto mb-4 w-fit rounded-full border bg-gradient-to-t from-[#D9E5FF] to-white px-4 py-1 text-sm font-medium shadow-xs">
                Bootcamp Aksademy
            </p>
            <h2 className="dark:text-primary-foreground mx-auto mb-4 max-w-2xl text-center text-3xl font-bold text-gray-900 italic md:text-4xl">
                Solusi #1 Mengembangkan Portofolio Diri
            </h2>
            <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
                <div className="space-y-2">
                    {items.map((item, index) => (
                        <button
                            key={index}
                            onClick={() => setActiveIndex(index)}
                            className={`w-full rounded-xl border-2 border-gray-300 p-4 text-sm font-medium shadow transition duration-200 ease-in dark:border-zinc-100/20 dark:bg-zinc-800/30 ${
                                activeIndex === index
                                    ? 'border-primary dark:border-primary dark:to-primary text-primary-foreground hover:cursor-pointer dark:bg-zinc-800 dark:bg-gradient-to-br dark:from-black dark:text-zinc-100'
                                    : 'border-gray-300 dark:bg-zinc-700 dark:text-zinc-400'
                            }`}
                        >
                            <h2 className="dark:text-primary-foreground mb-1 text-lg font-semibold text-gray-900">{item.title}</h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{item.subtitle}</p>
                        </button>
                    ))}
                </div>
                <div className="overflow-hidden border-t border-zinc-200 dark:border-zinc-700">
                    <TransitionPanel
                        activeIndex={activeIndex}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        variants={{
                            enter: { opacity: 0, y: -50, filter: 'blur(4px)' },
                            center: { opacity: 1, y: 0, filter: 'blur(0px)' },
                            exit: { opacity: 0, y: 50, filter: 'blur(4px)' },
                        }}
                    >
                        {items.map((item, index) => (
                            <div key={index} className="py-2">
                                <img src={item.image} alt={item.title} className="mx-auto w-3/4" />
                            </div>
                        ))}
                    </TransitionPanel>
                </div>
            </div>
        </section>
    );
}
